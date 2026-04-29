import { normalizeLanguageCode } from "./geo.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function callOpenAI(env, messages, options = {}) {
  const model = options.model || env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      temperature: options.temperature ?? 0,
      response_format: options.json ? { type: "json_object" } : undefined,
      messages
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function inferTopic(env, sourceType, sourceText) {
  if (!sourceText) return "PLEASE SPECIFY TOPIC";
  const prompt =
    sourceType === "h1"
      ? "This is the h1 of a web page, preserve as much of the page title as possible, but remove anything considered to be a brand mention, I simply want it to succinctly describe the page contents. Return only the topic."
      : "This is the title of a web page, preserve as much of the page title as possible, but remove anything considered to be a brand mention, I simply want it to succinctly describe the page contents. Return only the topic.";
  const content = await callOpenAI(env, [
    { role: "system", content: "You are a concise SEO assistant. Return only the requested short phrase." },
    { role: "user", content: `${prompt}\n\n${sourceText}` }
  ]);
  return content.replace(/^["']|["']$/g, "").trim() || sourceText;
}

export async function extractMainContent(env, visibleText, title, h1) {
  const clipped = (visibleText || "").slice(0, 28000);
  if (!clipped) return "";
  const content = await callOpenAI(env, [
    {
      role: "system",
      content:
        "You extract the main visible user-facing content from a web page. Remove navigation, boilerplate, cookie notices, repeated menus, footer links, and unrelated chrome. Preserve the meaningful page copy."
    },
    {
      role: "user",
      content: `Page title: ${title || "Unknown"}\nPage h1: ${h1 || "Unknown"}\n\nVisible text:\n${clipped}`
    }
  ]);
  return content.slice(0, 30000);
}

export async function detectLanguage(env, mainContent, fallback) {
  if (!mainContent) return normalizeLanguageCode(fallback);
  const content = await callOpenAI(env, [
    {
      role: "system",
      content:
        "Detect the primary language of the supplied webpage content. Return only a two-letter ISO 639-1 language code such as en, de, fr, es, it, nl, tr, pt."
    },
    { role: "user", content: mainContent.slice(0, 4000) }
  ]);
  return normalizeLanguageCode(content || fallback);
}

export async function classifyQuestionRelevance(env, mainContent, questions) {
  if (!Array.isArray(questions) || !questions.length) return new Set();
  const content = mainContent.slice(0, 26000);
  const payload = { questions };
  const raw = await callOpenAI(
    env,
    [
      {
        role: "system",
        content:
          "You are an SEO content analyst. For each People Also Ask question, decide whether it is directly related to the topic of the supplied content. Return strict JSON only."
      },
      {
        role: "user",
        content: `Content:\n${content}\n\nQuestions JSON:\n${JSON.stringify(payload)}\n\nReturn JSON in this shape: {"relevant":["question text", "..."]}. Include only directly relevant questions; omit questions that are not directly relevant.`
      }
    ],
    { json: true }
  );
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Set();
  }
  const allowed = new Set(questions);
  const relevant = Array.isArray(parsed.relevant)
    ? parsed.relevant.filter((question) => allowed.has(question))
    : [];
  return new Set(relevant);
}

export async function generateFallbackQuestions(env, topic) {
  const raw = await callOpenAI(
    env,
    [
      {
        role: "system",
        content:
          "You generate likely user questions for SEO content analysis. Return strict JSON only. Do not include numbering, commentary, or markdown."
      },
      {
        role: "user",
        content: `List what you think are the top 10 most commonly asked questions about ${topic}. Return the questions in a 1d array.\n\nReturn JSON in this exact shape: {"questions":["question 1","question 2"]}.`
      }
    ],
    { json: true, temperature: 0.2 }
  );
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.questions)) return [];

  return parsed.questions
    .map((question) => String(question || "").trim())
    .filter(Boolean)
    .filter((question, index, array) => array.indexOf(question) === index)
    .slice(0, 10);
}

export async function scoreQuestions(env, mainContent, questions) {
  const content = mainContent.slice(0, 26000);
  const raw = await callOpenAI(
    env,
    [
      {
        role: "system",
        content:
          "You are an SEO content analyst. For each question, classify whether the content fully answers it, partially answers it, or does not answer it. Return strict JSON only."
      },
      {
        role: "user",
        content: `Content:\n${content}\n\nQuestions:\n${JSON.stringify(questions)}\n\nReturn JSON in this shape: {"answers":[{"question":"...","status":"full|partial|not"}]}. Status must be exactly full, partial, or not.`
      }
    ],
    { json: true }
  );
  const parsed = JSON.parse(raw);
  const allowed = new Set(questions);
  return Array.isArray(parsed.answers)
    ? parsed.answers
        .filter((answer) => allowed.has(answer.question))
        .map((answer) => ({
          question: answer.question,
          status: ["full", "partial", "not"].includes(answer.status) ? answer.status : "not"
        }))
    : [];
}

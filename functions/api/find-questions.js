import { fetchAlsoAsked } from "../_lib/alsoasked.js";
import { badRequest, isMock, json, kvGet, kvPut, readJson, serverError } from "../_lib/http.js";
import { mockQuestions } from "../_lib/mock.js";
import { classifyQuestionRelevance, generateFallbackQuestions } from "../_lib/openai.js";

function buildQuestionObjects(questions, relevantSet) {
  return questions.map((question) => {
    const relevant = relevantSet.has(question);
    return {
      question,
      relevant,
      recommended: relevant,
      included: relevant
    };
  });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body?.id) return badRequest("Missing report id.");

  const record = await kvGet(env, `report:${body.id}`);
  if (!record) return badRequest("Report not found. Please fetch the page again.");

  const topic = String(body.topic || record.topic || "").trim();
  const countryCode = String(body.countryCode || record.countryCode || "us").toLowerCase();
  const languageCode = String(body.languageCode || record.languageCode || "en").toLowerCase();
  if (!topic || topic === "PLEASE SPECIFY TOPIC") return badRequest("Please specify a page topic.");

  try {
    let alsoAsked;
    let allQuestions;
    let questionItems;
    let questionSource = "alsoasked";
    let sourceNotice = "";

    if (isMock(env)) {
      alsoAsked = {
        raw: { mock: true, queries: [{ term: topic, results: mockQuestions.map((question) => ({ question, results: [] })) }] },
        questions: mockQuestions
      };
      allQuestions = mockQuestions;
      const relevantSet = new Set(mockQuestions.slice(0, 5));
      questionItems = buildQuestionObjects(allQuestions, relevantSet);
    } else {
      alsoAsked = await fetchAlsoAsked(env, topic, countryCode, languageCode);

      if (!alsoAsked.questions.length) {
        const fallback = await generateFallbackQuestions(env, topic);
        questionSource = "genai_fallback";
        sourceNotice = "No Google PAA questions for this topic, used GenAI as a fallback";

        if (!fallback.length) {
          return badRequest(
            `AlsoAsked did not return any questions for "${topic}", and the GenAI fallback could not produce questions. Please try manually redefining the page topic above, then run the search again.`,
            {
              reason: "no_questions_from_alsoasked_or_genai",
              topic,
              countryCode,
              languageCode
            }
          );
        }

        allQuestions = fallback;
        // GenAI fallback questions are generated specifically from the topic,
        // so treat them all as relevant/recommended/included by default.
        questionItems = buildQuestionObjects(allQuestions, new Set(allQuestions));
      } else {
        allQuestions = alsoAsked.questions;
        const relevantSet = await classifyQuestionRelevance(env, record.mainContent, allQuestions);
        questionItems = buildQuestionObjects(allQuestions, relevantSet);
      }
    }

    const relevantQuestions = questionItems.filter((item) => item.relevant).map((item) => item.question);

    const updatedRecord = {
      ...record,
      topic,
      countryCode,
      languageCode,
      alsoAskedRaw: alsoAsked.raw,
      alsoAskedQuestions: alsoAsked.questions,
      questions: questionItems,
      relevantQuestions,
      questionSource,
      sourceNotice,
      questionsFoundAt: new Date().toISOString()
    };

    await kvPut(env, `report:${record.id}`, updatedRecord);

    return json({
      id: record.id,
      url: record.url,
      topic,
      countryCode,
      languageCode,
      extractionMode: record.extractionMode,
      questions: questionItems,
      relevantQuestions,
      questionCount: questionItems.length,
      relevantQuestionCount: relevantQuestions.length,
      allQuestionCount: alsoAsked.questions.length,
      questionSource,
      sourceNotice
    });
  } catch (error) {
    return serverError("Could not find intent gaps.", error.message);
  }
}

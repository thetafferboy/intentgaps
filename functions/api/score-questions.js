import { badRequest, isMock, json, kvDelete, kvGet, readJson, serverError } from "../_lib/http.js";
import { mockScores } from "../_lib/mock.js";
import { scoreQuestions } from "../_lib/openai.js";

function calculateScore(answers) {
  const maxScore = answers.length * 3;
  const score = answers.reduce((total, answer) => {
    if (answer.status === "full") return total + 3;
    if (answer.status === "partial") return total + 1;
    return total;
  }, 0);
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percentage };
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body?.id) return badRequest("Missing report id.");

  const record = await kvGet(env, `report:${body.id}`);
  if (!record) return badRequest("Report not found. Please fetch the page again.");

  const questionPool = Array.isArray(record.questions) && record.questions.length
    ? record.questions.map((item) => (typeof item === "string" ? item : item?.question)).filter(Boolean)
    : Array.isArray(record.relevantQuestions)
      ? record.relevantQuestions
      : [];
  const allowed = new Set(questionPool);
  const defaultIncluded = Array.isArray(record.relevantQuestions) ? record.relevantQuestions : questionPool;

  const requestedQuestions = Array.isArray(body.questions)
    ? body.questions.map((question) => String(question || "")).filter((question) => allowed.has(question))
    : defaultIncluded;

  if (!requestedQuestions.length) {
    return badRequest("Please include at least one question to score.", {
      reason: "no_included_questions"
    });
  }

  try {
    const answers = isMock(env)
      ? mockScores(requestedQuestions)
      : await scoreQuestions(env, record.mainContent, requestedQuestions);

    const totals = calculateScore(answers);

    const responseBody = {
      id: record.id,
      url: record.url,
      topic: record.topic,
      countryCode: record.countryCode,
      languageCode: record.languageCode,
      extractionMode: record.extractionMode,
      questionCount: requestedQuestions.length,
      allQuestionCount: Array.isArray(record.alsoAskedQuestions) ? record.alsoAskedQuestions.length : 0,
      questionSource: record.questionSource,
      sourceNotice: record.sourceNotice,
      answers,
      ...totals
    };

    // Scorecard is fully built and returned to the client. The KV
    // record holds the bulky DOM, screenshot, AlsoAsked payload, and
    // intermediate question lists, none of which the frontend needs
    // after this point. Delete best-effort; never fail the scorecard
    // because cleanup failed.
    try {
      await kvDelete(env, `report:${record.id}`);
    } catch (cleanupError) {
      console.warn("kv cleanup failed for report", record.id, cleanupError?.message);
    }

    return json(responseBody);
  } catch (error) {
    return serverError("Could not score questions.", error.message);
  }
}

import { fetchAlsoAsked } from "../_lib/alsoasked.js";
import { badRequest, isMock, json, kvGet, kvPut, readJson, serverError } from "../_lib/http.js";
import { mockQuestions, mockScores } from "../_lib/mock.js";
import { filterRelevantQuestions, scoreQuestions } from "../_lib/openai.js";

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

  const topic = String(body.topic || record.topic || "").trim();
  const countryCode = String(body.countryCode || record.countryCode || "us").toLowerCase();
  const languageCode = String(body.languageCode || record.languageCode || "en").toLowerCase();
  if (!topic || topic === "PLEASE SPECIFY TOPIC") return badRequest("Please specify a page topic.");

  try {
    let alsoAsked;
    let relevantQuestions;
    let answers;

    if (isMock(env)) {
      alsoAsked = {
        raw: { mock: true, queries: [{ term: topic, results: mockQuestions.map((question) => ({ question, results: [] })) }] },
        questions: mockQuestions
      };
      relevantQuestions = mockQuestions.slice(0, 5);
      answers = mockScores(relevantQuestions);
    } else {
      alsoAsked = await fetchAlsoAsked(env, topic, countryCode, languageCode);
      relevantQuestions = await filterRelevantQuestions(env, record.mainContent, alsoAsked.questions);
      answers = await scoreQuestions(env, record.mainContent, relevantQuestions);
    }

    const totals = calculateScore(answers);
    const result = {
      ...record,
      topic,
      countryCode,
      languageCode,
      alsoAskedRaw: alsoAsked.raw,
      alsoAskedQuestions: alsoAsked.questions,
      relevantQuestions,
      answers,
      ...totals,
      analysedAt: new Date().toISOString()
    };

    await kvPut(env, `report:${record.id}`, result);

    return json({
      id: record.id,
      url: record.url,
      topic,
      countryCode,
      languageCode,
      extractionMode: record.extractionMode,
      questionCount: relevantQuestions.length,
      allQuestionCount: alsoAsked.questions.length,
      answers,
      ...totals
    });
  } catch (error) {
    return serverError("Could not find intent gaps.", error.message);
  }
}

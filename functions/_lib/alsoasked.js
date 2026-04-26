export function flattenQuestions(results, output = []) {
  if (!Array.isArray(results)) return output;
  for (const item of results) {
    if (item?.question && !output.includes(item.question)) {
      output.push(item.question);
    }
    if (Array.isArray(item?.results)) {
      flattenQuestions(item.results, output);
    }
  }
  return output;
}

export async function fetchAlsoAsked(env, topic, region, language) {
  const base = (env.ALSOASKED_BASE_URL || "https://alsoaskedapi.com").replace(/\/$/, "");
  const response = await fetch(`${base}/v1/search`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Api-Key": env.ALSOASKED_API_KEY
    },
    body: JSON.stringify({
      terms: [topic],
      language,
      region,
      depth: 2,
      fresh: false,
      async: false,
      notify_webhooks: false
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AlsoAsked API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const data = await response.json();
  const questions = flattenQuestions(data.queries?.[0]?.results || []);
  return { raw: data, questions };
}

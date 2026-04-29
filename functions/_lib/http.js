export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: init.status || 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers
    }
  });
}

export function badRequest(message, details) {
  return json({ error: message, details }, { status: 400 });
}

export function serverError(message, details) {
  return json({ error: message, details }, { status: 500 });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function requireUrl(value) {
  if (!value || typeof value !== "string") {
    throw new Error("Please enter a URL.");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Please enter a valid URL, including https:// or http://.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http:// and https:// URLs can be fetched.");
  }

  const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  if (blockedHosts.has(url.hostname)) {
    throw new Error("Local and private URLs cannot be fetched.");
  }

  return url.toString();
}

export function makeId(prefix = "ig") {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${token}`;
}

// Default TTL is short because each KV record is transient: it only
// needs to survive long enough for one user to walk through the
// fetch → review → find-questions → score flow. Records are deleted
// immediately after scorecard generation, so the TTL is just a safety
// net for sessions the user abandons partway through.
export async function kvPut(env, key, value, ttlSeconds = 60 * 60) {
  if (env.INTENTGAPS_KV) {
    await env.INTENTGAPS_KV.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  }
}

export async function kvGet(env, key) {
  if (!env.INTENTGAPS_KV) return null;
  const value = await env.INTENTGAPS_KV.get(key, "json");
  return value || null;
}

export async function kvDelete(env, key) {
  if (!env.INTENTGAPS_KV) return;
  await env.INTENTGAPS_KV.delete(key);
}

export function isMock(env) {
  return env.APP_MOCK_MODE === "true" || !env.OPENAI_API_KEY || !env.ALSOASKED_API_KEY;
}

import { clientExtractVisibleText, extractMetadataFromHtml } from "./extract.js";

async function fetchRenderedHtmlViaCloudflare(env, url) {
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_BROWSER_RENDERING_TOKEN) {
    return null;
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CLOUDFLARE_BROWSER_RENDERING_TOKEN}`
    },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: "networkidle2", timeout: 45000 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 IntentGapsBot/1.0"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare Browser Rendering error ${response.status}: ${text.slice(0, 500)}`);
  }

  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.result || parsed.html || parsed;
  } catch {
    return text;
  }
}

async function fetchStaticHtml(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 IntentGapsBot/1.0",
      accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Target URL returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`Target URL did not return HTML. Content-Type: ${contentType || "unknown"}.`);
  }

  return response.text();
}

export async function scrapePage(env, url) {
  const renderedHtml = await fetchRenderedHtmlViaCloudflare(env, url);
  const html = renderedHtml || (await fetchStaticHtml(url));
  const metadata = extractMetadataFromHtml(html);
  return {
    url,
    html,
    extractionMode: renderedHtml ? "cloudflare-browser-rendering" : "static-fetch-fallback",
    ...metadata
  };
}

export { clientExtractVisibleText };

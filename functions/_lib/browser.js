import { clientExtractVisibleText, extractMetadataFromHtml } from "./extract.js";

const BROWSER_RUN_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 IntentGapsBot/1.0";

function hasBrowserRunCredentials(env) {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_BROWSER_RENDERING_TOKEN);
}

async function fetchRenderedHtmlViaCloudflare(env, url) {
  if (!hasBrowserRunCredentials(env)) {
    return null;
  }

  const endpoint = `${BROWSER_RUN_ENDPOINT}/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CLOUDFLARE_BROWSER_RENDERING_TOKEN}`
    },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: "networkidle2", timeout: 45000 },
      userAgent: BROWSER_USER_AGENT
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare Browser Rendering could not render the page (${response.status}). ${text.slice(0, 500)}`);
  }

  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.result || parsed.html || parsed;
  } catch {
    return text;
  }
}

async function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function jsonScreenshotToDataUrl(parsed) {
  const value = parsed?.result || parsed?.screenshot || parsed?.image || parsed?.data;
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("data:image/")) return value;
  const mimeType = parsed?.mimeType || parsed?.contentType || "image/jpeg";
  return `data:${mimeType};base64,${value}`;
}

export async function capturePageScreenshot(env, url) {
  if (!hasBrowserRunCredentials(env)) {
    return null;
  }

  try {
    const endpoint = `${BROWSER_RUN_ENDPOINT}/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/screenshot`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.CLOUDFLARE_BROWSER_RENDERING_TOKEN}`
      },
      body: JSON.stringify({
        url,
        gotoOptions: { waitUntil: "networkidle2", timeout: 45000 },
        userAgent: BROWSER_USER_AGENT,
        viewport: { width: 1365, height: 900 },
        screenshotOptions: {
          type: "jpeg",
          quality: 70,
          fullPage: false
        }
      })
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
      const base64 = await arrayBufferToBase64(await response.arrayBuffer());
      return {
        dataUrl: `data:${contentType.split(";")[0]};base64,${base64}`,
        capturedAt: new Date().toISOString(),
        mode: "cloudflare-browser-run-screenshot"
      };
    }

    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      const dataUrl = jsonScreenshotToDataUrl(parsed);
      return dataUrl
        ? {
            dataUrl,
            capturedAt: new Date().toISOString(),
            mode: "cloudflare-browser-run-screenshot"
          }
        : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function fetchStaticHtml(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "user-agent": BROWSER_USER_AGENT,
        accept: "text/html,application/xhtml+xml"
      }
    });
  } catch (error) {
    throw new Error(`The target URL could not be reached. ${error.message || "Please check the URL and try again."}`);
  }

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
  const [renderedHtml, screenshot] = await Promise.all([fetchRenderedHtmlViaCloudflare(env, url), capturePageScreenshot(env, url)]);
  const html = renderedHtml || (await fetchStaticHtml(url));
  if (!html || typeof html !== "string" || html.trim().length < 50) {
    throw new Error("The target URL returned an empty or unreadable HTML response.");
  }
  const metadata = extractMetadataFromHtml(html);
  if (!metadata.visibleText || metadata.visibleText.trim().length < 80) {
    throw new Error("The target page was fetched, but there was not enough visible text to analyse. Please try a different URL.");
  }
  return {
    url,
    html,
    screenshot,
    extractionMode: renderedHtml ? "cloudflare-browser-rendering" : "static-fetch-fallback",
    ...metadata
  };
}

export { clientExtractVisibleText };

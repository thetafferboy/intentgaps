import { clientExtractVisibleText, extractMetadataFromHtml } from "./extract.js";

const BROWSER_RUN_ENDPOINT = "https://api.cloudflare.com/client/v4/accounts";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 IntentGapsBot/1.0";

function hasBrowserRunCredentials(env) {
  return Boolean(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_BROWSER_RENDERING_TOKEN);
}

function browserRunHeaders(env) {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${env.CLOUDFLARE_BROWSER_RENDERING_TOKEN}`
  };
}

function browserRunPayload(url) {
  return {
    url,
    gotoOptions: { waitUntil: "domcontentloaded", timeout: 4500 },
    waitForTimeout: 1200,
    userAgent: BROWSER_USER_AGENT,
    viewport: { width: 1365, height: 900, deviceScaleFactor: 1 },
    screenshotOptions: {
      type: "jpeg",
      quality: 70,
      fullPage: false,
      encoding: "base64"
    }
  };
}

function imageMimeTypeFromBase64(value) {
  if (value.startsWith("/9j/")) return "image/jpeg";
  if (value.startsWith("iVBOR")) return "image/png";
  if (value.startsWith("R0lGOD")) return "image/gif";
  if (value.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

function normalizeScreenshotDataUrl(value, fallbackMimeType = "image/jpeg") {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("data:image/")) return value;
  return `data:${fallbackMimeType || imageMimeTypeFromBase64(value)};base64,${value}`;
}

function screenshotRecord(dataUrl, mode) {
  return dataUrl
    ? {
        dataUrl,
        capturedAt: new Date().toISOString(),
        mode
      }
    : null;
}

async function fetchRenderedSnapshotViaCloudflare(env, url) {
  if (!hasBrowserRunCredentials(env)) {
    return null;
  }

  const endpoint = `${BROWSER_RUN_ENDPOINT}/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/snapshot`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: browserRunHeaders(env),
    body: JSON.stringify(browserRunPayload(url))
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const payload = parsed?.result && typeof parsed.result === "object" ? parsed.result : parsed;
  const html = payload?.content || payload?.html || payload?.result?.content || "";
  const screenshotValue = payload?.screenshot || payload?.image || payload?.result?.screenshot || "";
  const dataUrl = normalizeScreenshotDataUrl(screenshotValue, payload?.mimeType || payload?.contentType || "image/jpeg");

  if (!html && !dataUrl) {
    return null;
  }

  return {
    html: typeof html === "string" ? html : "",
    screenshot: screenshotRecord(dataUrl, "cloudflare-browser-run-snapshot")
  };
}

async function fetchRenderedHtmlViaCloudflare(env, url) {
  if (!hasBrowserRunCredentials(env)) {
    return null;
  }

  const endpoint = `${BROWSER_RUN_ENDPOINT}/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/content`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: browserRunHeaders(env),
    body: JSON.stringify({
      ...browserRunPayload(url),
      screenshotOptions: undefined
    })
  });

  if (!response.ok) {
    return null;
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
  const payload = parsed?.result && typeof parsed.result === "object" ? parsed.result : parsed;
  const value = payload?.result || payload?.screenshot || payload?.image || payload?.data;
  if (!value || typeof value !== "string") return null;
  return normalizeScreenshotDataUrl(value, payload?.mimeType || payload?.contentType || imageMimeTypeFromBase64(value));
}

export async function capturePageScreenshot(env, url) {
  if (!hasBrowserRunCredentials(env)) {
    return null;
  }

  try {
    const endpoint = `${BROWSER_RUN_ENDPOINT}/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/screenshot`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: browserRunHeaders(env),
      body: JSON.stringify(browserRunPayload(url))
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("image/")) {
      const base64 = await arrayBufferToBase64(await response.arrayBuffer());
      return screenshotRecord(`data:${contentType.split(";")[0]};base64,${base64}`, "cloudflare-browser-run-screenshot");
    }

    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      const dataUrl = jsonScreenshotToDataUrl(parsed);
      return screenshotRecord(dataUrl, "cloudflare-browser-run-screenshot");
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
  const failures = [];

  let snapshot = null;
  try {
    snapshot = await fetchRenderedSnapshotViaCloudflare(env, url);
  } catch (error) {
    failures.push(`snapshot failed: ${error.message || "unknown error"}`);
  }

  let renderedHtml = snapshot?.html || null;
  let screenshot = snapshot?.screenshot || null;

  if (!renderedHtml) {
    try {
      renderedHtml = await fetchRenderedHtmlViaCloudflare(env, url);
    } catch (error) {
      failures.push(`rendered HTML failed: ${error.message || "unknown error"}`);
    }
  }

  if (!screenshot) {
    try {
      screenshot = await capturePageScreenshot(env, url);
    } catch (error) {
      failures.push(`screenshot failed: ${error.message || "unknown error"}`);
    }
  }

  let html = renderedHtml;
  if (!html) {
    try {
      html = await fetchStaticHtml(url);
    } catch (error) {
      failures.push(`static fetch failed: ${error.message || "unknown error"}`);
      throw new Error(failures.join(" | ") || "No fetch method could retrieve the page.");
    }
  }
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
    extractionMode: snapshot?.html ? "cloudflare-browser-snapshot" : renderedHtml ? "cloudflare-browser-rendering" : "static-fetch-fallback",
    ...metadata
  };
}

export { clientExtractVisibleText };

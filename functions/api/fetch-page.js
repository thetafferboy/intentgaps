import { scrapePage } from "../_lib/browser.js";
import { detectCountryFromUrl, languages, normalizeLanguageCode } from "../_lib/geo.js";
import { badRequest, isMock, json, kvPut, makeId, readJson, requireUrl, serverError } from "../_lib/http.js";
import { detectLanguage, extractMainContent, inferTopic } from "../_lib/openai.js";

function fallbackTopic(h1, title) {
  return h1 || title || "PLEASE SPECIFY TOPIC";
}

async function mockFetchPage(env, url) {
  const id = makeId("report");
  const country = detectCountryFromUrl(url);
  const html = `<!doctype html><html lang="en"><head><title>Search intent gaps: demo page</title></head><body><h1>Search intent gaps</h1><main><p>Search intent gaps are missing answers or unexplored subtopics that users expect when they search for a subject. People Also Ask data can reveal follow-up questions that content should address.</p><p>This demo page explains how SEO teams can use content audits, AlsoAsked, and AI classification to find unanswered questions at scale.</p></main></body></html>`;
  const mockScreenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1365" height="900" viewBox="0 0 1365 900"><rect width="1365" height="900" fill="#f7f6f2"/><rect x="96" y="82" width="1173" height="104" rx="26" fill="#01696f" opacity=".13"/><rect x="126" y="228" width="720" height="56" rx="14" fill="#211f1a" opacity=".86"/><rect x="126" y="314" width="1010" height="24" rx="12" fill="#716f67" opacity=".45"/><rect x="126" y="364" width="930" height="24" rx="12" fill="#716f67" opacity=".35"/><rect x="126" y="444" width="1113" height="250" rx="24" fill="#fff" stroke="#d4d1ca"/><text x="126" y="770" font-family="Arial" font-size="32" fill="#01696f" font-weight="700">Rendered preview unavailable in mock mode</text></svg>`;
  const record = {
    id,
    url,
    html,
    title: "Search intent gaps: demo page",
    h1: "Search intent gaps",
    topic: "Search intent gaps",
    countryCode: country.code,
    languageCode: "en",
    mainContent:
      "Search intent gaps are missing answers or unexplored subtopics that users expect when they search for a subject. People Also Ask data can reveal follow-up questions that content should address. SEO teams can use content audits, AlsoAsked, and AI classification to find unanswered questions at scale.",
    screenshot: {
      dataUrl: `data:image/svg+xml;base64,${btoa(mockScreenshotSvg)}`,
      capturedAt: new Date().toISOString(),
      mode: "mock-preview"
    },
    extractionMode: "mock-mode",
    createdAt: new Date().toISOString()
  };
  await kvPut(env, `report:${id}`, record);
  return record;
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body) return badRequest("Expected JSON body.");

  let url;
  try {
    url = requireUrl(body.url);
  } catch (error) {
    return badRequest(error.message);
  }

  try {
    if (isMock(env)) {
      const record = await mockFetchPage(env, url);
      return json({
        id: record.id,
        url: record.url,
        title: record.title,
        h1: record.h1,
        topic: record.topic,
        countryCode: record.countryCode,
        languageCode: record.languageCode,
        screenshot: record.screenshot,
        extractionMode: record.extractionMode,
        languages
      });
    }

    const scraped = await scrapePage(env, url);
    const topicSource = scraped.h1 ? "h1" : scraped.title ? "title" : "manual";
    const topic = topicSource === "manual" ? "PLEASE SPECIFY TOPIC" : await inferTopic(env, topicSource, scraped.h1 || scraped.title);
    const country = detectCountryFromUrl(url);
    const mainContent = await extractMainContent(env, scraped.visibleText, scraped.title, scraped.h1);
    const languageCode = await detectLanguage(env, mainContent || scraped.visibleText, normalizeLanguageCode(scraped.detectedLanguage));
    const id = makeId("report");

    const record = {
      id,
      url,
      html: scraped.html,
      title: scraped.title,
      h1: scraped.h1,
      visibleText: scraped.visibleText,
      topic,
      countryCode: country.code,
      languageCode,
      mainContent,
      screenshot: scraped.screenshot,
      extractionMode: scraped.extractionMode,
      createdAt: new Date().toISOString()
    };

    await kvPut(env, `report:${id}`, record);

    return json({
      id,
      url,
      title: scraped.title,
      h1: scraped.h1,
      topic,
      countryCode: country.code,
      languageCode,
      screenshot: scraped.screenshot,
      extractionMode: scraped.extractionMode,
      languages
    });
  } catch (error) {
    return serverError(
      "We could not scrape that URL. Please check the page is public, returns visible HTML content, and is not blocking automated browsers.",
      error.message
    );
  }
}

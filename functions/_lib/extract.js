const BLOCK_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "CANVAS", "IFRAME", "FORM"]);

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractMetadataFromHtml(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "";
  const lang = html.match(/<html[^>]*\slang=["']?([a-zA-Z_-]+)/i)?.[1] || "";
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = stripTags(bodyMatch ? bodyMatch[1] : html);
  return {
    title: stripTags(title),
    h1: stripTags(h1),
    detectedLanguage: lang,
    visibleText: bodyText.slice(0, 35000)
  };
}

export function clientExtractVisibleText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || BLOCK_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return NodeFilter.FILTER_REJECT;
      }
      const value = node.textContent?.replace(/\s+/g, " ").trim();
      return value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const pieces = [];
  let current;
  while ((current = walker.nextNode())) {
    pieces.push(current.textContent.replace(/\s+/g, " ").trim());
  }
  return pieces.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

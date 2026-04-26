export const countries = [
  { code: "us", name: "United States", tlds: [".com", ".us"] },
  { code: "gb", name: "United Kingdom", tlds: [".uk", ".co.uk", ".org.uk", ".ac.uk"] },
  { code: "ie", name: "Ireland", tlds: [".ie"] },
  { code: "ca", name: "Canada", tlds: [".ca"] },
  { code: "au", name: "Australia", tlds: [".au", ".com.au"] },
  { code: "de", name: "Germany", tlds: [".de"] },
  { code: "fr", name: "France", tlds: [".fr"] },
  { code: "es", name: "Spain", tlds: [".es"] },
  { code: "it", name: "Italy", tlds: [".it"] },
  { code: "nl", name: "Netherlands", tlds: [".nl"] },
  { code: "tr", name: "Turkey", tlds: [".tr", ".com.tr"] },
  { code: "se", name: "Sweden", tlds: [".se"] },
  { code: "no", name: "Norway", tlds: [".no"] },
  { code: "dk", name: "Denmark", tlds: [".dk"] },
  { code: "pl", name: "Poland", tlds: [".pl"] },
  { code: "br", name: "Brazil", tlds: [".br", ".com.br"] },
  { code: "mx", name: "Mexico", tlds: [".mx", ".com.mx"] },
  { code: "in", name: "India", tlds: [".in", ".co.in"] },
  { code: "jp", name: "Japan", tlds: [".jp", ".co.jp"] }
];

export const languages = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "tr", name: "Turkish" },
  { code: "pt", name: "Portuguese" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "pl", name: "Polish" },
  { code: "ja", name: "Japanese" }
];

export function detectCountryFromUrl(urlString) {
  const hostname = new URL(urlString).hostname.toLowerCase();
  const matches = [];
  for (const country of countries) {
    for (const tld of country.tlds) {
      if (hostname.endsWith(tld)) {
        matches.push({ ...country, length: tld.length });
      }
    }
  }
  matches.sort((a, b) => b.length - a.length);
  return matches[0] ? { code: matches[0].code, name: matches[0].name } : { code: "us", name: "United States" };
}

export function normalizeLanguageCode(value) {
  if (!value) return "en";
  const lower = String(value).toLowerCase();
  const twoLetter = lower.split(/[-_]/)[0];
  return languages.some((language) => language.code === twoLetter) ? twoLetter : "en";
}

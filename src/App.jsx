import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe2,
  Linkedin,
  Loader2,
  Moon,
  RefreshCcw,
  Search,
  Sparkles,
  Sun,
  Youtube
} from "lucide-react";

const DEFAULT_TEST_URL = "https://www.pcgamer.com/best-gaming-chairs/";
const DEFAULT_TEST_TOPIC = "best gaming chairs";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

const COUNTRIES = [
  ["af", "Afghanistan (af)"],
  ["al", "Albania (al)"],
  ["dz", "Algeria (dz)"],
  ["as", "American Samoa (as)"],
  ["ad", "Andorra (ad)"],
  ["ao", "Angola (ao)"],
  ["ai", "Anguilla (ai)"],
  ["aq", "Antarctica (aq)"],
  ["ag", "Antigua and Barbuda (ag)"],
  ["ar", "Argentina (ar)"],
  ["am", "Armenia (am)"],
  ["aw", "Aruba (aw)"],
  ["au", "Australia (au)"],
  ["at", "Austria (at)"],
  ["az", "Azerbaijan (az)"],
  ["bs", "Bahamas (bs)"],
  ["bh", "Bahrain (bh)"],
  ["bd", "Bangladesh (bd)"],
  ["bb", "Barbados (bb)"],
  ["by", "Belarus (by)"],
  ["be", "Belgium (be)"],
  ["bz", "Belize (bz)"],
  ["bj", "Benin (bj)"],
  ["bm", "Bermuda (bm)"],
  ["bt", "Bhutan (bt)"],
  ["bo", "Bolivia (bo)"],
  ["ba", "Bosnia and Herzegovina (ba)"],
  ["bw", "Botswana (bw)"],
  ["bv", "Bouvet Island (bv)"],
  ["br", "Brazil (br)"],
  ["io", "British Indian Ocean Territory (io)"],
  ["bn", "Brunei Darussalam (bn)"],
  ["bg", "Bulgaria (bg)"],
  ["bf", "Burkina Faso (bf)"],
  ["bi", "Burundi (bi)"],
  ["kh", "Cambodia (kh)"],
  ["cm", "Cameroon (cm)"],
  ["ca", "Canada (ca)"],
  ["cv", "Cabo Verde (cv)"],
  ["ky", "Cayman Islands (ky)"],
  ["cf", "Central African Republic (cf)"],
  ["td", "Chad (td)"],
  ["cl", "Chile (cl)"],
  ["cn", "China (cn)"],
  ["cx", "Christmas Island (cx)"],
  ["cc", "Cocos (Keeling) Islands (cc)"],
  ["co", "Colombia (co)"],
  ["km", "Comoros (km)"],
  ["cg", "Congo (cg)"],
  ["cd", "Congo, Democratic Republic of the (cd)"],
  ["ck", "Cook Islands (ck)"],
  ["cr", "Costa Rica (cr)"],
  ["ci", "Côte d'Ivoire (ci)"],
  ["hr", "Croatia (hr)"],
  ["cu", "Cuba (cu)"],
  ["cy", "Cyprus (cy)"],
  ["cz", "Czechia (cz)"],
  ["dk", "Denmark (dk)"],
  ["dj", "Djibouti (dj)"],
  ["dm", "Dominica (dm)"],
  ["do", "Dominican Republic (do)"],
  ["ec", "Ecuador (ec)"],
  ["eg", "Egypt (eg)"],
  ["sv", "El Salvador (sv)"],
  ["gq", "Equatorial Guinea (gq)"],
  ["er", "Eritrea (er)"],
  ["ee", "Estonia (ee)"],
  ["et", "Ethiopia (et)"],
  ["fk", "Falkland Islands (fk)"],
  ["fo", "Faroe Islands (fo)"],
  ["fj", "Fiji (fj)"],
  ["fi", "Finland (fi)"],
  ["fr", "France (fr)"],
  ["gf", "French Guiana (gf)"],
  ["pf", "French Polynesia (pf)"],
  ["tf", "French Southern Territories (tf)"],
  ["ga", "Gabon (ga)"],
  ["gm", "Gambia (gm)"],
  ["ge", "Georgia (ge)"],
  ["de", "Germany (de)"],
  ["gh", "Ghana (gh)"],
  ["gi", "Gibraltar (gi)"],
  ["gr", "Greece (gr)"],
  ["gl", "Greenland (gl)"],
  ["gd", "Grenada (gd)"],
  ["gp", "Guadeloupe (gp)"],
  ["gu", "Guam (gu)"],
  ["gt", "Guatemala (gt)"],
  ["gn", "Guinea (gn)"],
  ["gw", "Guinea-Bissau (gw)"],
  ["gy", "Guyana (gy)"],
  ["ht", "Haiti (ht)"],
  ["hm", "Heard Island and McDonald Islands (hm)"],
  ["va", "Holy See (va)"],
  ["hn", "Honduras (hn)"],
  ["hk", "Hong Kong (hk)"],
  ["hu", "Hungary (hu)"],
  ["is", "Iceland (is)"],
  ["in", "India (in)"],
  ["id", "Indonesia (id)"],
  ["ir", "Iran (ir)"],
  ["iq", "Iraq (iq)"],
  ["ie", "Ireland (ie)"],
  ["il", "Israel (il)"],
  ["it", "Italy (it)"],
  ["jm", "Jamaica (jm)"],
  ["jp", "Japan (jp)"],
  ["jo", "Jordan (jo)"],
  ["kz", "Kazakhstan (kz)"],
  ["ke", "Kenya (ke)"],
  ["ki", "Kiribati (ki)"],
  ["kp", "Korea, Democratic People's Republic of (kp)"],
  ["kr", "Korea, Republic of (kr)"],
  ["kw", "Kuwait (kw)"],
  ["kg", "Kyrgyzstan (kg)"],
  ["la", "Lao People's Democratic Republic (la)"],
  ["lv", "Latvia (lv)"],
  ["lb", "Lebanon (lb)"],
  ["ls", "Lesotho (ls)"],
  ["lr", "Liberia (lr)"],
  ["ly", "Libya (ly)"],
  ["li", "Liechtenstein (li)"],
  ["lt", "Lithuania (lt)"],
  ["lu", "Luxembourg (lu)"],
  ["mo", "Macao (mo)"],
  ["mk", "North Macedonia (mk)"],
  ["mg", "Madagascar (mg)"],
  ["mw", "Malawi (mw)"],
  ["my", "Malaysia (my)"],
  ["mv", "Maldives (mv)"],
  ["ml", "Mali (ml)"],
  ["mt", "Malta (mt)"],
  ["mh", "Marshall Islands (mh)"],
  ["mq", "Martinique (mq)"],
  ["mr", "Mauritania (mr)"],
  ["mu", "Mauritius (mu)"],
  ["yt", "Mayotte (yt)"],
  ["mx", "Mexico (mx)"],
  ["fm", "Micronesia (fm)"],
  ["md", "Moldova (md)"],
  ["mc", "Monaco (mc)"],
  ["mn", "Mongolia (mn)"],
  ["ms", "Montserrat (ms)"],
  ["ma", "Morocco (ma)"],
  ["mz", "Mozambique (mz)"],
  ["mm", "Myanmar (mm)"],
  ["na", "Namibia (na)"],
  ["nr", "Nauru (nr)"],
  ["np", "Nepal (np)"],
  ["nl", "Netherlands (nl)"],
  ["an", "Netherlands Antilles (an)"],
  ["nc", "New Caledonia (nc)"],
  ["nz", "New Zealand (nz)"],
  ["ni", "Nicaragua (ni)"],
  ["ne", "Niger (ne)"],
  ["ng", "Nigeria (ng)"],
  ["nu", "Niue (nu)"],
  ["nf", "Norfolk Island (nf)"],
  ["mp", "Northern Mariana Islands (mp)"],
  ["no", "Norway (no)"],
  ["om", "Oman (om)"],
  ["pk", "Pakistan (pk)"],
  ["pw", "Palau (pw)"],
  ["ps", "Palestine (ps)"],
  ["pa", "Panama (pa)"],
  ["pg", "Papua New Guinea (pg)"],
  ["py", "Paraguay (py)"],
  ["pe", "Peru (pe)"],
  ["ph", "Philippines (ph)"],
  ["pn", "Pitcairn (pn)"],
  ["pl", "Poland (pl)"],
  ["pt", "Portugal (pt)"],
  ["pr", "Puerto Rico (pr)"],
  ["qa", "Qatar (qa)"],
  ["re", "Réunion (re)"],
  ["ro", "Romania (ro)"],
  ["ru", "Russian Federation (ru)"],
  ["rw", "Rwanda (rw)"],
  ["sh", "Saint Helena, Ascension and Tristan da Cunha (sh)"],
  ["kn", "Saint Kitts and Nevis (kn)"],
  ["lc", "Saint Lucia (lc)"],
  ["pm", "Saint Pierre and Miquelon (pm)"],
  ["vc", "Saint Vincent and the Grenadines (vc)"],
  ["ws", "Samoa (ws)"],
  ["sm", "San Marino (sm)"],
  ["st", "Sao Tome and Principe (st)"],
  ["sa", "Saudi Arabia (sa)"],
  ["sn", "Senegal (sn)"],
  ["rs", "Serbia (rs)"],
  ["sc", "Seychelles (sc)"],
  ["sl", "Sierra Leone (sl)"],
  ["sg", "Singapore (sg)"],
  ["sk", "Slovakia (sk)"],
  ["si", "Slovenia (si)"],
  ["sb", "Solomon Islands (sb)"],
  ["so", "Somalia (so)"],
  ["za", "South Africa (za)"],
  ["gs", "South Georgia and the South Sandwich Islands (gs)"],
  ["es", "Spain (es)"],
  ["lk", "Sri Lanka (lk)"],
  ["sd", "Sudan (sd)"],
  ["sr", "Suriname (sr)"],
  ["sj", "Svalbard and Jan Mayen (sj)"],
  ["sz", "Eswatini (sz)"],
  ["se", "Sweden (se)"],
  ["ch", "Switzerland (ch)"],
  ["sy", "Syrian Arab Republic (sy)"],
  ["tw", "Taiwan (tw)"],
  ["tj", "Tajikistan (tj)"],
  ["tz", "Tanzania (tz)"],
  ["th", "Thailand (th)"],
  ["tl", "Timor-Leste (tl)"],
  ["tg", "Togo (tg)"],
  ["tk", "Tokelau (tk)"],
  ["to", "Tonga (to)"],
  ["tt", "Trinidad and Tobago (tt)"],
  ["tn", "Tunisia (tn)"],
  ["tr", "Türkiye (tr)"],
  ["tm", "Turkmenistan (tm)"],
  ["tc", "Turks and Caicos Islands (tc)"],
  ["tv", "Tuvalu (tv)"],
  ["ug", "Uganda (ug)"],
  ["ua", "Ukraine (ua)"],
  ["ae", "United Arab Emirates (ae)"],
  ["gb", "United Kingdom (gb)"],
  ["us", "United States (us)"],
  ["um", "United States Minor Outlying Islands (um)"],
  ["uy", "Uruguay (uy)"],
  ["uz", "Uzbekistan (uz)"],
  ["vu", "Vanuatu (vu)"],
  ["ve", "Venezuela (ve)"],
  ["vn", "Viet Nam (vn)"],
  ["vg", "Virgin Islands, British (vg)"],
  ["vi", "Virgin Islands, U.S. (vi)"],
  ["wf", "Wallis and Futuna (wf)"],
  ["eh", "Western Sahara (eh)"],
  ["ye", "Yemen (ye)"],
  ["zm", "Zambia (zm)"],
  ["zw", "Zimbabwe (zw)"]
];

const LANGUAGES = [
  ["en", "English"],
  ["de", "German"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["it", "Italian"],
  ["nl", "Dutch"],
  ["tr", "Turkish"],
  ["pt", "Portuguese"],
  ["sv", "Swedish"],
  ["no", "Norwegian"],
  ["da", "Danish"],
  ["pl", "Polish"],
  ["ja", "Japanese"]
];

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -18, filter: "blur(8px)" }
};

function App() {
  const [theme, setTheme] = useState("light");
  const [step, setStep] = useState("home");
  const [url, setUrl] = useState(DEFAULT_TEST_URL);
  const [report, setReport] = useState(null);
  const [topic, setTopic] = useState("");
  const [countryCode, setCountryCode] = useState("us");
  const [languageCode, setLanguageCode] = useState("en");
  const [questions, setQuestions] = useState(null);
  const [includedQuestions, setIncludedQuestions] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  async function postJson(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      const detail = data.details ? ` ${data.details}` : "";
      throw new Error(`${data.error || "Something went wrong."}${detail}`);
    }
    return data;
  }

  async function fetchPage(event) {
    event.preventDefault();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the verification challenge before fetching the page.");
      return;
    }
    setError("");
    setStep("fetching");
    try {
      const data = await postJson("/api/fetch-page", { url, turnstileToken });
      const enteredDefaultUrl = normalizeUrlForComparison(url) === normalizeUrlForComparison(DEFAULT_TEST_URL);
      const pageTopic = enteredDefaultUrl ? DEFAULT_TEST_TOPIC : data.topic || "";
      setReport(data);
      setTopic(pageTopic);
      setCountryCode(data.countryCode || "us");
      setLanguageCode(data.languageCode || "en");
      setStep("settings");
    } catch (err) {
      setError(err.message);
      setStep("home");
      setTurnstileToken("");
      if (typeof window !== "undefined" && window.turnstile && window.__intentgapsTurnstileWidgetId) {
        try {
          window.turnstile.reset(window.__intentgapsTurnstileWidgetId);
        } catch {
          // Ignore reset failures.
        }
      }
    }
  }

  async function findQuestions() {
    if (!report?.id) return;
    setError("");
    setStep("finding");
    try {
      const data = await postJson("/api/find-questions", {
        id: report.id,
        topic,
        countryCode,
        languageCode
      });
      const items = normalizeQuestionItems(data);
      const included = Object.fromEntries(items.map((item) => [item.question, item.included]));
      setQuestions({ ...data, items });
      setIncludedQuestions(included);
      setStep("review");
    } catch (err) {
      setError(err.message);
      setStep("settings");
    }
  }

  function toggleQuestion(question) {
    setIncludedQuestions((current) => ({
      ...current,
      [question]: !current[question]
    }));
  }

  async function scoreSelected() {
    if (!report?.id || !questions) return;
    const items = questions.items || normalizeQuestionItems(questions);
    const selected = items
      .map((item) => item.question)
      .filter((question) => includedQuestions[question]);
    if (!selected.length) {
      setError("Please include at least one question to score.");
      return;
    }
    setError("");
    setStep("scoring");
    try {
      const data = await postJson("/api/score-questions", {
        id: report.id,
        questions: selected
      });
      setResult(data);
      setStep("scorecard");
    } catch (err) {
      setError(err.message);
      setStep("review");
    }
  }

  function reset() {
    setStep("home");
    setUrl(DEFAULT_TEST_URL);
    setReport(null);
    setTopic("");
    setCountryCode("us");
    setLanguageCode("en");
    setQuestions(null);
    setIncludedQuestions({});
    setResult(null);
    setError("");
    setTurnstileToken("");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Ambient />
      <header className="site-header" aria-label="IntentGaps header">
        <a className="brand" href="https://intentgaps.com" data-testid="link-brand">
          <Logo />
          <span>IntentGaps.com</span>
        </a>
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          data-testid="button-theme"
          onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main id="main" className="main-stage">
        <AnimatePresence mode="wait">
          {step === "home" && (
            <Home
              key="home"
              url={url}
              setUrl={setUrl}
              fetchPage={fetchPage}
              error={error}
              turnstileToken={turnstileToken}
              setTurnstileToken={setTurnstileToken}
            />
          )}
          {step === "fetching" && <LoadingPage key="fetching" label="Fetching page" detail="Rendering the target page, executing client-side JavaScript, and saving the DOM." />}
          {step === "settings" && (
            <Settings
              key="settings"
              report={report}
              topic={topic}
              setTopic={setTopic}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              languageCode={languageCode}
              setLanguageCode={setLanguageCode}
              analyze={findQuestions}
              error={error}
            />
          )}
          {step === "finding" && <LoadingPage key="finding" label="Finding closest proximity questions" detail="Getting AlsoAsked questions and assessing each one for relevance to your page." />}
          {step === "review" && (
            <ReviewQuestions
              key="review"
              questions={questions}
              includedQuestions={includedQuestions}
              toggleQuestion={toggleQuestion}
              scoreSelected={scoreSelected}
              error={error}
            />
          )}
          {step === "scoring" && <LoadingPage key="scoring" label="Scoring content" detail="Evaluating how well the page answers each included question." />}
          {step === "scorecard" && <Scorecard key="scorecard" result={result} reset={reset} />}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function normalizeQuestionItems(data) {
  if (Array.isArray(data?.questions) && data.questions.length) {
    return data.questions
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          return { question: item, relevant: true, recommended: true, included: true };
        }
        const question = String(item.question || "").trim();
        if (!question) return null;
        const relevant = Boolean(item.relevant);
        const recommended = item.recommended === undefined ? relevant : Boolean(item.recommended);
        const included = item.included === undefined ? relevant : Boolean(item.included);
        return { question, relevant, recommended, included };
      })
      .filter(Boolean);
  }
  // Backward-compatibility: older API responses returned only a string array.
  const list = Array.isArray(data?.relevantQuestions) ? data.relevantQuestions : [];
  return list.map((question) => ({ question, relevant: true, recommended: true, included: true }));
}

function normalizeUrlForComparison(value) {
  try {
    const parsed = new URL(String(value).trim());
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return String(value).trim().replace(/\/$/, "");
  }
}

function Home({ url, setUrl, fetchPage, error, turnstileToken, setTurnstileToken }) {
  const turnstileRequired = Boolean(TURNSTILE_SITE_KEY);
  const fetchDisabled = turnstileRequired && !turnstileToken;
  return (
    <motion.section className="home-page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            <span>Content intent audit demo</span>
          </div>
          <h1 data-testid="text-home-title">IntentGaps.com: Automatically find the intent gaps in your content</h1>
          <p className="subtext">
            A demo use of the{" "}
            <a href="https://alsoasked.com" target="_blank" rel="noreferrer">
              AlsoAsked
            </a>{" "}
            API
          </p>
        </div>
        <div className="insight-stack">
          <aside className="insight-card" aria-label="Did you know">
            <p className="insight-label">Did you know</p>
            <p>
              Answering more People Also Ask questions related to your topic is correlated to{" "}
              <a href="https://alsoasked.com/insights/paa-ranking-correlation" target="_blank" rel="noreferrer">
                ranking better in Google
              </a>
              ? You can{" "}
              <a href="https://searchengineland.com/improving-content-quality-scale-ai-442546" target="_blank" rel="noreferrer">
                do this process at scale
              </a>{" "}
              with Screaming Frog, AlsoAsked and ChatGPT.
            </p>
          </aside>
          <aside className="insight-card" aria-label="Did you know">
            <p className="insight-label">Did you know</p>
            <p>
              You can join 13,000+ other SEOs and get SEO tools, tips, and news every Monday for free in the the{" "}
              <a href="https://coreupdates.com/" target="_blank" rel="noreferrer">
                CoreUpdates.com newsletter
              </a>
              .
            </p>
          </aside>
        </div>
      </div>

      <form className="url-panel" onSubmit={fetchPage}>
        <label htmlFor="url-input">Enter a URL of your content:</label>
        <div className="url-row">
          <input
            id="url-input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            type="text"
            inputMode="url"
            placeholder="https://example.com/your-content"
            required
            data-testid="input-url"
          />
          <button
            className="primary-button"
            type="submit"
            data-testid="button-fetch"
            disabled={fetchDisabled}
            aria-disabled={fetchDisabled}
          >
            Fetch page <ArrowRight size={18} />
          </button>
        </div>
        {turnstileRequired ? (
          <TurnstileWidget token={turnstileToken} setToken={setTurnstileToken} />
        ) : null}
        {error ? (
          <p className="error-message" role="alert" data-testid="status-error">
            {error}
          </p>
        ) : null}
      </form>

      <section className="process-card" aria-labelledby="process-title">
        <h2 id="process-title">What does this process do?</h2>
        <ol>
          <li>Scrape your content and auto-detect the topic, language, and country</li>
          <li>Pass the topic to AlsoAsked to get the nearest intent proximity questions</li>
          <li>Use AI to determine if your content fully, partially, or does not answer these questions</li>
          <li>Produce a score card for you to improve your content</li>
        </ol>
      </section>
    </motion.section>
  );
}

function TurnstileWidget({ token, setToken }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    let cancelled = false;
    let pollHandle = null;

    function render() {
      if (cancelled || !containerRef.current) return;
      const turnstile = typeof window !== "undefined" ? window.turnstile : null;
      if (!turnstile || typeof turnstile.render !== "function") {
        pollHandle = window.setTimeout(render, 200);
        return;
      }
      try {
        const id = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          callback: (value) => {
            setToken(value);
            setStatus("verified");
          },
          "expired-callback": () => {
            setToken("");
            setStatus("expired");
            try {
              turnstile.reset(id);
            } catch {
              // Ignore reset failures.
            }
          },
          "error-callback": () => {
            setToken("");
            setStatus("error");
          },
          "timeout-callback": () => {
            setToken("");
            setStatus("expired");
          }
        });
        widgetIdRef.current = id;
        if (typeof window !== "undefined") {
          window.__intentgapsTurnstileWidgetId = id;
        }
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }

    render();

    return () => {
      cancelled = true;
      if (pollHandle) window.clearTimeout(pollHandle);
      const turnstile = typeof window !== "undefined" ? window.turnstile : null;
      if (turnstile && widgetIdRef.current && typeof turnstile.remove === "function") {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore remove failures.
        }
      }
      widgetIdRef.current = null;
      if (typeof window !== "undefined") {
        window.__intentgapsTurnstileWidgetId = null;
      }
    };
  }, [setToken]);

  let message = "Verifying you are human before fetching the page.";
  if (status === "verified" || token) message = "Verification complete. You can now fetch the page.";
  else if (status === "expired") message = "Verification expired. Please complete the challenge again.";
  else if (status === "error") message = "Verification could not load. Please refresh and try again.";

  return (
    <div className="turnstile-panel" data-testid="turnstile-panel">
      <div ref={containerRef} className="turnstile-widget" aria-label="Cloudflare Turnstile verification" />
      <p className={`turnstile-status ${status}`} role="status" aria-live="polite" data-testid="turnstile-status">
        {message}
      </p>
    </div>
  );
}

function LoadingPage({ label, detail }) {
  return (
    <motion.section className="loading-page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <div className="loading-orbit" aria-hidden="true">
        <div className="orbit-ring ring-a" />
        <div className="orbit-ring ring-b" />
        <div className="orbit-core">
          <Loader2 size={34} />
        </div>
      </div>
      <h1 data-testid="text-loading-label">{label}</h1>
      <p>{detail}</p>
      <div className="loading-steps" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </motion.section>
  );
}

function Settings({ report, topic, setTopic, countryCode, setCountryCode, languageCode, setLanguageCode, analyze, error }) {
  return (
    <motion.section className="settings-page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <div className="section-heading">
        <p className="eyebrow">
          <FileSearch size={16} />
          Page fetched
        </p>
        <h1>Review the detected settings</h1>
        <p className="fetched-url" data-testid="text-fetched-url">
          {report?.url}
        </p>
      </div>

      <PagePreview screenshot={report?.screenshot} url={report?.url} />

      <div className="settings-card">
        <label htmlFor="topic-input">Page topic:</label>
        <input
          id="topic-input"
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          data-testid="input-topic"
        />

        <div className="inline-selects">
          <SelectBox
            id="country-select"
            label="Country"
            value={countryCode}
            onChange={setCountryCode}
            options={COUNTRIES}
            testId="select-country"
          />
          <SelectBox
            id="language-select"
            label="Language"
            value={languageCode}
            onChange={setLanguageCode}
            options={LANGUAGES}
            testId="select-language"
          />
        </div>

        <div className="technical-note">
          <Globe2 size={18} />
          <span>Scrape mode: {report?.extractionMode || "pending"}</span>
        </div>

        {error ? (
          <p className="error-message" role="alert" data-testid="status-settings-error">
            {error}
          </p>
        ) : null}

        <button className="primary-button wide" type="button" onClick={analyze} data-testid="button-analyze">
          Find content gaps <Search size={18} />
        </button>
      </div>
    </motion.section>
  );
}

function PagePreview({ screenshot, url }) {
  return (
    <section className="preview-card" aria-labelledby="preview-title">
      <div className="preview-copy">
        <p className="eyebrow">
          <Globe2 size={16} />
          Rendered page preview
        </p>
        <h2 id="preview-title">What the browser saw</h2>
        <p>
          {screenshot?.dataUrl
            ? "Captured from the same rendered browser workflow used to analyse the page."
            : "Preview unavailable, but the page content was fetched successfully."}
        </p>
        {!screenshot?.dataUrl && screenshot?.reason ? (
          <p className="preview-debug" data-testid="text-preview-debug">
            Preview reason: {screenshot.reason}
          </p>
        ) : null}
      </div>
      <div className={`preview-frame ${screenshot?.dataUrl ? "" : "empty"}`}>
        {screenshot?.dataUrl ? (
          <img src={screenshot.dataUrl} alt={`Rendered preview of ${url || "the fetched page"}`} data-testid="img-page-preview" />
        ) : (
          <div className="preview-placeholder" data-testid="status-preview-unavailable">
            <CircleAlert size={22} />
            <span>Preview unavailable</span>
          </div>
        )}
      </div>
    </section>
  );
}

function SelectBox({ id, label, value, onChange, options, testId }) {
  return (
    <div className="select-box">
      <label htmlFor={id}>{label}</label>
      <div className="select-wrap">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} data-testid={testId}>
          {options.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <ChevronDown size={18} aria-hidden="true" />
      </div>
    </div>
  );
}

function ReviewQuestions({ questions, includedQuestions, toggleQuestion, scoreSelected, error }) {
  const items = questions?.items || normalizeQuestionItems(questions);
  const selectedCount = items.filter((item) => includedQuestions[item.question]).length;

  return (
    <motion.section
      className="review-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="section-heading">
        <p className="eyebrow">
          <ClipboardCheck size={16} />
          Review questions
        </p>
        <h1 data-testid="text-review-title">Questions we found:</h1>
        <p className="review-subtext" data-testid="text-review-subtext">
          Recommended questions selected, feel free to add or remove
        </p>
      </div>

      {questions?.sourceNotice ? (
        <div className="fallback-notice" role="status" data-testid="notice-question-source-review">
          <Sparkles size={18} />
          <p>{questions.sourceNotice}</p>
        </div>
      ) : null}

      <ul className="review-question-list" role="list">
        {items.map((item, index) => {
          const included = Boolean(includedQuestions[item.question]);
          return (
            <motion.li
              key={item.question}
              className="review-question-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                type="button"
                role="switch"
                aria-pressed={included}
                aria-label={`${included ? "Exclude" : "Include"} question: ${item.question}`}
                className={`review-question-box ${included ? "included" : "excluded"}`}
                data-testid={`button-review-question-${index}`}
                data-relevant={item.relevant ? "true" : "false"}
                onClick={() => toggleQuestion(item.question)}
              >
                <span className="review-question-icon" aria-hidden="true">
                  {included ? "✅" : "❌"}
                </span>
                <span className="review-question-text">{item.question}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      {error ? (
        <p className="error-message" role="alert" data-testid="status-review-error">
          {error}
        </p>
      ) : null}

      <div className="review-actions">
        <p className="review-count" data-testid="text-review-count">
          {selectedCount} of {items.length} included
        </p>
        <button
          className="primary-button"
          type="button"
          onClick={scoreSelected}
          disabled={selectedCount === 0}
          aria-disabled={selectedCount === 0}
          data-testid="button-score-content"
        >
          Score content <ArrowRight size={18} />
        </button>
      </div>
    </motion.section>
  );
}

function Scorecard({ result, reset }) {
  const counts = useMemo(() => {
    const answers = result?.answers || [];
    return {
      full: answers.filter((answer) => answer.status === "full").length,
      partial: answers.filter((answer) => answer.status === "partial").length,
      not: answers.filter((answer) => answer.status === "not").length
    };
  }, [result]);

  return (
    <motion.section className="scorecard-page" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <div className="score-hero">
        <div>
          <p className="eyebrow">
            <Gauge size={16} />
            Intent gap score
          </p>
          <h1>Score card for your content</h1>
          <p className="fetched-url">{result?.url}</p>
        </div>
        <div className="score-dial" style={{ "--score": result?.percentage ?? 0 }} data-testid="text-score">
          <span>{result?.score ?? 0}</span>
          <small>/{result?.maxScore ?? 0}</small>
          <p>{result?.percentage ?? 0}%</p>
        </div>
      </div>

      <div className="summary-row" aria-label="Score summary">
        <SummaryPill tone="green" label="Fully answered" value={counts.full} />
        <SummaryPill tone="amber" label="Partially answered" value={counts.partial} />
        <SummaryPill tone="red" label="Not answered" value={counts.not} />
      </div>

      {result?.sourceNotice ? (
        <div className="fallback-notice" role="status" data-testid="notice-question-source">
          <Sparkles size={18} />
          <p>{result.sourceNotice}</p>
        </div>
      ) : null}

      <section className="report-card" aria-labelledby="report-title">
        <h2 id="report-title">Question score card</h2>
        <div className="question-list">
          {(result?.answers || []).map((answer, index) => (
            <QuestionRow key={answer.question} answer={answer} index={index} />
          ))}
        </div>
      </section>

      <div className="cta-row">
        <a className="secondary-button" href="https://alsoasked.com" target="_blank" rel="noreferrer" data-testid="link-alsoasked">
          Explore AlsoAsked for free <ExternalLink size={16} />
        </a>
        <a
          className="secondary-button"
          href="https://searchengineland.com/improving-content-quality-scale-ai-442546"
          target="_blank"
          rel="noreferrer"
          data-testid="link-scale"
        >
          Learn how to do this at scale <ExternalLink size={16} />
        </a>
        <a className="primary-button" href="https://intentgaps.com" onClick={reset} data-testid="button-reset">
          Find more intent gaps <RefreshCcw size={16} />
        </a>
      </div>
    </motion.section>
  );
}

function SummaryPill({ tone, label, value }) {
  return (
    <div className={`summary-pill ${tone}`}>
      <span>{value}</span>
      <p>{label}</p>
    </div>
  );
}

function QuestionRow({ answer, index }) {
  const config = {
    full: { label: "Fully answered", icon: CheckCircle2, tone: "green" },
    partial: { label: "Partially answered", icon: CircleDashed, tone: "amber" },
    not: { label: "Does not answer", icon: CircleAlert, tone: "red" }
  }[answer.status];
  const Icon = config.icon;

  return (
    <article className="question-row" data-testid={`row-question-${index}`}>
      <div className="question-index">{String(index + 1).padStart(2, "0")}</div>
      <p>{answer.question}</p>
      <span className={`status-badge ${config.tone}`} data-testid={`status-question-${index}`}>
        <Icon size={16} />
        {config.label}
      </span>
    </article>
  );
}

function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <span className="beam beam-one" />
      <span className="beam beam-two" />
      <span className="gridline" />
    </div>
  );
}

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 48 48" aria-label="IntentGaps logo" role="img">
      <path d="M9 13.5C9 10.46 11.46 8 14.5 8h19C36.54 8 39 10.46 39 13.5v21c0 3.04-2.46 5.5-5.5 5.5h-19C11.46 40 9 37.54 9 34.5v-21Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M16 17h16M16 24h10M16 31h7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M29 29.5l3 3 5-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BlueSkyIcon({ size = 14 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 600 530"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M135.7 44.4C202 94 273.3 194.6 299.5 248.5 325.7 194.6 397 94 463.3 44.4 511 8.7 588.3-19 588.3 69.2c0 17.6-10.1 147.9-16 169.1-20.6 73.6-95.6 92.3-162.4 81 116.7 19.9 146.4 85.7 82.3 151.5-121.7 124.9-174.9-31.3-188.5-71.3-2.5-7.4-3.7-10.8-3.7-7.9 0-2.9-1.2.5-3.7 7.9-13.6 40-66.8 196.2-188.5 71.3-64.1-65.8-34.4-131.6 82.3-151.5-66.8 11.3-141.8-7.4-162.4-81-5.9-21.2-16-151.5-16-169.1C11.7-19 89-8.7 135.7 44.4z" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>
        <a href="https://intentgaps.com">IntentGaps.com</a> by{" "}
        <a href="https://withcandour.co.uk" target="_blank" rel="noopener noreferrer">
          Candour
        </a>
        's Mark Williams-Cook
        <span className="footer-socials">
          <a
            href="https://www.linkedin.com/in/markseo/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social"
            aria-label="Mark Williams-Cook on LinkedIn"
          >
            <Linkedin size={14} aria-hidden="true" />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://bsky.app/profile/markwilliamscook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social"
            aria-label="Mark Williams-Cook on BlueSky"
          >
            <BlueSkyIcon size={14} />
            <span>BlueSky</span>
          </a>
          <a
            href="https://youtube.com/@mwcsearch"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social"
            aria-label="Mark Williams-Cook on YouTube"
          >
            <Youtube size={14} aria-hidden="true" />
            <span>YouTube</span>
          </a>
        </span>
      </p>
    </footer>
  );
}

export default App;

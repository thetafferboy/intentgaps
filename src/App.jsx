import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDashed,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe2,
  Loader2,
  Moon,
  RefreshCcw,
  Search,
  Sparkles,
  Sun
} from "lucide-react";

const DEFAULT_TEST_URL = "https://www.pcgamer.com/best-gaming-chairs/";
const DEFAULT_TEST_TOPIC = "best gaming chairs";

const COUNTRIES = [
  ["us", "United States"],
  ["gb", "United Kingdom"],
  ["ie", "Ireland"],
  ["ca", "Canada"],
  ["au", "Australia"],
  ["de", "Germany"],
  ["fr", "France"],
  ["es", "Spain"],
  ["it", "Italy"],
  ["nl", "Netherlands"],
  ["tr", "Turkey"],
  ["se", "Sweden"],
  ["no", "Norway"],
  ["dk", "Denmark"],
  ["pl", "Poland"],
  ["br", "Brazil"],
  ["mx", "Mexico"],
  ["in", "India"],
  ["jp", "Japan"]
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
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

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
      throw new Error(data.error || "Something went wrong.");
    }
    return data;
  }

  async function fetchPage(event) {
    event.preventDefault();
    setError("");
    setStep("fetching");
    try {
      const data = await postJson("/api/fetch-page", { url });
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
    }
  }

  async function analyze() {
    if (!report?.id) return;
    setError("");
    setStep("finding");
    try {
      const data = await postJson("/api/analyze", {
        id: report.id,
        topic,
        countryCode,
        languageCode
      });
      setResult(data);
      setStep("scorecard");
    } catch (err) {
      setError(err.message);
      setStep("settings");
    }
  }

  function reset() {
    setStep("home");
    setUrl(DEFAULT_TEST_URL);
    setReport(null);
    setTopic("");
    setCountryCode("us");
    setLanguageCode("en");
    setResult(null);
    setError("");
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
            <Home key="home" url={url} setUrl={setUrl} fetchPage={fetchPage} error={error} />
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
              analyze={analyze}
              error={error}
            />
          )}
          {step === "finding" && <LoadingPage key="finding" label="Finding content gaps" detail="Getting AlsoAsked questions, filtering relevance, and scoring how well the page answers them." />}
          {step === "scorecard" && <Scorecard key="scorecard" result={result} reset={reset} />}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
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

function Home({ url, setUrl, fetchPage, error }) {
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
          <button className="primary-button" type="submit" data-testid="button-fetch">
            Fetch page <ArrowRight size={18} />
          </button>
        </div>
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

function Footer() {
  return (
    <footer className="site-footer">
      <p>
        <a href="https://intentgaps.com">IntentGaps.com</a> by{" "}
        <a href="https://www.linkedin.com/in/markseo/" target="_blank" rel="noreferrer">
          Mark Williams-Cook
        </a>{" "}
        of{" "}
        <a href="https://withcandour.co.uk" target="_blank" rel="noreferrer">
          Candour
        </a>
      </p>
    </footer>
  );
}

export default App;

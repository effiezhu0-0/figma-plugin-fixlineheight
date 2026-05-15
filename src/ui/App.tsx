import { useEffect, useMemo, useRef, useState } from "react";
import type { ApplyPhase2Result, PluginToUiMessage, UiToPluginMessage } from "../types/messages";
import { copy, formatResult, type Language } from "./i18n";
import effieAvatarUrl from "./assets/effie-avatar.png";
import "./styles/app.css";

type CheckboxProps = {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
  className?: string;
};

function parseLineHeightPercentForPayload(input: string): number {
  const trimmed = input.trim();
  if (trimmed === "") {
    return 100;
  }
  const n = parseFloat(trimmed.replace(/[^\d.-]/g, ""));
  if (isNaN(n) || !isFinite(n)) {
    return 100;
  }
  return Math.min(300, Math.max(50, Math.round(n)));
}

function Checkbox({ checked, onChange, disabled = false, label, hint, className }: CheckboxProps) {
  const classes = [
    "checkbox",
    checked ? "checkbox--checked" : "",
    !checked ? "checkbox--muted" : "",
    disabled ? "checkbox--disabled" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const containerClasses = ["check-control", className, disabled ? "check-control--disabled" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={containerClasses}>
      <input
        type="checkbox"
        className="checkbox-input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={classes} aria-hidden="true">
        {checked ? "✓" : ""}
      </span>
      <span className="check-control__content">
        <span className="row__title">{label}</span>
        {hint ? <span className="row__hint">{hint}</span> : null}
      </span>
    </label>
  );
}

export default function App() {
  const [language, setLanguage] = useState<Language>("zh");
  const [applyMultiline, setApplyMultiline] = useState(true);
  const [includeComponents, setIncludeComponents] = useState(true);
  const [includeInstances, setIncludeInstances] = useState(true);
  const [includeMainComponents, setIncludeMainComponents] = useState(true);
  const [skipMixedFontSizes, setSkipMixedFontSizes] = useState(true);
  const [lineHeightPercentInput, setLineHeightPercentInput] = useState("100");
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<ApplyPhase2Result | null>(null);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);

  const text = useMemo(() => copy[language], [language]);
  const isZh = language === "zh";
  const handleIncludeComponentsChange = (nextValue: boolean) => {
    setIncludeComponents(nextValue);
    if (nextValue) {
      setIncludeInstances(true);
      setIncludeMainComponents(true);
      return;
    }
    setIncludeInstances(false);
    setIncludeMainComponents(false);
  };
  const handleApply = () => {
    setIsApplying(true);
    const lineHeightPercent = parseLineHeightPercentForPayload(lineHeightPercentInput);
    const message: UiToPluginMessage = {
      type: "apply-phase2",
      payload: {
        lineHeightPercent,
        applyMultiline,
        includeComponents,
        includeInstances,
        includeMainComponents,
        skipMixedFontSizes
      }
    };
    parent.postMessage({ pluginMessage: message }, "*");
  };

  useEffect(() => {
    window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginToUiMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) {
        return;
      }

      if (message.type === "apply-phase2-result") {
        const payload = message.payload;
        setIsApplying(false);
        setResult(payload);

        const shouldAnimate =
          !payload.noSelection && !payload.noTextFound && payload.updatedCount > 0;

        if (shouldAnimate) {
          const runShimmer = () => {
            const el = ctaButtonRef.current;
            if (!el) {
              return;
            }
            el.classList.remove("cta--shimmer");
            void el.offsetWidth;
            el.classList.add("cta--shimmer");
          };
          requestAnimationFrame(() => {
            requestAnimationFrame(runShimmer);
          });
        }
      }
    };

    return () => {
      window.onmessage = null;
    };
  }, []);

  const noSelectionText = isZh ? "请选择1个图层" : "Please select a layer to start";
  const noTextText = isZh ? "未选中文本图层" : "No text layers selected";

  return (
    <main className="panel">
      <section className="lang-row">
        <button
          type="button"
          className={`lang-toggle ${isZh ? "lang-toggle--zh" : ""}`}
          onClick={() => setLanguage(isZh ? "en" : "zh")}
          aria-label="Switch language"
        >
          <span className="lang-toggle__dot" />
          <span className="lang-toggle__label">{isZh ? "中文" : "EN"}</span>
        </button>
      </section>

      <header className="hero">
        <h1 className="title">{text.title}</h1>
        <p className="subtitle">{text.subtitle}</p>
      </header>

      <section className="card" aria-label={text.preference}>
        <div className="card__header">{text.preference}</div>
        <div className="card__body">
          <div className="percent-section">
            <div className="percent-row">
              <span className="percent-row__label">{text.lineHeightPercentLabel}</span>
              <div className="percent-row__field">
                <input
                  type="text"
                  inputMode="numeric"
                  className="percent-input"
                  value={lineHeightPercentInput}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/[^\d]/g, "");
                    setLineHeightPercentInput(digitsOnly);
                  }}
                  onBlur={() => {
                    if (lineHeightPercentInput.trim() === "") {
                      setLineHeightPercentInput("100");
                    }
                  }}
                  aria-label={text.lineHeightPercentLabel}
                />
                <span className="percent-suffix">%</span>
              </div>
            </div>
            <hr className="preference-divider" />
          </div>

          <Checkbox
            checked={applyMultiline}
            onChange={setApplyMultiline}
            label={text.applyMultiline}
          />

          <Checkbox
            checked={includeComponents}
            onChange={handleIncludeComponentsChange}
            label={text.includeComponents}
          />

          <Checkbox
            checked={includeInstances}
            onChange={setIncludeInstances}
            label={text.instances}
            disabled={!includeComponents}
            className="check-control--sub"
          />
          <Checkbox
            checked={includeMainComponents}
            onChange={setIncludeMainComponents}
            label={text.mainComponents}
            disabled={!includeComponents}
            className="check-control--sub"
          />
          <p
            className={["component-note", !includeComponents ? "component-note--disabled" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {text.componentNote}
          </p>

          <Checkbox
            checked={skipMixedFontSizes}
            onChange={setSkipMixedFontSizes}
            label={text.skipMixed}
          />
        </div>
      </section>

      <button
        ref={ctaButtonRef}
        type="button"
        className="cta"
        onClick={handleApply}
        disabled={isApplying}
        onAnimationEnd={(event) => {
          if (event.animationName !== "cta-gradient-shimmer") {
            return;
          }
          event.currentTarget.classList.remove("cta--shimmer");
        }}
      >
        {text.apply}
      </button>

      {result?.noSelection ? <p className="alert-text">{noSelectionText}</p> : null}
      {result?.noTextFound ? <p className="alert-text">{noTextText}</p> : null}
      {result && !result.noSelection && !result.noTextFound ? (
        result.updatedCount > 0 ||
        result.autoLayoutCount > 0 ||
        result.skippedMissingFontCount > 0 ||
        result.skippedMultilineCount > 0 ||
        result.skippedMixedFontCount > 0 ||
        result.skippedComponentCount > 0 ? (
          <section className="result-card">
            {result.updatedCount > 0 ? (
              <div className="result-row">
                <span className="result-dot" aria-hidden="true" />
                <p className="result-text">{formatResult(text.resultUpdated, result.updatedCount)}</p>
              </div>
            ) : null}
            {result.autoLayoutCount > 0 ? (
              <div className="result-row result-row--warn">
                <span className="result-dot result-dot--warn" aria-hidden="true" />
                <p className="result-text result-text--warn">
                  {formatResult(text.resultAutoLayout, result.autoLayoutCount)}
                </p>
              </div>
            ) : null}
            {result.skippedMissingFontCount > 0 ? (
              <div className="result-row result-row--skip">
                <span className="result-dot result-dot--skip" aria-hidden="true" />
                <p className="result-text result-text--skip">
                  {formatResult(text.resultSkippedFont, result.skippedMissingFontCount)}
                </p>
              </div>
            ) : null}
            {result.skippedMultilineCount > 0 ? (
              <div className="result-row result-row--skip">
                <span className="result-dot result-dot--skip" aria-hidden="true" />
                <p className="result-text result-text--skip">
                  {formatResult(text.resultSkippedMultiline, result.skippedMultilineCount)}
                </p>
              </div>
            ) : null}
            {result.skippedMixedFontCount > 0 ? (
              <div className="result-row result-row--skip">
                <span className="result-dot result-dot--skip" aria-hidden="true" />
                <p className="result-text result-text--skip">
                  {formatResult(text.resultSkippedMixed, result.skippedMixedFontCount)}
                </p>
              </div>
            ) : null}
            {result.skippedComponentCount > 0 ? (
              <div className="result-row result-row--skip">
                <span className="result-dot result-dot--skip" aria-hidden="true" />
                <p className="result-text result-text--skip">
                  {formatResult(text.resultSkippedComponent, result.skippedComponentCount)}
                </p>
              </div>
            ) : null}
          </section>
        ) : null
      ) : null}
      {result?.errorMessage ? <p className="alert-text">{result.errorMessage}</p> : null}

      <footer className="plugin-footer">
        <div className="plugin-footer__avatar-wrap" aria-hidden="true">
          <img className="plugin-footer__avatar" src={effieAvatarUrl} alt="" width={20} height={20} />
        </div>
        <p className="plugin-footer__text">{text.footerCredit}</p>
      </footer>
    </main>
  );
}

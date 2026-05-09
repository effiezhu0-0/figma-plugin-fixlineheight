import { useEffect, useMemo, useState } from "react";
import type { ApplyPhase2Result, PluginToUiMessage, UiToPluginMessage } from "../types/messages";
import { copy, formatResult, type Language } from "./i18n";
import "./styles/app.css";

type CheckboxProps = {
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  disabled?: boolean;
  label: string;
  hint?: string;
  className?: string;
};

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
  const [skipMixedFontSizes, setSkipMixedFontSizes] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [result, setResult] = useState<ApplyPhase2Result | null>(null);

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
    const message: UiToPluginMessage = {
      type: "apply-phase2",
      payload: {
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
        setIsApplying(false);
        setResult(message.payload);
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
          <Checkbox
            checked={applyMultiline}
            onChange={setApplyMultiline}
            label={text.applyMultiline}
            hint={text.applyMultilineHint}
            className="check-control--top"
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
          <p className="component-note">{text.componentNote}</p>

          <Checkbox
            checked={skipMixedFontSizes}
            onChange={setSkipMixedFontSizes}
            label={text.skipMixed}
          />
        </div>
      </section>

      <button type="button" className="cta" onClick={handleApply} disabled={isApplying}>
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
    </main>
  );
}

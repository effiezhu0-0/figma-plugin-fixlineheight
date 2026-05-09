import { useMemo, useState } from "react";
import { copy, type Language } from "./i18n";
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

          <Checkbox
            checked={skipMixedFontSizes}
            onChange={setSkipMixedFontSizes}
            label={text.skipMixed}
          />
        </div>
      </section>

      <button type="button" className="cta">
        {text.apply}
      </button>
    </main>
  );
}

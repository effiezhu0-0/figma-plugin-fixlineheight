export type Language = "zh" | "en";

export type I18nCopy = {
  title: string;
  subtitle: string;
  preference: string;
  applyMultiline: string;
  applyMultilineHint: string;
  includeComponents: string;
  instances: string;
  mainComponents: string;
  skipMixed: string;
  apply: string;
};

export const copy: Record<Language, I18nCopy> = {
  zh: {
    title: "行高编辑器",
    subtitle: "使用字号和黄金比例修复行高",
    preference: "偏好设置",
    applyMultiline: "应用于多行文本",
    applyMultilineHint: "使用黄金比例 (1.618)",
    includeComponents: "包含组件",
    instances: "实例",
    mainComponents: "主组件",
    skipMixed: "跳过混合字号",
    apply: "应用"
  },
  en: {
    title: "Line Height Fixer",
    subtitle: "Fix line height using font size and golden ratio",
    preference: "Preference",
    applyMultiline: "Apply to multi-line text",
    applyMultilineHint: "Uses golden ratio (1.618)",
    includeComponents: "Include components",
    instances: "Instances",
    mainComponents: "Main components",
    skipMixed: "Skip mixed font sizes",
    apply: "Apply"
  }
};

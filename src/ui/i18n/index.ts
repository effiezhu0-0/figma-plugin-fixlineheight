export type Language = "zh" | "en";

export type I18nCopy = {
  title: string;
  subtitle: string;
  preference: string;
  lineHeightPercentLabel: string;
  applyMultiline: string;
  includeComponents: string;
  instances: string;
  mainComponents: string;
  componentNote: string;
  skipMixed: string;
  apply: string;
  resultUpdated: string;
  resultAutoLayout: string;
  resultSkippedFont: string;
  resultSkippedMultiline: string;
  resultSkippedMixed: string;
  resultSkippedComponent: string;
};

export const copy: Record<Language, I18nCopy> = {
  zh: {
    title: "行高编辑器",
    subtitle: "统一按行高比例调整文本",
    preference: "偏好设置",
    lineHeightPercentLabel: "行高比例",
    applyMultiline: "应用于多行文本",
    includeComponents: "包含组件",
    instances: "实例",
    mainComponents: "主组件",
    componentNote: "修改主组件可能影响未修改样式的实例",
    skipMixed: "跳过混合字号",
    apply: "应用",
    resultUpdated: "{n} 个图层已更新",
    resultAutoLayout: "更新的图层中{n}个在自动布局中，可能改变",
    resultSkippedFont: "{n} 个跳过（缺失字体）",
    resultSkippedMultiline: "{n} 个跳过（多行文本已关闭）",
    resultSkippedMixed: "{n} 个跳过（混合字号）",
    resultSkippedComponent: "{n} 个跳过（组件设置）"
  },
  en: {
    title: "Line Height Fixer",
    subtitle: "Apply a unified line-height percentage to text",
    preference: "Preference",
    lineHeightPercentLabel: "Line height percentage",
    applyMultiline: "Apply to multi-line text",
    includeComponents: "Include components",
    instances: "Instances",
    mainComponents: "Main components",
    componentNote: "Editing main components may affect linked instances",
    skipMixed: "Skip mixed font sizes",
    apply: "Apply",
    resultUpdated: "{n} layers updated",
    resultAutoLayout: "{n} of updated layers are in auto layout (layout may shift)",
    resultSkippedFont: "{n} skipped (missing fonts)",
    resultSkippedMultiline: "{n} skipped (multi-line disabled)",
    resultSkippedMixed: "{n} skipped (mixed font sizes)",
    resultSkippedComponent: "{n} skipped (component settings)"
  }
};

export function formatResult(template: string, n: number): string {
  return template.replace(/\{n\}/g, String(n));
}

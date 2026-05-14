# Line Height Fixer

A Figma plugin to quickly unify text line height across selected layers, frames, and components.

Built for UI/UX designers who want cleaner typography workflows with fewer manual adjustments.

---

## Features

### Smart Line Height Adjustment
- Set line height using percentage values

### Multi-line Support
Supports both:
- Single-line text
- Multi-line text

### Component-aware Processing
Choose whether to process:
- Instances
- Main components

Helps avoid accidental component-wide changes.

### Detailed Result Feedback
Shows:
- Updated text count
- Warnings
- Skips due to missing font, mixed font, etc.

### Lightweight & Native
- Designed specifically for Figma workflows
- Fast and minimal UI
- Bilingual support (中文 / EN)

---

## How to Use

1. Open the plugin
2. Select text layers, frames, or groups in Figma
3. Adjust preferences if needed
4. Click `Apply`

The plugin will automatically process all supported text layers in the selection.

---

## Preference Options

### Line Height Percentage
Set line height in percentage.

Examples:
- `100` → 100%
- `140` → 140%
- `160` → 160%

### Apply to Multi-line Text
Enable or disable multi-line text processing.

### Include Components
Choose whether to process:
- Instances
- Main components

### Skip Mixed Font Sizes
Skip text layers using mixed font sizes.

---

## Notes

Editing main components may affect linked instances that have not overridden styles.

Mixed font-size text is currently skipped for stability and consistency.

---

## Version

`v1.0`

---

## Made by

Effie Zhu · 2026

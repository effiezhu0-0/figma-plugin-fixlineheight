# LineFlow

**English:** LineFlow  
**中文:** 行高编辑器

A Figma plugin to unify text line height across selected layers, frames, and components with one click.

Built for UI/UX designers who want cleaner typography workflows with fewer manual adjustments.

## Features

### Smart line height adjustment
- Set line height using percentage values

### Multi-line support
Supports both:
- Single-line text
- Multi-line text

### Component-aware processing
Choose whether to process:
- Instances
- Main components

Helps avoid accidental component-wide changes.

### Detailed result feedback
Shows:
- Updated text count
- Warnings
- Skips due to missing font, mixed font, etc.

### Lightweight & native
- Designed specifically for Figma workflows
- Fast and minimal UI
- Bilingual support (中文 / EN)


## How to use

1. Open the plugin
2. Select text layers, frames, or groups in Figma
3. Adjust preferences if needed
4. Click `Apply`

The plugin will automatically process all supported text layers in the selection.


## Preference options

### Line height percentage
Set line height in percentage.

Examples:
- `100` → 100%
- `140` → 140%
- `160` → 160%

### Apply to multi-line text
Enable or disable multi-line text processing.

### Include components
Choose whether to process:
- Instances
- Main components

### Skip mixed font sizes
Skip text layers using mixed font sizes.


## Notes

Editing main components may affect linked instances that have not overridden styles.

Mixed font-size text is currently skipped for stability and consistency.


## Version

`v1.0`


## Made by

Effie Zhu · 2026

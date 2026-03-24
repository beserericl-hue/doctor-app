---
description: Rules for all component files under app/src/components/
globs: ["app/src/components/**/*.tsx"]
---
- Named exports only — no default exports in components/
- Props interface defined at top of file, named [ComponentName]Props
- All Pressable elements must have accessibilityRole and accessibilityLabel
- Minimum touch target: 48x48pt (use hitSlop when visual size is smaller)
- Never use inline style objects — only StyleSheet.create()
- Colors only from @/constants/colors — no hardcoded hex values
- No business logic in components — use hooks for data and store actions

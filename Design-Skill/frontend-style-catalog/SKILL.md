---
name: frontend-style-catalog
description: Choose and apply a frontend visual style for web or Electron projects using a reusable catalog of themes, rules, tokens, examples, and audits. Use when the user asks for styling, theming, visual direction, UI polish, or frontend look-and-feel work and no project-specific design system already answers the need.
---

# Frontend Style Catalog

Use this skill to pick one visual theme and apply it consistently to a frontend project.

## Workflow

1. Read [catalog/themes.json](catalog/themes.json) and show the available themes with one-line summaries.
2. Ask the user to choose a theme unless they already named one.
3. Once a theme is selected, read these files before changing code:
   - `themes/<theme-id>/brief.md`
   - `themes/<theme-id>/rules.md`
   - `themes/<theme-id>/tokens.css`
   - `themes/<theme-id>/components.md`
   - `themes/<theme-id>/anti-patterns.md`
   - `themes/<theme-id>/audit.md`
4. Apply the chosen theme to the minimum set of project files required.
5. Run a style audit using the selected theme's `audit.md`.

## Rules

- Show all available themes when the request is about frontend styling and no theme is already chosen.
- Do not blend themes unless the user explicitly asks for a hybrid.
- Treat `examples/` files as structural references only. Reuse patterns and layout ideas, but do not blindly copy exact code into the target project.
- Prefer project-native tools and CSS already in the repo over adding new dependencies.
- If the project already has a strong design system, use this catalog only if the user asks to restyle or replace it.

## Starter Themes

- `tactical-dark`: dense desktop control surfaces, dashboards, editors, dev tools
- `retro-pixel`: pixel-art and game-tool interfaces with hard edges and chunky contrast
- `soft-productivity`: calm notebook and planning interfaces with readable spacing

## Preview

Open [preview/index.html](preview/index.html) in a browser to browse the local catalog.

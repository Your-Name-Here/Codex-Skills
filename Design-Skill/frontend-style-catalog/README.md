# frontend-style-catalog

`frontend-style-catalog` is a reusable Codex skill scaffold for choosing and applying frontend visual themes to web and Electron projects.

It is a style catalog, not a component library. It gives Codex theme direction, implementation rules, CSS tokens, component guidance, anti-patterns, preview metadata, and audit checklists.

The folder `themes/Base Template/` is a shared specimen page for validating a theme against common UI patterns before or after applying theme-specific styling.

## What It Is

- A small set of named frontend themes
- Practical rules Codex can read before styling a project
- Theme tokens that can be copied into project CSS
- A local static preview page for browsing the catalog
- Audit checklists for post-implementation review

## What It Is Not

- Not a UI toolkit
- Not a framework
- Not a design token build pipeline
- Not a screenshot gallery by default
- Not a mandate to rewrite an existing design system unless the user asks

## Add A New Theme

1. Create `themes/<theme-id>/`.
2. Add:
   - `brief.md`
   - `rules.md`
   - `tokens.css`
   - `components.md`
   - `anti-patterns.md`
   - `audit.md`
   - `examples/README.md`
3. Add the theme entry to `catalog/themes.json`.
4. Reload `preview/index.html` and confirm the new card appears.
5. Keep instructions implementation-oriented. Avoid vague mood-board language.

## Add Screenshots Or Example HTML

- Put example HTML files inside `themes/<theme-id>/examples/`.
- Keep examples small and structural.
- If you add screenshots, store them beside the example files and reference them from that theme's `examples/README.md`.
- Treat examples as references for composition, spacing, and styling patterns, not code to paste unchanged.
- Use `themes/Base Template/index.html` as the baseline specimen when you want one page that exercises common UI patterns.

## Suggested Codex Prompts

- "Style this Electron dashboard with `tactical-dark`."
- "Show me the available themes in `frontend-style-catalog` and help me pick one."
- "Apply `soft-productivity` to this journaling app."
- "Restyle this sprite editor using `retro-pixel`."
- "Audit this page against the `tactical-dark` theme rules."

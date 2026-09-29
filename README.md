# Codex Skills

Reusable skills for AI coding agents. Each skill is a directory containing a `SKILL.md` file and any supporting references or assets.

## Skills

### Frontend Style Catalog

**Skill name:** `frontend-style-catalog`  
**Location:** [`Design-Skill/frontend-style-catalog/`](Design-Skill/frontend-style-catalog/)

Helps choose and apply a visual style for a web or Electron project. It provides a catalog of reusable themes with design tokens, layout and component guidance, examples, and visual audits. Use it when styling a UI and the project does not already have a design system to follow.

The included themes are tactical dark, soft productivity, retro pixel, and a base template. The directory also contains a browser preview for exploring the catalog.

### Verification-First Planning

**Skill name:** `verification-first-planning`  
**Location:** [`verification-first-planning/`](verification-first-planning/)

Creates a concrete implementation handoff before product work begins. It defines observable requirements, maps them to verification evidence, prepares and baselines tests or other checks where practical, and creates an ordered task plan. It is intended for feature and project planning, not implementation-only requests.

The skill includes templates for feature specifications, verification matrices, baseline reports, and task lists, plus reference guides for requirements, tests, and planning.

## Install

Install either skill from this GitHub repository with the [`skills` CLI](https://www.skills.sh/docs/cli). `npx` runs it without a separate global installation:

```sh
npx skills add https://github.com/Your-Name-Here/Codex-Skills --skill frontend-style-catalog
```

```sh
npx skills add https://github.com/Your-Name-Here/Codex-Skills --skill verification-first-planning
```

To install both in one command, pass both skill names:

```sh
npx skills add https://github.com/Your-Name-Here/Codex-Skills --skill frontend-style-catalog --skill verification-first-planning
```

The CLI will ask where to install the skills if it cannot infer your agent or target. Use its `--help` option to see current targeting options:

```sh
npx skills add --help
```

## Update

After the skills have been installed, update all installed skills with:

```sh
npx skills update
```

To update one installed skill, provide its name:

```sh
npx skills update frontend-style-catalog
```

```sh
npx skills update verification-first-planning
```

The update command fetches the latest versions from their source repositories. New installs also receive the latest published version. See the [CLI documentation](https://www.skills.sh/docs/cli) for current options.

## Contributing

Keep each skill's `name` in its `SKILL.md` frontmatter aligned with the directory name used by the install commands. Put skill-specific references, templates, examples, and assets alongside that `SKILL.md`.

# Skill Library

Enterprise Agent Skills registry compatible with [Cursor Agent Skills](https://cursor.com/docs/skills) and the [Agent Skills open standard](https://agentskills.io/specification).

Browse skills, copy an install command, and add them to your project in one step.

## Quick Install

```bash
npx @tianqi815/skill-cli add code-review
npx @tianqi815/skill-cli add oidc-integration -g
```

Or use the community CLI directly:

```bash
npx skills add tianqi815/skill-library --skill code-review -a cursor -y
```

## Repository Layout

```
skills/           Skill registry (SKILL.md directories)
catalog/          Auto-generated skills.json index
packages/skill-cli  Branded install CLI
apps/web          Skills marketplace web UI
scripts/          Validation and catalog generators
```

## Contribute a Skill

1. Copy `skills/_templates/SKILL.template.md` into `skills/<category>/<skill-name>/SKILL.md`
2. Ensure `name` matches the folder name
3. Run `npm run validate`
4. Open a pull request using the PR template

## Development

```bash
npm install
npm run validate
npm run catalog
npm run dev:web
npm run build
```

## Skill Standard

Each skill is a directory with `SKILL.md` (YAML frontmatter + markdown body). Optional: `scripts/`, `references/`, `assets/`.

Install target paths:

- Project: `.cursor/skills/<skill-name>/`
- Global: `~/.cursor/skills/<skill-name>/`

## Deployment

### GitHub Pages

The `Deploy Web` workflow publishes `apps/web/out` to the `gh-pages` branch.
Enable **Settings → Pages → Deploy from branch → gh-pages / root**.

### Vercel

Import the repository in Vercel. Configuration is in [`vercel.json`](vercel.json).

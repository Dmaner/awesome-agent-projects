# Awesome Agents Projects

A compact GitHub Pages directory for open-source AI agent projects.

## Development

```bash
npm install
npm run dev
```

## Content

The source of truth is `content/awesome-agent-projects.md`. It keeps `stars` and `updated` fields for sorting and validation, but the UI intentionally does not render stars.

Project icons live in `public/icons/` and are rendered in square frames with `object-fit: contain` to avoid distortion.

## Data Refresh

Data refresh is intentionally owned by the Codex automation `awesome-agent-projects-daily-refresh`, not by a project-side GitHub crawler script.

The automation updates `content/awesome-agent-projects.md` and `public/icons/`, then runs validation and build checks before committing and pushing changes.

GitHub Actions only deploys the static site to GitHub Pages after changes are pushed.

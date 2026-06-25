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

After appending or refreshing category entries, run:

```bash
npm run sort:categories
npm run validate:data
npm run build
```

`npm run sort:categories` only rewrites the `Categories` section order so each category lists projects by `stars` descending. It does not fetch GitHub data, change icons, or remove category projects.

GitHub Actions only deploys the static site to GitHub Pages after changes are pushed.

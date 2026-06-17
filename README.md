# Awesome Agents Projects

A compact GitHub Pages directory for open-source AI agent projects.

## Development

```bash
npm install
npm run seed:icons
npm run dev
```

## Content

The source of truth is `content/awesome-agent-projects.md`. It keeps `stars` for data sorting, but the UI intentionally does not render stars.

Project icons live in `public/icons/` and are rendered in square frames with `object-fit: contain` to avoid distortion.

## Data Refresh

Dry-run with fixture data:

```bash
npm run update:data -- --dry-run --fixture
```

Live update from GitHub Search:

```bash
GITHUB_TOKEN=... npm run update:data
```

The GitHub Actions workflow `.github/workflows/update-data.yml` runs daily and commits refreshed Markdown/icons when the repository is published.

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

Project icons live in `public/icons/` and are rendered in square frames with `object-fit: contain` to avoid distortion. The update script caches GitHub owner avatars first and falls back to generated SVGs only when the repo cannot be resolved.

## Data Refresh

Dry-run with fixture data:

```bash
npm run update:data -- --dry-run --fixture
```

Refresh cached GitHub icons for the current Markdown:

```bash
npm run cache:icons
```

Live update from GitHub Search:

```bash
GITHUB_TOKEN=... npm run update:data
```

`New` is updated only from repos that are not already present in the Markdown and either recently crossed the 1k-star discovery threshold or appear in GitHub Trending. If no matching new repos are found, the script exits without modifying `content/awesome-agent-projects.md`, preserving the existing `New` section.

The GitHub Actions workflow `.github/workflows/update-data.yml` runs daily and commits refreshed Markdown/icons when the repository is published.

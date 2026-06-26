# Awesome Agent Projects

Awesome Agent Projects is a daily refreshed directory of open-source AI agent projects.

The site is built for people and AI crawlers that need a compact, structured way to discover active agent projects across coding agents, browser agents, agent frameworks, MCP tooling, workflow automation, research agents, data agents, and vertical AI agents.

- Live site: https://dmaner.github.io/awesome-agent-projects/
- Repository: https://github.com/Dmaner/awesome-agent-projects
- Source data: `content/awesome-agent-projects.md`

## What The Directory Tracks

The homepage is organized into three data views:

- `Popular`: exactly 20 active agent-related repositories, sorted by GitHub stars.
- `New`: newly discovered active projects that were not already present in the previous directory snapshot.
- `Categories`: the accumulated project directory, grouped by practical builder use case.

Current category families:

- `Coding Agents`: agents that write, refactor, review, or operate on codebases.
- `AI Assistants`: personal, team, or conversational assistant systems.
- `Research Agents`: agents for deep research, papers, science, and citation-heavy workflows.
- `Data Agents`: agents for RAG, data analysis, knowledge graphs, retrieval, and databases.
- `Browser Agents`: agents that operate browsers, websites, desktops, or computer-use workflows.
- `Workflow Automation`: agentic workflow builders, orchestrators, and automation platforms.
- `Multi-Agent Frameworks`: frameworks for swarms, teams, role-playing agents, and multi-agent coordination.
- `Agent Infrastructure`: SDKs, runtimes, memory layers, MCP tooling, sandboxes, skills, and core agent infrastructure.
- `DevTools & CLIs`: developer tools, terminal tools, productivity helpers, and agent-facing CLIs.
- `Vertical Agents`: domain-specific agents for finance, security, education, marketing, office work, and other verticals.

## Data Refresh Policy

Data refresh is intentionally owned by the Codex automation `awesome-agent-projects-daily-refresh`.

The repository should not add, modify, or rely on a project-side GitHub crawler script. Refresh runs collect candidates outside the repo, then update only the Markdown source data and cached icons after validation.

The refresh process updates:

- `content/awesome-agent-projects.md`
- `public/icons/`

The content file stores parser-compatible project lines with hidden metadata such as `repo`, `icon`, `category`, `source`, `discovered`, `stars`, `updated`, and category `tags`. The UI renders the human-facing project cards from this Markdown.

## Suggest A Project

To suggest an open-source AI agent project, open an issue or pull request with:

- GitHub repository URL.
- Recommended category.
- A short reason why it is an agent project.
- Evidence that the repository is active and maintained.

Suggested projects are still subject to the refresh rules: they should be clearly agent-related, open source, active, and a good fit for an existing category family.

## Development

Install dependencies:

```bash
npm install
```

Run the local Vite app:

```bash
npm run dev
```

Sort category project rows by stars:

```bash
npm run sort:categories
```

Validate the Markdown parser contract and icon references:

```bash
npm run validate:data
```

Build the static site and SEO artifacts:

```bash
npm run build
```

`npm run build` runs the TypeScript/Vite build and then generates crawler-friendly files in `dist/`:

- `llms.txt`
- `catalog.json`
- `robots.txt`
- `sitemap.xml`

The build also injects JSON-LD into `dist/index.html` so crawlers that do not execute JavaScript still receive a structured summary of the directory.

## Content Format

`content/awesome-agent-projects.md` is the source of truth.

Every category project line must include:

- `repo`
- `icon`
- `stars`
- `updated`
- `tags`

Every category project line must be followed by an indented description line.

Project icons live in `public/icons/` and are rendered in square frames with `object-fit: contain` to avoid distortion.

## Publishing

GitHub Actions deploys the static site to GitHub Pages after changes are pushed to `main`.

Before committing content or SEO changes, run:

```bash
npm run sort:categories
npm run validate:data
npm run build
```

The deployed site should expose:

- https://dmaner.github.io/awesome-agent-projects/
- https://dmaner.github.io/awesome-agent-projects/llms.txt
- https://dmaner.github.io/awesome-agent-projects/catalog.json
- https://dmaner.github.io/awesome-agent-projects/sitemap.xml
- https://dmaner.github.io/awesome-agent-projects/robots.txt

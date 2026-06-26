<p align="center">
  <a href="https://dmaner.github.io/awesome-agent-projects/">
    <img src="public/favicon.svg" width="88" height="88" alt="Awesome Agent Projects logo">
  </a>
</p>

<h1 align="center">Awesome Agent Projects</h1>

<p align="center">
  <strong>A daily refreshed directory of active open-source AI agent projects.</strong>
</p>

<p align="center">
  <a href="https://dmaner.github.io/awesome-agent-projects/">Explore the site</a>
  &middot;
  <a href="https://dmaner.github.io/awesome-agent-projects/catalog.json">catalog.json</a>
  &middot;
  <a href="https://dmaner.github.io/awesome-agent-projects/llms.txt">llms.txt</a>
  &middot;
  <a href="https://github.com/Dmaner/awesome-agent-projects/issues">Suggest a project</a>
</p>

<p align="center">
  <a href="https://github.com/Dmaner/awesome-agent-projects/actions/workflows/deploy-pages.yml">
    <img alt="Deploy GitHub Pages" src="https://github.com/Dmaner/awesome-agent-projects/actions/workflows/deploy-pages.yml/badge.svg">
  </a>
</p>

Find coding agents, browser agents, research agents, data agents, workflow builders, multi-agent frameworks, MCP tooling, and agent infrastructure without digging through stale lists.

This project keeps a compact web directory for humans, plus structured files that search engines and AI crawlers can read directly.

## Start Here

| View | Use it for | Link |
| --- | --- | --- |
| Popular | The 20 highest-starred active agent repositories in the current refresh. | [Open Popular](https://dmaner.github.io/awesome-agent-projects/) |
| New | Newly discovered active projects that were not already in the previous directory snapshot. | [Open New](https://dmaner.github.io/awesome-agent-projects/) |
| Categories | The full accumulated directory, grouped by practical use case. | [Open Categories](https://dmaner.github.io/awesome-agent-projects/) |
| AI catalog | Machine-readable export for agents, search, and downstream tools. | [catalog.json](https://dmaner.github.io/awesome-agent-projects/catalog.json) |
| LLM guide | Short crawler-friendly guide to the directory and its structure. | [llms.txt](https://dmaner.github.io/awesome-agent-projects/llms.txt) |

## What Makes It Different

- Daily refresh from GitHub Search/API and GitHub Trending.
- Focus on open-source projects that are clearly agent-related.
- Activity filters for `Popular` and `New`, so old inactive repos do not dominate the front page.
- Full category archive in `content/awesome-agent-projects.md`.
- Cached project icons under `public/icons/`.
- Static SEO and AI crawler artifacts generated at build time.
- No GitHub crawler script in the repo. Data refresh is owned by the Codex automation workflow.

## Categories

| Category | What belongs here |
| --- | --- |
| Coding Agents | Agents that write, refactor, review, or operate on codebases. |
| AI Assistants | Personal, team, and conversational assistant systems. |
| Research Agents | Deep research, scientific workflows, papers, and citation-heavy agents. |
| Data Agents | RAG, data analysis, knowledge graphs, retrieval, and database agents. |
| Browser Agents | Agents that operate browsers, websites, desktops, or computer-use workflows. |
| Workflow Automation | Agentic workflow builders, orchestrators, and automation platforms. |
| Multi-Agent Frameworks | Swarms, teams, role-playing agents, and multi-agent coordination. |
| Agent Infrastructure | SDKs, runtimes, memory layers, MCP tooling, sandboxes, and skills. |
| DevTools & CLIs | Developer tools, terminal tools, productivity helpers, and agent-facing CLIs. |
| Vertical Agents | Domain-specific agents for finance, security, education, marketing, office work, and other verticals. |

## What Counts As An Agent Project

A good candidate usually has most of these traits:

- It runs, builds, evaluates, or manages AI agents.
- It gives an LLM tools, memory, workflow control, browser/computer access, codebase access, or multi-agent coordination.
- It is open source and has a public GitHub repository.
- It is actively maintained or recently active.
- It is more than a prompt collection, tutorial-only repo, generic AI app, or static resource list.

## Data Files

The Markdown source of truth is:

```text
content/awesome-agent-projects.md
```

Public build artifacts:

```text
https://dmaner.github.io/awesome-agent-projects/
https://dmaner.github.io/awesome-agent-projects/llms.txt
https://dmaner.github.io/awesome-agent-projects/catalog.json
https://dmaner.github.io/awesome-agent-projects/sitemap.xml
https://dmaner.github.io/awesome-agent-projects/robots.txt
```

`catalog.json` exports `popular`, `new`, and `categories` with project names, repositories, URLs, categories, stars, update dates, tags, and descriptions.

## Suggest A Project

Open an issue or pull request with:

```text
Repo:
Recommended category:
Why it is an agent project:
Maintenance signal:
```

Suggested projects are still checked by the refresh rules before they are included.

## Development

```bash
npm install
npm run dev
```

Before committing data or SEO changes:

```bash
npm run sort:categories
npm run validate:data
npm run build
```

What the commands do:

| Command | Purpose |
| --- | --- |
| `npm run sort:categories` | Sort category project rows by `stars` descending. |
| `npm run validate:data` | Validate Markdown parser fields, category counts, recency rules, and icon references. |
| `npm run build` | Build the static site and generate SEO/AI crawler artifacts in ignored `dist/`. |

## Maintenance Notes

Data refresh is intentionally owned by the Codex automation `awesome-agent-projects-daily-refresh`.

The repo should not add or rely on a project-side GitHub crawler. Refresh runs collect candidates outside the repo, then update:

```text
content/awesome-agent-projects.md
public/icons/
```

After a push to `main`, GitHub Actions deploys the static site to GitHub Pages.

## Related Lists

For broader or differently curated agent resources, see:

- [e2b-dev/awesome-ai-agents](https://github.com/e2b-dev/awesome-ai-agents)
- [kyrolabs/awesome-agents](https://github.com/kyrolabs/awesome-agents)
- [slavakurilyak/awesome-ai-agents](https://github.com/slavakurilyak/awesome-ai-agents)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const CONTENT_PATH = join(ROOT, "content", "awesome-agent-projects.md");
const ICON_DIR = join(ROOT, "public", "icons");
const TODAY = new Date().toISOString().slice(0, 10);
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const fixture = args.has("--fixture");

const CATEGORY_RULES = [
  ["Coding Agents", "Agents that help write, refactor and review code.", ["code", "coding", "developer", "software", "engineer", "ide", "terminal"]],
  ["AI Assistants", "Conversational agents and assistant frameworks.", ["assistant", "chat", "copilot", "conversation"]],
  ["Research Agents", "Agents for research, papers and scientific discovery.", ["research", "paper", "scientist", "science"]],
  ["Data Agents", "Agents for data analysis, query and visualization.", ["data", "sql", "table", "analytics", "query"]],
  ["Browser Agents", "Agents that operate browsers and the web.", ["browser", "web", "playwright", "selenium"]],
  ["Workflow Automation", "Automate tasks and processes with AI agents.", ["workflow", "automation", "task", "tool"]],
  ["Multi-Agent Frameworks", "Frameworks for building multi-agent systems.", ["multi-agent", "multi agent", "crew", "swarm"]],
  ["Agent Infrastructure", "Libraries and tools for agent infrastructure.", ["agent", "framework", "llm", "rag", "memory", "orchestration"]],
  ["DevTools & CLIs", "Developer tools, CLIs and productivity helpers.", ["cli", "terminal", "devtool", "command"]],
  ["Vertical Agents", "Domain-specific agents for real-world verticals.", ["finance", "medical", "legal", "education", "vertical"]],
];

const SEED_PROJECTS = [
  repo("All-Hands-AI/OpenHands", "OpenHands", "Code, run commands, browse, and ship changes through a software agent.", "Coding Agents", 56000),
  repo("SWE-agent/SWE-agent", "SWE-agent", "Turn language models into software engineering agents.", "Coding Agents", 17000),
  repo("microsoft/autogen", "AutoGen", "Build multi-agent conversations and agentic applications.", "Multi-Agent Frameworks", 46000),
  repo("langchain-ai/langgraph", "LangGraph", "Low-level orchestration framework for stateful agent workflows.", "Agent Infrastructure", 15000),
  repo("crewAIInc/crewAI", "CrewAI", "Framework for role-based autonomous AI agent teams.", "Multi-Agent Frameworks", 35000),
  repo("langgenius/dify", "Dify", "Open-source platform for LLM applications and agent workflows.", "Workflow Automation", 110000),
  repo("continuedev/continue", "Continue", "Open-source AI code assistant for IDEs and developer workflows.", "Coding Agents", 27000),
  repo("Aider-AI/aider", "Aider", "AI pair programming in your terminal with git-aware edits.", "DevTools & CLIs", 37000),
  repo("browser-use/browser-use", "Browser Use", "Make websites accessible for AI agents and browser automation.", "Browser Agents", 62000),
  repo("ComposioHQ/composio", "Composio", "Tool integrations for AI agents.", "Workflow Automation", 28000),
  repo("huggingface/smolagents", "Smolagents", "A lightweight library to build agents in Python.", "Agent Infrastructure", 21000),
  repo("langchain-ai/langchain", "LangChain", "Build context-aware agents at scale.", "Agent Infrastructure", 105000),
  repo("OpenInterpreter/open-interpreter", "OpenInterpreter", "Run code and automate any computer.", "DevTools & CLIs", 60000),
  repo("lobehub/lobe-chat", "LobeChat", "Open-source AI chat framework.", "AI Assistants", 65000),
  repo("OpenBMB/AgentVerse", "AgentVerse", "Platform for agent ecosystem experiments.", "Multi-Agent Frameworks", 5000),
  repo("letta-ai/letta", "MemGPT", "LLM agents with long-term memory.", "Agent Infrastructure", 17000),
  repo("microsoft/TaskWeaver", "TaskWeaver", "AI-native task orchestration.", "Workflow Automation", 7600),
  repo("run-llama/llama_index", "LlamaIndex", "Data framework for LLM apps.", "Data Agents", 44000),
  repo("gpt-engineer-org/gpt-engineer", "GPT Engineer", "LLM-powered software engineer.", "Coding Agents", 54000),
];

const projects = fixture ? SEED_PROJECTS : await collectGitHubProjects();

if (projects.length < 10) {
  if (dryRun) {
    console.log(`Dry run found ${projects.length} live projects. Existing content was not modified.`);
    process.exit(0);
  }
  throw new Error("Not enough GitHub projects were collected; refusing to overwrite content.");
}

const deduped = uniqueByRepo(projects);
const popular = deduped.toSorted((a, b) => b.stars - a.stars).slice(0, 10);
const newest = deduped.toSorted((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 10);
const categories = buildCategories(deduped);
const markdown = renderMarkdown(popular, newest, categories);

if (dryRun) {
  console.log(`Dry run OK: ${popular.length} Popular, ${newest.length} New, ${categories.length} categories.`);
  process.exit(0);
}

await mkdir(ICON_DIR, { recursive: true });
await Promise.all([...popular, ...newest, ...categories.flatMap((category) => category.projects)].map(cacheIcon));
await writeFile(CONTENT_PATH, markdown, "utf8");
console.log(`Updated ${CONTENT_PATH}`);

async function collectGitHubProjects() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const queries = [
    ["agent language:Python stars:>1000", "stars"],
    ["ai-agent stars:>1000", "stars"],
    [`agent created:>${since} stars:>200`, "stars"],
    ["coding agent stars:>500", "updated"],
    ["browser agent stars:>200", "updated"],
  ];

  const results = [];
  for (const [query, sort] of queries) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=20`;
    const json = await fetchJson(url);
    results.push(...json.items.map(normalizeGitHubRepo));
  }
  return results;
}

async function fetchJson(url) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "awesome-agent-projects-updater",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub request failed ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

function normalizeGitHubRepo(item) {
  const text = `${item.name} ${item.description ?? ""} ${item.topics?.join(" ") ?? ""}`.toLowerCase();
  const category = CATEGORY_RULES.find(([, , keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] ?? "Agent Infrastructure";
  return {
    name: item.name,
    repo: item.full_name,
    url: item.html_url,
    about: item.description ?? "Open-source agent project.",
    category,
    icon: `/icons/${slug(item.full_name)}.svg`,
    source: "github-search",
    discoveredAt: TODAY,
    stars: item.stargazers_count ?? 0,
    updatedAt: item.updated_at?.slice(0, 10) ?? TODAY,
    avatarUrl: item.owner?.avatar_url,
  };
}

function buildCategories(projects) {
  return CATEGORY_RULES.map(([name, description]) => {
    const categoryProjects = projects
      .filter((project) => project.category === name)
      .toSorted((a, b) => b.stars - a.stars)
      .slice(0, 3);

    return {
      name,
      description,
      projectCount: projects.filter((project) => project.category === name).length,
      projects: categoryProjects,
    };
  }).filter((category) => category.projects.length > 0);
}

async function cacheIcon(project) {
  const iconName = `${slug(project.repo)}.svg`;
  const iconPath = join(ICON_DIR, iconName);
  project.icon = `/icons/${iconName}`;
  await writeFile(iconPath, fallbackIconSvg(project.name), "utf8");
}

function renderMarkdown(popular, newest, categories) {
  return `# Awesome Agent Projects

Daily refreshed open-source agent projects, grouped for builders.

## Popular

${popular.map(renderProject).join("\n")}

## New

${newest.map(renderProject).join("\n")}

## Categories

${categories.map(renderCategory).join("\n\n")}
`;
}

function renderProject(project) {
  return `- [${project.name}](${project.url}) | repo: ${project.repo} | icon: ${project.icon} | category: ${project.category} | source: ${project.source} | discovered: ${project.discoveredAt} | stars: ${project.stars} | updated: ${project.updatedAt}
  ${project.about}`;
}

function renderCategory(category) {
  return `### ${category.name} | ${category.projectCount} projects

Description: ${category.description}

${category.projects.map((project) => `- [${project.name}](${project.url}) | repo: ${project.repo} | icon: ${project.icon}`).join("\n")}`;
}

function uniqueByRepo(projects) {
  const seen = new Set();
  return projects.filter((project) => {
    const key = project.repo.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function repo(fullName, name, about, category, stars) {
  return {
    name,
    repo: fullName,
    url: `https://github.com/${fullName}`,
    about,
    category,
    icon: `/icons/${slug(fullName)}.svg`,
    source: "fixture",
    discoveredAt: TODAY,
    stars,
    updatedAt: TODAY,
  };
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fallbackIconSvg(name) {
  const initials = name.split(/[\s._-]+/).map((part) => part[0]).join("").slice(0, 3).toUpperCase();
  const hue = Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${name}">
  <rect width="96" height="96" rx="18" fill="hsl(${hue} 74% 45%)"/>
  <circle cx="24" cy="24" r="18" fill="rgba(255,255,255,.18)"/>
  <circle cx="76" cy="75" r="26" fill="rgba(255,255,255,.12)"/>
  <text x="48" y="56" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${initials.length > 2 ? 24 : 30}" font-weight="800" fill="white">${initials}</text>
</svg>
`;
}

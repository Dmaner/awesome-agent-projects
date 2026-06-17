import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const CONTENT_PATH = join(ROOT, "content", "awesome-agent-projects.md");
const ICON_DIR = join(ROOT, "public", "icons");
const TODAY = new Date().toISOString().slice(0, 10);
const execFileAsync = promisify(execFile);
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const fixture = args.has("--fixture");
const cacheIconsOnly = args.has("--cache-icons-only");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || (await readGhToken());

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

const existingMarkdown = await readFile(CONTENT_PATH, "utf8");
const existingProjects = parseExistingProjects(existingMarkdown);
const existingRepoKeys = new Set(existingProjects.map((project) => repoKey(project.repo)).filter(Boolean));

if (cacheIconsOnly) {
  const updatedMarkdown = await rewriteMarkdownIcons(existingMarkdown, existingProjects);
  if (dryRun) {
    console.log(`Dry run OK: would cache GitHub avatars for ${uniqueByRepo(existingProjects).length} repositories.`);
    process.exit(0);
  }
  await writeFile(CONTENT_PATH, updatedMarkdown, "utf8");
  console.log(`Cached GitHub avatars and updated icon paths in ${CONTENT_PATH}`);
  process.exit(0);
}

const liveProjects = fixture ? SEED_PROJECTS : await collectGitHubProjects();

if (liveProjects.length < 10) {
  if (dryRun) {
    console.log(`Dry run found ${liveProjects.length} live projects. Existing content was not modified.`);
    process.exit(0);
  }
  throw new Error("Not enough GitHub projects were collected; refusing to overwrite content.");
}

const newCandidates = fixture
  ? uniqueByRepo(liveProjects)
  : uniqueByRepo(liveProjects).filter((project) => !existingRepoKeys.has(repoKey(project.repo)) && isNewSourceCandidate(project));

if (!fixture && newCandidates.length === 0) {
  console.log("No new 1k+ or GitHub Trending agent projects outside the existing Markdown. Existing content was not modified.");
  process.exit(0);
}

const mergedProjects = uniqueByRepo([...liveProjects, ...existingProjects]);
const popular = mergedProjects.toSorted((a, b) => b.stars - a.stars).slice(0, 10);
const newest = newCandidates
  .toSorted((a, b) => b.stars - a.stars || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 10);
const categories = buildCategories(mergedProjects);

if (dryRun) {
  console.log(`Dry run OK: ${popular.length} Popular, ${newest.length} New, ${categories.length} categories.`);
  process.exit(0);
}

await cacheIconsForProjects([...popular, ...newest, ...categories.flatMap((category) => category.projects)]);
await writeFile(CONTENT_PATH, renderMarkdown(popular, newest, categories), "utf8");
console.log(`Updated ${CONTENT_PATH}`);

async function collectGitHubProjects() {
  const createdSince = daysAgo(45);
  const pushedSince = daysAgo(14);
  const searchQueries = [
    [`agent created:>${createdSince} stars:>1000`, "stars", "github-recent-1k"],
    [`ai-agent created:>${createdSince} stars:>1000`, "stars", "github-recent-1k"],
    [`llm agent created:>${createdSince} stars:>1000`, "stars", "github-recent-1k"],
    [`agent pushed:>${pushedSince} stars:>1000`, "updated", "github-recent-1k"],
    ["agent stars:>1000", "stars", "github-search"],
    ["ai-agent stars:>1000", "stars", "github-search"],
  ];

  const results = [];
  for (const [query, sort, source] of searchQueries) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=25`;
    const json = await fetchJson(url);
    results.push(...json.items.map((item) => normalizeGitHubRepo(item, source)));
  }

  results.push(...await collectTrendingProjects());
  return uniqueByRepo(results);
}

async function collectTrendingProjects() {
  try {
    const trendingRepos = new Set();
    for (const since of ["daily", "weekly"]) {
      const html = await fetchText(`https://github.com/trending?since=${since}`);
      for (const match of html.matchAll(/href="\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)"/g)) {
        if (isRepoPath(match[1])) {
          trendingRepos.add(match[1]);
        }
      }
    }

    const projects = [];
    for (const fullName of [...trendingRepos].slice(0, 40)) {
      try {
        const item = await fetchJson(`https://api.github.com/repos/${fullName}`);
        const project = normalizeGitHubRepo(item, "github-trending");
        if (isAgentLike(project)) {
          projects.push(project);
        }
      } catch (error) {
        console.warn(`Skipping trending repo ${fullName}: ${error.message}`);
      }
    }
    return projects;
  } catch (error) {
    console.warn(`GitHub Trending collection failed: ${error.message}`);
    return [];
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: requestHeaders("application/vnd.github+json") });
  if (!response.ok) {
    throw new Error(`GitHub request failed ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { headers: requestHeaders("text/html") });
    if (!response.ok) {
      throw new Error(`GitHub request failed ${response.status}: ${await response.text()}`);
    }
    return response.text();
  } catch (error) {
    const { stdout } = await execFileAsync("curl", ["-L", "--fail", "--silent", "--show-error", url], {
      cwd: ROOT,
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    if (!stdout) {
      throw error;
    }
    return stdout;
  }
}

function requestHeaders(accept) {
  const headers = {
    Accept: accept,
    "User-Agent": "awesome-agent-projects-updater",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

async function readGhToken() {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "token"], { cwd: ROOT, timeout: 10_000 });
    return stdout.trim();
  } catch {
    return "";
  }
}

function normalizeGitHubRepo(item, source) {
  const text = `${item.name} ${item.description ?? ""} ${item.topics?.join(" ") ?? ""}`.toLowerCase();
  const category = CATEGORY_RULES.find(([, , keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] ?? "Agent Infrastructure";
  return {
    name: item.name,
    repo: item.full_name,
    url: item.html_url,
    about: item.description ?? "Open-source agent project.",
    category,
    icon: `/icons/${slug(item.full_name)}.png`,
    source,
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

async function cacheIconsForProjects(projects) {
  await mkdir(ICON_DIR, { recursive: true });
  const iconByRepo = new Map();
  await Promise.all(
    uniqueByRepo(projects).map(async (project) => {
      iconByRepo.set(repoKey(project.repo), await cacheIcon(project));
    }),
  );

  for (const project of projects) {
    project.icon = iconByRepo.get(repoKey(project.repo)) ?? project.icon;
  }
}

async function cacheIcon(project) {
  const key = repoKey(project.repo);
  const owner = project.repo?.split("/")[0];
  if (!key || !owner || owner === "vertical") {
    return writeFallbackIcon(project);
  }

  const iconName = `${slug(project.repo)}.png`;
  const iconPath = join(ICON_DIR, iconName);
  const avatarUrl = project.avatarUrl ?? `https://github.com/${owner}.png?size=160`;

  try {
    const response = await fetch(avatarUrl, { headers: requestHeaders("image/png") });
    if (!response.ok) {
      throw new Error(`avatar request failed ${response.status}`);
    }
    await writeFile(iconPath, Buffer.from(await response.arrayBuffer()));
    return `/icons/${iconName}`;
  } catch (error) {
    try {
      await cacheIconWithGh(project.repo, iconPath);
      return `/icons/${iconName}`;
    } catch (ghError) {
      console.warn(`Falling back to generated icon for ${project.repo}: ${error.message}; gh/curl fallback failed: ${ghError.message}`);
      return writeFallbackIcon(project);
    }
  }
}

async function cacheIconWithGh(repoName, iconPath) {
  const { stdout } = await execFileAsync("gh", ["api", `repos/${repoName}`, "--jq", ".owner.avatar_url"], {
    cwd: ROOT,
    timeout: 20_000,
  });
  const avatarUrl = stdout.trim();
  if (!avatarUrl) {
    throw new Error("empty avatar_url");
  }
  await execFileAsync("curl", ["-L", "--fail", "--silent", "--show-error", "-o", iconPath, avatarUrl], {
    cwd: ROOT,
    timeout: 30_000,
  });
}

async function writeFallbackIcon(project) {
  const iconName = `${slug(project.repo || project.name)}.svg`;
  await writeFile(join(ICON_DIR, iconName), fallbackIconSvg(project.name), "utf8");
  return `/icons/${iconName}`;
}

async function rewriteMarkdownIcons(markdown, projects) {
  await cacheIconsForProjects(projects);
  const iconByRepo = new Map(projects.map((project) => [repoKey(project.repo), project.icon]));

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim().startsWith("- [")) {
        return line;
      }
      const parsed = parseProjectLine(line);
      const icon = iconByRepo.get(repoKey(parsed.repo));
      if (!icon) {
        return line;
      }
      if (line.includes("| icon:")) {
        return line.replace(/\|\s*icon:\s*[^|]+/, `| icon: ${icon}`);
      }
      return `${line} | icon: ${icon}`;
    })
    .join("\n");
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

function parseExistingProjects(markdown) {
  const lines = markdown.split(/\r?\n/);
  const projects = [];
  let section;
  let activeCategory;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      section = sectionMatch[1].toLowerCase();
      activeCategory = undefined;
      continue;
    }

    if (section === "categories") {
      const categoryMatch = line.match(/^###\s+(.+?)(?:\s+\|\s+\d+\s+projects?)?$/i);
      if (categoryMatch) {
        activeCategory = categoryMatch[1];
        continue;
      }
    }

    if (line.startsWith("- [")) {
      const parsed = parseProjectLine(line);
      projects.push({
        name: parsed.name,
        repo: parsed.repo,
        url: parsed.url,
        about: collectDescription(lines, index) || parsed.name,
        category: parsed.category ?? activeCategory ?? "Agent Infrastructure",
        icon: parsed.icon ?? `/icons/${slug(parsed.repo)}.png`,
        source: parsed.source ?? "existing-md",
        discoveredAt: parsed.discoveredAt ?? TODAY,
        stars: Number(parsed.stars ?? 0),
        updatedAt: parsed.updatedAt ?? TODAY,
      });
    }
  }

  return projects;
}

function parseProjectLine(line) {
  const match = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)(.*)$/);
  if (!match) {
    throw new Error(`Invalid project line: ${line}`);
  }

  const [, name, url, rest] = match;
  const fields = {};
  for (const part of rest.split("|").map((item) => item.trim()).filter(Boolean)) {
    const fieldMatch = part.match(/^([^:]+):\s*(.+)$/);
    if (fieldMatch) {
      fields[fieldMatch[1].trim().toLowerCase()] = fieldMatch[2].trim();
    }
  }

  return {
    name,
    url,
    repo: fields.repo ?? "",
    icon: fields.icon,
    category: fields.category,
    source: fields.source,
    discoveredAt: fields.discovered,
    stars: fields.stars,
    updatedAt: fields.updated,
  };
}

function collectDescription(lines, startIndex) {
  const descriptionLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith("  ")) {
      break;
    }
    const trimmed = line.trim();
    if (trimmed) {
      descriptionLines.push(trimmed);
    }
  }
  return descriptionLines.join(" ");
}

function uniqueByRepo(projects) {
  const seen = new Set();
  return projects.filter((project) => {
    const key = repoKey(project.repo);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isNewSourceCandidate(project) {
  return project.stars >= 1000 || project.source === "github-trending";
}

function isAgentLike(project) {
  const haystack = `${project.name} ${project.about} ${project.category}`.toLowerCase();
  return /\b(agent|agents|ai|llm|coding|assistant|browser|automation|workflow|rag)\b/.test(haystack);
}

function repo(fullName, name, about, category, stars) {
  return {
    name,
    repo: fullName,
    url: `https://github.com/${fullName}`,
    about,
    category,
    icon: `/icons/${slug(fullName)}.png`,
    source: "fixture",
    discoveredAt: TODAY,
    stars,
    updatedAt: TODAY,
  };
}

function repoKey(value) {
  return value?.toLowerCase().trim() ?? "";
}

function isRepoPath(value) {
  const owner = value.split("/")[0].toLowerCase();
  return !new Set([
    "apps",
    "collections",
    "customer-stories",
    "enterprise",
    "explore",
    "features",
    "marketplace",
    "orgs",
    "organizations",
    "pricing",
    "sponsors",
    "topics",
    "trending",
  ]).has(owner);
}

function daysAgo(days) {
  return new Date(Date.now() - 1000 * 60 * 60 * 24 * days).toISOString().slice(0, 10);
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

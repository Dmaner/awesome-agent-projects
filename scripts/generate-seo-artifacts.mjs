import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const CONTENT = join(ROOT, "content", "awesome-agent-projects.md");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://dmaner.github.io/awesome-agent-projects/";
const REPOSITORY_URL = "https://github.com/Dmaner/awesome-agent-projects";
const SITE_NAME = "Awesome Agent Projects";
const SITE_DESCRIPTION = "Daily refreshed open-source AI agent directory for coding agents, browser agents, agent frameworks, MCP tooling, workflow automation, research agents, data agents, and vertical AI agents.";

await mkdir(DIST, { recursive: true });

const markdown = await readFile(CONTENT, "utf8");
const directory = parseDirectoryMarkdown(markdown);
const catalog = buildCatalog(directory);

await writeFile(join(DIST, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
await writeFile(join(DIST, "llms.txt"), renderLlmsTxt(catalog), "utf8");
await writeFile(join(DIST, "robots.txt"), renderRobotsTxt(), "utf8");
await writeFile(join(DIST, "sitemap.xml"), renderSitemap(), "utf8");
await injectJsonLd(catalog);

console.log("Generated SEO artifacts: llms.txt, catalog.json, robots.txt, sitemap.xml, JSON-LD");

function parseDirectoryMarkdown(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const directory = {
    popular: [],
    newest: [],
    categories: [],
  };
  let section;
  let activeCategory;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const name = sectionMatch[1].toLowerCase();
      section = name === "popular" ? "popular" : name === "new" ? "newest" : name === "categories" ? "categories" : undefined;
      activeCategory = undefined;
      continue;
    }

    if (section === "categories") {
      const categoryMatch = line.match(/^###\s+(.+?)(?:\s+\|\s+(\d+)\s+projects?)?$/i);
      if (categoryMatch) {
        activeCategory = {
          name: categoryMatch[1],
          description: "",
          projectCount: Number(categoryMatch[2] ?? 0),
          projects: [],
        };
        directory.categories.push(activeCategory);
        continue;
      }

      if (activeCategory && line.startsWith("Description:")) {
        activeCategory.description = line.replace(/^Description:\s*/i, "");
        continue;
      }

      if (activeCategory && line.startsWith("- [")) {
        const project = parseProject(line, collectAbout(lines, index));
        activeCategory.projects.push({
          ...project,
          category: activeCategory.name,
          tags: parseTags(project.fields.tags),
        });
      }
      continue;
    }

    if ((section === "popular" || section === "newest") && line.startsWith("- [")) {
      const project = parseProject(line, collectAbout(lines, index));
      directory[section].push({
        ...project,
        category: project.fields.category ?? "Uncategorized",
        tags: [],
      });
    }
  }

  return directory;
}

function parseProject(line, about) {
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
    repo: fields.repo ?? "",
    url,
    stars: Number(fields.stars ?? 0),
    updatedAt: fields.updated ?? "",
    about,
    fields,
  };
}

function collectAbout(lines, startIndex) {
  const about = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith("  ")) {
      break;
    }
    const trimmed = lines[index].trim();
    if (trimmed) {
      about.push(trimmed);
    }
  }
  return about.join(" ");
}

function parseTags(value) {
  return value?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [];
}

function buildCatalog(directory) {
  return {
    name: SITE_NAME,
    url: SITE_URL,
    repository: REPOSITORY_URL,
    description: SITE_DESCRIPTION,
    generatedAt: new Date().toISOString(),
    source: "content/awesome-agent-projects.md",
    popular: directory.popular.map(toCatalogProject),
    new: directory.newest.map(toCatalogProject),
    categories: directory.categories.map((category) => ({
      name: category.name,
      description: category.description,
      projectCount: category.projectCount,
      projects: category.projects.map(toCatalogProject),
    })),
  };
}

function toCatalogProject(project) {
  return {
    name: project.name,
    repo: project.repo,
    url: project.url,
    category: project.category,
    stars: project.stars,
    updatedAt: project.updatedAt,
    tags: project.tags,
    about: project.about,
  };
}

function renderLlmsTxt(catalogData) {
  const popular = catalogData.popular.slice(0, 20).map((project) => `- ${project.name}: ${project.url} - ${project.about}`).join("\n");
  const newest = catalogData.new.slice(0, 20).map((project) => `- ${project.name}: ${project.url} - ${project.about}`).join("\n");
  const categories = catalogData.categories
    .map((category) => `- ${category.name} (${category.projectCount} projects): ${category.description}`)
    .join("\n");

  return `# ${catalogData.name}

${catalogData.description}

This site is a compact, daily refreshed directory of active open-source AI agent projects. Use it to discover coding agents, browser agents, agent frameworks, MCP tooling, workflow automation, research agents, data agents, and vertical AI agents.

## Canonical URLs

- Site: ${catalogData.url}
- Repository: ${catalogData.repository}
- Structured catalog: ${catalogData.url}catalog.json
- Sitemap: ${catalogData.url}sitemap.xml

## Categories

${categories}

## Popular Agent Projects

${popular}

## Newly Added Agent Projects

${newest}

## Data Notes

- Source of truth: ${catalogData.source}
- Data refresh owner: Codex automation awesome-agent-projects-daily-refresh
- Project-side GitHub crawler scripts are intentionally not used
`;
}

function renderRobotsTxt() {
  return `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE_URL}sitemap.xml
`;
}

function renderSitemap() {
  const urls = [
    SITE_URL,
    `${SITE_URL}llms.txt`,
    `${SITE_URL}catalog.json`,
  ];
  const today = new Date().toISOString().slice(0, 10);
  const body = urls.map((url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

async function injectJsonLd(catalogData) {
  const indexPath = join(DIST, "index.html");
  const html = await readFile(indexPath, "utf8");
  const jsonLd = buildJsonLd(catalogData);
  const script = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  const nextHtml = html.includes("application/ld+json")
    ? html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, script)
    : html.replace("</head>", `    ${script}\n  </head>`);
  await writeFile(indexPath, nextHtml, "utf8");
}

function buildJsonLd(catalogData) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        "name": SITE_NAME,
        "url": SITE_URL,
        "description": SITE_DESCRIPTION,
        "inLanguage": "en",
      },
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}#collection`,
        "name": "Awesome Agent Projects",
        "url": SITE_URL,
        "description": SITE_DESCRIPTION,
        "isPartOf": { "@id": `${SITE_URL}#website` },
        "mainEntity": [
          { "@id": `${SITE_URL}#popular-agent-projects` },
          { "@id": `${SITE_URL}#new-agent-projects` },
          { "@id": `${SITE_URL}#agent-project-categories` },
        ],
        "about": catalogData.categories.map((category) => ({
          "@type": "Thing",
          "name": category.name,
          "description": category.description,
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}#popular-agent-projects`,
        "name": "Popular open-source AI agent projects",
        "numberOfItems": catalogData.popular.length,
        "itemListElement": catalogData.popular.map((project, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": project.url,
          "name": project.name,
          "description": project.about,
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}#new-agent-projects`,
        "name": "New open-source AI agent projects",
        "numberOfItems": catalogData.new.length,
        "itemListElement": catalogData.new.map((project, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": project.url,
          "name": project.name,
          "description": project.about,
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}#agent-project-categories`,
        "name": "AI agent project categories",
        "numberOfItems": catalogData.categories.length,
        "itemListElement": catalogData.categories.map((category, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": category.name,
          "description": category.description,
          "additionalType": "AI agent project category",
        })),
      },
    ],
  };
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

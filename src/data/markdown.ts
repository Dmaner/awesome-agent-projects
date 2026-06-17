import type { AgentCategory, AgentDirectory, AgentProject, CategoryProject } from "./types";

const FIELD_ALIASES: Record<string, keyof AgentProject> = {
  repo: "repo",
  icon: "icon",
  category: "category",
  source: "source",
  discovered: "discoveredAt",
  updated: "updatedAt",
};

type Section = "popular" | "newest" | "categories" | undefined;

export function parseDirectoryMarkdown(markdown: string): AgentDirectory {
  const lines = markdown.split(/\r?\n/);
  const directory: AgentDirectory = {
    popular: [],
    newest: [],
    categories: [],
  };

  let section: Section;
  let activeCategory: AgentCategory | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

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
        const description = collectDescription(lines, index);
        activeCategory.projects.push(parseCategoryProject(line, description));
      }

      continue;
    }

    if ((section === "popular" || section === "newest") && line.startsWith("- [")) {
      const description = collectDescription(lines, index);
      const project = parseAgentProject(line, description);
      directory[section].push(project);
    }
  }

  return directory;
}

function collectDescription(lines: string[], startIndex: number): string {
  const descriptionLines: string[] = [];
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

function parseAgentProject(line: string, about: string): AgentProject {
  const { name, url, fields } = parseProjectFields(line);
  return {
    name,
    url,
    about,
    repo: fields.repo ?? "",
    icon: fields.icon ?? "/icons/fallback.svg",
    category: fields.category ?? "Uncategorized",
    source: fields.source ?? "curated",
    discoveredAt: fields.discoveredAt ?? "",
    updatedAt: fields.updatedAt ?? "",
    stars: Number(fields.stars ?? 0),
  };
}

function parseCategoryProject(line: string, about: string): CategoryProject {
  const { name, url, fields } = parseProjectFields(line);
  return {
    name,
    url,
    about,
    repo: fields.repo ?? "",
    icon: fields.icon ?? "/icons/fallback.svg",
    stars: Number(fields.stars ?? 0),
    updatedAt: fields.updatedAt ?? "",
    tags: parseTags(fields.tags),
  };
}

function parseProjectFields(line: string) {
  const match = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)(.*)$/);
  if (!match) {
    throw new Error(`Invalid project line: ${line}`);
  }

  const [, name, url, rest] = match;
  const fields: Record<string, string> = {};

  for (const part of rest.split("|").map((item) => item.trim()).filter(Boolean)) {
    const fieldMatch = part.match(/^([^:]+):\s*(.+)$/);
    if (!fieldMatch) {
      continue;
    }

    const rawKey = fieldMatch[1].trim().toLowerCase();
    const value = fieldMatch[2].trim();
    const alias = FIELD_ALIASES[rawKey] ?? rawKey;
    fields[alias] = value;
  }

  return { name, url, fields };
}

function parseTags(value: string | undefined): string[] {
  return value?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [];
}

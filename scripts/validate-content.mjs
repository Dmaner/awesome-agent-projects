import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const CONTENT = join(ROOT, "content", "awesome-agent-projects.md");

const markdown = await readFile(CONTENT, "utf8");
const errors = [];

for (const section of ["Popular", "New", "Categories"]) {
  if (!markdown.includes(`## ${section}`)) {
    errors.push(`Missing section: ${section}`);
  }
}

const projectLines = markdown.split(/\r?\n/).filter((line) => line.trim().startsWith("- ["));
const sections = parseSections(markdown);

if ((sections.Popular?.projects.length ?? 0) !== 20) {
  errors.push(`Expected exactly 20 Popular projects, found ${sections.Popular?.projects.length ?? 0}.`);
}

for (const project of sections.Popular?.projects ?? []) {
  if (!isWithinDays(project.fields.updated, 30)) {
    errors.push(`Popular project is not updated within 30 days: ${project.name}`);
  }
}

for (const project of sections.New?.projects ?? []) {
  if (!isWithinDays(project.fields.updated, 14)) {
    errors.push(`New project is not updated within 14 days: ${project.name}`);
  }
}

for (const category of sections.Categories?.categories ?? []) {
  if (category.expectedCount !== category.projects.length) {
    errors.push(`Category count mismatch for ${category.name}: header says ${category.expectedCount}, found ${category.projects.length}.`);
  }
}

for (const line of projectLines) {
  const name = line.match(/^-\s+\[([^\]]+)\]/)?.[1];
  const icon = line.match(/\|\s*icon:\s*([^|]+)/)?.[1]?.trim();

  if (!name) {
    errors.push(`Invalid project line: ${line}`);
  }

  if (icon?.startsWith("/icons/")) {
    try {
      await access(join(ROOT, "public", icon.replace(/^\//, "")));
    } catch {
      errors.push(`Missing icon for ${name}: ${icon}`);
    }
  }
}

if (markdown.match(/\|\s*stars:\s*\d+/) === null) {
  errors.push("Expected hidden stars fields for data sorting.");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${projectLines.length} project entries in content/awesome-agent-projects.md`);

function parseSections(markdownText) {
  const parsed = {
    Popular: { projects: [] },
    New: { projects: [] },
    Categories: { categories: [] },
  };
  const lines = markdownText.split(/\r?\n/);
  let section;
  let category;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      category = undefined;
      continue;
    }

    if (section === "Categories") {
      const categoryMatch = line.match(/^###\s+(.+?)\s+\|\s+(\d+)\s+projects?$/i);
      if (categoryMatch) {
        category = {
          name: categoryMatch[1],
          expectedCount: Number(categoryMatch[2]),
          projects: [],
        };
        parsed.Categories.categories.push(category);
        continue;
      }
    }

    if (line.startsWith("- [")) {
      const project = parseProject(line);
      if (section === "Popular" || section === "New") {
        parsed[section].projects.push(project);
      } else if (section === "Categories" && category) {
        category.projects.push(project);
      }
    }
  }

  return parsed;
}

function parseProject(line) {
  const name = line.match(/^-\s+\[([^\]]+)\]/)?.[1] ?? "";
  const fields = {};
  for (const part of line.split("|").map((item) => item.trim()).filter(Boolean)) {
    const match = part.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      fields[match[1].trim().toLowerCase()] = match[2].trim();
    }
  }
  return { name, fields };
}

function isWithinDays(value, days) {
  if (!value) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const ageMs = Date.now() - date.getTime();
  return ageMs >= 0 && ageMs <= days * 24 * 60 * 60 * 1000;
}

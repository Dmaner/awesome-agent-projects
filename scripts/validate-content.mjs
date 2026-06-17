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
const seen = new Set();

for (const line of projectLines) {
  const name = line.match(/^-\s+\[([^\]]+)\]/)?.[1];
  const icon = line.match(/\|\s*icon:\s*([^|]+)/)?.[1]?.trim();

  if (!name) {
    errors.push(`Invalid project line: ${line}`);
  }

  if (name && seen.has(`${name}:${line}`)) {
    errors.push(`Duplicate project line: ${name}`);
  }
  if (name) {
    seen.add(`${name}:${line}`);
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

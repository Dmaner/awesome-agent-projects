import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const CONTENT = join(ROOT, "content", "awesome-agent-projects.md");
const CHECK_ONLY = process.argv.includes("--check");

const markdown = await readFile(CONTENT, "utf8");
const sortedMarkdown = sortCategorySections(markdown);

if (CHECK_ONLY) {
  if (sortedMarkdown !== markdown) {
    console.error("Category project order is not sorted by stars descending.");
    process.exit(1);
  }
  console.log("Category project order is sorted by stars descending.");
} else {
  await writeFile(CONTENT, sortedMarkdown, "utf8");
  console.log("Sorted category project order by stars descending.");
}

function sortCategorySections(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const categoriesIndex = lines.findIndex((line) => line.trim() === "## Categories");

  if (categoriesIndex === -1) {
    throw new Error("Missing ## Categories section.");
  }

  const beforeCategories = lines.slice(0, categoriesIndex + 1);
  const categoryLines = lines.slice(categoriesIndex + 1);
  const rendered = [...beforeCategories];
  let index = 0;

  while (index < categoryLines.length) {
    const line = categoryLines[index];
    if (!line.trim()) {
      if (rendered.at(-1) !== "") {
        rendered.push("");
      }
      index += 1;
      continue;
    }

    if (!line.startsWith("### ")) {
      rendered.push(line);
      index += 1;
      continue;
    }

    const blockStart = index;
    index += 1;
    while (index < categoryLines.length && !categoryLines[index].startsWith("### ")) {
      index += 1;
    }
    const block = categoryLines.slice(blockStart, index);
    rendered.push(...sortCategoryBlock(block));
  }

  return `${rendered.join("\n").trimEnd()}\n`;
}

function sortCategoryBlock(block) {
  const heading = block[0];
  const headingMatch = heading.match(/^###\s+(.+?)(?:\s+\|\s+\d+\s+projects?)?$/i);
  if (!headingMatch) {
    throw new Error(`Invalid category heading: ${heading}`);
  }

  const categoryName = headingMatch[1];
  const description = block.find((line) => line.trim().startsWith("Description:"))?.trim() ?? "";
  const projects = collectProjectBlocks(block);

  projects.sort((left, right) => {
    if (right.stars !== left.stars) {
      return right.stars - left.stars;
    }
    return left.name.localeCompare(right.name, "en", { sensitivity: "base" });
  });

  const rendered = [
    `### ${categoryName} | ${projects.length} projects`,
    "",
  ];

  if (description) {
    rendered.push(description, "");
  }

  for (const project of projects) {
    rendered.push(...project.lines);
  }

  return [...rendered, ""];
}

function collectProjectBlocks(block) {
  const projects = [];

  for (let index = 1; index < block.length; index += 1) {
    const line = block[index];
    if (!line.startsWith("- [")) {
      continue;
    }

    const projectLines = [line];
    index += 1;
    while (index < block.length && block[index].startsWith("  ")) {
      projectLines.push(block[index]);
      index += 1;
    }
    index -= 1;

    const name = line.match(/^-\s+\[([^\]]+)\]/)?.[1] ?? "";
    const stars = Number(line.match(/\|\s*stars:\s*(\d+)/)?.[1]);
    if (!Number.isFinite(stars)) {
      throw new Error(`Category project missing numeric stars: ${name || line}`);
    }

    projects.push({ name, stars, lines: projectLines });
  }

  return projects;
}

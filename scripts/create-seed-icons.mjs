import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const ICON_DIR = join(ROOT, "public", "icons");

const ICONS = [
  ["openclaw", "OC", "#f97316", "#0f172a"],
  ["openhands", "OH", "#2563eb", "#ffffff"],
  ["swe-agent", "SWE", "#111827", "#f8fafc"],
  ["autogen", "AG", "#10b981", "#ffffff"],
  ["langgraph", "LG", "#7c3aed", "#ffffff"],
  ["crewai", "CW", "#f59e0b", "#111827"],
  ["dify", "DF", "#06b6d4", "#ffffff"],
  ["continue", "CT", "#4f46e5", "#ffffff"],
  ["aider", "AI", "#111827", "#22c55e"],
  ["browser-use", "BU", "#0ea5e9", "#ffffff"],
  ["smolagents", "SA", "#0f766e", "#ffffff"],
  ["langchain", "LC", "#22c55e", "#0f172a"],
  ["openinterpreter", "OI", "#050505", "#ffffff"],
  ["lobechat", "LB", "#f472b6", "#111827"],
  ["agentverse", "AV", "#8b5cf6", "#ffffff"],
  ["memgpt", "MG", "#f97316", "#ffffff"],
  ["taskweaver", "TW", "#6366f1", "#ffffff"],
  ["llamaindex", "LI", "#ffffff", "#111827"],
  ["gpt-engineer", "GE", "#111827", "#22c55e"],
  ["composio", "CO", "#14b8a6", "#ffffff"],
  ["github-copilot-chat", "GH", "#2563eb", "#ffffff"],
  ["cursor", "CU", "#111827", "#ffffff"],
  ["chatgpt-next-web", "CN", "#10b981", "#ffffff"],
  ["msty", "MY", "#1e3a8a", "#ffffff"],
  ["ai-scientist", "AS", "#0f172a", "#e2e8f0"],
  ["paperqa", "PQ", "#ffffff", "#0f172a"],
  ["opendevin", "OD", "#0f172a", "#22d3ee"],
  ["chadata", "CD", "#f97316", "#ffffff"],
  ["databerry", "DB", "#1d4ed8", "#ffffff"],
  ["tablegpt", "TG", "#0284c7", "#ffffff"],
  ["playwright-mcp", "PW", "#22c55e", "#111827"],
  ["webvoyager", "WV", "#f59e0b", "#111827"],
  ["n8n", "N8", "#e11d48", "#ffffff"],
  ["agente", "AE", "#082f49", "#ffffff"],
  ["openpipe", "OP", "#0f172a", "#38bdf8"],
  ["litellm", "LL", "#1e3a8a", "#ffffff"],
  ["financegpt", "FG", "#164e63", "#ffffff"],
  ["medagents", "MD", "#312e81", "#ffffff"],
  ["legal-assistant", "LA", "#111827", "#ffffff"],
  ["fallback", "AI", "#334155", "#ffffff"],
];

await mkdir(ICON_DIR, { recursive: true });

await Promise.all(
  ICONS.map(([slug, label, background, foreground]) =>
    writeFile(join(ICON_DIR, `${slug}.svg`), createIconSvg(label, background, foreground), "utf8"),
  ),
);

console.log(`Wrote ${ICONS.length} seed icons to ${ICON_DIR}`);

function createIconSvg(label, background, foreground) {
  const safeLabel = label.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${safeLabel}">
  <rect width="96" height="96" rx="18" fill="${background}"/>
  <circle cx="24" cy="24" r="18" fill="rgba(255,255,255,.18)"/>
  <circle cx="76" cy="75" r="26" fill="rgba(255,255,255,.12)"/>
  <text x="48" y="56" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${safeLabel.length > 2 ? 24 : 30}" font-weight="800" fill="${foreground}">${safeLabel}</text>
</svg>
`;
}

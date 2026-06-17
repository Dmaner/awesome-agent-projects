import { useEffect, useMemo, useState } from "react";
import directoryMarkdown from "../content/awesome-agent-projects.md?raw";
import { parseDirectoryMarkdown } from "./data/markdown";
import type { AgentCategory, AgentProject, CategoryProject } from "./data/types";

const REPOSITORY_URL = "https://github.com/Dmaner/awesome-agent-projects";
const THEME_STORAGE_KEY = "awesome-agent-theme";
const BASE_URL = import.meta.env.BASE_URL;
const DEFAULT_CATEGORY = "Coding Agents";

type Theme = "light" | "dark";

export default function App() {
  const directory = useMemo(() => parseDirectoryMarkdown(directoryMarkdown), []);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <main className="page-shell">
      <SiteHeader theme={theme} onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")} />
      <ProjectStrip title="Popular" projects={directory.popular} />
      <ProjectStrip title="New" projects={directory.newest} />
      <CategoryDirectory categories={directory.categories} />
      <SiteFooter />
    </main>
  );
}

function SiteHeader({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href={BASE_URL} aria-label="Awesome Agents Projects home">
          <span className="brand__title">Awesome Agents Projects</span>
          <span className="brand__subtitle">awesome agent projects in opensource</span>
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a className="site-nav__github" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <button
            className="theme-button"
            type="button"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            onClick={onToggleTheme}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </nav>
      </div>
    </header>
  );
}

function ProjectStrip({ title, projects }: { title: string; projects: AgentProject[] }) {
  return (
    <section className="project-section" aria-labelledby={`${slugify(title)}-heading`}>
      <div className="section-heading-row">
        <h2 id={`${slugify(title)}-heading`} className="section-heading">
          {title}
        </h2>
      </div>

      <div className="project-strip">
        {projects.map((project) => (
          <ProjectTile key={`${title}-${project.repo}`} project={project} />
        ))}
      </div>
    </section>
  );
}

function ProjectTile({ project }: { project: Pick<AgentProject, "name" | "url" | "icon" | "about"> }) {
  return (
    <article className="project-tile">
      <a className="project-tile__icon-link" href={project.url} target="_blank" rel="noreferrer" aria-label={`Open ${project.name} on GitHub`}>
        <img className="project-tile__icon" src={resolveAssetPath(project.icon)} alt="" loading="lazy" />
      </a>
      <a className="project-tile__name" href={project.url} target="_blank" rel="noreferrer">
        {project.name}
      </a>
      <p className="project-tile__about">{project.about}</p>
    </article>
  );
}

function CategoryDirectory({ categories }: { categories: AgentCategory[] }) {
  const [activeCategoryName, setActiveCategoryName] = useState(() => categories.find((category) => category.name === DEFAULT_CATEGORY)?.name ?? categories[0]?.name ?? "");
  const activeCategory = useMemo(
    () => categories.find((category) => category.name === activeCategoryName) ?? categories[0],
    [activeCategoryName, categories],
  );

  if (!activeCategory) {
    return null;
  }

  return (
    <section className="project-section category-section" aria-labelledby="category-heading">
      <div className="section-heading-row">
        <h2 id="category-heading" className="section-heading">
          Category
        </h2>
      </div>

      <div className="category-tabs" role="tablist" aria-label="Project categories">
        {categories.map((category) => (
          <button
            key={category.name}
            id={`${slugify(category.name)}-tab`}
            className="category-tab"
            type="button"
            role="tab"
            aria-controls={`${slugify(category.name)}-panel`}
            aria-selected={category.name === activeCategory.name}
            onClick={() => setActiveCategoryName(category.name)}
          >
            <span>{category.name}</span>
            <span className="category-tab__count">{category.projectCount} projects</span>
          </button>
        ))}
      </div>

      <div
        id={`${slugify(activeCategory.name)}-panel`}
        className="category-panel"
        role="tabpanel"
        aria-labelledby={`${slugify(activeCategory.name)}-tab`}
      >
        <p className="category-panel__description">{activeCategory.description}</p>
        <ul className="category-projects" aria-label={`${activeCategory.name} projects`}>
          {activeCategory.projects.map((project) => (
            <CategoryProjectRow key={`${activeCategory.name}-${project.repo}`} project={project} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function CategoryProjectRow({ project }: { project: CategoryProject }) {
  return (
    <li className="category-project">
      <a className="category-project__icon-link" href={project.url} target="_blank" rel="noreferrer" aria-label={`Open ${project.name} on GitHub`}>
        <img className="category-project__icon" src={resolveAssetPath(project.icon)} alt="" loading="lazy" />
      </a>
      <div className="category-project__body">
        <div className="category-project__topline">
          <a className="category-project__name" href={project.url} target="_blank" rel="noreferrer">
            {project.name}
          </a>
          <span className="category-project__stars">{formatStars(project.stars)} stars</span>
        </div>
        <p className="category-project__about">{project.about}</p>
        <span className="category-project__tags">
          {project.tags.length > 0 ? project.tags.join(", ") : project.repo}
        </span>
      </div>
    </li>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>2026 Dman · Power by Codex</p>
    </footer>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path d="M20.1 14.7A8 8 0 0 1 9.3 3.9a8.2 8.2 0 1 0 10.8 10.8Z" fill="currentColor" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
      <path
        d="M12 6.8a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4Zm0-5 1.2 3.1h-2.4L12 1.8Zm0 17.3 1.2 3.1h-2.4l1.2-3.1ZM1.8 12l3.1-1.2v2.4L1.8 12Zm17.3 0 3.1-1.2v2.4L19.1 12ZM4.8 3.7l3 1.4-1.7 1.7-1.3-3.1Zm13.1 13.5 1.3 3.1-3-1.4 1.7-1.7Zm2.4-12.4-1.4 3-1.7-1.7 3.1-1.3ZM6.8 17.9l-3.1 1.3 1.4-3 1.7 1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function resolveAssetPath(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${BASE_URL}${path.replace(/^\/+/, "")}`;
}

function formatStars(stars: number) {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(stars >= 100000 ? 0 : 1)}k`;
  }
  return String(stars);
}

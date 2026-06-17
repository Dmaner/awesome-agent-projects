export type AgentProject = {
  name: string;
  repo: string;
  url: string;
  about: string;
  category: string;
  icon: string;
  source: string;
  discoveredAt: string;
  stars: number;
  updatedAt: string;
};

export type CategoryProject = Pick<AgentProject, "name" | "repo" | "url" | "icon" | "about" | "stars" | "updatedAt"> & {
  tags: string[];
};

export type AgentCategory = {
  name: string;
  description: string;
  projectCount: number;
  projects: CategoryProject[];
};

export type AgentDirectory = {
  popular: AgentProject[];
  newest: AgentProject[];
  categories: AgentCategory[];
};

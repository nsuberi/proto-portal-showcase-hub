export interface Insight {
  id: string;
  title: string;
  summary: string;
  date: string;
  contentPath: string;
  cellsPath?: string;
  tags: string[];
  domains: { domain: string; note: string }[];
  status: "new" | "viewed" | "favorite" | "dismissed";
  sourceUrl?: string;
  sourceTitle?: string;
}

export interface CodeCell {
  cell_id: string;
  code_raw: string;
  code_html: string;
  mock_output: {
    type: "stream" | "dataframe" | "chart" | "json";
    content: string;
  };
}

export interface Feedback {
  favorites: string[];
  dismissed: string[];
  topicRequests: { id: string; topic: string; submittedAt: string; status: string }[];
  lastUpdated: string;
}

export interface ResearchMemory {
  activeDirections: string[];
  completedDirections: string[];
  avoidTopics: string[];
  personalContext: string[];
  lastSessionDate: string;
  totalSessions: number;
}

export type Domain = "distributed" | "music" | "architecture" | "ml";

export const DOMAIN_LABELS: Record<Domain, string> = {
  distributed: "Distributed Systems",
  music: "Music & Signal Processing",
  architecture: "Architecture",
  ml: "ML & Inference",
};

export const DOMAIN_COLORS: Record<Domain, string> = {
  distributed: "domain-distributed",
  music: "domain-music",
  architecture: "domain-architecture",
  ml: "domain-ml",
};

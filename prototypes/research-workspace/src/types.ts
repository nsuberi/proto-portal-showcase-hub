export type ContentType = "insight" | "synthesis" | "architecture";

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  type: ContentType;
  contentPath: string;
  cellsPath?: string;
  diagramContent?: string;
  tags: string[];
  domains: { domain: string; note: string }[];
  status: "new" | "viewed" | "favorite" | "dismissed";
  sourceUrl?: string;
  sourceTitle?: string;
  author?: string;
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

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  insight: "Insight",
  synthesis: "Synthesis",
  architecture: "Architecture",
};

export const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  insight: "lightbulb",
  synthesis: "layers",
  architecture: "git-branch",
};

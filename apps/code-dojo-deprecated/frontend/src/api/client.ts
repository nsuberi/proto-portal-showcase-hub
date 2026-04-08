const BASE = "/code-dojo";

class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown
  ) {
    super(`API error ${status}`);
  }
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data);
  }
  return res.json();
}

// ── Auth ──

export interface User {
  id: number;
  email: string;
  role: "student" | "instructor" | "admin";
}

export const authApi = {
  me: () => api<{ authenticated: boolean; user?: User }>("/api/auth/me"),
  login: (email: string, password: string) =>
    api<{ success: boolean; user?: User; error?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (email: string, password: string, confirm_password: string) =>
    api<{ success: boolean; user?: User; errors?: string[] }>(
      "/api/auth/signup",
      {
        method: "POST",
        body: JSON.stringify({ email, password, confirm_password }),
      }
    ),
  logout: () =>
    api<{ success: boolean }>("/api/auth/logout", { method: "POST" }),
  account: () =>
    api<{ user: User; submissions: SubmissionSummary[] }>("/api/auth/account"),
};

// ── Modules ──

export interface AreaSummary {
  slug: string;
  title: string;
  color: string;
  icon_name: string;
}

export interface ModuleSummary {
  id: number;
  title: string;
  description: string;
  order: number;
  goal_count: number;
  curriculum_area_id: number | null;
  estimated_hours: number | null;
  difficulty_level: number;
  status: "published" | "coming_soon" | "draft";
  area?: AreaSummary;
}

export interface GoalSummary {
  id: number;
  title: string;
  order: number;
  video_url: string | null;
  starter_repo: string | null;
}

export interface GoalDetail {
  id: number;
  title: string;
  video_url: string | null;
  challenge_md: string | null;
  starter_repo: string | null;
}

export interface CoreLearningGoal {
  id: number;
  title: string;
  description: string;
  gem_color: string;
}

export interface GoalProgressEntry {
  core_goal_id: number;
  status: string;
  attempts: number;
}

export interface SubmissionSummary {
  id: number;
  goal_id?: number;
  goal_title?: string | null;
  pr_url: string;
  status: string;
  created_at: string;
  passed?: boolean | null;
}

export const modulesApi = {
  list: () => api<{ modules: ModuleSummary[] }>("/api/modules"),
  get: (id: number) =>
    api<{
      module: ModuleSummary & { id: number; title: string; description: string };
      goals: GoalSummary[];
    }>(`/api/modules/${id}`),
  getGoal: (moduleId: number, goalId: number) =>
    api<{
      module: { id: number; title: string };
      goal: GoalDetail;
      latest_submission: { id: number; pr_url: string; status: string; created_at: string } | null;
      progress: GoalProgressEntry[];
      core_learning_goals: CoreLearningGoal[];
      challenge_rubric: { id: number; rubric: unknown } | null;
    }>(`/api/modules/${moduleId}/goals/${goalId}`),
};

// ── Curriculum Areas ──

export interface CurriculumArea {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon_name: string;
  color: string;
  order: number;
  module_count: number;
  published_count: number;
  user_progress: {
    modules_started: number;
    modules_completed: number;
    total: number;
  } | null;
}

export interface AreaProgress {
  slug: string;
  title: string;
  icon_name: string;
  color: string;
  progress_percent: number;
  modules_started: number;
  modules_completed: number;
  modules_total: number;
}

export interface RecommendedModule {
  module_id: number;
  title: string;
  area_slug: string;
  area_title: string;
  difficulty_level: number;
  estimated_hours: number;
}

export const areasApi = {
  list: () => api<{ areas: CurriculumArea[] }>("/api/areas"),
  get: (slug: string) =>
    api<{
      area: CurriculumArea;
      modules: (ModuleSummary & { goals: { id: number; title: string; order: number }[] })[];
    }>(`/api/areas/${slug}`),
};

export const catalogApi = {
  list: (params?: { area?: string; difficulty?: string; status?: string }) => {
    const qs = params
      ? new URLSearchParams(
          Object.fromEntries(Object.entries(params).filter(([, v]) => v))
        ).toString()
      : "";
    return api<{ modules: ModuleSummary[] }>(`/api/catalog${qs ? `?${qs}` : ""}`);
  },
};

export const pathApi = {
  progress: () =>
    api<{
      overall_progress: number;
      total_xp: number;
      areas: AreaProgress[];
      recommended_next: RecommendedModule[];
    }>("/api/path/progress"),
};

// ── Admin ──

export const adminApi = {
  dashboard: () =>
    api<{
      students: { id: number; email: string; created_at: string }[];
      submissions: {
        id: number;
        user_email: string | null;
        goal_title: string | null;
        pr_url: string;
        status: string;
        created_at: string;
        passed: boolean | null;
      }[];
      pending_reviews: number;
    }>("/api/admin/dashboard"),
};

// ── Anatomy (existing JSON endpoints) ──

export interface AnatomyElement {
  id: number | null;
  name: string;
  description: string;
  type: "admin_topic" | "ai_detected";
  active_conversation_id: number | null;
}

export const anatomyApi = {
  getElements: (submissionId: number) =>
    api<{ submission_id: number; elements: AnatomyElement[] }>(
      `/submissions/${submissionId}/anatomy`
    ),
  chat: (submissionId: number, body: { topic_id?: number; message: string; conversation_id?: number }) =>
    api<{ success: boolean; response: string; conversation_id?: number }>(
      `/submissions/${submissionId}/anatomy/chat`,
      { method: "POST", body: JSON.stringify(body) }
    ),
};

// ── Submissions (existing JSON endpoints) ──

export const submissionsApi = {
  getDiff: (id: number) =>
    api<{ diff: string; formatted_html: string }>(`/submissions/${id}/diff`),
  getFiles: (id: number) =>
    api<{ files: unknown[] }>(`/submissions/${id}/files`),
  validatePR: (url: string) =>
    api<{ valid: boolean; pr?: unknown; error?: string }>(
      `/submissions/api/validate-pr?url=${encodeURIComponent(url)}`
    ),
};

export { ApiError };

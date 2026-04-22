export interface Property {
  property_id: string;
  address: string;
  text: string;
  appraised_value: number;
  year_built: number;
  comps: { address: string; value: number }[];
}

export interface LogEntry {
  ts: string;
  level: "INFO" | "ERROR" | string;
  code_hash: string;
  event: string;
  session_id?: string;
  span_id?: string;
  property_id?: string;
  retrieved_ids?: string[];
  top_score?: number;
  candidate_count?: number;
  query?: string;
  mode?: string;
  model?: string;
  latency_ms?: number;
  output_chars?: number;
  answer_chars?: number;
  message_chars?: number;
  error?: string;
}

export interface ChatResult {
  answer: string;
  requested_property_id: string;
  retrieved_property_id: string;
  session_id: string;
  span_id: string;
}

export interface TranscriptSummary {
  session_id: string;
  property_id: string | null;
  turn_count: number;
}

export interface TranscriptTurn {
  session_id: string;
  property_id: string;
  turn: number;
  role: "user" | "agent";
  text: string;
}

export interface BehavioralSignals {
  property_id: string;
  retrieval_count: number;
  repeated_question_rate: number;
  avg_turn_latency_ms: number;
  abandonment_flag: boolean;
  satisfaction_proxy: number;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  health: () => get<{ status: string; code_hash: string }>("/health"),
  properties: () => get<{ properties: Property[] }>("/properties"),
  transcripts: () => get<{ sessions: TranscriptSummary[] }>("/transcripts"),
  transcript: (id: string) =>
    get<{ session_id: string; turns: TranscriptTurn[] }>(
      `/transcripts/${encodeURIComponent(id)}`
    ),
  behavioral: () => get<Record<string, BehavioralSignals>>("/behavioral"),
  logs: (sessionId?: string, limit = 200) => {
    const params = new URLSearchParams();
    if (sessionId) params.set("session_id", sessionId);
    params.set("limit", String(limit));
    return get<{ entries: LogEntry[] }>(`/logs?${params.toString()}`);
  },
  chat: async (
    sessionId: string,
    propertyId: string,
    message: string
  ): Promise<ChatResult> => {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        property_id: propertyId,
        message,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`chat failed: ${res.status} ${detail}`);
    }
    return (await res.json()) as ChatResult;
  },
};

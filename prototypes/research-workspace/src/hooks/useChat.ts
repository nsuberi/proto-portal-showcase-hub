import { useState, useEffect, useRef, useCallback } from "react";
import { getActiveProject, subscribeActiveProject } from "../lib/projectStore";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUses?: { tool: string; description: string }[];
}

export type QuotaBlockReason =
  | "not_allowed"
  | "daily_runs"
  | "daily_budget"
  | "org_budget"
  | "concurrent"
  | "error";

export interface QuotaState {
  remainingUsd: number | null;
  remainingRuns: number | null;
  perRunCapUsd: number | null;
  usdPerDay: number | null;
  runsPerDay: number | null;
  lastCostUsd: number | null;
  blocked: QuotaBlockReason | null;
}

export interface UseChatResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  quota: QuotaState;
  sendMessage: (content: string) => void;
  newChat: () => void;
}

const API_BASE = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const EMPTY_QUOTA: QuotaState = {
  remainingUsd: null,
  remainingRuns: null,
  perRunCapUsd: null,
  usdPerDay: null,
  runsPerDay: null,
  lastCostUsd: null,
  blocked: null,
};

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [quota, setQuota] = useState<QuotaState>(EMPTY_QUOTA);
  const [activeProject, setActiveProject] = useState(getActiveProject());
  const wsRef = useRef<WebSocket | null>(null);

  // Reconnect (and clear the conversation) whenever the active project changes.
  useEffect(() => subscribeActiveProject(setActiveProject), []);
  const currentTextRef = useRef("");
  const currentToolsRef = useRef<{ tool: string; description: string }[]>([]);
  const assistantIdRef = useRef<string | null>(null);

  // Initial quota snapshot for the banner (before the first message).
  useEffect(() => {
    fetch(`${API_BASE}/api/vault/quota`)
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => {
        if (!q) return;
        setQuota((prev) => ({
          ...prev,
          remainingUsd: q.remainingUsd ?? prev.remainingUsd,
          remainingRuns: q.remainingRuns ?? prev.remainingRuns,
          perRunCapUsd: q.perRunCapUsd ?? prev.perRunCapUsd,
          usdPerDay: q.limits?.usdPerDay ?? prev.usdPerDay,
          runsPerDay: q.limits?.runsPerDay ?? prev.runsPerDay,
          blocked: q.allowed === false ? "not_allowed" : prev.blocked,
        }));
      })
      .catch(() => {
        /* banner is best-effort */
      });
  }, []);

  useEffect(() => {
    // New project → fresh conversation context.
    setMessages([]);
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.DEV ? "localhost:8080" : location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/prototypes/research-workspace/vault/api/vault/chat?project=${encodeURIComponent(activeProject)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "assistant_text") {
          currentTextRef.current = data.content;
          const id = assistantIdRef.current!;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === id) {
              return [...prev.slice(0, -1), { ...last, content: data.content }];
            }
            return prev;
          });
        } else if (data.type === "tool_use") {
          const desc = formatToolUse(data.tool, data.input);
          currentToolsRef.current = [...currentToolsRef.current, { tool: data.tool, description: desc }];
          const id = assistantIdRef.current!;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === id) {
              return [...prev.slice(0, -1), { ...last, toolUses: [...currentToolsRef.current] }];
            }
            return prev;
          });
        } else if (data.type === "quota") {
          // Pre-run reservation snapshot
          setQuota((prev) => ({
            ...prev,
            remainingUsd: data.remainingUsd ?? prev.remainingUsd,
            remainingRuns: data.remainingRuns ?? prev.remainingRuns,
            perRunCapUsd: data.perRunCapUsd ?? prev.perRunCapUsd,
            blocked: null,
          }));
        } else if (data.type === "blocked") {
          // Quota gate rejected the run — drop the empty assistant placeholder.
          setIsStreaming(false);
          assistantIdRef.current = null;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.content) return prev.slice(0, -1);
            return prev;
          });
          setQuota((prev) => ({
            ...prev,
            blocked: (data.reason as QuotaBlockReason) || "error",
            remainingUsd: data.remainingUsd ?? prev.remainingUsd,
            remainingRuns: data.remainingRuns ?? prev.remainingRuns,
            usdPerDay: data.limits?.usdPerDay ?? prev.usdPerDay,
            runsPerDay: data.limits?.runsPerDay ?? prev.runsPerDay,
          }));
        } else if (data.type === "done") {
          setIsStreaming(false);
          currentTextRef.current = "";
          currentToolsRef.current = [];
          assistantIdRef.current = null;
          setQuota((prev) => ({
            ...prev,
            lastCostUsd: typeof data.costUsd === "number" ? data.costUsd : prev.lastCostUsd,
            remainingUsd: data.remainingUsd ?? prev.remainingUsd,
            remainingRuns: data.remainingRuns ?? prev.remainingRuns,
          }));
        } else if (data.type === "error") {
          setIsStreaming(false);
          const id = assistantIdRef.current || crypto.randomUUID();
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === id && last.role === "assistant") {
              return [...prev.slice(0, -1), { ...last, content: last.content || `Error: ${data.message}` }];
            }
            return [...prev, { id, role: "assistant", content: `Error: ${data.message}` }];
          });
          assistantIdRef.current = null;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsStreaming(false);
    };

    ws.onerror = () => setIsConnected(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [activeProject]);

  const newChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    currentTextRef.current = "";
    currentToolsRef.current = [];
    assistantIdRef.current = null;
  }, []);

  const sendMessage = useCallback((content: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !content.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: content.trim() },
    ]);

    const assistantId = crypto.randomUUID();
    assistantIdRef.current = assistantId;
    currentTextRef.current = "";
    currentToolsRef.current = [];
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
    setIsStreaming(true);
    setQuota((prev) => ({ ...prev, blocked: null }));

    ws.send(JSON.stringify({ type: "message", content: content.trim() }));
  }, []);

  return { messages, isStreaming, isConnected, quota, sendMessage, newChat };
}

function formatToolUse(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case "Read":
      return `Reading ${input.file_path}`;
    case "Write":
      return `Writing ${input.file_path}`;
    case "Edit":
      return `Editing ${input.file_path}`;
    case "Bash":
      return `Running command`;
    case "Glob":
      return `Searching files: ${input.pattern}`;
    case "Grep":
      return `Searching for: ${input.pattern}`;
    default:
      return `Using ${tool}`;
  }
}

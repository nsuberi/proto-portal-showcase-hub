import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUses?: { tool: string; description: string }[];
}

export interface UseChatResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  isConnected: boolean;
  authUrl: string | null;
  isAuthenticating: boolean;
  sendMessage: (content: string) => void;
  startAuth: () => void;
  submitAuthCode: (code: string) => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const currentTextRef = useRef("");
  const currentToolsRef = useRef<{ tool: string; description: string }[]>([]);
  const assistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.DEV ? "localhost:8080" : location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/prototypes/research-workspace/vault/api/vault/chat`;

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
              return [
                ...prev.slice(0, -1),
                { ...last, content: data.content },
              ];
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
              return [
                ...prev.slice(0, -1),
                { ...last, toolUses: [...currentToolsRef.current] },
              ];
            }
            return prev;
          });
        } else if (data.type === "auth_required") {
          // Claude couldn't authenticate — show the auth flow
          setIsStreaming(false);
          setMessages((prev) => {
            // Remove the empty streaming assistant message
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.content) {
              return prev.slice(0, -1);
            }
            return prev;
          });
          // Auto-trigger the auth flow
          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            setIsAuthenticating(true);
            ws.send(JSON.stringify({ type: "auth" }));
          }
        } else if (data.type === "auth_url") {
          setAuthUrl(data.url);
          setIsAuthenticating(true);
        } else if (data.type === "auth_done") {
          setIsAuthenticating(false);
          if (data.success) {
            setAuthUrl(null);
          }
        } else if (data.type === "done") {
          setIsStreaming(false);
          currentTextRef.current = "";
          currentToolsRef.current = [];
          assistantIdRef.current = null;
        } else if (data.type === "error") {
          setIsStreaming(false);
          // Update the existing assistant message or create a new one
          const id = assistantIdRef.current || crypto.randomUUID();
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === id && last.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content || `Error: ${data.message}` },
              ];
            }
            return [
              ...prev,
              { id, role: "assistant", content: `Error: ${data.message}` },
            ];
          });
          assistantIdRef.current = null;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (isStreaming) {
        setIsStreaming(false);
      }
    };

    ws.onerror = () => setIsConnected(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !content.trim()) return;

      // Add user message
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: content.trim() },
      ]);

      // Prepare assistant message placeholder
      const assistantId = crypto.randomUUID();
      assistantIdRef.current = assistantId;
      currentTextRef.current = "";
      currentToolsRef.current = [];
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setIsStreaming(true);

      ws.send(JSON.stringify({ type: "message", content: content.trim() }));
    },
    []
  );

  const startAuth = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setAuthUrl(null);
    setIsAuthenticating(true);
    ws.send(JSON.stringify({ type: "auth" }));
  }, []);

  const submitAuthCode = useCallback((code: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "auth_code", code: code.trim() }));
  }, []);

  return { messages, isStreaming, isConnected, authUrl, isAuthenticating, sendMessage, startAuth, submitAuthCode };
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

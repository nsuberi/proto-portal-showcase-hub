/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useConversations } from "../hooks/useConversations";
import { useChatContext } from "./ChatContext";
import type { ConversationSummary } from "../types/conversation";

interface ConversationsContextValue {
  conversations: ConversationSummary[];
  loading: boolean;
  reload: () => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { conversations, loading, reload } = useConversations();
  const { isStreaming } = useChatContext();
  const prevStreamingRef = useRef(false);

  // Auto-refresh after a chat completes (streaming transitions true -> false)
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      const timer = setTimeout(() => reload(), 500);
      return () => clearTimeout(timer);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, reload]);

  return (
    <ConversationsContext.Provider value={{ conversations, loading, reload }}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error("useConversationsContext must be used within ConversationsProvider");
  return ctx;
}

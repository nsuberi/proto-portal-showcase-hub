import { useState, useEffect, useCallback } from "react";
import type { ConversationSummary, ConversationDetail } from "../types/conversation";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/vault/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return { conversations, loading, reload: loadConversations };
}

export async function loadConversationDetail(
  id: string,
): Promise<ConversationDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/vault/conversations/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

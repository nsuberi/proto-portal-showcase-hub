import { useState, useEffect, useCallback } from "react";
import type { Feedback } from "../types";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:3004/api/v1"
  : "/api/v1";

const EMPTY_FEEDBACK: Feedback = {
  favorites: [],
  dismissed: [],
  topicRequests: [],
  lastUpdated: "",
};

export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback>(EMPTY_FEEDBACK);

  useEffect(() => {
    fetch(`${API_BASE}/research-workspace/feedback`)
      .then((r) => r.json())
      .then(setFeedback)
      .catch(() => {});
  }, []);

  const favorite = useCallback(async (contentId: string) => {
    const res = await fetch(`${API_BASE}/research-workspace/feedback/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    });
    if (res.ok) setFeedback(await res.json());
  }, []);

  const unfavorite = useCallback(async (contentId: string) => {
    const res = await fetch(`${API_BASE}/research-workspace/feedback/favorite`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    });
    if (res.ok) setFeedback(await res.json());
  }, []);

  const dismiss = useCallback(async (contentId: string) => {
    const res = await fetch(`${API_BASE}/research-workspace/feedback/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId }),
    });
    if (res.ok) setFeedback(await res.json());
  }, []);

  const requestTopic = useCallback(async (topic: string) => {
    const res = await fetch(`${API_BASE}/research-workspace/feedback/topic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (res.ok) setFeedback(await res.json());
    return res.ok;
  }, []);

  const isFavorite = useCallback(
    (contentId: string) => feedback.favorites.includes(contentId),
    [feedback.favorites]
  );

  const isDismissed = useCallback(
    (contentId: string) => feedback.dismissed.includes(contentId),
    [feedback.dismissed]
  );

  return { feedback, favorite, unfavorite, dismiss, requestTopic, isFavorite, isDismissed };
}

import { useState, useCallback, useEffect } from "react";
import type { ContentItem } from "../types";

// ---------------------------------------------------------------------------
// API bases — vault server (Cognito-authed) for writes,
// Lambda API (public) as read fallback for unauthenticated gallery visitors
// ---------------------------------------------------------------------------

const VAULT_BASE = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const LAMBDA_API_BASE = import.meta.env.DEV
  ? "http://localhost:3004/api/v1/research-workspace"
  : "/api/v1/research-workspace";

const CACHE_KEY = "research-workspace-published-cache";

export interface PublishedEntry {
  item: ContentItem;
  markdown: string;
}

// ---------------------------------------------------------------------------
// Read helpers — fetch from vault server, fall back to localStorage cache
// ---------------------------------------------------------------------------

/**
 * Fetch published items — tries the vault server first (works when
 * Cognito-authenticated, e.g. inside the workspace). Falls back to the
 * Lambda API which is public (works for unauthenticated gallery visitors).
 */
async function fetchPublishedItems(): Promise<ContentItem[]> {
  // Try vault server (EFS-backed, works when authenticated)
  try {
    const res = await fetch(`${VAULT_BASE}/api/vault/published`);
    if (res.ok) {
      const data = await res.json();
      return (data.items || []).map(serverItemToContentItem);
    }
  } catch {
    // Vault server unreachable — try Lambda API
  }

  // Fallback: Lambda API (public, DynamoDB-backed)
  try {
    const res = await fetch(`${LAMBDA_API_BASE}/published`);
    if (res.ok) {
      const data = await res.json();
      return (data.items || []).map(serverItemToContentItem);
    }
  } catch {
    // Both unavailable
  }

  return [];
}

/**
 * Fetch a single published entry (item + markdown) by id.
 * Same fallback strategy: vault server → Lambda API.
 */
export async function fetchPublishedEntry(
  id: string
): Promise<PublishedEntry | null> {
  // Try vault server (returns { item, markdown } from EFS)
  try {
    const res = await fetch(
      `${VAULT_BASE}/api/vault/published/${encodeURIComponent(id)}`
    );
    if (res.ok) {
      const data = await res.json();
      return {
        item: serverItemToContentItem(data.item),
        markdown: data.markdown,
      };
    }
  } catch {
    // Try Lambda API
  }

  // Fallback: Lambda API (metadata from DynamoDB, content from S3)
  try {
    const [metaRes, contentRes] = await Promise.all([
      fetch(`${LAMBDA_API_BASE}/published`),
      fetch(`${LAMBDA_API_BASE}/published/${encodeURIComponent(id)}/content`),
    ]);
    if (metaRes.ok && contentRes.ok) {
      const metaData = await metaRes.json();
      const mdContent = await contentRes.text();
      const itemRaw = (metaData.items || []).find(
        (i: Record<string, unknown>) => i.id === id
      );
      if (itemRaw) {
        return {
          item: serverItemToContentItem(itemRaw),
          markdown: mdContent,
        };
      }
    }
  } catch {
    // Both unavailable
  }

  return null;
}

/** Map server item shape to frontend ContentItem. */
function serverItemToContentItem(raw: Record<string, unknown>): ContentItem {
  return {
    id: (raw.id as string) || "",
    title: (raw.title as string) || "",
    summary: (raw.summary as string) || "",
    date: (raw.date as string) || (raw.publishedAt as string)?.slice(0, 10) || "",
    type: (raw.type as ContentItem["type"]) || "insight",
    contentPath: (raw.contentPath as string) || "",
    tags: (raw.tags as string[]) || [],
    domains: (raw.domains as ContentItem["domains"]) || [],
    status: "new",
    author: (raw.author as string) || "Workspace",
  };
}

// ---------------------------------------------------------------------------
// Write — publish to vault server (EFS-persisted)
// ---------------------------------------------------------------------------

/** Publish a vault file to the shared gallery via the vault server. */
export async function publishToGallery(
  filePath: string,
  markdown: string,
  tags: string[] = ["published"]
): Promise<ContentItem> {
  const res = await fetch(`${VAULT_BASE}/api/vault/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath, markdown, tags }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Publish failed: HTTP ${res.status} ${body}`);
  }

  const item: ContentItem = serverItemToContentItem(await res.json());

  // Update localStorage cache so gallery reflects the change instantly
  updateCache(item);

  // Notify in-page listeners
  window.dispatchEvent(new Event("published-content-changed"));

  return item;
}

function updateCache(item: ContentItem) {
  try {
    const cached = getCachedItems();
    const filtered = cached.filter((i) => i.id !== item.id);
    localStorage.setItem(CACHE_KEY, JSON.stringify([item, ...filtered]));
  } catch {
    // localStorage full or unavailable — non-fatal
  }
}

function getCachedItems(): ContentItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// React hook — returns published ContentItem[], fetches from server
// ---------------------------------------------------------------------------

/**
 * Hook that returns the list of published items.
 * Shows cached data instantly, then refreshes from the server.
 */
export function usePublishedItems(): ContentItem[] {
  const [items, setItems] = useState<ContentItem[]>(getCachedItems);

  const refresh = useCallback(() => {
    fetchPublishedItems()
      .then((serverItems) => {
        setItems(serverItems);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(serverItems));
        } catch {
          // non-fatal
        }
      })
      .catch(() => {
        // Server unreachable — keep showing cached items
      });
  }, []);

  useEffect(() => {
    refresh();
    // Re-fetch when the current tab publishes something
    window.addEventListener("published-content-changed", refresh);
    return () => {
      window.removeEventListener("published-content-changed", refresh);
    };
  }, [refresh]);

  return items;
}

// ---------------------------------------------------------------------------
// Tag utilities (used by PublishDialog — pure functions, no storage)
// ---------------------------------------------------------------------------

/** Get all unique tags across cached published items. */
export function getExistingTags(): string[] {
  const items = getCachedItems();
  const tags = new Set<string>();
  for (const item of items) {
    for (const t of item.tags) tags.add(t);
  }
  return [...tags].sort();
}

/** Suggest tags by scanning markdown headings and bold phrases. */
export function suggestTagsFromContent(markdown: string): string[] {
  const suggestions = new Set<string>();

  const headings = markdown.match(/^#{1,3}\s+(.+)$/gm) || [];
  for (const h of headings) {
    const text = h.replace(/^#+\s+/, "").trim();
    for (const word of text.split(/\s+/)) {
      const clean = word.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
      if (clean.length >= 3) suggestions.add(clean);
    }
  }

  const boldMatches = markdown.match(/\*\*(.+?)\*\*|__(.+?)__/g) || [];
  for (const b of boldMatches) {
    const phrase = b.replace(/\*\*|__/g, "").trim().toLowerCase();
    if (phrase.length >= 3 && phrase.length <= 30) suggestions.add(phrase);
  }

  const stopWords = new Set([
    "the", "and", "for", "that", "this", "with", "from", "are", "was",
    "were", "been", "have", "has", "had", "not", "but", "what", "all",
    "can", "her", "his", "its", "our", "they", "you", "how", "why",
    "when", "where", "which", "who", "will", "would", "could", "should",
  ]);
  return [...suggestions].filter((s) => !stopWords.has(s)).slice(0, 10);
}

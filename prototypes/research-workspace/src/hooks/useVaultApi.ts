import { useState, useEffect, useCallback } from "react";

/** Tree node returned by GET /api/vault/tree */
export interface VaultNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: VaultNode[];
}

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

/**
 * Fetch the vault file tree.
 * Returns { tree, loading, error, refetch }.
 */
export function useVaultTree() {
  const [tree, setTree] = useState<VaultNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(apiUrl("/api/vault/tree"))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setTree(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tree, loading, error, refetch };
}

/**
 * Fetch a single file's content.
 * Returns { content, loading, error, refetch }.
 */
export function useVaultFile(filePath: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!filePath) {
      setContent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(apiUrl(`/api/vault/files/${encodeURIComponent(filePath)}`))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [filePath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { content, loading, error, refetch };
}

/** Save (PUT) file content. */
export async function saveVaultFile(
  filePath: string,
  content: string
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/vault/files/${encodeURIComponent(filePath)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: content,
    }
  );
  if (!res.ok) {
    throw new Error(`Save failed: HTTP ${res.status}`);
  }
}

/** Create (POST) a new file. */
export async function createVaultFile(
  filePath: string,
  content?: string
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/vault/files/${encodeURIComponent(filePath)}`),
    {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: content ?? "",
    }
  );
  if (!res.ok) {
    if (res.status === 409) throw new Error("File already exists");
    throw new Error(`Create failed: HTTP ${res.status}`);
  }
}

/** Delete a file. */
export async function deleteVaultFile(filePath: string): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/vault/files/${encodeURIComponent(filePath)}`),
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(`Delete failed: HTTP ${res.status}`);
  }
}

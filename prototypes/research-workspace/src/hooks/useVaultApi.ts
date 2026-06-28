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

/** A single hit returned by GET /api/vault/search?q= */
export interface VaultSearchResult {
  path: string;
  snippet: string;
}

/**
 * Full-text search across the vault's markdown files.
 * Returns matching files with a surrounding snippet.
 */
export async function searchVault(
  query: string,
  signal?: AbortSignal
): Promise<VaultSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const res = await fetch(
    apiUrl(`/api/vault/search?q=${encodeURIComponent(trimmed)}`),
    { signal }
  );
  if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`);
  const data = await res.json();
  return (data.results ?? []) as VaultSearchResult[];
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

/** Create an empty folder. */
export async function createVaultFolder(folderPath: string): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/vault/folders/${encodeURIComponent(folderPath)}`),
    { method: "POST" }
  );
  if (!res.ok) {
    if (res.status === 409) throw new Error("Folder already exists");
    throw new Error(`Create folder failed: HTTP ${res.status}`);
  }
}

/** Move/rename a file or folder (PATCH). */
export async function moveVaultFile(
  fromPath: string,
  toPath: string
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/vault/files/${encodeURIComponent(fromPath)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPath: toPath }),
    }
  );
  if (!res.ok) {
    throw new Error(`Move failed: HTTP ${res.status}`);
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

/** Download a folder (or entire vault) as a ZIP file. */
export async function downloadVault(folderPath?: string): Promise<void> {
  const params = folderPath
    ? `?path=${encodeURIComponent(folderPath)}`
    : "";
  const url = apiUrl(`/api/vault/download${params}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] || "vault.zip";

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

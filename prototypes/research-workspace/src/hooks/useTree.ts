import { useState, useEffect, useCallback } from "react";
import type { BanyanTree, Branch, Leaf, Connection } from "../types/tree";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

const TREE_PATH = ".tree.json";
const INTENTIONS_PATH = ".intentions.json";

const EMPTY_TREE: BanyanTree = {
  version: 1,
  roots: [],
  branches: [],
  leaves: [],
  flowers: [],
  connections: [],
  lastModified: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Migration: .intentions.json → .tree.json
// ---------------------------------------------------------------------------

interface LegacyIntention {
  id: string;
  type: "research" | "synthesis" | "review";
  title: string;
  description: string;
  schedule?: { timesPerDay: number; endDate?: string };
  status: "pending" | "in_progress" | "completed";
  documents?: string[];
  createdAt: string;
  lastRunAt?: string;
}

const TYPE_TO_STATUS: Record<string, Branch["status"]> = {
  research: "growing",
  synthesis: "growing",
  review: "growing",
};

function migrateIntentionsToTree(intentions: LegacyIntention[]): BanyanTree {
  const now = new Date().toISOString();
  const branches: Branch[] = [];
  const leaves: Leaf[] = [];
  const connections: Connection[] = [];

  for (const intent of intentions) {
    // Map each intention to a branch
    const branch: Branch = {
      id: intent.id,
      title: intent.title,
      description: buildBranchDescription(intent),
      status: intent.status === "completed" ? "flowering" : TYPE_TO_STATUS[intent.type] || "growing",
      rootConnections: [],
      createdAt: intent.createdAt,
      lastActiveAt: intent.lastRunAt || intent.createdAt,
    };
    branches.push(branch);

    // Map documents to leaf entries
    if (intent.documents) {
      for (const docPath of intent.documents) {
        const leaf: Leaf = {
          id: crypto.randomUUID(),
          branchId: intent.id,
          type: inferLeafType(docPath),
          filePath: docPath,
          summary: docPath.split("/").pop() || docPath,
          createdAt: intent.createdAt,
        };
        leaves.push(leaf);
      }
    }

    // Create connections between synthesis/review branches and their source branches
    if (intent.type === "synthesis" || intent.type === "review") {
      // Look for research branches that this synthesis might reference
      const researchBranches = intentions.filter(
        (i) => i.type === "research" && i.id !== intent.id,
      );
      for (const rb of researchBranches) {
        connections.push({
          from: rb.id,
          to: intent.id,
          type: "feeds",
          label: `${rb.title} feeds into ${intent.title}`,
        });
      }
    }
  }

  return {
    version: 1,
    roots: [],
    branches,
    leaves,
    flowers: [],
    connections,
    lastModified: now,
  };
}

function buildBranchDescription(intent: LegacyIntention): string {
  const parts: string[] = [];
  if (intent.description) parts.push(intent.description);

  // Preserve the intention type as context
  const typeLabel =
    intent.type === "research"
      ? "Research intention"
      : intent.type === "synthesis"
        ? "Synthesis intention"
        : "Review intention";
  parts.push(`[Migrated from ${typeLabel}]`);

  if (intent.schedule) {
    const freq = `${intent.schedule.timesPerDay}x/day`;
    const end = intent.schedule.endDate
      ? ` until ${intent.schedule.endDate}`
      : ", ongoing";
    parts.push(`Schedule: ${freq}${end}`);
  }

  return parts.join("\n");
}

function inferLeafType(filePath: string): Leaf["type"] {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  if (["py", "ts", "tsx", "js", "jsx", "rs", "go", "java"].includes(ext))
    return "code";
  if (["mmd", "mermaid"].includes(ext)) return "diagram";
  return "markdown";
}

async function loadIntentions(): Promise<LegacyIntention[] | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/vault/files/${encodeURIComponent(INTENTIONS_PATH)}`,
    );
    if (!res.ok) return null;
    const text = await res.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTree() {
  const [tree, setTree] = useState<BanyanTree>(EMPTY_TREE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Save tree to vault
  const saveTree = useCallback(async (updated: BanyanTree) => {
    const withTimestamp = {
      ...updated,
      lastModified: new Date().toISOString(),
    };
    setTree(withTimestamp);

    try {
      await fetch(
        `${BASE_URL}/api/vault/files/${encodeURIComponent(TREE_PATH)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify(withTimestamp, null, 2),
        },
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  // Load tree from vault, with auto-migration from intentions
  const loadTree = useCallback(async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/vault/files/${encodeURIComponent(TREE_PATH)}`,
      );

      if (res.ok) {
        // .tree.json exists — use it
        const text = await res.text();
        const parsed = JSON.parse(text) as BanyanTree;
        setTree(parsed);
        setError(null);
        setLoading(false);
        return;
      }

      if (res.status === 404) {
        // No .tree.json — try migrating from .intentions.json
        const intentions = await loadIntentions();

        if (intentions && intentions.length > 0) {
          console.log(
            `[useTree] Migrating ${intentions.length} intentions to tree`,
          );
          const migrated = migrateIntentionsToTree(intentions);
          setTree(migrated);
          setError(null);
          // Auto-save the migrated tree
          await saveTree(migrated);
          setLoading(false);
          return;
        }

        // No intentions either — start fresh
        setTree(EMPTY_TREE);
        setLoading(false);
        return;
      }

      throw new Error(`Failed to load tree: ${res.status}`);
    } catch (err) {
      setError((err as Error).message);
      setTree(EMPTY_TREE);
    } finally {
      setLoading(false);
    }
  }, [saveTree]);

  // Load on mount
  useEffect(() => {
    loadTree();
  }, [loadTree]);

  return { tree, loading, error, saveTree, reload: loadTree };
}

import { useState, useEffect, useCallback } from "react";
import {
  getActiveProject,
  setActiveProject as setActiveProjectStore,
  subscribeActiveProject,
} from "../lib/projectStore";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  sourceCount: number;
}

/**
 * Lists the user's projects (isolated workspaces) and exposes the active one.
 * Switching the active project updates the shared store, which re-scopes every
 * vault API call (via the global fetch wrapper) and reconnects the chat WS.
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState(getActiveProject());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    fetch(`${BASE_URL}/api/vault/projects`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.projects) setProjects(data.projects);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => refetch(), [refetch]);
  useEffect(() => subscribeActiveProject(setActiveId), []);

  const switchProject = useCallback((id: string) => {
    setActiveProjectStore(id);
  }, []);

  const createProject = useCallback(
    async (name: string): Promise<Project | null> => {
      const res = await fetch(`${BASE_URL}/api/vault/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const created = await res.json();
      refetch();
      setActiveProjectStore(created.id);
      return created;
    },
    [refetch],
  );

  const active = projects.find((p) => p.id === activeId) || null;

  return {
    projects,
    active,
    activeId,
    loading,
    refetch,
    switchProject,
    createProject,
  };
}

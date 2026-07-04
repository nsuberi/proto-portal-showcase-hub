// Active-project store + a global fetch wrapper that scopes every vault API
// request to the selected project via the X-Project-Id header. Installing one
// wrapper means the ~40 existing fetch call sites don't each need editing.

const STORAGE_KEY = "rw-active-project";
const DEFAULT_PROJECT = "default";

let activeProjectId =
  (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) ||
  DEFAULT_PROJECT;

const listeners = new Set<(id: string) => void>();

export function getActiveProject(): string {
  return activeProjectId;
}

export function setActiveProject(id: string): void {
  activeProjectId = id || DEFAULT_PROJECT;
  try {
    localStorage.setItem(STORAGE_KEY, activeProjectId);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(activeProjectId));
}

export function subscribeActiveProject(cb: (id: string) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

let installed = false;

/** Patch window.fetch once so vault API calls carry the active project. */
export function installProjectFetch(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input instanceof Request
            ? input.url
            : String(input);

    if (url.includes("/api/vault/")) {
      const headers = new Headers(
        init.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      if (!headers.has("X-Project-Id")) {
        headers.set("X-Project-Id", activeProjectId);
      }
      return original(input, { ...init, headers });
    }
    return original(input, init);
  };
}

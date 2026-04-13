import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rw-auth";

const VAULT_BASE = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

/**
 * Lightweight auth status hook.
 * Reads localStorage for instant rendering, then validates against the vault
 * backend in the background. Provides a logout function that clears cookies
 * and local state.
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );

  useEffect(() => {
    fetch(`${VAULT_BASE}/api/vault/tree`)
      .then((r) => {
        if (r.ok) {
          localStorage.setItem(STORAGE_KEY, "1");
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setIsAuthenticated(false);
      });
  }, []);

  const logout = useCallback(() => {
    // Clear session cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie =
        c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, logout };
}

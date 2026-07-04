import { useState, useEffect } from "react";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

export interface UserProfile {
  userId: string;
  email: string;
  /** GitHub login (e.g. "nsuberi"), from the OIDC `preferred_username` claim. */
  githubLogin: string;
  /** GitHub display name, from the `name` claim. */
  displayName: string;
  /** GitHub avatar URL, from the `picture` claim. May be empty. */
  avatarUrl: string;
  /** True when signed in via a real GitHub/Cognito session; false in dev. */
  githubConnected: boolean;
  /** Number of files in the user's vault. */
  vaultItemCount: number;
}

/**
 * Fetches the signed-in user's GitHub identity (login, name, avatar) and a
 * vault item count from GET /api/vault/me. Display-only — no links to a
 * user page. Returns null while loading or if the request fails.
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE_URL}/api/vault/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}

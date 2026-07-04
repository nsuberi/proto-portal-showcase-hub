import { useState, useRef, useEffect } from "react";
import { FileText } from "lucide-react";
import GithubMark from "../icons/GithubMark";
import { useUserProfile } from "../../hooks/useUserProfile";

/**
 * Top-right user identity chip. Shows the GitHub avatar (or the GitHub mark
 * when no avatar image is available) that, when clicked, reveals a small card
 * with the signed-in GitHub ID and the number of items in the user's vault.
 * In local dev there's no GitHub session, so the card says so explicitly.
 * Display-only — there is no link to a user page.
 */
export default function UserMenu({ size = "lg" }: { size?: "sm" | "lg" }) {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const login = profile?.githubLogin || "";
  const avatarUrl = profile?.avatarUrl || "";
  const connected = !!profile?.githubConnected;

  // Avatar is 75% of the previous large size (w-16 → w-12).
  const avatarSize = size === "lg" ? "w-12 h-12" : "w-9 h-9";
  const markSize = size === "lg" ? "w-6 h-6" : "w-5 h-5";

  // Avatar content: real GitHub image when available, otherwise the GitHub mark.
  const avatarContent = avatarUrl ? (
    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
  ) : (
    <GithubMark className={markSize} />
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="GitHub account"
        aria-expanded={open}
        className={`flex items-center justify-center ${avatarSize} rounded-full overflow-hidden bg-primary-container text-on-primary-container ring-1 ring-outline-variant hover:ring-primary/50 transition-shadow`}
      >
        {avatarContent}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bark-card z-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-primary-container text-on-primary-container shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <GithubMark className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              {connected ? (
                <>
                  <div className="flex items-center gap-1.5 font-headline text-sm text-on-surface truncate">
                    <GithubMark className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                    <span className="truncate">{login || "GitHub account"}</span>
                  </div>
                  {profile?.displayName && profile.displayName !== login && (
                    <div className="font-label text-xs text-on-surface-variant truncate">
                      {profile.displayName}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="font-headline text-sm text-on-surface">
                    Dev mode
                  </div>
                  <div className="font-label text-xs text-on-surface-variant">
                    Not connected to GitHub
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-outline-variant flex items-center gap-2 font-label text-xs text-on-surface-variant">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="font-semibold text-on-surface">
                {profile ? profile.vaultItemCount : "—"}
              </span>{" "}
              {profile?.vaultItemCount === 1 ? "item" : "items"} in your vault
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

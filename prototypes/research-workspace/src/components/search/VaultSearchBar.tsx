import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, FileText, X } from "lucide-react";
import { searchVault } from "../../hooks/useVaultApi";
import type { VaultSearchResult } from "../../hooks/useVaultApi";

interface VaultSearchBarProps {
  /** Called with the file path when a result is selected. */
  onSelectResult: (filePath: string) => void;
}

/**
 * GitHub-style search bar for the workspace top bar.
 * Searches across the vault's markdown files (full-text via the backend)
 * and shows a dropdown of matching files with snippets.
 */
export default function VaultSearchBar({ onSelectResult }: VaultSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VaultSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search whenever the query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchVault(trimmed, controller.signal)
        .then((hits) => {
          setResults(hits);
          setActiveIndex(hits.length > 0 ? 0 : -1);
          setError(null);
          setLoading(false);
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          setError(err.message);
          setResults([]);
          setLoading(false);
        });
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus shortcut: "/" focuses the search bar (GitHub-style)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !(document.activeElement as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const selectResult = useCallback(
    (path: string) => {
      onSelectResult(path);
      setOpen(false);
      setQuery("");
      setResults([]);
      inputRef.current?.blur();
    },
    [onSelectResult],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex].path);
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-3.5 h-3.5 text-on-surface-variant/40 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search your vault..."
          aria-label="Search your vault"
          className="w-full pl-9 pr-9 py-1.5 rounded-lg bg-surface-container-low/70 border border-outline-variant/40 font-label text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:bg-surface-bright transition-colors"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 p-0.5 rounded text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded border border-outline-variant/40 font-mono text-[10px] text-on-surface-variant/40 pointer-events-none">
            /
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-surface-bright border border-outline-variant/40 shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/50" />
              <span className="font-label text-xs text-on-surface-variant/50">
                Searching...
              </span>
            </div>
          ) : error ? (
            <div className="px-4 py-3 font-label text-xs text-error/70">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 font-label text-xs text-on-surface-variant/50">
              No matches for &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result, i) => {
                const fileName = result.path.split("/").pop() || result.path;
                const dir = result.path.includes("/")
                  ? result.path.slice(0, result.path.lastIndexOf("/"))
                  : "";
                return (
                  <li key={result.path}>
                    <button
                      onClick={() => selectResult(result.path)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                        i === activeIndex
                          ? "bg-primary-container/50"
                          : "hover:bg-surface-container-low/60"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 mt-0.5 text-on-surface-variant/40 flex-shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-1.5">
                          <span className="font-label text-xs font-medium text-on-surface truncate">
                            {fileName}
                          </span>
                          {dir && (
                            <span className="font-mono text-[10px] text-on-surface-variant/40 truncate">
                              {dir}
                            </span>
                          )}
                        </span>
                        <span className="block font-body text-[11px] text-on-surface-variant/60 truncate mt-0.5">
                          {result.snippet}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

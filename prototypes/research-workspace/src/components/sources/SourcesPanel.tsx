import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Globe, ExternalLink, RefreshCw, ShieldQuestion } from "lucide-react";
import { useChatContext } from "../../contexts/ChatContext";
import { getActiveProject, subscribeActiveProject } from "../../lib/projectStore";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

interface Source {
  type: "search" | "fetch";
  url?: string;
  query?: string;
  label: string;
  firstUsedAt: string;
  lastUsedAt: string;
  count: number;
}

interface SourcesPanelProps {
  /** Switch to chat and send a prompt (used by the meta-question chips). */
  onAskInChat: (prompt: string) => void;
}

/**
 * Surfaces exactly what the agent searched and fetched to fill this project —
 * one of the clearest windows into what the agent is actually doing. Also
 * offers meta-questions about source reliability and selection.
 */
export default function SourcesPanel({ onAskInChat }: SourcesPanelProps) {
  const { isStreaming } = useChatContext();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const wasStreaming = useRef(isStreaming);

  const refetch = useCallback(() => {
    fetch(`${BASE_URL}/api/vault/sources`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.sources) setSources(data.sources);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => refetch(), [refetch]);
  // Re-scope when the active project changes.
  useEffect(() => subscribeActiveProject(() => refetch()), [refetch]);

  // Refresh when a run is active (sources stream in) and when it finishes.
  useEffect(() => {
    if (isStreaming) {
      const t = setInterval(refetch, 3000);
      return () => clearInterval(t);
    }
    if (wasStreaming.current) refetch();
    wasStreaming.current = isStreaming;
  }, [isStreaming, refetch]);

  const searches = sources.filter((s) => s.type === "search");
  const fetches = sources.filter((s) => s.type === "fetch");

  // Build a compact source list to ground the meta-questions.
  const sourceList = sources
    .map((s) => (s.type === "fetch" ? `- ${s.url}` : `- search: "${s.query}"`))
    .join("\n");

  const META_QUESTIONS = [
    {
      label: "How reliable are these sources?",
      prompt:
        `Assess the reliability of the sources gathered for this project so far:\n${sourceList}\n\n` +
        `For each, note its likely trustworthiness (primary vs secondary, reputation, recency, potential bias) and call out any I should treat with caution.`,
    },
    {
      label: "Why these sources — and what else?",
      prompt:
        `Here are the sources used for this project:\n${sourceList}\n\n` +
        `Explain why these were reasonable choices, why someone might prefer different sources, and suggest specific higher-quality or complementary sources I'm missing.`,
    },
    {
      label: "What did each source contribute?",
      prompt:
        `For the sources gathered in this project:\n${sourceList}\n\n` +
        `Summarize what each one contributed to the research and where they agree or disagree.`,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="font-label text-xs text-on-surface-variant">
          Sources the agent searched & fetched for this project.
        </p>
        <button
          onClick={refetch}
          aria-label="Refresh sources"
          className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isStreaming ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <p className="font-label text-xs text-on-surface-variant px-1">Loading…</p>
        ) : sources.length === 0 ? (
          <div className="px-1 py-6 text-center">
            <Globe className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
            <p className="font-label text-sm text-on-surface-variant">
              No sources yet.
            </p>
            <p className="font-label text-xs text-on-surface-variant/70 mt-1">
              As the agent researches, the web searches and pages it reads show up here.
            </p>
          </div>
        ) : (
          <>
            {searches.length > 0 && (
              <section>
                <h4 className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-wide text-on-surface-variant px-1 mb-1.5">
                  <Search className="w-3.5 h-3.5" /> Searches ({searches.length})
                </h4>
                <ul className="space-y-1">
                  {searches.map((s, i) => (
                    <li
                      key={`q-${i}`}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-surface-container-low"
                    >
                      <span className="font-label text-sm text-on-surface truncate">
                        “{s.query}”
                      </span>
                      {s.count > 1 && (
                        <span className="font-label text-[11px] text-on-surface-variant shrink-0">
                          ×{s.count}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {fetches.length > 0 && (
              <section>
                <h4 className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-wide text-on-surface-variant px-1 mb-1.5">
                  <Globe className="w-3.5 h-3.5" /> Pages read ({fetches.length})
                </h4>
                <ul className="space-y-1">
                  {fetches.map((s, i) => (
                    <li
                      key={`u-${i}`}
                      className="px-2 py-1.5 rounded-md bg-surface-container-low"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 font-label text-sm text-primary hover:underline"
                      >
                        <span className="truncate">{s.label}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <span className="block font-label text-[11px] text-on-surface-variant truncate">
                        {s.url}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {/* Meta-questions about the sources */}
      <div className="border-t border-outline-variant pt-3 mt-2">
        <h4 className="flex items-center gap-1.5 font-label text-[11px] uppercase tracking-wide text-on-surface-variant px-1 mb-2">
          <ShieldQuestion className="w-3.5 h-3.5" /> Ask about these sources
        </h4>
        <div className="flex flex-col gap-1.5">
          {META_QUESTIONS.map((q) => (
            <button
              key={q.label}
              disabled={sources.length === 0 || isStreaming}
              onClick={() => onAskInChat(q.prompt)}
              className="text-left px-2.5 py-1.5 rounded-lg border border-outline-variant font-label text-sm text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

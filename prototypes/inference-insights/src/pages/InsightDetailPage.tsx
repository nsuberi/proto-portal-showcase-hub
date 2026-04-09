import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Insight, CodeCell } from "../types";
import { DOMAIN_LABELS, type Domain } from "../types";
import MarkdownRenderer from "../components/MarkdownRenderer";
import CodeCanvas from "../components/CodeCanvas";
import { useFeedback } from "../hooks/useFeedback";
import { ArrowLeft, Star, X, ExternalLink } from "lucide-react";

export default function InsightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [cells, setCells] = useState<CodeCell[]>([]);
  const { favorite, unfavorite, dismiss, isFavorite, isDismissed } = useFeedback();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(import.meta.env.BASE_URL + "data/insights-index.json")
      .then((r) => r.json())
      .then((data: Insight[]) => {
        const found = data.find((i) => i.id === id);
        if (found) setInsight(found);
      });
  }, [id]);

  useEffect(() => {
    if (!insight) return;

    fetch(import.meta.env.BASE_URL + insight.contentPath)
      .then((r) => r.text())
      .then(setMarkdown)
      .catch(() => setMarkdown("*Content not found.*"));

    if (insight.cellsPath) {
      fetch(import.meta.env.BASE_URL + insight.cellsPath)
        .then((r) => r.json())
        .then(setCells)
        .catch(() => setCells([]));
    }
  }, [insight]);

  if (!insight) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-label text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  const domainColor = (domain: string) => {
    const map: Record<string, string> = {
      distributed: "bg-domain-distributed/20 text-domain-distributed",
      music: "bg-domain-music/20 text-domain-music",
      architecture: "bg-domain-architecture/20 text-domain-architecture",
      ml: "bg-domain-ml/20 text-domain-ml",
    };
    return map[domain] || "bg-surface-container-high text-on-surface-variant";
  };

  const favorited = isFavorite(insight.id);
  const dismissed = isDismissed(insight.id);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title & Meta */}
        <div className="mb-8">
          <p className="font-label text-xs text-on-surface-variant mb-2">
            {new Date(insight.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface mb-3">
            {insight.title}
          </h1>
          <p className="font-body text-lg text-on-surface-variant">
            {insight.summary}
          </p>
        </div>

        {/* Domains */}
        <div className="flex flex-wrap gap-2 mb-6">
          {insight.domains.map((d) => (
            <span
              key={d.domain}
              className={`font-label text-xs px-3 py-1.5 rounded-full ${domainColor(d.domain)}`}
              title={d.note}
            >
              {DOMAIN_LABELS[d.domain as Domain] || d.domain}
            </span>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {insight.tags.map((tag) => (
            <span
              key={tag}
              className="font-label text-xs px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Source link */}
        {insight.sourceUrl && (
          <a
            href={insight.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-label text-sm text-primary hover:text-primary/80 mb-8 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {insight.sourceTitle || "View Source"}
          </a>
        )}

        {/* Content */}
        <article className="mb-12">
          <MarkdownRenderer content={markdown} />
        </article>

        {/* Code Cells */}
        {cells.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-headline text-xl font-semibold text-on-surface">
              Interactive Code
            </h2>
            {cells.map((cell) => (
              <CodeCanvas key={cell.cell_id} cell={cell} />
            ))}
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-12 pt-8 border-t border-outline-variant/30">
          <button
            onClick={() => favorited ? unfavorite(insight.id) : favorite(insight.id)}
            className={`inline-flex items-center gap-2 font-label text-sm px-4 py-2 rounded-lg transition-colors ${
              favorited
                ? "bg-tertiary/30 text-tertiary"
                : "bg-tertiary/10 text-tertiary hover:bg-tertiary/20"
            }`}
          >
            <Star className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
            {favorited ? "Favorited" : "Favorite"}
          </button>
          <button
            onClick={() => dismiss(insight.id)}
            className={`inline-flex items-center gap-2 font-label text-sm px-4 py-2 rounded-lg transition-colors ${
              dismissed
                ? "bg-error/20 text-error"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
            }`}
          >
            <X className="w-4 h-4" />
            {dismissed ? "Dismissed" : "Dismiss"}
          </button>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Insight, Domain } from "../types";
import InsightCard from "../components/InsightCard";
import DomainFilter from "../components/DomainFilter";
import TopicRequestForm from "../components/TopicRequestForm";
import { useFeedback } from "../hooks/useFeedback";

export default function GalleryPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeDomains, setActiveDomains] = useState<Domain[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { requestTopic } = useFeedback();

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/insights-index.json")
      .then((r) => r.json())
      .then((data) => setInsights(data))
      .catch(() => setInsights([]));
  }, []);

  const allTags = [...new Set(insights.flatMap((i) => i.tags))].sort();

  const filtered = insights
    .filter((insight) => {
      if (activeDomains.length === 0) return true;
      return insight.domains.some((d) =>
        activeDomains.includes(d.domain as Domain)
      );
    })
    .filter((insight) => {
      if (!activeTag) return true;
      return insight.tags.includes(activeTag);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const toggleDomain = (d: Domain) =>
    setActiveDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                Inference Insights
              </h1>
              <p className="font-label text-sm text-on-surface-variant mt-1">
                Automated research connecting inference engineering to distributed systems, music &amp; architecture
              </p>
            </div>
            <a
              href="/"
              className="font-label text-sm text-primary hover:text-primary/80 transition-colors hidden sm:block"
            >
              &larr; Portfolio
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <DomainFilter active={activeDomains} onToggle={toggleDomain} />

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`font-label text-xs px-3 py-1.5 rounded-full transition-colors ${
                    activeTag === tag
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-bright"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filtered.map((insight) => (
              <Link key={insight.id} to={`/insight/${insight.id}`}>
                <InsightCard insight={insight} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-headline text-xl text-on-surface-variant mb-2">
              {insights.length === 0
                ? "No insights yet"
                : "No insights match your filters"}
            </p>
            <p className="font-body text-on-surface-variant/60">
              {insights.length === 0
                ? "The research loop hasn\u2019t run yet. Insights will appear here automatically."
                : "Try adjusting your domain or tag filters."}
            </p>
          </div>
        )}

        {/* Topic Request */}
        <TopicRequestForm onSubmit={requestTopic} />
      </main>
    </div>
  );
}

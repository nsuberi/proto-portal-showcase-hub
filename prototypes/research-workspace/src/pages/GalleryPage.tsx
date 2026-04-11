import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { ContentItem, ContentType, Domain } from "../types";
import ContentCard from "../components/ContentCard";
import ContentTypeTabs from "../components/ContentTypeTabs";
import DomainFilter from "../components/DomainFilter";
import TopicRequestForm from "../components/TopicRequestForm";
import { useFeedback } from "../hooks/useFeedback";
import { Lock } from "lucide-react";

export default function GalleryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<ContentType | "all">("all");
  const [activeDomains, setActiveDomains] = useState<Domain[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { requestTopic } = useFeedback();

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/content-index.json")
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]));
  }, []);

  const allTags = [...new Set(items.flatMap((i) => i.tags))].sort();

  const counts: Record<ContentType | "all", number> = {
    all: items.length,
    insight: items.filter((i) => i.type === "insight").length,
    synthesis: items.filter((i) => i.type === "synthesis").length,
    architecture: items.filter((i) => i.type === "architecture").length,
  };

  const filtered = items
    .filter((item) => {
      if (activeTab === "all") return true;
      return item.type === activeTab;
    })
    .filter((item) => {
      if (activeDomains.length === 0) return true;
      return item.domains.some((d) =>
        activeDomains.includes(d.domain as Domain)
      );
    })
    .filter((item) => {
      if (!activeTag) return true;
      return item.tags.includes(activeTag);
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
                Research Workspace
              </h1>
              <p className="font-label text-sm text-on-surface-variant mt-1">
                Insights, syntheses &amp; architecture diagrams connecting inference engineering to distributed systems, music &amp; architecture
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <a
                href="/prototypes/research-workspace/vault/"
                className="inline-flex items-center gap-1.5 font-label text-sm text-tertiary hover:text-tertiary/80 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Sign in to publish
              </a>
              <a
                href="/"
                className="font-label text-sm text-primary hover:text-primary/80 transition-colors"
              >
                &larr; Portfolio
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Content Type Tabs */}
        <div className="mb-6">
          <ContentTypeTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>

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
            {filtered.map((item) => (
              <Link key={item.id} to={`/content/${item.id}`}>
                <ContentCard item={item} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-headline text-xl text-on-surface-variant mb-2">
              {items.length === 0
                ? "No content yet"
                : "No content matches your filters"}
            </p>
            <p className="font-body text-on-surface-variant/60">
              {items.length === 0
                ? "The research loop hasn\u2019t run yet. Content will appear here automatically."
                : "Try adjusting your content type, domain, or tag filters."}
            </p>
          </div>
        )}

        {/* Topic Request */}
        <TopicRequestForm onSubmit={requestTopic} />
      </main>
    </div>
  );
}

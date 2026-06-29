import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { ContentItem, ContentType } from "../types";
import ContentCard from "../components/ContentCard";
import ContentTypeTabs from "../components/ContentTypeTabs";
import ResearchLauncher from "../components/ResearchLauncher";
import TreeIcon from "../components/icons/TreeIcon";
import { usePublishedItems } from "../hooks/usePublishedContent";
import { useAuthStatus } from "../hooks/useAuthStatus";
import { useWakeNavigation } from "../hooks/useWakeNavigation";
import BackendStartingSplash from "../components/BackendStartingSplash";
import { Lock, LogOut, ArrowRight } from "lucide-react";

const VAULT_AUTH_URL = "/prototypes/research-workspace/vault/";

export default function GalleryPage() {
  const [staticItems, setStaticItems] = useState<ContentItem[]>([]);
  const [activeTab, setActiveTab] = useState<ContentType | "all">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { isAuthenticated, logout } = useAuthStatus();
  const publishedItems = usePublishedItems();
  const { waking, phase, elapsed, wakeThenNavigate, retry } = useWakeNavigation();

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/content-index.json")
      .then((r) => r.json())
      .then((data) => setStaticItems(data))
      .catch(() => setStaticItems([]));
  }, []);

  // Merge static content with user-published content
  const items = useMemo(() => {
    const staticIds = new Set(staticItems.map((i) => i.id));
    const deduped = publishedItems.filter((p) => !staticIds.has(p.id));
    return [...deduped, ...staticItems];
  }, [staticItems, publishedItems]);

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
      if (!activeTag) return true;
      return item.tags.includes(activeTag);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-surface">
      {waking && <BackendStartingSplash phase={phase} elapsed={elapsed} onRetry={retry} />}
      {/* Header */}
      <header className="border-b border-outline-variant/30 bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <TreeIcon className="w-7 h-7 text-primary flex-shrink-0" />
              <span className="font-headline text-xl font-semibold text-on-surface">
                Your Research
              </span>
            </div>
            <div className="flex items-center gap-5">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/workspace"
                    className="inline-flex items-center gap-1.5 font-label text-sm text-tertiary hover:text-tertiary/80 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Go to Workspace
                  </Link>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 font-label text-sm text-on-surface-variant/72 hover:text-on-surface-variant/80 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => wakeThenNavigate(VAULT_AUTH_URL)}
                  className="inline-flex items-center gap-1.5 font-label text-sm text-tertiary hover:text-tertiary/80 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign in to publish
                </button>
              )}
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

      {/* Input-led hero */}
      <ResearchLauncher isAuthenticated={isAuthenticated} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" id="gallery">
        {/* Section heading */}
        <h2 className="font-headline text-xl sm:text-2xl font-semibold text-on-surface mb-5">
          Your published insights
        </h2>

        {/* Content Type Tabs */}
        <div className="mb-6">
          <ContentTypeTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="mb-8">
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
          </div>
        )}

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
                ? "No published insights yet"
                : "No content matches your filters"}
            </p>
            <p className="font-body text-on-surface-variant/80">
              {items.length === 0
                ? "Be the first to set an intention and share what you learn."
                : "Try adjusting your content type or tag filters."}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center">
          <a
            href="/"
            className="font-label text-xs text-on-surface-variant/65 hover:text-on-surface-variant/85 transition-colors"
          >
            &larr; Back to Portfolio
          </a>
        </div>
      </footer>
    </div>
  );
}

import { useState, useMemo, Suspense, createElement } from "react";
import { useNavigate } from "react-router-dom";
import { ShowcaseGalleryItem } from "@/components/ShowcaseGalleryItem";
import { AppLoggerProvider } from "@/components/AppLogger";
import { showcaseEntries } from "@/data/showcase";
import { artifactComponents } from "@/artifacts/registry";

/** Only show entries that have a connected React artifact app */
const connectedEntries = showcaseEntries.filter((e) => e.artifactRouteId);

export default function ShowcasePage() {
  const navigate = useNavigate();
  const [activeTag, setActiveTag] = useState<string>("All");

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    connectedEntries.forEach((entry) => {
      entry.tags.forEach((tag) => tagSet.add(tag));
    });
    return ["All", ...Array.from(tagSet).sort()];
  }, []);

  const filteredEntries = useMemo(() => {
    if (activeTag === "All") return connectedEntries;
    return connectedEntries.filter((entry) => entry.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-xl font-bold text-on-surface">
          What people are building
        </h1>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Real work from the community — running code, visible reasoning, peer
          feedback.
        </p>
      </div>

      {/* Filter / sort bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isActive = tag === activeTag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-3 py-1 font-label text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Gallery grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredEntries.map((entry) => {
            const Comp = entry.artifactRouteId
              ? artifactComponents[entry.artifactRouteId]
              : undefined;
            return (
              <ShowcaseGalleryItem
                key={entry.id}
                title={entry.title}
                author={entry.author}
                tags={entry.tags}
                reactions={entry.reactions}
                previewContent={
                  Comp ? (
                    <AppLoggerProvider>
                      <Suspense fallback={null}>
                        {createElement(Comp)}
                      </Suspense>
                    </AppLoggerProvider>
                  ) : undefined
                }
                onClick={() => navigate(`/artifacts/${entry.artifactRouteId}`)}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-16">
          <p className="mb-3 font-body text-sm text-on-surface-variant">
            No work matches this filter.
          </p>
          <button
            type="button"
            onClick={() => setActiveTag("All")}
            className="rounded-full bg-surface-container-highest px-4 py-1.5 font-label text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}

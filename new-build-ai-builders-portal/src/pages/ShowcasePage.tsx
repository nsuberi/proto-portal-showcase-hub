import { useState, useMemo } from "react";
import { ShowcaseGalleryItem } from "@/components/ShowcaseGalleryItem";
import { showcaseEntries } from "@/data/showcase";

export default function ShowcasePage() {
  const [activeTag, setActiveTag] = useState<string>("All");

  // Collect unique tags from all entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    showcaseEntries.forEach((entry) => {
      entry.tags.forEach((tag) => tagSet.add(tag));
    });
    return ["All", ...Array.from(tagSet).sort()];
  }, []);

  // Filter entries by active tag
  const filteredEntries = useMemo(() => {
    if (activeTag === "All") return showcaseEntries;
    return showcaseEntries.filter((entry) => entry.tags.includes(activeTag));
  }, [activeTag]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-deep-space">
          What people are building
        </h1>
        <p className="mt-1 text-sm text-dust">
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
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-instrument-blue/10 text-instrument-blue border-instrument-blue"
                  : "border-border-warm text-dust hover:border-instrument-blue hover:text-instrument-blue"
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
          {filteredEntries.map((entry) => (
            <ShowcaseGalleryItem
              key={entry.id}
              title={entry.title}
              author={entry.author}
              tags={entry.tags}
              reactions={entry.reactions}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-sm text-dust mb-3">
            No work matches this filter.
          </p>
          <button
            type="button"
            onClick={() => setActiveTag("All")}
            className="rounded-full border border-instrument-blue px-4 py-1.5 text-xs font-medium text-instrument-blue hover:bg-instrument-blue/10 transition-colors"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}

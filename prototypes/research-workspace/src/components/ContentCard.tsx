import { Lightbulb, Layers, GitBranch } from "lucide-react";
import type { ContentItem, ContentType } from "../types";
import { CONTENT_TYPE_LABELS } from "../types";

interface Props {
  item: ContentItem;
}

const TYPE_BADGE_STYLES: Record<ContentType, string> = {
  insight: "bg-tertiary/15 text-tertiary",
  synthesis: "bg-primary/15 text-primary",
  architecture: "bg-secondary/15 text-secondary",
};

const TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  insight: <Lightbulb className="w-3 h-3" />,
  synthesis: <Layers className="w-3 h-3" />,
  architecture: <GitBranch className="w-3 h-3" />,
};

export default function ContentCard({ item }: Props) {
  return (
    <article className="group bg-surface-container-low border border-outline-variant/20 rounded-lg p-5 hover:border-primary/30 hover:bg-surface-container transition-all cursor-pointer h-full flex flex-col">
      {/* Date + Type Badge */}
      <div className="flex items-center justify-between mb-2">
        <p className="font-label text-xs text-on-surface-variant/60">
          {new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <span
          className={`inline-flex items-center gap-1 font-label text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE_STYLES[item.type]}`}
        >
          {TYPE_ICONS[item.type]}
          {CONTENT_TYPE_LABELS[item.type]}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors mb-2 line-clamp-2">
        {item.title}
      </h3>

      {/* Summary */}
      <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-3 flex-1">
        {item.summary}
      </p>

      {/* Author attribution */}
      {item.author && (
        <p className="font-label text-xs text-on-surface-variant/50 mb-3">
          by {item.author}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="font-label text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant/70"
          >
            {tag}
          </span>
        ))}
        {item.tags.length > 3 && (
          <span className="font-label text-[10px] px-2 py-0.5 text-on-surface-variant/50">
            +{item.tags.length - 3}
          </span>
        )}
      </div>
    </article>
  );
}

import type { Insight, Domain } from "../types";
import { DOMAIN_LABELS } from "../types";

interface Props {
  insight: Insight;
}

const DOMAIN_DOT_COLORS: Record<string, string> = {
  distributed: "bg-domain-distributed",
  music: "bg-domain-music",
  architecture: "bg-domain-architecture",
  ml: "bg-domain-ml",
};

export default function InsightCard({ insight }: Props) {
  return (
    <article className="group bg-surface-container-low border border-outline-variant/20 rounded-lg p-5 hover:border-primary/30 hover:bg-surface-container transition-all cursor-pointer h-full flex flex-col">
      {/* Date */}
      <p className="font-label text-xs text-on-surface-variant/60 mb-2">
        {new Date(insight.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Title */}
      <h3 className="font-headline text-lg font-semibold text-on-surface group-hover:text-primary transition-colors mb-2 line-clamp-2">
        {insight.title}
      </h3>

      {/* Summary */}
      <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-3 flex-1">
        {insight.summary}
      </p>

      {/* Domain dots */}
      <div className="flex items-center gap-3 mb-3">
        {insight.domains.map((d) => (
          <div key={d.domain} className="flex items-center gap-1.5" title={d.note}>
            <span
              className={`w-2 h-2 rounded-full ${DOMAIN_DOT_COLORS[d.domain] || "bg-on-surface-variant"}`}
            />
            <span className="font-label text-xs text-on-surface-variant">
              {DOMAIN_LABELS[d.domain as Domain] || d.domain}
            </span>
          </div>
        ))}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {insight.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="font-label text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant/70"
          >
            {tag}
          </span>
        ))}
        {insight.tags.length > 3 && (
          <span className="font-label text-[10px] px-2 py-0.5 text-on-surface-variant/50">
            +{insight.tags.length - 3}
          </span>
        )}
      </div>
    </article>
  );
}

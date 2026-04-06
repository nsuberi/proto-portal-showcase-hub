import { useState } from "react";
import { tokens } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface ReferencePanelProps {
  title: string;
  content: string;
  category: string;
  className?: string;
}

const catColors: Record<string, string> = {
  architecture: tokens.color.primary,
  building: tokens.color.tertiary,
  data: tokens.color.phase2,
  design: tokens.color.secondary,
};

const CALLOUT_QUOTE =
  "This matters because you want to be in power to fix things — not waiting for someone else.";

export function ReferencePanel({
  title,
  content,
  category,
  className,
}: ReferencePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const accent = catColors[category] ?? tokens.color.outline;

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          "bg-surface-container-low rounded-xl",
          "transition-colors cursor-pointer",
          isOpen && "rounded-b-none bg-surface-container",
        )}
        style={{
          borderLeftWidth: 3,
          borderLeftColor: accent,
        }}
      >
        <span className="flex-1 font-headline text-sm font-medium text-on-surface">
          {title}
        </span>

        {/* Category badge */}
        <span
          className="font-label text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accent}20`,
            color: accent,
          }}
        >
          {category}
        </span>

        {/* Chevron */}
        <span
          className={cn(
            "material-symbols-outlined text-on-primary-container transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        >
          expand_more
        </span>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div
          className="bg-surface-container-lowest rounded-b-xl px-4 py-4"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: accent,
          }}
        >
          <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap m-0">
            {content}
          </p>

          {/* Callout quote */}
          <blockquote
            className="mt-4 pl-4 py-2 font-body text-xs italic text-on-surface-variant m-0"
            style={{
              borderLeft: `3px solid ${accent}`,
            }}
          >
            {CALLOUT_QUOTE}
          </blockquote>
        </div>
      )}
    </div>
  );
}

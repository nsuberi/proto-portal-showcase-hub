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
  architecture: tokens.color.instrumentBlue,
  building: tokens.color.atmosphereTeal,
  data: "#D4A03A",
  design: tokens.color.signalOrange,
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
  const accent = catColors[category] ?? tokens.color.dust;

  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          "bg-shelter-white border-thin border-border-warm rounded-lg",
          "transition-colors cursor-pointer",
          isOpen && "rounded-b-none",
        )}
        style={{
          borderLeftWidth: 3,
          borderLeftColor: accent,
          ...(isOpen
            ? {
                backgroundColor: `${accent}08`,
                borderColor: `${accent}40`,
                borderLeftColor: accent,
              }
            : {}),
        }}
      >
        {/* Accent bar is handled by the left border above */}
        <span className="flex-1 text-sm font-medium text-dark-text">
          {title}
        </span>

        {/* Category badge */}
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${accent}18`,
            color: accent,
          }}
        >
          {category}
        </span>

        {/* Chevron */}
        <svg
          className={cn(
            "w-4 h-4 text-dust transition-transform duration-200",
            isOpen && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div
          className="bg-regolith border-thin border-t-0 border-border-warm rounded-b-lg px-4 py-4"
          style={{
            borderColor: `${accent}40`,
          }}
        >
          <p className="text-sm text-dark-text leading-relaxed whitespace-pre-wrap m-0">
            {content}
          </p>

          {/* Callout quote */}
          <blockquote
            className="mt-4 pl-4 py-2 text-xs italic text-dust m-0"
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

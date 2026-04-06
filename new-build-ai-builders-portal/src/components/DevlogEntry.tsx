import { useState } from "react";
import { tokens, devlogSectionMeta } from "@/design-system/tokens";
import type { DevlogSections, DevlogSectionKey } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface DevlogEntryProps {
  title: string;
  date: string;
  sections?: DevlogSections;
  author?: string;
  className?: string;
}

export function DevlogEntry({
  title,
  date,
  sections = {},
  author,
  className,
}: DevlogEntryProps) {
  const [expandedSection, setExpandedSection] = useState<DevlogSectionKey | null>(null);

  const sectionKeys = (Object.keys(sections) as DevlogSectionKey[]).filter(
    (key) => sections[key] !== undefined,
  );

  function toggleSection(key: DevlogSectionKey) {
    setExpandedSection((prev) => (prev === key ? null : key));
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border-warm bg-shelter-white",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <h3 className="text-[15px] font-semibold text-deep-space">{title}</h3>
        <span className="shrink-0 font-mono text-[11px] text-dust">{date}</span>
      </div>

      {/* Author */}
      {author && (
        <p className="px-4 pb-3 text-[12px] text-dust">by {author}</p>
      )}
      {!author && <div className="pb-1" />}

      {/* Accordion sections */}
      {sectionKeys.length > 0 && (
        <div className="border-t border-border-warm">
          {sectionKeys.map((key) => {
            const meta = devlogSectionMeta[key];
            const isExpanded = expandedSection === key;

            return (
              <div key={key} className="border-b border-border-warm last:border-b-0">
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors",
                    "text-[13px] text-dark-text hover:bg-regolith",
                  )}
                  style={
                    isExpanded
                      ? {
                          backgroundColor: tokens.color.instrumentBlue + "0D",
                          borderColor: tokens.color.instrumentBlue + "40",
                        }
                      : undefined
                  }
                  onClick={() => toggleSection(key)}
                  aria-expanded={isExpanded}
                >
                  <span className="w-4 text-center text-[14px] leading-none text-dust">
                    {meta.icon}
                  </span>
                  <span className="flex-1 font-medium">{meta.label}</span>
                  <span
                    className={cn(
                      "text-[10px] text-dust transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  >
                    ▾
                  </span>
                </button>

                {isExpanded && (
                  <div
                    className="px-4 pb-3 pt-2"
                    style={{
                      borderTop: `1px solid ${tokens.color.instrumentBlue}40`,
                    }}
                  >
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-dark-text">
                      {sections[key]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

DevlogEntry.displayName = "DevlogEntry";

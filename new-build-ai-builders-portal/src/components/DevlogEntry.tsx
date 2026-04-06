import { useState } from "react";
import { devlogSectionMeta } from "@/design-system/tokens";
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
        "overflow-hidden rounded-xl bg-surface-container-low",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-2">
        <h3 className="font-headline text-[15px] font-semibold text-on-surface">{title}</h3>
        <span className="shrink-0 font-label text-[11px] text-on-primary-container">{date}</span>
      </div>

      {/* Author */}
      {author && (
        <p className="px-5 pb-3 font-body text-[12px] italic text-on-surface-variant">by {author}</p>
      )}
      {!author && <div className="pb-1" />}

      {/* Accordion sections — no border dividers, use spacing */}
      {sectionKeys.length > 0 && (
        <div className="flex flex-col gap-1 px-3 pb-3">
          {sectionKeys.map((key) => {
            const meta = devlogSectionMeta[key];
            const isExpanded = expandedSection === key;

            return (
              <div key={key}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
                    "font-label text-[13px] text-on-surface",
                    isExpanded
                      ? "bg-primary-container text-primary"
                      : "hover:bg-surface-container-highest",
                  )}
                  onClick={() => toggleSection(key)}
                  aria-expanded={isExpanded}
                >
                  <span className="material-symbols-outlined w-5 text-center text-[18px] text-on-primary-container">
                    {meta.icon}
                  </span>
                  <span className="flex-1 font-medium">{meta.label}</span>
                  <span
                    className={cn(
                      "material-symbols-outlined text-[16px] text-on-primary-container transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  >
                    expand_more
                  </span>
                </button>

                {isExpanded && (
                  <div className="rounded-b-lg bg-surface-container-lowest px-4 pb-3 pt-2">
                    <p className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-on-surface">
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

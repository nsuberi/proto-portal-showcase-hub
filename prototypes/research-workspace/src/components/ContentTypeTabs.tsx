import { Lightbulb, Layers, GitBranch } from "lucide-react";
import type { ContentType } from "../types";

interface Props {
  activeTab: ContentType | "all";
  onTabChange: (tab: ContentType | "all") => void;
  counts: Record<ContentType | "all", number>;
}

const TABS: { key: ContentType | "all"; label: string; icon?: React.ReactNode }[] = [
  { key: "all", label: "All" },
  { key: "insight", label: "Insights", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { key: "synthesis", label: "Syntheses", icon: <Layers className="w-3.5 h-3.5" /> },
  { key: "architecture", label: "Architectures", icon: <GitBranch className="w-3.5 h-3.5" /> },
];

export default function ContentTypeTabs({ activeTab, onTabChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`inline-flex items-center gap-1.5 font-label text-sm px-4 py-2 rounded-lg border transition-all ${
              isActive
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-surface-container-low text-on-surface-variant border-transparent hover:border-outline-variant/30 hover:bg-surface-container"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span
              className={`font-label text-xs px-1.5 py-0.5 rounded-full ${
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-surface-container-high text-on-surface-variant/60"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

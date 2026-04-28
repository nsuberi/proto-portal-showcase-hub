import { type ReactNode } from "react";
import {
  FolderOpen,
  Lightbulb,
  Activity,
  Settings2,
} from "lucide-react";
import SidebarIcon from "./SidebarIcon";

export type SidebarSection = "files" | "plan" | "audit" | "config" | null;

interface SidebarRailProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  intentionCount?: number;
  hasActiveRun?: boolean;
  /** Render prop for each section's expanded content */
  children: (section: Exclude<SidebarSection, null>) => ReactNode;
}

const SECTIONS = [
  { id: "files" as const, icon: FolderOpen, label: "Files" },
  { id: "plan" as const, icon: Lightbulb, label: "Plan" },
  { id: "audit" as const, icon: Activity, label: "Activity" },
  { id: "config" as const, icon: Settings2, label: "Personalization" },
];

export default function SidebarRail({
  activeSection,
  onSectionChange,
  intentionCount = 0,
  hasActiveRun = false,
  children,
}: SidebarRailProps) {
  const isExpanded = activeSection !== null;

  return (
    <div
      className={`sidebar-rail flex h-full ${isExpanded ? "expanded" : ""}`}
    >
      {/* Icon column — always visible */}
      <div className="flex flex-col items-center pt-4 gap-1 flex-shrink-0 w-[48px]">
        {SECTIONS.map((section) => (
          <SidebarIcon
            key={section.id}
            icon={section.icon}
            label={section.label}
            isActive={activeSection === section.id}
            badge={section.id === "plan" ? intentionCount : 0}
            pulse={section.id === "audit" && hasActiveRun}
            onClick={() =>
              onSectionChange(
                activeSection === section.id ? null : section.id,
              )
            }
          />
        ))}
      </div>

      {/* Expanded content panel */}
      {isExpanded && (
        <div className="sidebar-content flex-1 min-w-0 overflow-hidden border-l border-outline-variant/20">
          {children(activeSection)}
        </div>
      )}
    </div>
  );
}

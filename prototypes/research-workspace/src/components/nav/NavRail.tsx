import {
  MessageCircle,
  FolderOpen,
  Network,
  Settings2,
  History,
  Globe,
  PanelLeft,
  PanelLeftClose,
  Plus,
} from "lucide-react";
import NavIcon from "./NavIcon";
import TreeIcon from "../icons/TreeIcon";

export type ViewId = "chat" | "files" | "tree" | "sources" | "history" | "config";

interface NavRailProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onNewChat?: () => void;
  branchCount?: number;
  hasActiveRun?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const NAV_ITEMS: { id: ViewId; icon: typeof MessageCircle; label: string }[] = [
  { id: "chat", icon: MessageCircle, label: "Chat" },
  { id: "history", icon: History, label: "History" },
  { id: "files", icon: FolderOpen, label: "Vault" },
  { id: "sources", icon: Globe, label: "Sources" },
  { id: "tree", icon: Network, label: "Knowledge Map" },
  { id: "config", icon: Settings2, label: "Personalization" },
];

export default function NavRail({
  activeView,
  onNavigate,
  onNewChat,
  branchCount = 0,
  hasActiveRun = false,
  isExpanded = false,
  onToggleExpand,
}: NavRailProps) {
  const ToggleIcon = isExpanded ? PanelLeftClose : PanelLeft;

  return (
    <nav className={`nav-rail flex flex-col py-4 gap-1 h-full self-stretch ${isExpanded ? "expanded items-stretch px-2" : "items-center"}`}>
      {/* Brand header — tree icon top-left, wordmark when expanded */}
      {isExpanded ? (
        <div className="flex items-center gap-2 px-3 pt-1 pb-3">
          <TreeIcon className="w-6 h-6 text-primary flex-shrink-0" />
          <h2 className="font-headline text-base font-semibold text-on-surface whitespace-nowrap">
            Your Research
          </h2>
        </div>
      ) : (
        <div className="flex justify-center pt-1 pb-2">
          <TreeIcon className="w-6 h-6 text-primary" />
        </div>
      )}

      {/* New Chat button — circled plus, no divider (Claude-style) */}
      <NavIcon
        icon={Plus}
        label="New Chat"
        isActive={false}
        isExpanded={isExpanded}
        circled
        onClick={() => onNewChat?.()}
      />

      {NAV_ITEMS.map((item) => (
        <NavIcon
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={activeView === item.id}
          isExpanded={isExpanded}
          badge={item.id === "tree" ? branchCount : 0}
          pulse={item.id === "chat" && hasActiveRun}
          onClick={() => onNavigate(item.id)}
        />
      ))}

      {/* Collapse / expand toggle — pinned to the bottom (GitLab dynamic) */}
      <button
        onClick={onToggleExpand}
        className={`mt-auto flex items-center ${
          isExpanded ? "justify-start px-3 gap-2.5 w-full" : "justify-center w-[44px]"
        } h-[40px] rounded-lg text-on-surface-variant/65 hover:text-on-surface-variant hover:bg-on-surface/[0.04] transition-colors`}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ToggleIcon className="w-[18px] h-[18px] flex-shrink-0" />
        {isExpanded && (
          <span className="font-label text-[13px]">Collapse sidebar</span>
        )}
      </button>
    </nav>
  );
}

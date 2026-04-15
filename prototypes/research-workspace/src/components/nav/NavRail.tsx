import {
  MessageCircle,
  FolderOpen,
  Network,
  Settings2,
  History,
  PanelLeft,
  PanelLeftClose,
  Plus,
} from "lucide-react";
import NavIcon from "./NavIcon";

export type ViewId = "chat" | "files" | "tree" | "history" | "config";

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
    <nav className={`nav-rail flex flex-col items-center py-4 gap-1 ${isExpanded ? "expanded items-stretch" : ""}`}>
      {/* Collapse / expand toggle */}
      <button
        onClick={onToggleExpand}
        className={`flex items-center ${
          isExpanded ? "justify-start px-3 gap-2.5" : "justify-center"
        } w-full h-[36px] mb-1 rounded-lg text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-on-surface/[0.04] transition-colors`}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ToggleIcon className="w-[18px] h-[18px] flex-shrink-0" />
      </button>

      {/* New Chat button */}
      <NavIcon
        icon={Plus}
        label="New Chat"
        isActive={false}
        isExpanded={isExpanded}
        onClick={() => onNewChat?.()}
      />

      <div className="w-8 border-t border-outline-variant/30 my-1" />

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
    </nav>
  );
}

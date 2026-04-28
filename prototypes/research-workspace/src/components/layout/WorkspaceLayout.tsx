import { useState, useCallback } from "react";
import NavRail from "../nav/NavRail";
import type { ViewId } from "../nav/NavRail";
import ChatView from "../views/ChatView";
import FileExplorerView from "../views/FileExplorerView";
import TreeGraphView from "../views/TreeGraphView";
import ConfigView from "../views/ConfigView";
import ConversationHistory from "../history/ConversationHistory";
import ContextPanel from "../context/ContextPanel";
import MobileBottomSheet from "../context/MobileBottomSheet";
import BranchListPanel from "../context/BranchListPanel";
import ActivityPanel from "../context/ActivityPanel";
import FilePreviewPanel from "../context/FilePreviewPanel";
import ToolPolicyEditor from "../config/ToolPolicyEditor";
import ToastContainer from "../ui/ToastContainer";
import { useChatContext } from "../../contexts/ChatContext";
import { useConversationPhase } from "../../hooks/useConversationPhase";
import type { ConversationPhase } from "../../hooks/useConversationPhase";
import {
  MessageCircle,
  FolderOpen,
  History,
  LogIn,
  Network,
  Settings2,
  ArrowLeft,
  LogOut,
  Leaf,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useAuthStatus } from "../../hooks/useAuthStatus";

type MobileTab = "chat" | "history" | "files" | "tree" | "config";

const PHASE_PANEL_TITLE: Partial<Record<ConversationPhase, string>> = {
  intending: "Your Branches",
  researching: "Agent Activity",
  reviewing: "Artifact",
  reflecting: "Knowledge Map",
  connecting: "Connections",
};

export default function WorkspaceLayout() {
  const [activeView, setActiveView] = useState<ViewId>("chat");
  const [policyEditorOpen, setPolicyEditorOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [contextDismissed, setContextDismissed] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [artifactFile, setArtifactFile] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activityPanelOpen, setActivityPanelOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStatus();

  // Chat state from shared context
  const { messages, isStreaming, newChat } = useChatContext();
  const { phase, reviewFilePath } = useConversationPhase(messages, isStreaming);

  // Reset dismissal when phase changes (desktop)
  const handleDismiss = useCallback(() => {
    setContextDismissed(true);
    setArtifactFile(null);
    setActivityPanelOpen(false);
    setTimeout(() => setContextDismissed(false), 2000);
  }, []);

  // Open a file in the artifact context panel (or mobile bottom sheet)
  const handleOpenFile = useCallback(
    (filePath: string) => {
      setArtifactFile(filePath);
      setContextDismissed(false);
      if (isMobile) {
        setMobileSheetOpen(true);
      }
    },
    [isMobile],
  );

  // Determine whether to show context panel (desktop)
  // Phase-based panels (excluding "researching" — activity is now on-demand)
  const showPhasePanel =
    !contextDismissed &&
    activeView === "chat" &&
    !isMobile &&
    phase !== "idle" &&
    phase !== "exploring" &&
    phase !== "researching";

  const showContextPanel = showPhasePanel || (!!artifactFile && !isMobile) || (activityPanelOpen && !isMobile);

  // Mobile: show a dot on chat tab when context is available
  const hasContextAvailable =
    phase !== "idle" && phase !== "exploring";

  const contextTitle = activityPanelOpen
    ? "Agent Activity"
    : artifactFile
      ? artifactFile.split("/").pop() || "Artifact"
      : PHASE_PANEL_TITLE[phase] || "Context";

  // Open activity panel (from chat "View activity" button)
  const handleOpenActivity = useCallback(() => {
    setActivityPanelOpen(true);
    setContextDismissed(false);
    setArtifactFile(null);
    if (isMobile) {
      setMobileSheetOpen(true);
    }
  }, [isMobile]);

  // Context panel content (shared between desktop panel and mobile sheet)
  const contextContent = activityPanelOpen ? (
    <ActivityPanel />
  ) : artifactFile ? (
    <FilePreviewPanel filePath={artifactFile} />
  ) : (
    <>
      {phase === "intending" && <BranchListPanel />}
      {phase === "reviewing" && reviewFilePath && (
        <FilePreviewPanel filePath={reviewFilePath} />
      )}
      {phase === "connecting" && <BranchListPanel />}
      {phase === "reflecting" && <BranchListPanel />}
    </>
  );

  // ---------------------------------------------------------------------------
  // Session expired banner
  // ---------------------------------------------------------------------------

  const sessionExpiredBanner = !isAuthenticated && (
    <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-tertiary-container border-b border-tertiary/20">
      <LogIn className="w-4 h-4 text-tertiary flex-shrink-0" />
      <p className="font-label text-xs text-on-surface/70 flex-1">
        Your session has expired. Sign in again to continue.
      </p>
      <button
        onClick={() => {
          logout();
          window.location.href = "/prototypes/research-workspace/workspace";
        }}
        className="font-label text-xs font-semibold px-3 py-1.5 rounded-lg bg-tertiary text-on-tertiary hover:bg-tertiary/90 active:bg-tertiary/80 transition-colors whitespace-nowrap"
      >
        Sign in
      </button>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Mobile layout
  // ---------------------------------------------------------------------------

  if (isMobile) {
    const TABS: {
      id: MobileTab;
      icon: typeof MessageCircle;
      label: string;
    }[] = [
      { id: "chat", icon: MessageCircle, label: "Chat" },
      { id: "history", icon: History, label: "History" },
      { id: "files", icon: FolderOpen, label: "Vault" },
      { id: "tree", icon: Network, label: "Tree" },
      { id: "config", icon: Settings2, label: "Personalization" },
    ];

    return (
      <div className="workspace-layout workspace-backdrop overflow-hidden flex flex-col">
        {policyEditorOpen && (
          <ToolPolicyEditor onClose={() => setPolicyEditorOpen(false)} />
        )}
        {sessionExpiredBanner}

        {/* Mobile top bar — minimal, Claude-style */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant/50 active:text-on-surface-variant transition-colors py-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Center brand */}
          <div className="flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="font-headline text-sm text-on-surface/80">
              Gardener
            </span>
            {isStreaming && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="inline-flex items-center font-label text-xs text-on-surface-variant/40 active:text-on-surface-variant/60 transition-colors py-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* View content — edge-to-edge */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className={`absolute inset-0 ${mobileTab === "chat" ? "" : "hidden"}`}
          >
            <ChatView onOpenActivity={handleOpenActivity} />
          </div>
          <div
            className={`absolute inset-0 ${mobileTab === "history" ? "" : "hidden"}`}
          >
            <ConversationHistory onClose={() => setMobileTab("chat")} />
          </div>
          <div
            className={`absolute inset-0 p-2 ${mobileTab === "files" ? "" : "hidden"}`}
          >
            <FileExplorerView />
          </div>
          <div
            className={`absolute inset-0 p-2 ${mobileTab === "tree" ? "" : "hidden"}`}
          >
            <div className="bark-card h-full overflow-hidden">
              <TreeGraphView />
            </div>
          </div>
          <div
            className={`absolute inset-0 ${mobileTab === "config" ? "" : "hidden"}`}
          >
            <ConfigView onOpenFile={handleOpenFile} />
          </div>
        </div>

        {/* Tab bar — iOS-inspired, frosted glass */}
        <div className="mobile-tab-bar flex relative">
          {TABS.map(({ id, icon: Icon, label }) => {
            const isActive = mobileTab === id;
            // Show streaming indicator on chat tab
            const showDot =
              id === "chat" && !isActive && (isStreaming || hasContextAvailable);

            return (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors relative ${
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant/40 active:text-on-surface-variant/60"
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-[22px] h-[22px] transition-transform ${
                      isActive ? "scale-105" : ""
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {showDot && (
                    <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-label leading-none ${
                    isActive ? "font-semibold" : "font-normal"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}

          {/* Context sheet trigger — appears when context available on chat tab */}
          {mobileTab === "chat" && hasContextAvailable && (
            <button
              onClick={() => setMobileSheetOpen(true)}
              className="absolute right-3 -top-12 w-10 h-10 rounded-full bg-primary/90 text-on-primary shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              style={{
                boxShadow: "0 4px 16px rgba(74, 138, 56, 0.25)",
              }}
            >
              {phase === "researching" ? (
                <span className="w-2.5 h-2.5 rounded-full bg-on-primary animate-pulse" />
              ) : (
                <Leaf className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Bottom sheet for context panel */}
        <MobileBottomSheet
          title={contextTitle}
          isOpen={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
        >
          {contextContent}
        </MobileBottomSheet>

        <ToastContainer />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop layout — NavRail + centered view + context panel
  // ---------------------------------------------------------------------------

  return (
    <div className="workspace-layout workspace-backdrop flex">
      <ToastContainer />
      {/* Tool policy editor modal */}
      {policyEditorOpen && (
        <ToolPolicyEditor onClose={() => setPolicyEditorOpen(false)} />
      )}

      {/* Nav rail */}
      <NavRail
        activeView={activeView}
        onNavigate={setActiveView}
        onNewChat={() => {
          newChat();
          setActiveView("chat");
        }}
        hasActiveRun={isStreaming}
        isExpanded={sidebarExpanded}
        onToggleExpand={() => setSidebarExpanded((v) => !v)}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0">
        {sessionExpiredBanner}
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0 px-4 py-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Gallery
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant/40 hover:text-on-surface-variant/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>

        {/* View area + context panel */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          {/* Main view */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {activeView === "chat" && <ChatView onOpenActivity={handleOpenActivity} />}
            {activeView === "history" && (
              <div className="flex justify-center h-full p-2">
                <div className="w-full max-w-3xl bark-card">
                  <ConversationHistory onClose={() => setActiveView("chat")} />
                </div>
              </div>
            )}
            {activeView === "files" && <FileExplorerView />}
            {activeView === "tree" && (
              <div className="flex justify-center h-full p-2">
                <div className="w-full max-w-4xl bark-card">
                  <TreeGraphView />
                </div>
              </div>
            )}
            {activeView === "config" && <ConfigView onOpenFile={handleOpenFile} />}
          </div>

          {/* Context panel — slides in based on conversation phase */}
          {showContextPanel && (
            <ContextPanel title={contextTitle} onClose={handleDismiss}>
              {contextContent}
            </ContextPanel>
          )}
        </div>
      </main>
    </div>
  );
}

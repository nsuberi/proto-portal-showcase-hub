import { useState, useCallback, useEffect } from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import FileBrowser from "../file-browser/FileBrowser";
import MarkdownEditor from "../editor/MarkdownEditor";
import CodeEditor from "../editor/CodeEditor";
import IntentionsPanel from "../intentions/IntentionsPanel";
import SessionConfigPanel from "../config/SessionConfigPanel";
import ToolPolicyEditor from "../config/ToolPolicyEditor";
import AgentActivityStrip from "../activity/AgentActivityStrip";
import SidebarRail from "../sidebar/SidebarRail";
import type { SidebarSection } from "../sidebar/SidebarRail";
import ToastContainer from "../ui/ToastContainer";
import {
  FileText,
  FolderOpen,
  Lightbulb,
  Activity,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useAuthStatus } from "../../hooks/useAuthStatus";

const CODE_EXTENSIONS = new Set([
  "py", "ts", "tsx", "js", "jsx", "json", "sh", "bash",
  "yml", "yaml", "toml", "cfg", "ini", "css", "html",
  "sql", "r", "rs", "go", "java", "c", "cpp", "h",
]);

function isCodeFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return CODE_EXTENSIONS.has(ext);
}

type MobileTab = "files" | "editor" | "plan" | "activity";

function ResizeHandle({
  direction = "horizontal",
}: {
  direction?: "horizontal" | "vertical";
}) {
  const isHorizontal = direction === "horizontal";
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center ${
        isHorizontal ? "w-5" : "h-5"
      }`}
    >
      <div
        className={`rounded-full bg-white/[0.06] group-hover:bg-primary/40 transition-colors ${
          isHorizontal ? "w-0.5 h-8" : "h-0.5 w-8"
        }`}
      />
    </PanelResizeHandle>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <FileText className="w-16 h-16 text-on-surface-variant/20 mb-4" />
      <h2 className="font-headline text-xl text-on-surface-variant/60 mb-2">
        No file selected
      </h2>
      <p className="font-body text-sm text-on-surface-variant/40 max-w-md">
        Select a file from the sidebar to start editing, or create a new file
        with the + button.
      </p>
    </div>
  );
}

function FileEditor({
  filePath,
  onSave,
  isFullscreen,
  onFullscreen,
}: {
  filePath: string;
  onSave?: () => void;
  isFullscreen?: boolean;
  onFullscreen?: () => void;
}) {
  if (isCodeFile(filePath)) {
    return (
      <CodeEditor
        filePath={filePath}
        onSave={onSave}
        isFullscreen={isFullscreen}
        onFullscreen={onFullscreen}
      />
    );
  }
  return (
    <MarkdownEditor
      filePath={filePath}
      onSave={onSave}
      isFullscreen={isFullscreen}
      onFullscreen={onFullscreen}
    />
  );
}

export default function WorkspaceLayout() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("files");
  const [fullscreen, setFullscreen] = useState(false);
  const [policyEditorOpen, setPolicyEditorOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState<SidebarSection>(null);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { logout } = useAuthStatus();

  const handleSelectFile = useCallback((path: string) => {
    setSelectedFile(path);
  }, []);

  const handleMobileSelectFile = useCallback((path: string) => {
    setSelectedFile(path);
    setMobileTab("editor");
  }, []);

  const handleSave = useCallback(() => {
    // Could trigger tree refetch if needed
  }, []);

  const toggleActivityExpanded = useCallback(() => {
    setActivityExpanded((prev) => !prev);
  }, []);

  // Escape exits fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen]);

  // ---------------------------------------------------------------------------
  // Mobile layout — 4 tabs
  // ---------------------------------------------------------------------------

  if (isMobile) {
    const TABS: { id: MobileTab; icon: typeof FolderOpen; label: string }[] = [
      { id: "files", icon: FolderOpen, label: "Files" },
      { id: "editor", icon: FileText, label: "Editor" },
      { id: "plan", icon: Lightbulb, label: "Plan" },
      { id: "activity", icon: Activity, label: "Activity" },
    ];

    return (
      <div className="workspace-layout workspace-backdrop overflow-hidden flex flex-col">
        {policyEditorOpen && (
          <ToolPolicyEditor onClose={() => setPolicyEditorOpen(false)} />
        )}
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 font-label text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Gallery
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-1.5 font-label text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative p-5 pb-0">
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "files" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <FileBrowser
                onSelectFile={handleMobileSelectFile}
                selectedFile={selectedFile}
              />
            </div>
          </div>
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "editor" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              {selectedFile ? (
                <FileEditor filePath={selectedFile} onSave={handleSave} />
              ) : (
                <WelcomeScreen />
              )}
            </div>
          </div>
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "plan" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <IntentionsPanel />
            </div>
          </div>
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "activity" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <AgentActivityStrip
                isExpanded={true}
                onToggleExpanded={() => {}}
              />
            </div>
          </div>
        </div>

        <div className="flex border-t border-white/[0.06] bg-black/40 backdrop-blur-md">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-label transition-colors ${
                mobileTab === id
                  ? "text-primary bg-primary/10"
                  : "text-on-surface-variant/60"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Desktop layout — sidebar rail + editor + activity strip
  // ---------------------------------------------------------------------------

  return (
    <div className="workspace-layout workspace-backdrop p-5 flex">
      <ToastContainer />
      {/* Fullscreen editor overlay */}
      {fullscreen && selectedFile && (
        <div className="fixed inset-0 z-50 workspace-backdrop p-5">
          <div className="glass-widget h-full">
            <FileEditor
              filePath={selectedFile}
              onSave={handleSave}
              isFullscreen
              onFullscreen={() => setFullscreen(false)}
            />
          </div>
        </div>
      )}
      {/* Tool policy editor modal */}
      {policyEditorOpen && (
        <ToolPolicyEditor onClose={() => setPolicyEditorOpen(false)} />
      )}

      {/* Sidebar rail */}
      <SidebarRail
        activeSection={sidebarSection}
        onSectionChange={setSidebarSection}
      >
        {(section) => {
          switch (section) {
            case "files":
              return (
                <FileBrowser
                  onSelectFile={handleSelectFile}
                  selectedFile={selectedFile}
                />
              );
            case "plan":
              return <IntentionsPanel />;
            case "audit":
              return (
                <AgentActivityStrip
                  isExpanded={true}
                  onToggleExpanded={() => {}}
                />
              );
            case "config":
              return (
                <SessionConfigPanel
                  onSelectFile={handleSelectFile}
                  onOpenPolicyEditor={() => setPolicyEditorOpen(true)}
                />
              );
          }
        }}
      </SidebarRail>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 pl-2">
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0 mb-3">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 font-label text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Gallery
          </button>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-1.5 font-label text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>

        {/* Editor + Activity strip */}
        <PanelGroup
          direction="vertical"
          autoSaveId="workspace-main-v2"
          className="flex-1 min-h-0"
        >
          {/* Editor panel */}
          <Panel defaultSize={75} minSize={30}>
            <div className="glass-widget h-full">
              {selectedFile ? (
                <FileEditor
                  filePath={selectedFile}
                  onSave={handleSave}
                  onFullscreen={() => setFullscreen(true)}
                />
              ) : (
                <WelcomeScreen />
              )}
            </div>
          </Panel>

          <ResizeHandle direction="vertical" />

          {/* Agent Activity Strip */}
          <Panel
            defaultSize={25}
            minSize={5}
            collapsible
            collapsedSize={5}
            onCollapse={() => setActivityExpanded(false)}
            onExpand={() => setActivityExpanded(true)}
          >
            <div className="glass-widget h-full">
              <AgentActivityStrip
                isExpanded={activityExpanded}
                onToggleExpanded={toggleActivityExpanded}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

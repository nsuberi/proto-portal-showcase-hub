import { useState, useCallback, useEffect } from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import FileBrowser from "../file-browser/FileBrowser";
import MarkdownEditor from "../editor/MarkdownEditor";
import CodeEditor from "../editor/CodeEditor";
import TerminalPanel from "../terminal/TerminalPanel";
import IntentionsPanel from "../intentions/IntentionsPanel";
import ToolActivityPanel from "../activity/ToolActivityPanel";
import SessionConfigPanel from "../config/SessionConfigPanel";
import ToolPolicyEditor from "../config/ToolPolicyEditor";
import ToastContainer from "../ui/ToastContainer";
import {
  FileText,
  FolderOpen,
  Terminal,
  Lightbulb,
  Shield,
  Settings2,
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

type MobileTab = "files" | "editor" | "claude" | "intentions" | "config" | "activity";

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

  // Escape exits fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen]);

  if (isMobile) {
    const TABS: { id: MobileTab; icon: typeof FolderOpen; label: string }[] = [
      { id: "files", icon: FolderOpen, label: "Files" },
      { id: "editor", icon: FileText, label: "Editor" },
      { id: "claude", icon: Terminal, label: "Claude" },
      { id: "intentions", icon: Lightbulb, label: "Plan" },
      { id: "config", icon: Settings2, label: "Config" },
      { id: "activity", icon: Shield, label: "Audit" },
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
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "claude" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <TerminalPanel />
            </div>
          </div>
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "intentions" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <IntentionsPanel />
            </div>
          </div>
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "config" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <SessionConfigPanel onSelectFile={handleMobileSelectFile} onOpenPolicyEditor={() => setPolicyEditorOpen(true)} />
            </div>
          </div>
          <div className={`absolute inset-0 m-5 mb-0 ${mobileTab === "activity" ? "" : "hidden"}`}>
            <div className="glass-widget h-full">
              <ToolActivityPanel />
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

  return (
    <div className="workspace-layout workspace-backdrop p-5 flex flex-col">
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

      <PanelGroup
        direction="horizontal"
        autoSaveId="workspace-h-panels"
        className="flex-1 min-h-0"
      >
        {/* Left column: Files + Intentions stacked */}
        <Panel defaultSize={22} minSize={15} maxSize={40}>
          <PanelGroup
            direction="vertical"
            autoSaveId="workspace-left-v3"
          >
            <Panel defaultSize={40} minSize={15}>
              <div className="glass-widget h-full">
                <FileBrowser
                  onSelectFile={handleSelectFile}
                  selectedFile={selectedFile}
                />
              </div>
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel defaultSize={25} minSize={10}>
              <div className="glass-widget h-full">
                <SessionConfigPanel onSelectFile={handleSelectFile} onOpenPolicyEditor={() => setPolicyEditorOpen(true)} />
              </div>
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel defaultSize={35} minSize={15}>
              <div className="glass-widget h-full">
                <IntentionsPanel />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        <ResizeHandle direction="horizontal" />

        {/* Right area: Editor + Terminal + Activity stacked */}
        <Panel defaultSize={78} minSize={40}>
          <PanelGroup
            direction="vertical"
            autoSaveId="workspace-v-panels"
          >
            <Panel defaultSize={50} minSize={15}>
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

            <Panel defaultSize={28} minSize={10}>
              <div className="glass-widget h-full">
                <TerminalPanel />
              </div>
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel defaultSize={22} minSize={10}>
              <div className="glass-widget h-full">
                <ToolActivityPanel />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

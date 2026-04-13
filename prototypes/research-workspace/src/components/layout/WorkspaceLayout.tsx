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
import {
  FileText,
  FolderOpen,
  Terminal,
  Lightbulb,
  Shield,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile";

const CODE_EXTENSIONS = new Set([
  "py", "ts", "tsx", "js", "jsx", "json", "sh", "bash",
  "yml", "yaml", "toml", "cfg", "ini", "css", "html",
  "sql", "r", "rs", "go", "java", "c", "cpp", "h",
]);

function isCodeFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return CODE_EXTENSIONS.has(ext);
}

type MobileTab = "files" | "editor" | "claude" | "intentions" | "activity";

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

function FileEditor({ filePath, onSave }: { filePath: string; onSave?: () => void }) {
  if (isCodeFile(filePath)) {
    return <CodeEditor filePath={filePath} onSave={onSave} />;
  }
  return <MarkdownEditor filePath={filePath} onSave={onSave} />;
}

export default function WorkspaceLayout() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("files");
  const [fullscreen, setFullscreen] = useState(false);
  const isMobile = useIsMobile();

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
      { id: "activity", icon: Shield, label: "Hooks" },
    ];

    return (
      <div className="workspace-layout workspace-backdrop overflow-hidden flex flex-col">
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
    <div className="workspace-layout workspace-backdrop p-5">
      {/* Fullscreen editor overlay */}
      {fullscreen && selectedFile && (
        <div className="fixed inset-0 z-50 workspace-backdrop p-5">
          {/* Minimize button floats above everything */}
          <button
            onClick={() => setFullscreen(false)}
            className="fixed top-7 right-7 z-[60] p-2 rounded-lg bg-black/60 border border-white/[0.15] text-white/70 hover:text-white hover:bg-black/80 backdrop-blur-sm transition-colors shadow-lg"
            title="Exit fullscreen (Esc)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <div className="glass-widget h-full">
            <FileEditor filePath={selectedFile} onSave={handleSave} />
          </div>
        </div>
      )}

      <PanelGroup
        direction="horizontal"
        autoSaveId="workspace-h-panels"
        className="h-full"
      >
        {/* Left column: Files + Intentions stacked */}
        <Panel defaultSize={22} minSize={15} maxSize={40}>
          <PanelGroup
            direction="vertical"
            autoSaveId="workspace-left-v"
          >
            <Panel defaultSize={50} minSize={20}>
              <div className="glass-widget h-full">
                <FileBrowser
                  onSelectFile={handleSelectFile}
                  selectedFile={selectedFile}
                />
              </div>
            </Panel>

            <ResizeHandle direction="vertical" />

            <Panel defaultSize={50} minSize={20}>
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
              <div className="glass-widget h-full relative">
                {selectedFile ? (
                  <>
                    <button
                      onClick={() => setFullscreen(true)}
                      className="absolute top-2 right-2 z-10 p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <FileEditor filePath={selectedFile} onSave={handleSave} />
                  </>
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

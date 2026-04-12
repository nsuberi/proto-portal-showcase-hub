import { useState, useCallback } from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import FileBrowser from "../file-browser/FileBrowser";
import MarkdownEditor from "../editor/MarkdownEditor";
import ChatPanel from "../chat/ChatPanel";
import {
  FileText,
  FolderOpen,
  MessageCircle,
} from "lucide-react";
import { useIsMobile } from "../../hooks/useIsMobile";

type MobileTab = "files" | "editor" | "chat";

function ResizeHandle({
  direction = "horizontal",
}: {
  direction?: "horizontal" | "vertical";
}) {
  const isHorizontal = direction === "horizontal";
  return (
    <PanelResizeHandle
      className={`group relative flex items-center justify-center ${
        isHorizontal
          ? "w-1.5 hover:w-2 transition-all"
          : "h-1.5 hover:h-2 transition-all"
      }`}
    >
      <div
        className={`rounded-full bg-outline-variant/40 group-hover:bg-primary/60 transition-colors ${
          isHorizontal ? "w-0.5 h-8" : "h-0.5 w-8"
        }`}
      />
    </PanelResizeHandle>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-surface-container-lowest">
      <FileText className="w-16 h-16 text-on-surface-variant/30 mb-4" />
      <h2 className="font-headline text-xl text-on-surface-variant mb-2">
        No file selected
      </h2>
      <p className="font-body text-sm text-on-surface-variant/60 max-w-md">
        Select a file from the sidebar to start editing, or create a new file
        with the + button.
      </p>
    </div>
  );
}

export default function WorkspaceLayout() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("files");
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

  if (isMobile) {
    const TABS: { id: MobileTab; icon: typeof FolderOpen; label: string }[] = [
      { id: "files", icon: FolderOpen, label: "Files" },
      { id: "editor", icon: FileText, label: "Editor" },
      { id: "chat", icon: MessageCircle, label: "Claude" },
    ];

    return (
      <div className="workspace-layout h-screen bg-surface-container-lowest overflow-hidden flex flex-col">
        {/* All panels stay mounted to preserve state and connections */}
        <div className="flex-1 overflow-hidden relative">
          <div className={`absolute inset-0 ${mobileTab === "files" ? "" : "hidden"}`}>
            <FileBrowser
              onSelectFile={handleMobileSelectFile}
              selectedFile={selectedFile}
            />
          </div>
          <div className={`absolute inset-0 ${mobileTab === "editor" ? "" : "hidden"}`}>
            {selectedFile ? (
              <MarkdownEditor filePath={selectedFile} onSave={handleSave} />
            ) : (
              <WelcomeScreen />
            )}
          </div>
          <div className={`absolute inset-0 ${mobileTab === "chat" ? "" : "hidden"}`}>
            <ChatPanel />
          </div>
        </div>

        {/* Bottom tab bar */}
        <div className="flex border-t border-outline-variant/20 bg-surface-container-low">
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
    <div className="workspace-layout h-screen bg-surface-container-lowest overflow-hidden">
      <PanelGroup
        direction="horizontal"
        autoSaveId="workspace-h-panels"
      >
        {/* Left panel: File Browser */}
        <Panel defaultSize={20} minSize={12} maxSize={40}>
          <FileBrowser
            onSelectFile={handleSelectFile}
            selectedFile={selectedFile}
          />
        </Panel>

        <ResizeHandle direction="horizontal" />

        {/* Right area: Editor + Terminal stacked vertically */}
        <Panel defaultSize={80} minSize={40}>
          <PanelGroup
            direction="vertical"
            autoSaveId="workspace-v-panels"
          >
            {/* Center panel: Editor */}
            <Panel defaultSize={70} minSize={20}>
              {selectedFile ? (
                <MarkdownEditor
                  filePath={selectedFile}
                  onSave={handleSave}
                />
              ) : (
                <WelcomeScreen />
              )}
            </Panel>

            <ResizeHandle direction="vertical" />

            {/* Bottom panel: Claude Chat */}
            <Panel defaultSize={30} minSize={10}>
              <ChatPanel />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

import { useState, useCallback } from "react";
import FileBrowser from "../file-browser/FileBrowser";
import CodeEditor from "../editor/CodeEditor";
import MarkdownEditor from "../editor/MarkdownEditor";
import { FileText, ArrowLeft } from "lucide-react";
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

function EditorEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <FileText className="w-16 h-16 text-on-surface-variant/20 mb-4" />
      <h2 className="font-headline text-xl text-on-surface-variant/60 mb-2">
        No file selected
      </h2>
      <p className="font-body text-sm text-on-surface-variant/40 max-w-md">
        Select a file from the browser to start editing.
      </p>
    </div>
  );
}

export default function FileExplorerView() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleSelectFile = useCallback((path: string) => {
    setSelectedFile(path);
  }, []);

  // -------------------------------------------------------------------------
  // Mobile: file browser full-width, editor slides in as overlay
  // -------------------------------------------------------------------------
  if (isMobile) {
    const fileName = selectedFile?.split("/").pop() || "";

    return (
      <div className="relative h-full">
        {/* File browser (always rendered, hidden when editor is open) */}
        <div className={`h-full bark-card ${selectedFile ? "hidden" : ""}`}>
          <FileBrowser
            onSelectFile={handleSelectFile}
            selectedFile={selectedFile}
          />
        </div>

        {/* Editor overlay — slides in from right */}
        {selectedFile && (
          <div className="absolute inset-0 mobile-editor-overlay bark-card flex flex-col">
            {/* Mobile editor header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-outline-variant/30">
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 -ml-1 rounded-lg active:bg-on-surface/[0.06] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-on-surface-variant/60" />
              </button>
              <FileText className="w-3.5 h-3.5 text-on-surface-variant/40 flex-shrink-0" />
              <span className="font-mono text-xs text-on-surface-variant/70 truncate">
                {fileName}
              </span>
            </div>

            {/* Editor content */}
            <div className="flex-1 min-h-0">
              {isCodeFile(selectedFile) ? (
                <CodeEditor filePath={selectedFile} />
              ) : (
                <MarkdownEditor filePath={selectedFile} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Desktop: side-by-side browser + editor
  // -------------------------------------------------------------------------
  return (
    <div className="flex h-full gap-2 p-2">
      {/* File browser (left) */}
      <div className="w-72 flex-shrink-0 bark-card">
        <FileBrowser
          onSelectFile={handleSelectFile}
          selectedFile={selectedFile}
        />
      </div>

      {/* Editor (right) */}
      <div className="flex-1 bark-card">
        {selectedFile ? (
          isCodeFile(selectedFile) ? (
            <CodeEditor filePath={selectedFile} />
          ) : (
            <MarkdownEditor filePath={selectedFile} />
          )
        ) : (
          <EditorEmptyState />
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { useVaultFile, saveVaultFile } from "../../hooks/useVaultApi";
import MilkdownEditor from "./MilkdownEditor";
import PublishDialog from "./PublishDialog";
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Keyboard,
  Maximize2,
  Minimize2,
  Globe,
} from "lucide-react";

interface MarkdownEditorProps {
  filePath: string;
  onSave?: () => void;
  isFullscreen?: boolean;
  onFullscreen?: () => void;
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
const MOD = isMac ? "\u2318" : "Ctrl";

const HOTKEYS = [
  { keys: `${MOD}+S`, action: "Save now" },
  { keys: `${MOD}+Z`, action: "Undo" },
  { keys: `${MOD}+Shift+Z`, action: "Redo" },
  { keys: `${MOD}+B`, action: "Bold" },
  { keys: `${MOD}+I`, action: "Italic" },
];

export default function MarkdownEditor({
  filePath,
  onSave,
  isFullscreen,
  onFullscreen,
}: MarkdownEditorProps) {
  const { content, loading, error } = useVaultFile(filePath);
  const [localContent, setLocalContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [publishStatus, setPublishStatus] = useState<
    "idle" | "published"
  >("idle");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    if (content !== null) {
      setLocalContent(content);
      lastSavedRef.current = content;
      setSaveStatus("idle");
    }
  }, [content]);

  // Auto-save on typing (800ms debounce)
  const handleChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);

      if (newContent !== lastSavedRef.current) {
        setSaveStatus("unsaved");
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        if (newContent === lastSavedRef.current) return;
        setSaveStatus("saving");
        try {
          await saveVaultFile(filePath, newContent);
          lastSavedRef.current = newContent;
          setSaveStatus("saved");
          onSave?.();
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
        }
      }, 800);
    },
    [filePath, onSave]
  );

  const handleManualSave = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    try {
      await saveVaultFile(filePath, localContent);
      lastSavedRef.current = localContent;
      setSaveStatus("saved");
      onSave?.();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    }
  }, [filePath, localContent, onSave]);

  // Ctrl/Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleManualSave]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Close hotkey menu on click outside
  useEffect(() => {
    if (!showHotkeys) return;
    const close = () => setShowHotkeys(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showHotkeys]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
          <p className="font-label text-sm text-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="glass-header flex items-center justify-between px-4 py-1.5">
        <span className="font-mono text-xs text-on-surface-variant/80 truncate min-w-0">
          {filePath}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <SaveStatusBadge status={saveStatus} />
          <button
            onClick={handleManualSave}
            className="p-1 rounded hover:bg-on-surface/[0.08] transition-colors text-on-surface-variant/60 hover:text-on-surface/70"
            title={`Save (${MOD}+S)`}
          >
            <Save className="w-3.5 h-3.5" />
          </button>

          {/* Publish */}
          <div className="relative">
            <button
              onClick={() => {
                if (publishStatus !== "published") {
                  setShowPublishDialog((v) => !v);
                }
              }}
              className={`p-1 rounded transition-colors ${
                publishStatus === "published"
                  ? "text-accent-success"
                  : "text-on-surface-variant/60 hover:text-on-surface/70 hover:bg-on-surface/[0.08]"
              }`}
              title="Publish to gallery"
            >
              {publishStatus === "published" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
            </button>
            {showPublishDialog && (
              <PublishDialog
                filePath={filePath}
                markdown={localContent}
                onClose={() => setShowPublishDialog(false)}
                onPublished={() => {
                  setShowPublishDialog(false);
                  setPublishStatus("published");
                  setTimeout(() => setPublishStatus("idle"), 2500);
                }}
              />
            )}
          </div>

          {/* Hotkey menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowHotkeys(!showHotkeys); }}
              className="p-1 rounded hover:bg-on-surface/[0.08] transition-colors text-on-surface-variant/40 hover:text-on-surface-variant"
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
            {showHotkeys && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-[#1a1b20] border border-outline-variant/40 shadow-xl py-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-1.5 border-b border-outline-variant/30">
                  <span className="font-label text-[10px] text-on-surface-variant/60 uppercase tracking-wider">
                    Shortcuts
                  </span>
                </div>
                {HOTKEYS.map(({ keys, action }) => (
                  <div
                    key={keys}
                    className="flex items-center justify-between px-3 py-1"
                  >
                    <span className="font-label text-[10px] text-on-surface-variant">
                      {action}
                    </span>
                    <kbd className="font-mono text-[9px] text-on-surface-variant/60 bg-on-surface/[0.06] px-1.5 py-0.5 rounded">
                      {keys}
                    </kbd>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen toggle */}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1 rounded hover:bg-on-surface/[0.08] transition-colors text-on-surface-variant/40 hover:text-on-surface/70"
              title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <MilkdownEditor
          key={filePath}
          content={localContent}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  switch (status) {
    case "saving":
      return (
        <span className="flex items-center gap-1 font-label text-[10px] text-tertiary">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          Saving
        </span>
      );
    case "saved":
      return (
        <span className="flex items-center gap-1 font-label text-[10px] text-accent-success">
          <Check className="w-2.5 h-2.5" />
          Saved
        </span>
      );
    case "unsaved":
      return (
        <span className="w-1.5 h-1.5 rounded-full bg-tertiary/80" title="Unsaved — auto-saving..." />
      );
    case "error":
      return (
        <span className="flex items-center gap-1 font-label text-[10px] text-error">
          <AlertCircle className="w-2.5 h-2.5" />
          Error
        </span>
      );
    default:
      return null;
  }
}

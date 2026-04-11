import { useState, useEffect, useCallback, useRef } from "react";
import { useVaultFile, saveVaultFile } from "../../hooks/useVaultApi";
import MilkdownEditor from "./MilkdownEditor";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";

interface MarkdownEditorProps {
  filePath: string;
  onSave?: () => void;
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

export default function MarkdownEditor({
  filePath,
  onSave,
}: MarkdownEditorProps) {
  const { content, loading, error } = useVaultFile(filePath);
  const [localContent, setLocalContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  // When file loads, set local content
  useEffect(() => {
    if (content !== null) {
      setLocalContent(content);
      lastSavedRef.current = content;
      setSaveStatus("idle");
    }
  }, [content]);

  // Auto-save with debounce
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
          // Reset to idle after a moment
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
        }
      }, 1500);
    },
    [filePath, onSave]
  );

  // Manual save
  const handleManualSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
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

  // Keyboard shortcut: Ctrl/Cmd+S
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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-container-lowest">
        <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-container-lowest">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
          <p className="font-label text-sm text-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-outline-variant/20 bg-surface-container-low/50">
        <span className="font-mono text-xs text-on-surface-variant/60 truncate">
          {filePath}
        </span>
        <div className="flex items-center gap-2">
          <SaveStatusBadge status={saveStatus} />
          <button
            onClick={handleManualSave}
            className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant/60 hover:text-on-surface-variant"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <MilkdownEditor
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
        <span className="flex items-center gap-1 font-label text-xs text-tertiary">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving...
        </span>
      );
    case "saved":
      return (
        <span className="flex items-center gap-1 font-label text-xs text-domain-ml">
          <Check className="w-3 h-3" />
          Saved
        </span>
      );
    case "unsaved":
      return (
        <span className="font-label text-xs text-tertiary/80">
          Unsaved changes
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1 font-label text-xs text-error">
          <AlertCircle className="w-3 h-3" />
          Save failed
        </span>
      );
    default:
      return null;
  }
}

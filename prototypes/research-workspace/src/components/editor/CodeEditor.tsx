import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useVaultFile, saveVaultFile } from "../../hooks/useVaultApi";
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Code2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface CodeEditorProps {
  filePath: string;
  onSave?: () => void;
  isFullscreen?: boolean;
  onFullscreen?: () => void;
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

// ---------------------------------------------------------------------------
// Lightweight syntax highlighting via regex (no external library)
// ---------------------------------------------------------------------------

const LANG_MAP: Record<string, string> = {
  py: "python",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  sh: "bash",
  bash: "bash",
  yml: "yaml",
  yaml: "yaml",
};

function getLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "text";
}

function highlightLine(line: string, lang: string): string {
  // Escape HTML
  let s = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (lang === "json") {
    s = s.replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="nf">$1</span>:');
    s = s.replace(/:(\s*)("(?:[^"\\]|\\.)*")/g, ':$1<span class="s2">$2</span>');
    s = s.replace(/:\s*(true|false|null)\b/g, ': <span class="kc">$1</span>');
    s = s.replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="mi">$1</span>');
    return s;
  }

  // Comments
  if (lang === "python") {
    s = s.replace(/(#.*)$/, '<span class="c1">$1</span>');
  } else {
    s = s.replace(/(\/\/.*)$/, '<span class="c1">$1</span>');
  }

  // Strings (double and single quoted)
  s = s.replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '<span class="s2">$&</span>');

  // Keywords
  const pyKw = /\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|as|yield|lambda|pass|break|continue|raise|async|await|None|True|False|self)\b/g;
  const tsKw = /\b(const|let|var|function|return|if|else|for|while|class|interface|type|import|export|from|async|await|new|this|extends|implements|true|false|null|undefined|throw|try|catch|finally|switch|case|default|break|continue|yield|typeof|instanceof|void|enum|abstract|readonly|static|private|public|protected)\b/g;
  const bashKw = /\b(if|then|else|elif|fi|for|do|done|while|case|esac|function|return|export|source|echo|exit|set|unset|local|readonly|shift)\b/g;

  if (lang === "python") s = s.replace(pyKw, '<span class="k">$1</span>');
  else if (lang === "typescript" || lang === "javascript") s = s.replace(tsKw, '<span class="k">$1</span>');
  else if (lang === "bash") s = s.replace(bashKw, '<span class="k">$1</span>');

  // Numbers
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="mi">$1</span>');

  // Decorators (Python)
  if (lang === "python") {
    s = s.replace(/(@\w+)/g, '<span class="nd">$1</span>');
  }

  return s;
}

function HighlightedView({ content, lang }: { content: string; lang: string }) {
  const html = useMemo(() => {
    return content
      .split("\n")
      .map((line, i) => {
        const num = String(i + 1).padStart(4, " ");
        const highlighted = highlightLine(line, lang);
        return `<span class="text-white/20 select-none">${num}  </span>${highlighted}`;
      })
      .join("\n");
  }, [content, lang]);

  return (
    <pre
      className="highlight-dark font-mono text-sm leading-relaxed text-white/90 p-4 h-full overflow-auto whitespace-pre"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CodeEditor({
  filePath,
  onSave,
  isFullscreen,
  onFullscreen,
}: CodeEditorProps) {
  const { content, loading, error } = useVaultFile(filePath);
  const [localContent, setLocalContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [editing, setEditing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const lang = getLanguage(filePath);

  useEffect(() => {
    if (content !== null) {
      setLocalContent(content);
      lastSavedRef.current = content;
      setSaveStatus("idle");
    }
  }, [content]);

  const handleChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);
      if (newContent !== lastSavedRef.current) setSaveStatus("unsaved");
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
      }, 1500);
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
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
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-white/40" />
          <span className="font-mono text-xs text-white/60 truncate">{filePath}</span>
          <span className="font-label text-[9px] text-primary/60 bg-primary/10 px-1.5 py-0.5 rounded">
            {lang}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className={`px-2 py-0.5 rounded text-[10px] font-label transition-colors ${
              editing ? "bg-tertiary/20 text-tertiary" : "text-white/40 hover:text-white/60"
            }`}
          >
            {editing ? "Preview" : "Edit"}
          </button>
          <SaveStatusBadge status={saveStatus} />
          <button
            onClick={handleManualSave}
            className="p-1 rounded hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white/60"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-1 rounded hover:bg-white/[0.08] transition-colors text-white/30 hover:text-white/70"
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {editing ? (
          <textarea
            value={localContent}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
            className="w-full h-full bg-transparent text-white font-mono text-sm p-4 resize-none focus:outline-none border-none leading-relaxed placeholder:text-white/30 [tab-size:2]"
            placeholder="Enter code..."
          />
        ) : (
          <HighlightedView content={localContent} lang={lang} />
        )}
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
        </span>
      );
    case "saved":
      return (
        <span className="flex items-center gap-1 font-label text-xs text-accent-success">
          <Check className="w-3 h-3" />
        </span>
      );
    case "unsaved":
      return <span className="w-1.5 h-1.5 rounded-full bg-tertiary/80" />;
    case "error":
      return <AlertCircle className="w-3 h-3 text-error" />;
    default:
      return null;
  }
}

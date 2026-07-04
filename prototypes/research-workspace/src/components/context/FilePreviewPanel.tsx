import { useState, useEffect } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import MarkdownRenderer from "../MarkdownRenderer";

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:8080"
  : "/prototypes/research-workspace/vault";

interface FilePreviewPanelProps {
  filePath: string;
}

export default function FilePreviewPanel({ filePath }: FilePreviewPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setContent(null);

    fetch(
      `${BASE_URL}/api/vault/files/${encodeURIComponent(filePath)}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(`File not found (${res.status})`);
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [filePath]);

  const fileName = filePath.split("/").pop() || filePath;
  const isMarkdown = /\.md$/i.test(filePath);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-primary/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertCircle className="w-6 h-6 text-error/40 mb-2" />
        <p className="font-label text-xs text-on-surface-variant/80">{error}</p>
        <p className="font-mono text-[10px] text-on-surface-variant/65 mt-1">
          {filePath}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-outline-variant/20">
        <FileText className="w-3.5 h-3.5 text-on-surface-variant/65" />
        <span className="font-mono text-xs text-on-surface-variant/85 truncate">
          {fileName}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {isMarkdown && content ? (
          <div className="text-sm">
            <MarkdownRenderer content={content} />
          </div>
        ) : (
          <pre className="font-mono text-xs text-on-surface/88 whitespace-pre-wrap break-words">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}

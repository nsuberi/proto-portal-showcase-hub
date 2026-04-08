import { useState, useRef, useCallback, Suspense, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { tokens } from "@/design-system/tokens";
import type { ArtifactStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface ArtifactViewerProps {
  /** Display title in the chrome bar */
  title: string;
  /** URL to an HTML file (served from public/) */
  src?: string;
  /** Raw HTML string to render inline via srcdoc */
  html?: string;
  /** React component to render inline as the preview (takes priority over src/html) */
  previewContent?: ReactNode;
  /** Source code to show in code view */
  code?: string;
  /** Language label for the code tab */
  language?: string;
  status?: ArtifactStatus;
  className?: string;
  /** Fixed height for the preview area (default 320) */
  height?: number;
  /** Route path to the full artifact page (e.g. "/artifacts/loan-classifier") */
  artifactRoute?: string;
}

const artifactStatusColors: Record<
  ArtifactStatus,
  { bg: string; color: string; label: string }
> = {
  running: {
    bg: tokens.color.tertiaryContainer,
    color: tokens.color.tertiary,
    label: "Running",
  },
  building: {
    bg: tokens.color.primaryContainer,
    color: tokens.color.primary,
    label: "Building...",
  },
  error: {
    bg: tokens.color.errorContainer,
    color: tokens.color.error,
    label: "Error",
  },
};

type ViewMode = "preview" | "code";

export function ArtifactViewer({
  title,
  src,
  html,
  previewContent,
  code,
  language,
  status,
  className,
  height = 320,
  artifactRoute,
}: ArtifactViewerProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>("preview");
  const [isExpanded, setIsExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const statusCfg = status ? artifactStatusColors[status] : null;

  const hasCode = Boolean(code);
  const hasPreview = Boolean(previewContent || src || html);

  const handleRefresh = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (src) {
      iframe.src = src;
    } else if (html) {
      iframe.srcdoc = html;
    }
  }, [src, html]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-sm bg-surface-container-lowest",
        isExpanded && "fixed inset-4 z-50 shadow-2xl",
        className,
      )}
    >
      {/* Chrome bar */}
      <div className="flex items-center justify-between bg-[#0d0e12] px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <span className="block h-3 w-3 rounded-full bg-[#FF5F56]" />
            <span className="block h-3 w-3 rounded-full bg-[#FFBD2E]" />
            <span className="block h-3 w-3 rounded-full bg-[#27C93F]" />
          </div>

          {/* Title */}
          <span className="font-label text-xs text-on-primary-container">
            {title}
            {language ? `.${language}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — only show if both views available */}
          {hasCode && hasPreview && (
            <div className="flex overflow-hidden rounded-md bg-surface-container">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={cn(
                  "px-2.5 py-1 font-label text-[10px] font-medium transition-colors",
                  mode === "preview"
                    ? "bg-primary-container text-primary"
                    : "text-on-primary-container hover:text-on-surface",
                )}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setMode("code")}
                className={cn(
                  "px-2.5 py-1 font-label text-[10px] font-medium transition-colors",
                  mode === "code"
                    ? "bg-primary-container text-primary"
                    : "text-on-primary-container hover:text-on-surface",
                )}
              >
                Code
              </button>
            </div>
          )}

          {/* Refresh button (preview mode only) */}
          {mode === "preview" && hasPreview && (
            <button
              type="button"
              onClick={handleRefresh}
              className="flex h-6 w-6 items-center justify-center rounded-md text-on-primary-container transition-colors hover:bg-surface-container hover:text-on-surface"
              title="Refresh"
            >
              <span className="material-symbols-outlined text-sm">
                refresh
              </span>
            </button>
          )}

          {/* Open full artifact app */}
          {artifactRoute && (
            <button
              type="button"
              onClick={() => navigate(artifactRoute)}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-label text-[10px] font-medium text-on-primary-container transition-colors hover:bg-surface-container hover:text-on-surface"
              title="Open App"
            >
              <span className="material-symbols-outlined text-sm">
                open_in_new
              </span>
              Open
            </button>
          )}

          {/* Expand/collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-on-primary-container transition-colors hover:bg-surface-container hover:text-on-surface"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <span className="material-symbols-outlined text-sm">
              {isExpanded ? "close_fullscreen" : "open_in_full"}
            </span>
          </button>

          {/* Status pill */}
          {statusCfg && (
            <span
              className="rounded-full px-2 py-0.5 font-label text-xs"
              style={{
                backgroundColor: statusCfg.bg,
                color: statusCfg.color,
              }}
            >
              {statusCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      {mode === "preview" && hasPreview ? (
        <div
          className="relative bg-surface-container-lowest"
          style={{ height: isExpanded ? "calc(100% - 40px)" : height }}
        >
          {previewContent ? (
            <div className="h-full w-full overflow-auto">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <span className="font-label text-xs text-on-primary-container">
                      Loading...
                    </span>
                  </div>
                }
              >
                {previewContent}
              </Suspense>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={src}
              srcDoc={html}
              title={title}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-forms"
            />
          )}
        </div>
      ) : (
        <div className="p-4" style={{ minHeight: 120 }}>
          <pre className="m-0 overflow-x-auto">
            <code className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-primary">
              {code || "// No source code provided"}
            </code>
          </pre>
        </div>
      )}

      {/* Expanded overlay backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10 bg-black/60"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

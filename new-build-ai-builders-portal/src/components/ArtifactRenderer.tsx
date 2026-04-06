import { tokens } from "@/design-system/tokens";
import type { ArtifactStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface ArtifactRendererProps {
  title: string;
  status?: ArtifactStatus;
  code: string;
  language?: string;
  className?: string;
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

export function ArtifactRenderer({
  title,
  status,
  code,
  language,
  className,
}: ArtifactRendererProps) {
  const statusCfg = status ? artifactStatusColors[status] : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient",
        className,
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between bg-[#0d0e12] px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <span className="block h-3 w-3 rounded-full bg-[#FF5F56]" />
            <span className="block h-3 w-3 rounded-full bg-[#FFBD2E]" />
            <span className="block h-3 w-3 rounded-full bg-[#27C93F]" />
          </div>

          {/* Filename */}
          <span className="font-label text-xs text-on-primary-container">
            {title}
            {language ? `.${language}` : ""}
          </span>
        </div>

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

      {/* Code area */}
      <div className="p-4" style={{ minHeight: 120 }}>
        <pre className="m-0 overflow-x-auto">
          <code className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-primary">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

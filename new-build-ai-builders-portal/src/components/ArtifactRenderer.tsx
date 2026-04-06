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
    bg: "#D8F0E8",
    color: tokens.color.atmosphereTeal,
    label: "● Running",
  },
  building: {
    bg: "#E0F0FA",
    color: tokens.color.instrumentBlue,
    label: "◌ Building…",
  },
  error: {
    bg: "#FDE8D8",
    color: "#C0442A",
    label: "● Error",
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
        "bg-deep-space rounded-lg overflow-hidden border-thin border-orbital-blue",
        className,
      )}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: "#0A1420" }}
      >
        <div className="flex items-center gap-3">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <span
              className="block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#FF5F56" }}
            />
            <span
              className="block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#FFBD2E" }}
            />
            <span
              className="block w-3 h-3 rounded-full"
              style={{ backgroundColor: "#27C93F" }}
            />
          </div>

          {/* Filename */}
          <span
            className="font-mono text-xs"
            style={{ color: "#6B8BA4" }}
          >
            {title}
            {language ? `.${language}` : ""}
          </span>
        </div>

        {/* Status pill */}
        {statusCfg && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
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
          <code
            className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: "#B8CDE0" }}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

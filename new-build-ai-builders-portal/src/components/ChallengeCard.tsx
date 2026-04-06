import { phaseConfig, statusConfig } from "@/design-system/tokens";
import type { Phase, ChallengeStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  phase?: Phase;
  title: string;
  description: string;
  deliverables?: string[];
  status?: ChallengeStatus;
  tags?: string[];
  className?: string;
  onClick?: () => void;
}

export function ChallengeCard({
  phase,
  title,
  description,
  deliverables = [],
  status,
  tags = [],
  className,
  onClick,
}: ChallengeCardProps) {
  const phaseData = phase ? phaseConfig[phase] : null;
  const statusData = status ? statusConfig[status] : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-surface-container-low",
        "transition-colors duration-200 hover:bg-surface-container",
        "shadow-[inset_3px_0_12px_-4px_rgba(227,226,232,0.15)]",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="p-5">
        {/* Header row: phase badge + status badge */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {phaseData && (
              <span
                className="rounded-full px-2.5 py-0.5 font-label text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: phaseData.bg,
                  color: phaseData.accent,
                }}
              >
                Phase {phase}: {phaseData.label}
              </span>
            )}
          </div>

          {statusData && (
            <span
              className="rounded-full px-2.5 py-0.5 font-label text-[10px] font-semibold"
              style={{
                backgroundColor: statusData.bg,
                color: statusData.color,
              }}
            >
              {statusData.label}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-container-highest px-2 py-0.5 font-label text-[11px] text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="mb-1 font-headline text-base font-semibold text-on-surface">
          {title}
        </h3>

        {/* Description */}
        <p className="mb-3 font-body text-[13px] leading-relaxed text-on-surface-variant">
          {description}
        </p>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div className="rounded-lg bg-surface-container-lowest p-3">
            <p className="mb-2 font-label text-[11px] font-semibold uppercase tracking-wider text-on-primary-container">
              Deliverables
            </p>
            <ul className="flex flex-col gap-1.5">
              {deliverables.map((item, i) => (
                <li key={i} className="flex items-center gap-2 font-body text-[12px] text-on-surface">
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

ChallengeCard.displayName = "ChallengeCard";

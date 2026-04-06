import { tokens, phaseConfig, statusConfig } from "@/design-system/tokens";
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
        "relative overflow-hidden rounded-lg border border-border-warm bg-shelter-white",
        "transition-shadow duration-200 hover:shadow-md",
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
      {/* Phase accent bar */}
      {phaseData && (
        <div
          className="h-1 w-full"
          style={{ backgroundColor: phaseData.accent }}
        />
      )}

      <div className="p-4">
        {/* Header row: phase badge + status badge */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {phaseData && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
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
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
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
                className="rounded-full border border-border-warm px-2 py-0.5 text-[11px] text-dust"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="mb-1 text-base font-semibold text-deep-space">
          {title}
        </h3>

        {/* Description */}
        <p className="mb-3 text-[13px] leading-relaxed text-dust">
          {description}
        </p>

        {/* Deliverables */}
        {deliverables.length > 0 && (
          <div className="rounded-md bg-regolith p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-dust">
              Deliverables
            </p>
            <ul className="flex flex-col gap-1.5">
              {deliverables.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-dark-text">
                  <span
                    className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: phaseData
                        ? phaseData.accent
                        : tokens.color.dust,
                    }}
                  />
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

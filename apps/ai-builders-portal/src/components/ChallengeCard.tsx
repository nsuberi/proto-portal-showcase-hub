import { phaseConfig, statusConfig } from "@/design-system/tokens";
import type { Phase, ChallengeStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

const practiceColors: Record<string, { bg: string; text: string }> = {
  Discovery: { bg: "rgba(187,198,226,0.12)", text: "var(--color-phase-1)" },
  Building: { bg: "rgba(255,186,56,0.12)", text: "var(--color-phase-2)" },
  Security: { bg: "rgba(255,180,165,0.12)", text: "var(--color-phase-3)" },
  Storytelling: { bg: "rgba(168,213,186,0.12)", text: "var(--color-phase-4)" },
};

interface ChallengeCardProps {
  phase?: Phase;
  title: string;
  description: string;
  deliverables?: string[];
  status?: ChallengeStatus;
  tags?: string[];
  practices?: string[];
  submission?: number;
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
  practices = [],
  submission,
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

        {/* Practices */}
        {practices.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {practices.map((practice) => {
              const colors = practiceColors[practice];
              return (
                <span
                  key={practice}
                  className="rounded-full px-2 py-0.5 font-label text-[10px] font-semibold"
                  style={colors ? { backgroundColor: colors.bg, color: colors.text } : undefined}
                >
                  {practice}
                </span>
              );
            })}
          </div>
        )}

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
          {submission && (
            <span className="mr-1.5 font-label text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              S{submission}
            </span>
          )}
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

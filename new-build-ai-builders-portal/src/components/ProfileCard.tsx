import { tokens, phaseConfig } from "@/design-system/tokens";
import type { Phase } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  name: string;
  role: string;
  phase: Phase;
  stats: Array<{ value: string; label: string }>;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProfileCard({
  name,
  role,
  phase,
  stats,
  className,
}: ProfileCardProps) {
  const phaseData = phaseConfig[phase];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border-warm",
        className,
      )}
    >
      {/* Gradient header */}
      <div
        className="relative px-5 pb-5 pt-6"
        style={{
          background: `linear-gradient(135deg, ${tokens.color.deepSpace}, ${tokens.color.orbitalBlue})`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-shelter-white"
            style={{ backgroundColor: tokens.color.instrumentBlue + "4D" }}
          >
            {getInitials(name)}
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-shelter-white">
              {name}
            </h3>
            <p
              className="truncate text-[12px]"
              style={{ color: tokens.color.shelterWhite + "99" }}
            >
              {role}
            </p>
          </div>

          {/* Phase badge */}
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: phaseData.bg,
              color: phaseData.accent,
            }}
          >
            Phase {phase}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 divide-x divide-border-warm bg-shelter-white">
        {stats.map((stat, i) => (
          <div key={i} className="px-3 py-4 text-center">
            <p className="text-xl font-semibold text-deep-space">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-dust">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

ProfileCard.displayName = "ProfileCard";

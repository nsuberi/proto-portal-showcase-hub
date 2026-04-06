import { phaseConfig } from "@/design-system/tokens";
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
        "overflow-hidden rounded-xl bg-surface-container-low",
        className,
      )}
    >
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-primary-container to-surface-container-lowest px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 font-headline text-sm font-semibold text-primary">
            {getInitials(name)}
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-headline text-base font-semibold text-on-surface">
              {name}
            </h3>
            <p className="truncate font-body text-[12px] italic text-on-surface-variant">
              {role}
            </p>
          </div>

          {/* Phase badge */}
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 font-label text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: phaseData.bg,
              color: phaseData.accent,
            }}
          >
            Phase {phase}
          </span>
        </div>
      </div>

      {/* Stats grid — no dividers, whitespace separation */}
      <div className="grid grid-cols-4 gap-4 bg-surface-container px-3 py-4">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <p className="font-headline text-xl font-semibold text-primary">
              {stat.value}
            </p>
            <p className="mt-0.5 font-label text-[10px] uppercase tracking-wider text-on-primary-container">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

ProfileCard.displayName = "ProfileCard";

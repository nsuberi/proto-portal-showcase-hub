import { useNavigate, useSearchParams } from "react-router-dom";
import { challenges } from "@/data/challenges";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { Phase, ChallengeStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

const phaseFilters: Array<{ label: string; value: Phase | null }> = [
  { label: "All", value: null },
  { label: "Curiosity", value: 1 },
  { label: "Clarity", value: 2 },
  { label: "Capability", value: 3 },
  { label: "Consistency", value: 4 },
];

const statusFilters: Array<{ label: string; value: ChallengeStatus | null }> = [
  { label: "All", value: null },
  { label: "Not started", value: "not-started" },
  { label: "In progress", value: "in-progress" },
  { label: "Submitted", value: "submitted" },
  { label: "Reviewed", value: "reviewed" },
];

export default function ChallengesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activePhase = searchParams.get("phase")
    ? (Number(searchParams.get("phase")) as Phase)
    : null;
  const activeStatus = (searchParams.get("status") as ChallengeStatus) || null;

  function setFilter(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  }

  const filtered = challenges.filter((c) => {
    if (activePhase !== null && c.phase !== activePhase) return false;
    if (activeStatus !== null && c.status !== activeStatus) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-xl font-bold text-on-surface">Submissions &amp; Challenges</h1>
        <p className="mt-1 font-body text-sm text-on-surface-variant">
          Seven submissions span all four practices. Additional challenges let you go deeper.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Phase filters */}
        {phaseFilters.map((f) => {
          const isActive =
            f.value === null ? activePhase === null : activePhase === f.value;
          return (
            <button
              key={`phase-${f.label}`}
              type="button"
              onClick={() =>
                setFilter("phase", f.value !== null ? String(f.value) : null)
              }
              className={cn(
                "rounded-full px-3 py-2 font-label text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface",
              )}
            >
              {f.label}
            </button>
          );
        })}

        {/* Separator */}
        <span className="mx-1 h-4 w-px bg-outline-variant/20" />

        {/* Status filters */}
        {statusFilters.map((f) => {
          const isActive =
            f.value === null ? activeStatus === null : activeStatus === f.value;
          return (
            <button
              key={`status-${f.label}`}
              type="button"
              onClick={() => setFilter("status", f.value)}
              className={cn(
                "rounded-full px-3 py-2 font-label text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container-highest text-on-surface-variant hover:text-on-surface",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Challenge grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              phase={challenge.phase}
              title={challenge.title}
              description={challenge.description}
              deliverables={challenge.deliverables}
              status={challenge.status}
              tags={challenge.tags}
              practices={challenge.practices}
              submission={challenge.submission}
              onClick={() => navigate(`/challenges/${challenge.id}`)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container py-16 text-center">
          <p className="mb-4 font-body text-sm text-on-surface-variant">
            No challenges match your filters.
          </p>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="rounded-full bg-surface-container-highest px-4 py-1.5 font-label text-xs font-medium text-primary transition-colors hover:bg-primary/10 cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

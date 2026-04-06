import { useNavigate, useSearchParams } from "react-router-dom";
import { challenges } from "@/data/challenges";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { Phase, ChallengeStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

const phaseFilters: Array<{ label: string; value: Phase | null }> = [
  { label: "All", value: null },
  { label: "Guided", value: 1 },
  { label: "Constrained", value: 2 },
  { label: "Discovery", value: 3 },
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
        <h1 className="text-xl font-bold text-deep-space">Challenges</h1>
        <p className="mt-1 text-sm text-dust">
          Bounded units of work that build real capability.
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
                "rounded-full border-thin border-border-warm px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-instrument-blue/10 text-instrument-blue border-instrument-blue/40"
                  : "bg-shelter-white text-dust hover:text-dark-text",
              )}
            >
              {f.label}
            </button>
          );
        })}

        {/* Separator */}
        <span className="mx-1 h-4 w-px bg-border-warm" />

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
                "rounded-full border-thin border-border-warm px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-instrument-blue/10 text-instrument-blue border-instrument-blue/40"
                  : "bg-shelter-white text-dust hover:text-dark-text",
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
              onClick={() => navigate(`/challenges/${challenge.id}`)}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-sm text-dust">
            No challenges match your filters.
          </p>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="rounded-full border-thin border-border-warm bg-shelter-white px-4 py-1.5 text-xs font-medium text-instrument-blue transition-colors hover:bg-regolith cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

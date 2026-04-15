import { useTree } from "../../hooks/useTree";
import { GitBranch, Plus, Sprout } from "lucide-react";

interface BranchListPanelProps {
  /** ID of a newly created branch to highlight with a pulse */
  highlightBranchId?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  growing: { label: "Growing", color: "text-leaf" },
  flowering: { label: "Flowering", color: "text-flower" },
  internalizing: { label: "Internalizing", color: "text-branch" },
  rooted: { label: "Rooted", color: "text-root" },
};

export default function BranchListPanel({ highlightBranchId }: BranchListPanelProps) {
  const { tree } = useTree();

  const branches = tree.branches;
  const roots = tree.roots;

  return (
    <div className="flex flex-col h-full">
      {/* Roots summary */}
      {roots.length > 0 && (
        <div className="px-4 py-3 border-b border-outline-variant/20">
          <h4 className="font-label text-[10px] uppercase tracking-wider text-root mb-2">
            Your Roots
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {roots.map((root) => (
              <span
                key={root.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-root/8 text-root font-label text-[10px]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-root" />
                {root.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Branches */}
      <div className="flex-1 overflow-y-auto">
        {branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Sprout className="w-8 h-8 text-on-surface-variant/15 mb-2" />
            <p className="font-label text-xs text-on-surface-variant/40">
              No branches yet. Tell the Gardener what you want to explore.
            </p>
          </div>
        ) : (
          <div className="py-2">
            {branches.map((branch) => {
              const isHighlighted = branch.id === highlightBranchId;
              const status = STATUS_LABELS[branch.status] || STATUS_LABELS.growing;
              const leafCount = tree.leaves.filter(
                (l) => l.branchId === branch.id,
              ).length;
              const flowerCount = tree.flowers.filter(
                (f) => f.branchId === branch.id,
              ).length;

              return (
                <div
                  key={branch.id}
                  className={`px-4 py-2.5 border-b border-outline-variant/10 transition-colors ${
                    isHighlighted
                      ? "bg-primary/8 animate-pulse"
                      : "hover:bg-on-surface/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <GitBranch
                      className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${status.color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-xs text-on-surface font-medium truncate">
                        {branch.title}
                      </p>
                      {branch.description && (
                        <p className="font-body text-[10px] text-on-surface-variant/60 mt-0.5 line-clamp-2">
                          {branch.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`font-label text-[9px] uppercase tracking-wider ${status.color}`}
                        >
                          {status.label}
                        </span>
                        {leafCount > 0 && (
                          <span className="font-label text-[9px] text-leaf/60">
                            {leafCount} leaves
                          </span>
                        )}
                        {flowerCount > 0 && (
                          <span className="font-label text-[9px] text-flower/60">
                            {flowerCount} flowers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add branch hint */}
      <div className="px-4 py-2 border-t border-outline-variant/20">
        <p className="font-label text-[10px] text-on-surface-variant/40 flex items-center gap-1">
          <Plus className="w-3 h-3" />
          Tell the Gardener "I want to learn about..." to grow a new branch
        </p>
      </div>
    </div>
  );
}

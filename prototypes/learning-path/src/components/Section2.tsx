import { useMemo } from "react";
import { cuisineClusters } from "../data/recipes";
import { CuisineCluster, Recipe } from "../types";
import clsx from "clsx";

type Props = {
  selectedRecipe?: Recipe | null;
  recipeProgress: Record<string, number>; // recipe name -> times made (0..3)
  onToggleProgress: (recipeName: string) => void;
  visibleClusters?: CuisineCluster[];
  onSelectRecipe: (recipe: Recipe) => void;
};

function Broccoli({ filled }: { filled: boolean }) {
  return (
    <span
      className={clsx(
        "inline-block w-4 h-4 rounded-sm border mr-1 align-middle",
        filled ? "bg-green-600 border-green-700" : "border-green-700 bg-white"
      )}
      title={filled ? "Made" : "Not made"}
    />
  );
}

export default function Section2({ selectedRecipe, recipeProgress, onToggleProgress, visibleClusters, onSelectRecipe }: Props) {
  const clusters = useMemo(() => visibleClusters ?? cuisineClusters, [visibleClusters]);

  return (
    <section className="py-mobile px-mobile parchment-bg">
      <div className="container-mobile">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-900">Foods of the world</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clusters.map(cluster => (
            <div key={cluster.cuisine} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-secondary" />
                <h3 className="text-lg font-semibold text-slate-900">{cluster.cuisine}</h3>
                <div className="text-xs text-slate-500">(stylized map placeholder)</div>
              </div>
              <ul className="space-y-2">
                {cluster.recipes.map(r => {
                  const count = Math.min(3, recipeProgress[r.name] ?? 0);
                  const completed = count === 3;
                  return (
                    <li
                      key={r.name}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2 rounded border transition-colors",
                        completed
                          ? "border-amber-400 bg-amber-50 text-amber-900"
                          : "border-slate-200 bg-white text-slate-900"
                      )}
                    >
                      <button
                        className={clsx(
                          "text-left flex-1 mr-3 underline-offset-2 rounded-sm transition-colors",
                          selectedRecipe?.name === r.name
                            ? "text-primary"
                            : "text-slate-800 hover:bg-slate-50"
                        )}
                        onClick={() => onSelectRecipe(r)}
                        title={`View details for ${r.name}`}
                      >
                        {r.name}
                      </button>
                      <div className="flex items-center">
                        <Broccoli filled={count >= 1} />
                        <Broccoli filled={count >= 2} />
                        <Broccoli filled={count >= 3} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



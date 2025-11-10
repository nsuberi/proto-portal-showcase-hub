import { useCallback, useMemo, useState } from "react";
import Section1 from "./components/Section1";
import Section2 from "./components/Section2";
import Section3 from "./components/Section3";
import { CuisineCluster, Recipe } from "./types";
import { initialRecipeProgress } from "./data/recipes";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import clsx from "clsx";

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [visibleClusters, setVisibleClusters] = useState<CuisineCluster[] | undefined>(undefined);
  const [recipeProgress, setRecipeProgress] = useState<Record<string, number>>(initialRecipeProgress);
  const [modalOpen, setModalOpen] = useState(false);

  const onSelectRecipe = useCallback((r: Recipe) => {
    setSelectedRecipe(r);
    setModalOpen(true);
  }, []);

  const onVisibleClustersChange = useCallback((clusters: CuisineCluster[]) => {
    setVisibleClusters(clusters);
  }, []);

  const onToggleProgress = useCallback((recipeName: string) => {
    setRecipeProgress(prev => {
      const current = prev[recipeName] ?? 0;
      return { ...prev, [recipeName]: Math.min(3, current + 1) };
    });
  }, []);

  const canIncrementSelected = useMemo(() => !!selectedRecipe, [selectedRecipe]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-mobile px-mobile">
        <div className="container-mobile">
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="bg-gradient-primary bg-clip-text text-transparent">Learning Path</span>
          </h1>
          <p className="text-muted-foreground mt-2">Explore recipes from around the world and track your cooking journey.</p>
        </div>
      </header>

      <main>
        <Section1
          selectedRecipe={selectedRecipe ?? undefined}
          onSelectRecipe={onSelectRecipe}
          onVisibleClustersChange={onVisibleClustersChange}
          recipeProgress={recipeProgress}
        />
        <Section2
          selectedRecipe={selectedRecipe ?? undefined}
          recipeProgress={recipeProgress}
          onToggleProgress={onToggleProgress}
          visibleClusters={visibleClusters}
          onSelectRecipe={onSelectRecipe}
        />
        <Section3
          selectedRecipe={selectedRecipe ?? undefined}
          onSelectRecipe={onSelectRecipe}
        />
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        Built with the shared design tokens.
      </footer>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background text-foreground rounded-lg shadow-lg max-w-xl w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <DialogTitle className="text-lg font-semibold">
                {selectedRecipe?.name ?? "Recipe"}
              </DialogTitle>
              <div className="flex gap-2">
                <button
                  className={clsx(
                    "px-3 py-2 rounded-md border text-sm",
                    canIncrementSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  disabled={!canIncrementSelected}
                  onClick={() => {
                    if (selectedRecipe) {
                      onToggleProgress(selectedRecipe.name);
                    }
                  }}
                >
                  I made it!
                </button>
                <button
                  className="px-3 py-2 rounded-md border text-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="text-sm space-y-2 max-h-[60vh] overflow-auto pr-1">
              {selectedRecipe ? (
                <>
                  <div><span className="font-semibold">Origin:</span> {selectedRecipe.origin}</div>
                  <div>{selectedRecipe.description}</div>
                  <div>
                    <h4 className="font-semibold mt-2 mb-1">Ingredients</h4>
                    <ul className="list-disc ml-5">
                      {selectedRecipe.ingredients.map(i => (
                        <li key={i.id}>
                          {i.name} — {i.amount} {i.units_of_measurement} ({i.description})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mt-2 mb-1">Steps</h4>
                    <ol className="list-decimal ml-5">
                      {selectedRecipe.steps.map(s => (
                        <li key={s.id}>
                          <span className="font-medium">Stage {s.stage}</span> — {s.description} ({s.time_required_min} min)
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                <div>Select a recipe to view details.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



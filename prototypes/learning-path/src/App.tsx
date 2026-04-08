import { useCallback, useMemo, useState } from "react";
import Section1 from "./components/Section1";
import Section2 from "./components/Section2";
import Navigation from "./components/Navigation";
import { CuisineCluster, Recipe } from "./types";
import { initialRecipeProgress } from "./data/recipes";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import clsx from "clsx";

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [visibleClusters, setVisibleClusters] = useState<CuisineCluster[] | undefined>(undefined);
  const [recipeProgress, setRecipeProgress] = useState<Record<string, number>>(initialRecipeProgress);
  const [modalOpen, setModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

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
      <Navigation onShowInstructions={() => setShowInstructions(true)} />

      <header className="pt-8 pb-4 sm:pt-12 sm:pb-6 px-mobile">
        <div className="container-mobile max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-2">
            Your Culinary Adventure Awaits
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-4 leading-tight">
            Cooking is a Journey
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Every time you make a dish, you learn something new—a little more salt,
            a minute less on the heat—until it becomes uniquely yours.
          </p>
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
        {/* Section3 removed to improve performance */}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        Built with the shared design tokens.
      </footer>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="fixed inset-0 z-50 isolate flex items-center justify-center p-4 pointer-events-none">
          <div className="relative bg-background text-foreground rounded-lg shadow-2xl max-w-xl w-full p-4 pointer-events-auto border border-border">
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

      {/* Instructions Modal */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="fixed inset-0 z-50 isolate flex items-center justify-center p-4 pointer-events-none">
          <div className="relative bg-background text-foreground rounded-lg shadow-2xl max-w-lg w-full p-6 pointer-events-auto border border-border">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-xl font-semibold">How to Use Recipe Explorer</DialogTitle>
              <button
                className="px-3 py-1 rounded-md border text-sm hover:bg-muted transition-colors"
                onClick={() => setShowInstructions(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Exploring Cuisines</h4>
                <p className="text-muted-foreground">Use the cuisine buttons or arrow controls to navigate between different world cuisines. The graph shows recipes as nodes.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Viewing Recipes</h4>
                <p className="text-muted-foreground">Click on any recipe node in the graph or recipe name in the list to view its details, ingredients, and cooking steps.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Tracking Progress</h4>
                <p className="text-muted-foreground">Click "I made it!" to track your cooking progress. Each recipe can be made up to 3 times, shown by the broccoli indicators.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Color Coding</h4>
                <p className="text-muted-foreground">Node colors become more vibrant as you make a recipe more times, helping you visualize your cooking journey.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



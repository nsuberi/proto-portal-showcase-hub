import { cuisineClusters } from "../data/recipes";
import { Recipe } from "../types";
import clsx from "clsx";

type Props = {
  selectedRecipe?: Recipe | null;
  onSelectRecipe: (recipe: Recipe) => void;
};

export default function Section3({ selectedRecipe, onSelectRecipe }: Props) {
  // Simplified world map placeholder and hex grid visualization
  const recipes = cuisineClusters.flatMap(c => c.recipes);

  return (
    <section className="py-mobile px-mobile">
      <div className="container-mobile">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Recipes Around the World</h2>
        <div className="rounded-lg border overflow-hidden">
          <div
            className="w-full h-80 sm:h-96 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted via-background to-muted relative"
            aria-label="World map (stylized)"
          >
            {/* Hex grid rows */}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center gap-2">
              <div className="hex-row">
                {recipes.slice(0, 5).map(r => (
                  <button
                    key={`r1-${r.name}`}
                    className={clsx("hex-cell hover:shadow-glow transition-smooth", selectedRecipe?.name === r.name && "ring-2 ring-primary")}
                    title={`${r.name} (${r.origin})`}
                    onClick={() => onSelectRecipe(r)}
                  />
                ))}
              </div>
              <div className="hex-row offset">
                {recipes.slice(5, 10).map(r => (
                  <button
                    key={`r2-${r.name}`}
                    className={clsx("hex-cell hover:shadow-glow transition-smooth", selectedRecipe?.name === r.name && "ring-2 ring-primary")}
                    title={`${r.name} (${r.origin})`}
                    onClick={() => onSelectRecipe(r)}
                  />
                ))}
              </div>
              <div className="hex-row">
                {recipes.slice(10, 15).map(r => (
                  <button
                    key={`r3-${r.name}`}
                    className={clsx("hex-cell hover:shadow-glow transition-smooth", selectedRecipe?.name === r.name && "ring-2 ring-primary")}
                    title={`${r.name} (${r.origin})`}
                    onClick={() => onSelectRecipe(r)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



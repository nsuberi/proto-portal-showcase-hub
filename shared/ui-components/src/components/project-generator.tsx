import * as React from "react"
import { cn } from "../lib/utils"
import { CategoryBadge } from "./category-badge"

/**
 * Custom project generator — Codecademy "Generate a custom project" pattern.
 * Context card showing subskill + theme chip grid + generate CTA.
 *
 * Curriculum: Discovery and Design (prototyping to learn, not anchoring to tools)
 *             Building (AI evaluation tools, creating real data flows)
 */

export interface ProjectGeneratorProps extends React.HTMLAttributes<HTMLDivElement> {
  subskillLabel?: string
  subskillDescription: string
  themes: string[]
  selectedTheme?: string
  onSelectTheme: (theme: string) => void
  onGenerate: () => void
  isGenerating?: boolean
}

const ProjectGenerator = React.forwardRef<HTMLDivElement, ProjectGeneratorProps>(
  ({
    subskillLabel = "Subskill",
    subskillDescription,
    themes,
    selectedTheme,
    onSelectTheme,
    onGenerate,
    isGenerating,
    className,
    ...props
  }, ref) => (
    <div ref={ref} className={cn("space-y-6 max-w-2xl mx-auto", className)} {...props}>
      <h2 className="text-lg font-bold">Generate a custom project for this subskill</h2>

      {/* Context card */}
      <div className="rounded-lg border bg-card p-5">
        <CategoryBadge className="mb-2">{subskillLabel}</CategoryBadge>
        <p className="text-base font-semibold mt-2">{subskillDescription}</p>
      </div>

      {/* Theme selection */}
      <div>
        <h3 className="text-base font-bold mb-3">Choose a theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onSelectTheme(theme)}
              className={cn(
                "px-4 py-3 rounded-lg border text-sm font-medium text-left transition-all",
                selectedTheme === theme
                  ? "border-warning bg-warning/10 text-foreground ring-2 ring-warning/30"
                  : "border-border text-foreground hover:border-foreground/30"
              )}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      {/* Generate CTA */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!selectedTheme || isGenerating}
        className={cn(
          "w-full py-3 rounded-lg text-sm font-semibold transition-all",
          selectedTheme
            ? "bg-warning text-warning-foreground hover:bg-warning/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isGenerating ? "Generating..." : "Get custom project"}
      </button>
    </div>
  )
)
ProjectGenerator.displayName = "ProjectGenerator"

export { ProjectGenerator }

import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Skill tracking matrix — Codecademy skill progress grid.
 * Grid of skill sets vs individual skills with percentage badges.
 * Right sidebar with level indicator + XP total.
 *
 * Curriculum: Auto-didactic (self-assessment, tracking growth)
 *             Community of Practice (legitimate peripheral participation)
 */

export interface Skill {
  id: string
  name: string
  progress: number
}

export interface SkillSet {
  id: string
  name: string
  skills: Skill[]
}

export interface SkillMatrixProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  level?: { label: string; stage: "beginner" | "intermediate" | "advanced" }
  totalXP?: number
  skillSets: SkillSet[]
  onSkillClick?: (skillSetId: string, skillId: string) => void
}

const SkillMatrix = React.forwardRef<HTMLDivElement, SkillMatrixProps>(
  ({ title, level, totalXP, skillSets, onSkillClick, className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-6", className)} {...props}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-6">
        {/* Matrix grid */}
        <div className="space-y-4">
          {skillSets.map((set) => (
            <div key={set.id}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{set.name}</h3>
              <div className="flex flex-wrap gap-2">
                {set.skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onSkillClick?.(set.id, skill.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      skill.progress > 0
                        ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {skill.progress > 0 ? `${skill.progress}%` : "0%"}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {level && (
            <div className="rounded-lg border bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {title} level
              </h4>
              <p className="text-lg font-bold capitalize mb-3">{level.label}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {(["beginner", "intermediate", "advanced"] as const).map((stage) => (
                  <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      stage === level.stage ? "bg-foreground" : "bg-muted"
                    )} />
                    <span className="capitalize">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalXP !== undefined && (
            <div className="rounded-lg border bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {title} XP
              </h4>
              <p className="text-2xl font-bold">{totalXP} XP</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
)
SkillMatrix.displayName = "SkillMatrix"

export { SkillMatrix }

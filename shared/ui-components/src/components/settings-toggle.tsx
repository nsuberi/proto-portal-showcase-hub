import * as React from "react"
import { cn } from "../lib/utils"

/**
 * Settings toggle — Codecademy "Tools" panel pattern.
 * Label + optional description + toggle switch.
 *
 * Curriculum: Architecture (configuration, infrastructure),
 *             Building (debugging tools, instrumentation)
 */

export interface SettingsToggleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label: string
  description?: string
  badge?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

const SettingsToggle = React.forwardRef<HTMLDivElement, SettingsToggleProps>(
  ({ label, description, badge, checked, onChange, disabled, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-4 py-3",
        disabled && "opacity-50",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {badge && (
            <span className="text-[0.625rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked
            ? "bg-[hsl(var(--warning,48_100%_52%))]"
            : "bg-muted",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  )
)
SettingsToggle.displayName = "SettingsToggle"

export { SettingsToggle }

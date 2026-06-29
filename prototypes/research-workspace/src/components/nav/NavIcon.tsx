import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface NavIconProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isExpanded?: boolean;
  badge?: number;
  pulse?: boolean;
  circled?: boolean;
  onClick: () => void;
}

export default function NavIcon({
  icon: Icon,
  label,
  isActive,
  isExpanded = false,
  badge = 0,
  pulse = false,
  circled = false,
  onClick,
}: NavIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => !isExpanded && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative flex items-center ${
          isExpanded ? "justify-start gap-2.5 w-full px-3" : "justify-center w-[44px]"
        } h-[44px] rounded-lg transition-colors ${
          isActive
            ? "bg-primary/12 text-primary"
            : "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/[0.06]"
        }`}
        title={isExpanded ? undefined : label}
      >
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
        )}

        {/* Fixed icon slot so circled + plain icons share one leading box →
            labels and icon centers always line up. */}
        <span className="flex items-center justify-center w-8 h-8 flex-shrink-0">
          {circled ? (
            <span className="flex items-center justify-center w-[26px] h-[26px] rounded-full bg-primary text-on-primary">
              <Icon className="w-[17px] h-[17px]" strokeWidth={2.75} />
            </span>
          ) : (
            <Icon className="w-[24px] h-[24px]" />
          )}
        </span>

        {/* Inline label when expanded */}
        {isExpanded && (
          <span className="font-label text-base font-medium truncate">
            {label}
          </span>
        )}

        {/* Badge */}
        {(badge > 0 || pulse) && (
          <span
            className={`absolute top-1 ${isExpanded ? "left-8" : "right-1"} rounded-full flex items-center justify-center font-label font-bold ${
              pulse
                ? "w-2 h-2 bg-primary animate-ambient-pulse"
                : "min-w-[14px] h-[14px] text-[8px] bg-primary/20 text-primary px-0.5"
            }`}
          >
            {badge > 0 ? (badge > 99 ? "99+" : badge) : ""}
          </span>
        )}
      </button>

      {/* Tooltip — only when collapsed */}
      {showTooltip && !isExpanded && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <span className="whitespace-nowrap font-label text-xs bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded-md shadow-md">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

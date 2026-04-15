import type { LucideIcon } from "lucide-react";

interface SidebarIconProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  badge?: number;
  pulse?: boolean;
  onClick: () => void;
}

export default function SidebarIcon({
  icon: Icon,
  label,
  isActive,
  badge = 0,
  pulse = false,
  onClick,
}: SidebarIconProps) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-rail-icon group relative flex items-center justify-center w-[48px] h-[48px] transition-colors ${
        isActive ? "text-primary" : "text-white/40 hover:text-white/60"
      }`}
      title={label}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-sm bg-primary" />
      )}

      <Icon className="w-[18px] h-[18px]" />

      {/* Badge */}
      {(badge > 0 || pulse) && (
        <span
          className={`absolute top-1.5 right-1.5 rounded-full flex items-center justify-center font-label font-bold ${
            pulse
              ? "w-2 h-2 bg-primary animate-ambient-pulse"
              : "min-w-[14px] h-[14px] text-[8px] bg-white/20 text-white/70 px-0.5"
          }`}
        >
          {badge > 0 ? (badge > 99 ? "99+" : badge) : ""}
        </span>
      )}
    </button>
  );
}

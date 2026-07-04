import type { LucideIcon } from "lucide-react";

interface IconActionButtonProps {
  icon: LucideIcon;
  /** Accessible label and tooltip text. */
  label: string;
  onClick: () => void;
}

/**
 * Icon-only action button. On hover it shows a subtle gray backdrop and drops
 * down a dark tooltip with light text naming the action. Used for the
 * top-bar "Back to Gallery" / "Logout" controls.
 */
export default function IconActionButton({
  icon: Icon,
  label,
  onClick,
}: IconActionButtonProps) {
  return (
    <div className="relative group shrink-0">
      <button
        onClick={onClick}
        aria-label={label}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
      >
        <Icon className="w-5 h-5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-md bg-inverse-surface text-inverse-on-surface font-label text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50"
      >
        {label}
      </span>
    </div>
  );
}

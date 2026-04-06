import { cn } from "@/lib/utils";

interface ToolkitItemProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
  onClick?: () => void;
}

export function ToolkitItem({
  title,
  description,
  icon,
  className,
  onClick,
}: ToolkitItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border-warm bg-shelter-white px-5 py-4",
        "cursor-pointer transition-colors duration-200 hover:border-instrument-blue",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Icon */}
      <span className="shrink-0 text-[18px] text-instrument-blue">{icon}</span>

      {/* Text */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-dark-text">
          {title}
        </span>
        <span className="text-[11px] text-dust">{description}</span>
      </div>
    </div>
  );
}

ToolkitItem.displayName = "ToolkitItem";

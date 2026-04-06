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
        "flex items-center gap-3 rounded-xl bg-surface-container-low px-5 py-4",
        "cursor-pointer transition-colors duration-200 hover:bg-surface-container",
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
      <span className="shrink-0 text-[18px] text-primary">{icon}</span>

      {/* Text */}
      <div className="flex flex-col gap-0.5">
        <span className="font-headline text-[13px] font-semibold text-on-surface">
          {title}
        </span>
        <span className="font-body text-[11px] text-on-surface-variant">{description}</span>
      </div>
    </div>
  );
}

ToolkitItem.displayName = "ToolkitItem";

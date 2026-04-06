import { tokens } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface ShowcaseGalleryItemProps {
  title: string;
  author: string;
  tags: string[];
  reactions: string;
  className?: string;
  onClick?: () => void;
}

export function ShowcaseGalleryItem({
  title,
  author,
  tags,
  reactions,
  className,
  onClick,
}: ShowcaseGalleryItemProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border-warm bg-shelter-white",
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
      {/* Preview area */}
      <div
        className="flex h-[100px] items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${tokens.color.deepSpace}, ${tokens.color.orbitalBlue})`,
        }}
      >
        <span className="text-[12px] tracking-wide text-shelter-white/70">
          ▶ artifact preview
        </span>
      </div>

      {/* Details */}
      <div className="p-3">
        <h4 className="mb-1 text-[13px] font-semibold text-dark-text">
          {title}
        </h4>
        <p className="mb-2 text-[11px] text-dust">{author}</p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-regolith px-2 py-0.5 font-mono text-[9px] text-dust"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Reactions */}
        <p className="text-[11px] text-dust">{reactions}</p>
      </div>
    </div>
  );
}

ShowcaseGalleryItem.displayName = "ShowcaseGalleryItem";

import { cn } from "@/lib/utils";

interface ShowcaseGalleryItemProps {
  title: string;
  author: string;
  tags: string[];
  reactions: string;
  /** URL to a self-contained HTML artifact for the live preview thumbnail */
  artifactUrl?: string;
  className?: string;
  onClick?: () => void;
}

export function ShowcaseGalleryItem({
  title,
  author,
  tags,
  reactions,
  artifactUrl,
  className,
  onClick,
}: ShowcaseGalleryItemProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-surface-container-low",
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
      {/* Preview area */}
      {artifactUrl ? (
        <div className="relative h-[140px] overflow-hidden bg-surface-container-lowest">
          <iframe
            src={artifactUrl}
            title={`${title} preview`}
            className="pointer-events-none absolute left-0 top-0 h-[560px] w-[400%] origin-top-left scale-[0.25] border-0"
            sandbox="allow-scripts"
            tabIndex={-1}
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 hover:bg-black/30">
            <span className="material-symbols-outlined text-xl text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              open_in_full
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-[140px] items-center justify-center bg-gradient-to-br from-surface-container-lowest to-primary-container">
          <span className="font-label text-[12px] tracking-wide text-on-surface/40">
            <span className="material-symbols-outlined mr-1 align-middle text-sm">
              play_circle
            </span>
            artifact preview
          </span>
        </div>
      )}

      {/* Details */}
      <div className="p-3">
        <h4 className="mb-1 font-headline text-[13px] font-semibold text-on-surface">
          {title}
        </h4>
        <p className="mb-2 font-body text-[11px] italic text-on-surface-variant">
          {author}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-container-highest px-2 py-0.5 font-label text-[9px] uppercase tracking-wider text-on-surface-variant"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Reactions */}
        <p className="font-label text-[11px] text-on-primary-container">
          {reactions}
        </p>
      </div>
    </div>
  );
}

ShowcaseGalleryItem.displayName = "ShowcaseGalleryItem";

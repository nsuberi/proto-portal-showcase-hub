import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Prototype } from "./PortfolioPrototypeCard";

interface PortfolioGalleryProps {
  prototypes: ReadonlyArray<Prototype>;
  /** Glassy, dark-on-video styling for use overlaid on the hero video. */
  overlay?: boolean;
}

/**
 * Horizontally scrollable gallery of featured projects. Each tile shows a still
 * frame of the project; hovering lifts it with a warm sunset glow to signal it's
 * clickable and will open the project. Drag/scroll, or nudge with the arrows
 * (which only appear when the tiles overflow the visible width).
 */
export function PortfolioGallery({ prototypes, overlay = false }: PortfolioGalleryProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Arrows only appear when the tiles actually overflow the visible width.
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => setHasOverflow(track.scrollWidth > track.clientWidth + 1);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [prototypes]);

  const scrollByTiles = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // Scroll by roughly one tile + gap so each nudge advances one card.
    const firstTile = track.querySelector<HTMLElement>("[data-tile]");
    const amount = firstTile ? firstTile.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  const arrowBase =
    "absolute top-1/2 z-20 -translate-y-1/2 hidden sm:flex h-11 w-11 items-center justify-center rounded-full transition-smooth";
  const arrowSkin = overlay
    ? "bg-background/40 backdrop-blur-md border border-white/30 text-white hover:bg-background/70"
    : "bg-background/80 backdrop-blur-sm border border-border shadow-elegant hover:bg-primary hover:text-primary-foreground";

  return (
    <div className="relative">
      {/* Arrow controls — only when the tiles overflow the visible width */}
      {hasOverflow && (
        <>
          <button
            type="button"
            aria-label="Scroll gallery left"
            onClick={() => scrollByTiles(-1)}
            className={`${arrowBase} ${arrowSkin} left-0 -translate-x-1/2`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Scroll gallery right"
            onClick={() => scrollByTiles(1)}
            className={`${arrowBase} ${arrowSkin} right-0 translate-x-1/2`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-2 px-2 [scrollbar-width:thin]"
      >
        {prototypes.map((p) => {
          const isLive = p.status === "Live Demo Available";
          const Tile = isLive ? "a" : "div";

          return (
            <Tile
              key={p.title}
              data-tile
              {...(isLive ? { href: p.link } : {})}
              className={`featured-card group relative shrink-0 snap-start overflow-hidden rounded-2xl border shadow-elegant w-[82vw] sm:w-[360px] lg:w-[400px] aspect-[4/3] ${
                isLive ? "cursor-pointer" : "opacity-80"
              }`}
            >
              {/* Still-frame preview — blurred at rest (details obscured),
                  sharpens into the high-res frame on hover. */}
              {p.preview ? (
                <img
                  src={p.preview}
                  alt={`${p.title} preview`}
                  className="absolute inset-0 h-full w-full object-cover object-top scale-110 blur-md transition-all duration-500 ease-out group-hover:scale-105 group-hover:blur-0"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              )}

              {/* Legibility gradient + title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                {!isLive && (
                  <span className="mb-2 inline-block px-2 py-1 text-xs bg-white/15 text-white rounded-full font-medium">
                    Concept
                  </span>
                )}
                <h3 className="text-white text-lg sm:text-xl font-semibold leading-snug drop-shadow">
                  {p.title}
                </h3>
                {isLive && (
                  <span className="mt-1 block text-sm font-medium text-[hsl(var(--sunset))] opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    View project →
                  </span>
                )}
              </div>
            </Tile>
          );
        })}
      </div>
    </div>
  );
}

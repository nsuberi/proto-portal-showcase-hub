import { useEffect, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { type Prototype } from "./PortfolioPrototypeCard";
import { PortfolioGallery } from "./PortfolioGallery";

const DISPLAY_FONT =
  "Futura, 'Futura PT', 'Helvetica Neue', Helvetica, Arial, sans-serif";

interface FeaturedProjectsDrawerProps {
  prototypes: ReadonlyArray<Prototype>;
}

/**
 * A yellow "loadout" call-to-action. Pressing it slides an equipment-drawer up
 * from the bottom (game-inventory style), blurs the rest of the page, and puts
 * the featured projects front and center. Close via the X, the backdrop, or Esc.
 */
export function FeaturedProjectsDrawer({ prototypes }: FeaturedProjectsDrawerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Lock background scroll while the drawer owns the screen.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      {/* Yellow call-to-action */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group inline-flex items-center gap-3 rounded-xl bg-[hsl(var(--sunset))] px-6 py-4 text-black font-bold uppercase tracking-wide text-base sm:text-lg shadow-lg ring-1 ring-black/10 hover:brightness-105 active:scale-[0.98] transition-all"
        style={{ fontFamily: DISPLAY_FONT }}
      >
        <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
        Featured Projects
        <span className="ml-1 grid h-6 min-w-6 place-items-center rounded-full bg-black/15 px-1.5 text-sm">
          {prototypes.length}
        </span>
      </button>

      {/* Drawer overlay (always mounted so it can animate both ways) */}
      <div
        className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* Backdrop — blurs and dims the rest of the screen */}
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Equipment drawer — slides up from the bottom */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Featured projects"
          className={`absolute inset-x-0 bottom-0 max-h-[82vh] rounded-t-3xl border-t-4 border-[hsl(var(--sunset))] bg-black/90 backdrop-blur-xl text-white shadow-2xl transition-transform duration-500 ease-out ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ boxShadow: "0 -12px 60px hsl(var(--sunset) / 0.25)" }}
        >
          {/* Grab handle */}
          <div className="flex justify-center pt-3">
            <span className="h-1.5 w-12 rounded-full bg-[hsl(var(--sunset))]/70" />
          </div>

          <div className="flex items-center justify-between px-6 sm:px-10 pt-4 pb-5">
            <h2
              className="text-2xl sm:text-3xl font-bold uppercase tracking-tight"
              style={{ fontFamily: DISPLAY_FONT }}
            >
              Featured Projects
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close drawer"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/5 text-white hover:bg-white/15 transition-smooth"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 sm:px-10 pb-8 sm:pb-12 overflow-y-auto">
            <PortfolioGallery prototypes={prototypes} overlay />
          </div>
        </div>
      </div>
    </>
  );
}

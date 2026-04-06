import type { RoomStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface LiveRoomCardProps {
  theme: string;
  time: string;
  attendees: number;
  status?: RoomStatus;
  className?: string;
}

export function LiveRoomCard({
  theme,
  time,
  attendees,
  status = "upcoming",
  className,
}: LiveRoomCardProps) {
  const isLive = status === "live";

  return (
    <div
      className={cn(
        "rounded-xl bg-surface-container-low px-5 py-4",
        isLive && "ring-1 ring-secondary/30",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left side: theme + meta */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-secondary animate-live-pulse" />
            )}
            <span className="font-headline text-[13px] font-semibold text-on-surface">
              {theme}
            </span>
          </div>
          <span className="font-label text-[11px] text-on-primary-container">
            {time} · {attendees} attendee{attendees !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Right side: action button */}
        {isLive ? (
          <button
            className="rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-4 py-2 font-label text-[11px] font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95"
            type="button"
          >
            Join now
          </button>
        ) : (
          <button
            className="rounded-lg bg-transparent px-4 py-2 font-label text-[11px] font-semibold text-on-primary-container ring-1 ring-outline-variant/20 transition-colors hover:text-primary hover:ring-primary/30"
            type="button"
          >
            RSVP
          </button>
        )}
      </div>
    </div>
  );
}

LiveRoomCard.displayName = "LiveRoomCard";

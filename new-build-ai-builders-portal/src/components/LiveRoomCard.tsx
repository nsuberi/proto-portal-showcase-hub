import { tokens } from "@/design-system/tokens";
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
        "rounded-lg border bg-shelter-white px-4 py-3",
        !isLive && "border-border-warm",
        className,
      )}
      style={
        isLive
          ? { borderWidth: "1px", borderColor: `${tokens.color.signalOrange}60` }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        {/* Left side: theme + meta */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {isLive && (
              <span
                className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-signal-orange animate-live-pulse"
              />
            )}
            <span className="text-[13px] font-semibold text-dark-text">
              {theme}
            </span>
          </div>
          <span className="text-[11px] text-dust">
            {time} · {attendees} attendee{attendees !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Right side: action button */}
        {isLive ? (
          <button
            className="rounded-md bg-signal-orange px-3 py-1.5 text-[11px] font-semibold text-shelter-white transition-opacity hover:opacity-90"
            type="button"
          >
            Join now
          </button>
        ) : (
          <button
            className="rounded-md border border-border-warm bg-transparent px-3 py-1.5 text-[11px] font-semibold text-dust transition-colors hover:border-instrument-blue hover:text-instrument-blue"
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

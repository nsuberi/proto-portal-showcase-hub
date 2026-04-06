import { useState } from "react";
import type { RoomStatus } from "@/design-system/tokens";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  theme: string;
  time: string;
  date: string;
  attendees: number;
  status: RoomStatus;
  agenda?: string[];
}

const mockRooms: Room[] = [
  {
    id: "1",
    theme: "Presenting discovery work to leadership",
    time: "Live now",
    date: "Today",
    attendees: 6,
    status: "live",
    agenda: [
      "Jordan presents document triage pilot results",
      "Priya shares rate lock dashboard iteration 3",
      "Open Q&A with leadership panel",
    ],
  },
  {
    id: "2",
    theme: "Technical architecture review",
    time: "2:00 PM EST",
    date: "Apr 6",
    attendees: 4,
    status: "upcoming",
    agenda: [
      "Pipeline vs monolith trade-offs",
      "Review Marcus's compliance checker architecture",
      "Debugging common proxy issues",
    ],
  },
  {
    id: "3",
    theme: "Demo day: Cohort 3 final presentations",
    time: "10:00 AM EST",
    date: "Apr 12",
    attendees: 18,
    status: "upcoming",
    agenda: [
      "6 cohort members present final prototypes",
      "Peer feedback rounds",
      "Community voting for showcase features",
    ],
  },
  {
    id: "4",
    theme: "Debugging session: Proxy and auth flows",
    time: "11:00 AM EST",
    date: "Apr 14",
    attendees: 7,
    status: "upcoming",
    agenda: [
      "Walk through common proxy configuration errors",
      "Live debugging of auth token refresh",
      "Open help desk — bring your blockers",
    ],
  },
];

export default function CommunityPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 font-headline text-xl font-bold text-on-surface">Community</h1>
        <p className="font-body text-sm text-on-surface-variant">
          Basecamp sessions — where you return after exploring, share what you
          found, and plan the next expedition.
        </p>
      </div>

      {/* Star chart timeline */}
      <div className="mb-8 rounded-xl bg-surface-container-low px-4 py-8 sm:px-6 overflow-x-auto">
        <h2 className="mb-6 font-headline text-sm font-semibold uppercase tracking-wider text-on-primary-container flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-tertiary">radar</span>
          Upcoming Sessions
        </h2>

        {/* Horizontal timeline */}
        <div className="relative min-w-[600px]">
          {/* Connecting line */}
          <div className="absolute top-[20px] left-6 right-6 h-[1.5px] bg-outline-variant/20" />

          {/* Stars row */}
          <div className="relative flex justify-between px-2">
            {mockRooms.map((room) => {
              const isLive = room.status === "live";
              const isExpanded = expandedId === room.id;

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : room.id)}
                  className="group relative flex flex-col items-center gap-2 border-0 bg-transparent cursor-pointer px-1"
                  style={{ flex: "1 1 0" }}
                >
                  {/* Star point */}
                  <div className="relative flex h-10 w-10 items-center justify-center">
                    {/* Pulse ring — live only */}
                    {isLive && (
                      <div className="absolute h-10 w-10 rounded-full border border-secondary/30 animate-pulse" />
                    )}
                    {/* Hover ring */}
                    <div
                      className={cn(
                        "absolute h-8 w-8 rounded-full border transition-transform duration-500",
                        isLive
                          ? "border-secondary/40 group-hover:scale-150"
                          : "border-primary/30 group-hover:scale-150",
                        isExpanded && "scale-150",
                      )}
                    />
                    {/* Star core */}
                    <div
                      className={cn(
                        "relative z-10 rounded-full transition-colors",
                        isLive
                          ? "h-4 w-4 bg-secondary shadow-[0_0_15px_rgba(255,180,165,0.6)]"
                          : "h-3 w-3 bg-primary group-hover:bg-tertiary",
                      )}
                    />
                  </div>

                  {/* Date — large and obvious */}
                  <span
                    className={cn(
                      "font-headline text-base font-bold tracking-tight transition-colors",
                      isLive
                        ? "text-secondary"
                        : isExpanded
                          ? "text-tertiary"
                          : "text-on-surface group-hover:text-tertiary",
                    )}
                  >
                    {room.date}
                  </span>

                  {/* Time */}
                  <span className="font-label text-[10px] uppercase tracking-widest text-on-primary-container">
                    {room.time}
                  </span>

                  {/* Title — always visible */}
                  <span
                    className={cn(
                      "max-w-[140px] text-center font-headline text-[12px] font-semibold leading-tight transition-colors",
                      isLive
                        ? "text-on-surface"
                        : "text-on-surface-variant group-hover:text-on-surface",
                    )}
                  >
                    {room.theme}
                  </span>

                  {/* Attendee count */}
                  <span className="flex items-center gap-1 font-label text-[10px] text-on-primary-container">
                    <span className="material-symbols-outlined text-[12px]">group</span>
                    {room.attendees}
                  </span>

                  {/* Expand hint */}
                  <span
                    className={cn(
                      "material-symbols-outlined text-[14px] transition-all duration-200",
                      isExpanded
                        ? "text-tertiary rotate-180"
                        : "text-on-primary-container opacity-0 group-hover:opacity-100",
                    )}
                  >
                    expand_more
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded agenda panel */}
        {expandedId !== null && (() => {
          const room = mockRooms.find((r) => r.id === expandedId);
          if (!room) return null;
          const isLive = room.status === "live";

          return (
            <div className="mt-6 rounded-xl bg-surface-container-lowest p-5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 h-3 w-3 shrink-0 rounded-full",
                      isLive
                        ? "bg-secondary shadow-[0_0_10px_rgba(255,180,165,0.5)]"
                        : "bg-primary",
                    )}
                  />
                  <div>
                    <p className="font-headline text-base font-bold text-on-surface">
                      {room.theme}
                    </p>
                    <p className="mt-1 font-label text-[11px] text-on-primary-container">
                      {room.date} · {room.time} · {room.attendees} attendee{room.attendees !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {isLive ? (
                  <button
                    className="shrink-0 rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-4 py-2 font-label text-[11px] font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95"
                    type="button"
                  >
                    Join now
                  </button>
                ) : (
                  <button
                    className="shrink-0 rounded-lg bg-transparent px-4 py-2 font-label text-[11px] font-semibold text-on-primary-container ring-1 ring-outline-variant/20 transition-colors hover:text-primary hover:ring-primary/30"
                    type="button"
                  >
                    RSVP
                  </button>
                )}
              </div>

              {/* Agenda items */}
              {room.agenda && room.agenda.length > 0 && (
                <div>
                  <p className="mb-2 font-label text-[10px] font-semibold uppercase tracking-widest text-on-primary-container">
                    Agenda
                  </p>
                  <ul className="flex flex-col gap-2">
                    {room.agenda.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface-variant">
                        <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="astro-glass rounded-xl p-6 text-center">
        <p className="font-headline text-sm font-semibold text-on-surface mb-1">
          More community features coming soon
        </p>
        <p className="font-body text-xs text-on-surface-variant">
          Threaded feedback on presentations, cohort views, and async
          presentation reviews.
        </p>
      </div>
    </div>
  );
}

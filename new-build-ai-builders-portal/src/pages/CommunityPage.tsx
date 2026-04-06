import { LiveRoomCard } from "@/components/LiveRoomCard";
import type { RoomStatus } from "@/design-system/tokens";

const mockRooms: Array<{
  id: string;
  theme: string;
  time: string;
  attendees: number;
  status: RoomStatus;
}> = [
  {
    id: "1",
    theme: "Presenting discovery work to leadership",
    time: "Live now",
    attendees: 6,
    status: "live",
  },
  {
    id: "2",
    theme: "Technical architecture review",
    time: "Tomorrow, 2:00 PM EST",
    attendees: 4,
    status: "upcoming",
  },
  {
    id: "3",
    theme: "Demo day: Cohort 3 final presentations",
    time: "Apr 12, 10:00 AM EST",
    attendees: 18,
    status: "upcoming",
  },
  {
    id: "4",
    theme: "Debugging session: Proxy and auth flows",
    time: "Apr 14, 11:00 AM EST",
    attendees: 7,
    status: "upcoming",
  },
];

export default function CommunityPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-deep-space mb-1">Community</h1>
        <p className="text-sm text-dust">
          Basecamp sessions — where you return after exploring, share what you
          found, and plan the next expedition.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-deep-space uppercase tracking-wider mb-4">
          Live Rooms
        </h2>
        <div className="flex flex-col gap-3">
          {mockRooms.map((room) => (
            <LiveRoomCard
              key={room.id}
              theme={room.theme}
              time={room.time}
              attendees={room.attendees}
              status={room.status}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border-thin border-border-warm bg-shelter-white p-6 text-center">
        <p className="text-sm font-semibold text-deep-space mb-1">
          More community features coming soon
        </p>
        <p className="text-xs text-dust">
          Threaded feedback on presentations, cohort views, and async
          presentation reviews.
        </p>
      </div>
    </div>
  );
}

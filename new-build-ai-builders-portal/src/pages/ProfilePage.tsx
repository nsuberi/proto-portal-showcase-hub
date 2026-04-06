import { useState } from "react";
import { ProfileCard } from "@/components/ProfileCard";
import { JourneyMap } from "@/components/JourneyMap";
import { GoalEvolution } from "@/components/GoalEvolution";
import { DevlogEntry } from "@/components/DevlogEntry";
import {
  mockUser,
  mockGoals,
  mockJourneyPhases,
  mockDevlogs,
} from "@/data/user";

export default function ProfilePage() {
  const [copyLabel, setCopyLabel] = useState("Copy portfolio link");

  function handleCopyLink() {
    const url = `${window.location.origin}/ai-builders/portfolio/${mockUser.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy portfolio link"), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Profile card */}
      <ProfileCard
        name={mockUser.name}
        role={mockUser.role}
        phase={mockUser.phase}
        stats={mockUser.stats}
      />

      {/* Share portfolio */}
      <div className="rounded-lg border border-border-warm bg-shelter-white px-5 py-4">
        <h4 className="text-sm font-semibold text-deep-space">
          Share your work
        </h4>
        <p className="text-xs text-dust mt-1">
          Copy a link to share your portfolio with managers and colleagues.
        </p>
        <button
          type="button"
          className="mt-3 bg-instrument-blue text-white rounded-md text-xs px-3 py-1.5"
          onClick={handleCopyLink}
        >
          {copyLabel}
        </button>
      </div>

      {/* Journey map */}
      <div>
        <h2 className="text-lg font-semibold text-deep-space mb-4">
          Your journey
        </h2>
        <JourneyMap phases={mockJourneyPhases} />
      </div>

      {/* Goal evolution */}
      <div>
        <h2 className="text-lg font-semibold text-deep-space">
          Goal evolution
        </h2>
        <p className="text-xs text-dust mb-4">
          How your goals have developed over time — evidence of growing
          judgment.
        </p>
        <GoalEvolution goals={mockGoals} />
      </div>

      {/* Devlog history */}
      <div>
        <h2 className="text-lg font-semibold text-deep-space">
          Devlog history
        </h2>
        <p className="text-xs text-dust mb-4">
          Your structured reflections from challenges and projects.
        </p>
        <div className="flex flex-col gap-4">
          {mockDevlogs.map((devlog) => (
            <DevlogEntry
              key={devlog.id}
              title={devlog.title}
              date={devlog.date}
              author={devlog.author}
              sections={devlog.sections}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
    <div>
      {/* Two-column HUD dashboard on desktop */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column: personal overview */}
        <div className="flex flex-col gap-8">
          {/* Profile card */}
          <ProfileCard
            name={mockUser.name}
            role={mockUser.role}
            phase={mockUser.phase}
            stats={mockUser.stats}
          />

          {/* Share portfolio */}
          <div className="astro-glass rounded-xl px-5 py-4">
            <h4 className="font-headline text-sm font-semibold text-on-surface">
              Share your work
            </h4>
            <p className="mt-1 font-body text-xs text-on-surface-variant">
              Copy a link to share your portfolio with managers and colleagues.
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-4 py-1.5 font-label text-xs font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95"
              onClick={handleCopyLink}
            >
              {copyLabel}
            </button>
          </div>

          {/* Journey map */}
          <div>
            <h2 className="mb-4 font-headline text-lg font-semibold text-on-surface">
              Your journey
            </h2>
            <JourneyMap phases={mockJourneyPhases} />
          </div>
        </div>

        {/* Right column: timeline & devlogs */}
        <div className="flex flex-col gap-8">
          {/* Goal evolution */}
          <div>
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Goal evolution
            </h2>
            <p className="mb-4 font-body text-xs italic text-on-surface-variant">
              How your goals have developed over time — evidence of growing
              judgment.
            </p>
            <GoalEvolution goals={mockGoals} />
          </div>

          {/* Devlog history */}
          <div>
            <h2 className="font-headline text-lg font-semibold text-on-surface">
              Devlog history
            </h2>
            <p className="mb-4 font-body text-xs italic text-on-surface-variant">
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
      </div>
    </div>
  );
}

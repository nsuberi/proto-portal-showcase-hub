import { useParams, Link } from "react-router-dom";
import { tokens, phaseConfig } from "@/design-system/tokens";
import { ArtifactRenderer } from "@/components/ArtifactRenderer";
import { VideoViewer } from "@/components/VideoViewer";
import { DevlogEntry } from "@/components/DevlogEntry";
import { mockUser, mockDevlogs } from "@/data/user";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PortfolioPage() {
  const { userId } = useParams();
  void userId; // MVP: always renders mockUser regardless of userId

  const user = mockUser;
  const phaseData = phaseConfig[user.phase];
  const workItems = mockDevlogs.slice(0, 2);

  return (
    <div className="min-h-screen bg-regolith">
      {/* Minimal header bar */}
      <header className="bg-deep-space py-3 px-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-shelter-white tracking-wide">
          AI Builders Portal
        </span>
        <Link
          to="/"
          className="text-xs text-dust hover:text-shelter-white transition-colors"
        >
          Learn more &rarr;
        </Link>
      </header>

      {/* Portfolio header / banner */}
      <div
        className="py-12 px-6"
        style={{
          background: `linear-gradient(135deg, ${tokens.color.deepSpace}, ${tokens.color.orbitalBlue})`,
        }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-semibold text-shelter-white"
              style={{ backgroundColor: tokens.color.instrumentBlue + "4D" }}
            >
              {getInitials(user.name)}
            </div>

            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-shelter-white">
                {user.name}
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: tokens.color.shelterWhite + "99" }}
              >
                {user.role}
              </p>
            </div>

            {/* Phase badge */}
            <span
              className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: phaseData.bg,
                color: phaseData.accent,
              }}
            >
              Phase {user.phase}
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-thin border-border-warm bg-shelter-white">
        <div className="mx-auto max-w-3xl grid grid-cols-4 divide-x divide-border-warm">
          {user.stats.map((stat, i) => (
            <div key={i} className="px-3 py-4 text-center">
              <p className="text-xl font-semibold text-deep-space">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-dust">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Completed work section */}
      <div className="bg-regolith py-10 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-lg font-semibold text-deep-space mb-6">
            Completed work
          </h2>

          <div className="space-y-6">
            {workItems.map((devlog) => (
              <div
                key={devlog.id}
                className="rounded-lg border border-border-warm bg-shelter-white overflow-hidden"
              >
                {/* Artifact renderer for the first devlog (has code-like content) */}
                {devlog.id === "devlog-1" && (
                  <ArtifactRenderer
                    title="classifier/pipeline.py"
                    code={`# Document triage pipeline — iteration 2\nfrom pipeline import extract, classify, redact\n\ndef process(doc):\n    extracted = extract(doc)\n    classified = classify(extracted)\n    return redact(classified)`}
                    status="running"
                    className="rounded-none border-0"
                  />
                )}

                {/* Video viewer for the second devlog */}
                {devlog.id === "devlog-2" && (
                  <VideoViewer
                    loomUrl="https://www.loom.com/share/b6eb7fadcd124848ac8dfe4118788697"
                    caption="First successful deployment walkthrough"
                    className="rounded-none border-0"
                  />
                )}

                {/* Devlog entry */}
                <div className="p-0">
                  <DevlogEntry
                    title={devlog.title}
                    date={devlog.date}
                    author={devlog.author}
                    sections={devlog.sections}
                    className="border-0 rounded-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 text-center">
        <p className="text-xs text-dust">
          Built with{" "}
          <Link
            to="/"
            className="underline hover:text-deep-space transition-colors"
          >
            AI Builders Portal
          </Link>
        </p>
      </footer>
    </div>
  );
}

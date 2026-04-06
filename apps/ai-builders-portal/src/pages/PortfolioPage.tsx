import { useParams, Link } from "react-router-dom";
import { phaseConfig, GALAXY_BG_URL } from "@/design-system/tokens";
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
  void userId;

  const user = mockUser;
  const phaseData = phaseConfig[user.phase];
  const workItems = mockDevlogs.slice(0, 2);

  return (
    <div className="relative min-h-screen bg-surface">
      {/* Galaxy background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-surface to-surface-container-lowest" />
        <img
          src={GALAXY_BG_URL}
          alt=""
          className="h-full w-full object-cover opacity-30 mix-blend-screen"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Frosted header bar */}
        <header className="flex items-center justify-between bg-surface/70 px-6 py-3 backdrop-blur-xl">
          <span className="font-headline text-sm font-semibold tracking-wide text-on-surface">
            AI Builders Portal
          </span>
          <Link
            to="/"
            className="font-label text-xs text-on-primary-container transition-colors hover:text-primary"
          >
            Learn more &rarr;
          </Link>
        </header>

        {/* Portfolio header / banner */}
        <div className="bg-gradient-to-br from-primary-container to-surface-container-lowest px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/20 font-headline text-base font-semibold text-primary">
                {getInitials(user.name)}
              </div>

              {/* Name + role */}
              <div className="min-w-0 flex-1">
                <h1 className="font-headline text-2xl font-bold text-on-surface">
                  {user.name}
                </h1>
                <p className="mt-1 font-body text-sm italic text-on-surface-variant">
                  {user.role}
                </p>
              </div>

              {/* Phase badge */}
              <span
                className="shrink-0 rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-wider"
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

        {/* Stats bar — whitespace separation, no dividers */}
        <div className="bg-surface-container">
          <div className="mx-auto grid max-w-3xl grid-cols-4 gap-4 px-3 py-4">
            {user.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-headline text-xl font-semibold text-primary">
                  {stat.value}
                </p>
                <p className="mt-0.5 font-label text-[10px] uppercase tracking-wider text-on-primary-container">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Completed work section */}
        <div className="px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 font-headline text-lg font-semibold text-on-surface">
              Completed work
            </h2>

            <div className="flex flex-col gap-6">
              {workItems.map((devlog) => (
                <div
                  key={devlog.id}
                  className="overflow-hidden rounded-xl bg-surface-container-low"
                >
                  {devlog.id === "devlog-1" && (
                    <ArtifactRenderer
                      title="classifier/pipeline.py"
                      code={`# Document triage pipeline — iteration 2\nfrom pipeline import extract, classify, redact\n\ndef process(doc):\n    extracted = extract(doc)\n    classified = classify(extracted)\n    return redact(classified)`}
                      status="running"
                      className="rounded-none"
                    />
                  )}

                  {devlog.id === "devlog-2" && (
                    <VideoViewer
                      loomUrl="https://www.loom.com/share/b6eb7fadcd124848ac8dfe4118788697"
                      caption="First successful deployment walkthrough"
                      className="rounded-none"
                    />
                  )}

                  <div className="p-0">
                    <DevlogEntry
                      title={devlog.title}
                      date={devlog.date}
                      author={devlog.author}
                      sections={devlog.sections}
                      className="rounded-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 text-center">
          <p className="font-label text-xs text-on-primary-container">
            Built with{" "}
            <Link
              to="/"
              className="underline transition-colors hover:text-primary"
            >
              AI Builders Portal
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getChallengeById } from "@/data/challenges";
import { phaseConfig, statusConfig } from "@/design-system/tokens";
import { ReferencePanel } from "@/components/ReferencePanel";
import { ArtifactRenderer } from "@/components/ArtifactRenderer";
import { VideoViewer } from "@/components/VideoViewer";

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const challenge = id ? getChallengeById(id) : undefined;

  const [artifactUrl, setArtifactUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  if (!challenge) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="mb-4 font-body text-sm text-on-surface-variant">Challenge not found.</p>
        <Link
          to="/challenges"
          className="font-label text-sm text-primary hover:text-tertiary transition-colors"
        >
          &larr; Back to challenges
        </Link>
      </div>
    );
  }

  const phase = phaseConfig[challenge.phase];
  const status = statusConfig[challenge.status];

  const showArtifactPreview =
    artifactUrl.trim().length > 0 &&
    /\.(py|ts|tsx|js|jsx|json|yaml|yml|html|css)(\?|$|#)/i.test(artifactUrl);

  const showVideoPreview =
    videoUrl.trim().length > 0 && /loom\.com\/(share|embed)\//i.test(videoUrl);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    alert(
      `Submission recorded (mock).\nArtifact: ${artifactUrl || "(none)"}\nVideo: ${videoUrl || "(none)"}`,
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        to="/challenges"
        className="mb-6 inline-flex items-center gap-1 font-label text-sm text-primary hover:text-tertiary transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to challenges
      </Link>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: narrative content */}
        <div className="flex flex-col gap-6">
          {/* Challenge header card */}
          <div className="overflow-hidden rounded-xl bg-surface-container-low shadow-[inset_3px_0_12px_-4px_rgba(227,226,232,0.15)]">
            <div className="p-5">
              {/* Phase badge + tags + status */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 font-label text-[10px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: phase.bg, color: phase.accent }}
                >
                  Phase {challenge.phase}: {phase.label}
                </span>

                {challenge.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-container-highest px-2 py-0.5 font-label text-[11px] text-on-surface-variant"
                  >
                    {tag}
                  </span>
                ))}

                <span
                  className="ml-auto rounded-full px-2.5 py-0.5 font-label text-[10px] font-semibold"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>

              {/* Title */}
              <h1 className="mb-3 font-headline text-xl font-bold text-on-surface">
                {challenge.title}
              </h1>

              {/* Full description */}
              <p className="font-body text-sm leading-[1.7] text-on-surface-variant">
                {challenge.fullDescription ?? challenge.description}
              </p>
            </div>
          </div>

          {/* Deliverables */}
          <div className="rounded-xl bg-surface-container-lowest p-5">
            <h2 className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-primary-container">
              Expected deliverables
            </h2>
            <ul className="flex flex-col gap-2">
              {challenge.deliverables.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 font-body text-sm text-on-surface"
                >
                  <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Submission section */}
          <div className="rounded-xl bg-surface-container p-6">
            <h2 className="mb-4 font-headline text-base font-semibold text-on-surface">
              Submit your work
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Artifact URL */}
              <div>
                <label
                  htmlFor="artifact-url"
                  className="mb-1.5 block font-label text-xs font-medium text-on-surface"
                >
                  Artifact URL
                </label>
                <input
                  id="artifact-url"
                  type="url"
                  placeholder="https://github.com/..."
                  value={artifactUrl}
                  onChange={(e) => setArtifactUrl(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 font-label text-sm text-on-surface placeholder:text-on-primary-container/60 outline-none focus:border-tertiary/50 focus:ring-1 focus:ring-tertiary/30"
                />
              </div>

              {/* Artifact preview */}
              {showArtifactPreview && (
                <ArtifactRenderer
                  title="submission-preview"
                  status="building"
                  code={`// Preview for: ${artifactUrl}\n// Artifact will be rendered after submission.`}
                  language="ts"
                />
              )}

              {/* Video URL */}
              <div>
                <label
                  htmlFor="video-url"
                  className="mb-1.5 block font-label text-xs font-medium text-on-surface"
                >
                  Video URL{" "}
                  <span className="font-normal text-on-primary-container">(optional)</span>
                </label>
                <input
                  id="video-url"
                  type="url"
                  placeholder="https://www.loom.com/share/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 font-label text-sm text-on-surface placeholder:text-on-primary-container/60 outline-none focus:border-tertiary/50 focus:ring-1 focus:ring-tertiary/30"
                />
              </div>

              {/* Video preview */}
              {showVideoPreview && (
                <VideoViewer loomUrl={videoUrl} caption="Loom walkthrough preview" />
              )}

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-6 py-2.5 font-label font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column: reference materials */}
        {challenge.references && challenge.references.length > 0 && (
          <div>
            <h2 className="mb-3 font-label text-xs font-semibold uppercase tracking-wider text-on-primary-container">
              Reference materials
            </h2>
            <div className="flex flex-col gap-3">
              {challenge.references.map((ref, i) => (
                <ReferencePanel
                  key={i}
                  title={ref.title}
                  content={ref.content}
                  category={ref.category}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

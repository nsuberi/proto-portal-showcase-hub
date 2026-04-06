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
        <p className="mb-4 text-sm text-dust">Challenge not found.</p>
        <Link
          to="/challenges"
          className="text-sm text-instrument-blue hover:underline"
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
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        to="/challenges"
        className="mb-6 inline-block text-sm text-instrument-blue hover:underline"
      >
        &larr; Back to challenges
      </Link>

      {/* Challenge header card */}
      <div className="mb-6 overflow-hidden rounded-lg border-thin border-border-warm bg-shelter-white">
        {/* Phase accent bar */}
        <div className="h-1" style={{ backgroundColor: phase.accent }} />

        <div className="p-5">
          {/* Phase badge + tags + status */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: phase.bg, color: phase.accent }}
            >
              Phase {challenge.phase}: {phase.label}
            </span>

            {challenge.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border-thin border-border-warm px-2 py-0.5 text-[11px] text-dust"
              >
                {tag}
              </span>
            ))}

            <span
              className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-xl font-bold text-deep-space">
            {challenge.title}
          </h1>

          {/* Full description */}
          <p className="text-sm leading-[1.7] text-dust">
            {challenge.fullDescription ?? challenge.description}
          </p>
        </div>
      </div>

      {/* Deliverables */}
      <div className="mb-6 rounded-lg bg-regolith p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-dust">
          Expected deliverables
        </h2>
        <ul className="flex flex-col gap-2">
          {challenge.deliverables.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-dark-text"
            >
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: phase.accent }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Reference materials */}
      {challenge.references && challenge.references.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-dust">
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

      {/* Submission section */}
      <div className="rounded-lg border-thin border-border-warm bg-shelter-white p-6">
        <h2 className="mb-4 text-base font-semibold text-deep-space">
          Submit your work
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Artifact URL */}
          <div>
            <label
              htmlFor="artifact-url"
              className="mb-1.5 block text-xs font-medium text-dark-text"
            >
              Artifact URL
            </label>
            <input
              id="artifact-url"
              type="url"
              placeholder="https://github.com/..."
              value={artifactUrl}
              onChange={(e) => setArtifactUrl(e.target.value)}
              className="w-full rounded-lg border-thin border-border-warm bg-regolith px-3 py-2 text-sm text-dark-text placeholder:text-dust/60 outline-none focus:border-instrument-blue/60"
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
              className="mb-1.5 block text-xs font-medium text-dark-text"
            >
              Video URL{" "}
              <span className="font-normal text-dust">(optional)</span>
            </label>
            <input
              id="video-url"
              type="url"
              placeholder="https://www.loom.com/share/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded-lg border-thin border-border-warm bg-regolith px-3 py-2 text-sm text-dark-text placeholder:text-dust/60 outline-none focus:border-instrument-blue/60"
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
              className="rounded-lg bg-signal-orange px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

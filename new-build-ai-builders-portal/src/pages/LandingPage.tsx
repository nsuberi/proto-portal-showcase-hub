import { Link } from "react-router-dom";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ShowcaseGalleryItem } from "@/components/ShowcaseGalleryItem";

const showcaseItems = [
  {
    title: "Loan document classifier",
    author: "Jordan R.",
    tags: ["data", "AI"],
    reactions: "12 reactions",
  },
  {
    title: "Rate lock dashboard",
    author: "Priya K.",
    tags: ["design", "API"],
    reactions: "8 reactions",
  },
  {
    title: "Compliance checker",
    author: "Marcus T.",
    tags: ["eval", "risk"],
    reactions: "15 reactions",
  },
];

const phases = [
  {
    name: "Developing Intuition",
    accent: "#1E3A5F",
    description:
      "Scaffolded challenges where you develop a feel for the environment. Follow guided walkthroughs, watch community sessions, and learn what building with AI actually looks like.",
  },
  {
    name: "Exercising Judgment",
    accent: "#2A9D8F",
    description:
      "Defined projects with real decisions about architecture, data, and design. Present your work, notice problems in your organization, and develop judgment about the choices you're making.",
  },
  {
    name: "Navigating Independently",
    accent: "#D4A03A",
    description:
      "Independent discovery. Find problems, shape solutions, create prototypes, record presentations, and advocate for change in your organization.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="-mx-4 sm:-mx-6 -mt-8 bg-deep-space py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-instrument-blue">
            AI Builders Program
          </p>
          <h1 className="mb-4 text-[28px] font-bold leading-tight text-shelter-white sm:text-[32px]">
            Build real things with AI.
            <br />
            Show your work. Grow with a community.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-[14px] leading-relaxed text-dust sm:text-[16px]">
            A community of practice for enterprise professionals developing the
            capability to discover problems, prototype solutions, and advocate
            for change.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center min-h-[44px] rounded-lg bg-signal-orange px-6 py-3 text-sm font-semibold text-shelter-white transition-opacity hover:opacity-90"
            >
              Start your journey
            </Link>
            <Link
              to="/showcase"
              className="inline-flex items-center justify-center min-h-[44px] rounded-lg border border-shelter-white/40 px-6 py-3 text-sm font-semibold text-shelter-white transition-colors hover:border-shelter-white"
            >
              See what people are building
            </Link>
          </div>
        </div>
      </section>

      {/* ── Showcase Preview ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-1 text-[20px] font-semibold text-deep-space">
          People are building this right now
        </h2>
        <p className="mb-6 text-[13px] text-dust">
          Real work from the community. Running code, visible reasoning, peer
          feedback.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {showcaseItems.map((item) => (
            <ShowcaseGalleryItem key={item.title} {...item} />
          ))}
        </div>
        <div className="mt-6">
          <Link
            to="/showcase"
            className="text-[13px] font-medium text-instrument-blue hover:underline"
          >
            Browse all showcase work &rarr;
          </Link>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-6 text-[20px] font-semibold text-deep-space">
          Three phases of development
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {phases.map((phase) => (
            <div
              key={phase.name}
              className="overflow-hidden rounded-lg border border-border-warm bg-shelter-white"
            >
              <div
                className="h-1 w-full"
                style={{ backgroundColor: phase.accent }}
              />
              <div className="p-4">
                <h3 className="mb-2 text-[14px] font-semibold text-deep-space">
                  {phase.name}
                </h3>
                <p className="text-[13px] leading-relaxed text-dust">
                  {phase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Challenge ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-6 text-[20px] font-semibold text-deep-space">
          Start with a challenge
        </h2>
        <div className="max-w-2xl">
          <ChallengeCard
            phase={1}
            title="Walk the terrain: Your first deployment"
            description="Follow a guided walkthrough to deploy a simple Flask application with hot module reload. You'll learn how your dev environment works — proxy configuration, log access, and what happens when things break."
            deliverables={[
              "Running application deployed to dev",
              "Screenshot of successful log inspection",
            ]}
            status="not-started"
            tags={["Architecture", "Building"]}
          />
        </div>
        <div className="mt-6">
          <Link
            to="/challenges"
            className="text-[13px] font-medium text-instrument-blue hover:underline"
          >
            Browse all challenges &rarr;
          </Link>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-12 text-center sm:py-16">
        <h2 className="mb-2 text-[20px] font-semibold text-deep-space">
          Ready to find your path?
        </h2>
        <p className="mb-6 text-[14px] text-dust">
          The journey starts with understanding where you are and where you want
          to go.
        </p>
        <Link
          to="/onboarding"
          className="inline-block rounded-lg bg-signal-orange px-6 py-3 text-sm font-semibold text-shelter-white transition-opacity hover:opacity-90"
        >
          Begin onboarding
        </Link>
      </section>
    </div>
  );
}

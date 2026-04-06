import { Link } from "react-router-dom";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ShowcaseGalleryItem } from "@/components/ShowcaseGalleryItem";
import { cn } from "@/lib/utils";

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
    accent: "var(--color-phase-1)",
    description:
      "Scaffolded challenges where you develop a feel for the environment. Follow guided walkthroughs, watch community sessions, and learn what building with AI actually looks like.",
  },
  {
    name: "Exercising Judgment",
    accent: "var(--color-phase-2)",
    description:
      "Defined projects with real decisions about architecture, data, and design. Present your work, notice problems in your organization, and develop judgment about the choices you're making.",
  },
  {
    name: "Navigating Independently",
    accent: "var(--color-phase-3)",
    description:
      "Independent discovery. Find problems, shape solutions, create prototypes, record presentations, and advocate for change in your organization.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="-mx-4 sm:-mx-6 -mt-8 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <div className="astro-glass rounded-2xl p-8 sm:p-12">
            <p className="mb-4 font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-tertiary">
              AI Builders Program
            </p>
            <h1 className="mb-4 font-headline text-[28px] font-bold leading-tight text-on-surface sm:text-[36px]">
              Build real things with AI.
              <br />
              <span className="text-primary">Show your work.</span> Grow with a community.
            </h1>
            <p className="mx-auto mb-8 max-w-xl font-body text-[14px] leading-relaxed text-on-surface-variant sm:text-[16px]">
              A community of practice for enterprise professionals developing the
              capability to discover problems, prototype solutions, and advocate
              for change.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
              <Link
                to="/onboarding"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-6 py-3 font-label text-sm font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95"
              >
                Start your journey
              </Link>
              <Link
                to="/showcase"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 py-3 font-label text-sm font-semibold text-on-surface ring-1 ring-outline-variant/30 transition-colors hover:ring-primary/50 hover:text-primary"
              >
                See what people are building
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Showcase Preview ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-1 font-headline text-[20px] font-semibold text-on-surface">
          People are building this right now
        </h2>
        <p className="mb-6 font-body text-[13px] text-on-surface-variant">
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
            className="font-label text-[13px] font-medium text-primary hover:text-tertiary transition-colors"
          >
            Browse all showcase work &rarr;
          </Link>
        </div>
      </section>

      {/* ── How It Works — Star chart phases ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-10 font-headline text-[20px] font-semibold text-on-surface">
          Three phases of development
        </h2>

        {/* Horizontal star timeline — no bounding box */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-[20px] left-[16.6%] right-[16.6%] h-[1.5px] bg-outline-variant/20" />

          <div className="relative flex justify-between">
            {phases.map((phase, index) => (
              <div
                key={phase.name}
                className="group relative flex flex-col items-center gap-3 px-2"
                style={{ flex: "1 1 0" }}
              >
                {/* Star point */}
                <div className="relative flex h-10 w-10 items-center justify-center">
                  {/* Hover ring */}
                  <div
                    className="absolute h-8 w-8 rounded-full border transition-transform duration-500 group-hover:scale-150"
                    style={{ borderColor: `${phase.accent}40` }}
                  />
                  {/* Star core */}
                  <div
                    className={cn(
                      "relative z-10 h-3 w-3 rounded-full transition-all duration-300 group-hover:scale-125",
                      index === 0 && "bg-phase-1",
                      index === 1 && "bg-phase-2",
                      index === 2 && "bg-phase-3",
                    )}
                  />
                </div>

                {/* Phase name */}
                <h3 className="font-headline text-[14px] font-bold text-on-surface text-center transition-colors group-hover:text-tertiary">
                  {phase.name}
                </h3>

                {/* Description */}
                <p className="max-w-[280px] text-center font-body text-[12px] leading-relaxed text-on-surface-variant">
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four Foundations ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-6 font-headline text-[20px] font-semibold text-on-surface">
          Four foundations
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { name: "Tools and Platforms", icon: "construction" },
            { name: "Discovery and Problem Shaping", icon: "search_insights" },
            { name: "Building", icon: "code_blocks" },
            { name: "Scaling and Sustaining", icon: "trending_up" },
          ].map((f) => (
            <div
              key={f.name}
              className="group flex flex-col items-center gap-3 rounded-xl bg-surface-container-low p-5 text-center transition-colors duration-200 hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[28px] text-primary transition-colors group-hover:text-tertiary">
                {f.icon}
              </span>
              <span className="font-headline text-[13px] font-semibold leading-tight text-on-surface">
                {f.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Challenge ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-6 font-headline text-[20px] font-semibold text-on-surface">
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
            className="font-label text-[13px] font-medium text-primary hover:text-tertiary transition-colors"
          >
            Browse all challenges &rarr;
          </Link>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="py-12 sm:py-16">
        <div className="astro-glass rounded-2xl p-8 text-center">
          <h2 className="mb-2 font-headline text-[20px] font-semibold text-on-surface">
            Ready to find your path?
          </h2>
          <p className="mb-6 font-body text-[14px] text-on-surface-variant">
            The journey starts with understanding where you are and where you want
            to go.
          </p>
          <Link
            to="/onboarding"
            className="inline-block rounded-lg bg-gradient-to-br from-primary to-on-primary-container px-6 py-3 font-label text-sm font-bold uppercase tracking-widest text-on-primary-fixed transition-all hover:brightness-110 active:scale-95"
          >
            Begin onboarding
          </Link>
        </div>
      </section>
    </div>
  );
}

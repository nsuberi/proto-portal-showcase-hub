import { Suspense, createElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ShowcaseGalleryItem } from "@/components/ShowcaseGalleryItem";
import { AppLoggerProvider } from "@/components/AppLogger";
import { artifactComponents } from "@/artifacts/registry";
import { cn } from "@/lib/utils";

const showcaseItems = [
  {
    title: "Loan document classifier",
    author: "Jordan R.",
    tags: ["data", "AI"],
    reactions: "12 reactions",
    artifactRouteId: "loan-classifier",
  },
  {
    title: "Rate lock dashboard",
    author: "Priya K.",
    tags: ["design", "API"],
    reactions: "8 reactions",
    artifactRouteId: "rate-dashboard",
  },
  {
    title: "AI meeting summarizer",
    author: "Rachel F.",
    tags: ["AI", "productivity"],
    reactions: "9 reactions",
    artifactRouteId: "meeting-summarizer",
  },
];

const levels = [
  {
    name: "Curiosity",
    accent: "var(--color-phase-1)",
    description:
      "Engaging with the tools and concepts. Asking questions. Showing willingness to explore how AI development works and what's possible.",
  },
  {
    name: "Clarity",
    accent: "var(--color-phase-2)",
    description:
      "Understanding why things work, not just how. Distinguishing intent from behavior. Making connections between code, architecture, and product decisions.",
  },
  {
    name: "Capability",
    accent: "var(--color-phase-3)",
    description:
      "Producing work that holds up under scrutiny. Making sound architectural and product decisions. Building things others can use and build on.",
  },
  {
    name: "Consistency",
    accent: "var(--color-phase-4)",
    description:
      "Reliably applying practices across contexts. Elevating others. Designing for sustainability and teaching what you've learned.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
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
              A community of practice for people developing the
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
          {showcaseItems.map((item) => {
            const Comp = artifactComponents[item.artifactRouteId];
            return (
              <ShowcaseGalleryItem
                key={item.title}
                title={item.title}
                author={item.author}
                tags={item.tags}
                reactions={item.reactions}
                previewContent={
                  Comp ? (
                    <AppLoggerProvider>
                      <Suspense fallback={null}>
                        {createElement(Comp)}
                      </Suspense>
                    </AppLoggerProvider>
                  ) : undefined
                }
                onClick={() => navigate(`/artifacts/${item.artifactRouteId}`)}
              />
            );
          })}
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
          Four levels of development
        </h2>

        {/* Star timeline — vertical on mobile, horizontal on md+ */}
        <div className="relative">
          {/* Connecting line — vertical on mobile, horizontal on md+ */}
          <div className="absolute left-[20px] top-[12%] bottom-[12%] w-[1.5px] bg-outline-variant/20 md:left-[12%] md:right-[12%] md:top-[20px] md:bottom-auto md:h-[1.5px] md:w-auto" />

          <div className="relative flex flex-col gap-6 md:flex-row md:gap-0 md:justify-between">
            {levels.map((level, index) => (
              <div
                key={level.name}
                className="group relative flex items-start gap-4 md:flex-col md:items-center md:gap-3 md:px-2"
                style={{ flex: "1 1 0" }}
              >
                {/* Star point */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  {/* Hover ring */}
                  <div
                    className="absolute h-8 w-8 rounded-full border transition-transform duration-500 group-hover:scale-150"
                    style={{ borderColor: `${level.accent}40` }}
                  />
                  {/* Star core */}
                  <div
                    className={cn(
                      "relative z-10 h-3 w-3 rounded-full transition-all duration-300 group-hover:scale-125",
                      index === 0 && "bg-phase-1",
                      index === 1 && "bg-phase-2",
                      index === 2 && "bg-phase-3",
                      index === 3 && "bg-phase-4",
                    )}
                  />
                </div>

                <div className="flex flex-col md:items-center">
                  {/* Level name */}
                  <h3 className="font-headline text-[14px] font-bold text-on-surface md:text-center transition-colors group-hover:text-tertiary">
                    {level.name}
                  </h3>

                  {/* Description */}
                  <p className="max-w-[280px] md:text-center font-body text-[12px] leading-relaxed text-on-surface-variant">
                    {level.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four Practices ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-6 font-headline text-[20px] font-semibold text-on-surface">
          Four practices
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { name: "Discovering and Shaping Problems", icon: "search_insights", submissions: "Brownfield analysis, sample application, discovery pitch" },
            { name: "Building with AI", icon: "code_blocks", submissions: "Agentic coding tools and harnesses, prototype build" },
            { name: "Security and Continuous Improvement", icon: "security", submissions: "Credential review, improvement plan" },
            { name: "Storytelling", icon: "campaign", submissions: "Dev log, video, communications package" },
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
              <span className="font-body text-[11px] leading-snug text-on-surface-variant">
                {f.submissions}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Practices × Levels Matrix ── */}
      <section className="py-12 sm:py-16">
        <h2 className="mb-2 font-headline text-[20px] font-semibold text-on-surface">
          How you're assessed
        </h2>
        <p className="mb-6 font-body text-[13px] text-on-surface-variant">
          Each practice is observed across four levels of development. You don't
          move through levels sequentially — you may show Capability in one
          practice while still building Clarity in another.
        </p>

        {/* Matrix table — scrollable on mobile */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="w-[180px] p-3 text-left font-label text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant" />
                {levels.map((level, i) => (
                  <th
                    key={level.name}
                    className="p-3 text-center font-headline text-[13px] font-bold"
                  >
                    <span
                      className={cn(
                        i === 0 && "text-phase-1",
                        i === 1 && "text-phase-2",
                        i === 2 && "text-phase-3",
                        i === 3 && "text-phase-4",
                      )}
                    >
                      {level.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  practice: "Discovering and Shaping",
                  cells: [
                    "Explores the codebase, asks questions",
                    "Distinguishes intent from behavior",
                    "Connects discovery to buildable solutions",
                    "Repeatable analysis across contexts",
                  ],
                },
                {
                  practice: "Building with AI",
                  cells: [
                    "Experiments with tools, submits PRs",
                    "Traces data end to end, explains choices",
                    "Defensible architecture, refined design",
                    "Reliable quality, elevates others' work",
                  ],
                },
                {
                  practice: "Security and Improvement",
                  cells: [
                    "Engages with security concepts",
                    "Understands why feedback loops matter",
                    "Implements credential management",
                    "Security practices are habitual",
                  ],
                },
                {
                  practice: "Storytelling",
                  cells: [
                    "Shares work, presents to others",
                    "Explains why it matters, attributes others",
                    "Creates artifacts others can learn from",
                    "Storytelling strengthens the community",
                  ],
                },
              ].map((row, rowIndex) => (
                <tr
                  key={row.practice}
                  className={cn(
                    "transition-colors",
                    rowIndex % 2 === 0
                      ? "bg-surface-container-lowest"
                      : "bg-surface-container-low/50",
                  )}
                >
                  <td className="p-3 font-headline text-[12px] font-semibold text-on-surface">
                    {row.practice}
                  </td>
                  {row.cells.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="p-3 font-body text-[11px] leading-snug text-on-surface-variant"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
            title="Brownfield analysis"
            submission={1}
            description="Analyze a brownfield codebase across three angles: data architecture, proxy/deployment networking, and testing coverage against inferred product intent."
            deliverables={[
              "Data architecture analysis",
              "Deployment/networking analysis",
              "Test coverage gap analysis",
            ]}
            status="not-started"
            tags={["Architecture", "Analysis"]}
            practices={["Discovery"]}
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

import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lightbulb, Layers, GitBranch } from "lucide-react";

interface Props {
  isAuthenticated: boolean;
}

const SCATTERED_DOTS = [
  { x: 8, y: 18, size: 6, delay: 0, opacity: 0.3 },
  { x: 15, y: 45, size: 5, delay: 0.8, opacity: 0.5 },
  { x: 5, y: 70, size: 4, delay: 1.6, opacity: 0.25 },
  { x: 20, y: 30, size: 7, delay: 0.4, opacity: 0.4 },
  { x: 12, y: 60, size: 5, delay: 1.2, opacity: 0.35 },
  { x: 22, y: 80, size: 4, delay: 2.0, opacity: 0.3 },
  { x: 3, y: 40, size: 6, delay: 0.6, opacity: 0.45 },
  { x: 18, y: 10, size: 5, delay: 1.4, opacity: 0.35 },
  { x: 10, y: 85, size: 4, delay: 1.8, opacity: 0.25 },
];

const ORGANIZED_BLOCKS = [
  { x: 76, y: 20, type: "insight" as const },
  { x: 84, y: 20, type: "synthesis" as const },
  { x: 76, y: 38, type: "architecture" as const },
  { x: 84, y: 38, type: "insight" as const },
  { x: 80, y: 56, type: "synthesis" as const },
  { x: 76, y: 74, type: "insight" as const },
  { x: 84, y: 74, type: "architecture" as const },
];

const TYPE_COLORS = {
  insight: "var(--color-tertiary)",
  synthesis: "var(--color-primary)",
  architecture: "var(--color-secondary)",
};

export default function HeroSection({ isAuthenticated }: Props) {
  const scrollToGallery = () => {
    document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden py-12 sm:py-20 border-b border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:gap-12 gap-8">
        {/* Left: text + CTAs */}
        <div className="flex-1 md:max-w-lg">
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface mb-3">
            Set an intention. Let Claude investigate.
          </h2>
          <p className="font-body text-base text-on-surface-variant/80 mb-8">
            Declare what you want to learn — a paper to analyze, connections to
            synthesize, ideas to review. Watch Claude work in real time, then
            curate the best insights into your published knowledge gallery.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {isAuthenticated ? (
              <Link
                to="/workspace"
                className="inline-flex items-center justify-center gap-2 font-label text-sm px-6 py-3 rounded-lg bg-tertiary text-on-tertiary font-semibold hover:bg-tertiary/90 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Open Your Workspace
              </Link>
            ) : (
              <a
                href="/prototypes/research-workspace/vault/"
                className="inline-flex items-center justify-center gap-2 font-label text-sm px-6 py-3 rounded-lg bg-tertiary text-on-tertiary font-semibold hover:bg-tertiary/90 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Sign In &amp; Set Your First Intention
              </a>
            )}
            <button
              onClick={scrollToGallery}
              className="inline-flex items-center justify-center gap-2 font-label text-sm px-6 py-3 rounded-lg border border-outline-variant/30 text-primary hover:bg-surface-container transition-colors"
            >
              Browse Published Insights
            </button>
          </div>
          <Link
            to="/security"
            className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant/40 hover:text-on-surface-variant/70 transition-colors mt-4"
          >
            <Shield className="w-3 h-3" />
            Learn about our security architecture
          </Link>
        </div>

        {/* Right: lens focus visual */}
        <div className="flex-1 relative" aria-hidden="true">
          <div className="relative w-full max-w-xl mx-auto md:mx-0 md:ml-auto h-72 sm:h-84">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Scattered dots (left side) */}
              {SCATTERED_DOTS.map((dot, i) => (
                <circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.size / 2}
                  fill="var(--color-on-surface-variant)"
                  opacity={dot.opacity}
                  style={{
                    animation: `float-dot 4s ease-in-out ${dot.delay}s infinite`,
                  }}
                />
              ))}

              {/* Converging lines from dots to lens */}
              {SCATTERED_DOTS.slice(0, 5).map((dot, i) => (
                <line
                  key={`line-in-${i}`}
                  x1={dot.x}
                  y1={dot.y}
                  x2={42}
                  y2={50}
                  stroke="var(--color-primary)"
                  strokeWidth="0.3"
                  opacity={0.15}
                />
              ))}

              {/* Diverging lines from lens to organized blocks */}
              {ORGANIZED_BLOCKS.slice(0, 5).map((block, i) => (
                <line
                  key={`line-out-${i}`}
                  x1={58}
                  y1={50}
                  x2={block.x}
                  y2={block.y + 4}
                  stroke="var(--color-primary)"
                  strokeWidth="0.3"
                  opacity={0.15}
                />
              ))}

              {/* Lens shape */}
              <ellipse
                cx={50}
                cy={50}
                rx={10}
                ry={22}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="0.8"
                opacity={0.3}
                style={{ animation: "focus-pulse 6s ease-in-out infinite" }}
              />
              <ellipse
                cx={50}
                cy={50}
                rx={7}
                ry={16}
                fill="var(--color-primary)"
                opacity={0.05}
                style={{ animation: "focus-pulse 6s ease-in-out 0.5s infinite" }}
              />

              {/* Lens label */}
              <text
                x={50}
                y={51}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-label"
                fill="var(--color-primary)"
                fontSize="3.5"
                opacity={0.6}
              >
                intention
              </text>

              {/* Organized blocks (right side) */}
              {ORGANIZED_BLOCKS.map((block, i) => (
                <rect
                  key={i}
                  x={block.x}
                  y={block.y}
                  width={6}
                  height={8}
                  rx={1}
                  fill={TYPE_COLORS[block.type]}
                  opacity={0.5}
                />
              ))}
            </svg>

            {/* Type labels floating near organized blocks */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 pr-2">
              <span className="inline-flex items-center gap-1 font-label text-[10px] text-tertiary/60">
                <Lightbulb className="w-2.5 h-2.5" /> Insights
              </span>
              <span className="inline-flex items-center gap-1 font-label text-[10px] text-primary/60">
                <Layers className="w-2.5 h-2.5" /> Syntheses
              </span>
              <span className="inline-flex items-center gap-1 font-label text-[10px] text-secondary/60">
                <GitBranch className="w-2.5 h-2.5" /> Architectures
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

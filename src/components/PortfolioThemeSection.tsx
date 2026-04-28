import {
  PortfolioPrototypeCard,
  type Prototype,
} from "./PortfolioPrototypeCard";

interface PortfolioThemeSectionProps {
  id: string;
  title: string;
  blurb: string;
  prototypes: ReadonlyArray<Prototype>;
}

export function PortfolioThemeSection({
  id,
  title,
  blurb,
  prototypes,
}: PortfolioThemeSectionProps) {
  if (prototypes.length === 0) return null;

  return (
    <section
      id={`theme-${id}`}
      data-theme-id={id}
      className="scroll-mt-32 lg:scroll-mt-24 mb-16 last:mb-0"
    >
      <header className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-3xl leading-relaxed">
          {blurb}
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {prototypes.map((p, i) => (
          <PortfolioPrototypeCard key={i} prototype={p} />
        ))}
      </div>
    </section>
  );
}

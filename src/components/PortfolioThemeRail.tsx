import { useEffect, useRef, useState } from "react";

export interface ThemeRailItem {
  id: string;
  label: string;
}

interface PortfolioThemeRailProps {
  items: ReadonlyArray<ThemeRailItem>;
  anchorPrefix?: string;
}

export function PortfolioThemeRail({
  items,
  anchorPrefix = "theme-",
}: PortfolioThemeRailProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const visibleRef = useRef(new Set<string>());

  useEffect(() => {
    const visible = visibleRef.current;
    visible.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-theme-id");
          if (!id) continue;
          if (entry.isIntersecting) {
            visible.add(id);
          } else {
            visible.delete(id);
          }
        }
        const firstVisible = items.find((it) => visible.has(it.id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0, 0.1, 0.5, 1],
      },
    );

    for (const it of items) {
      const el = document.getElementById(`${anchorPrefix}${it.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items, anchorPrefix]);

  const handleClick = (id: string) => {
    const el = document.getElementById(`${anchorPrefix}${id}`);
    if (el) {
      setActiveId(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav aria-label="Prototype themes" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="lg:hidden flex gap-2 overflow-x-auto pb-2 sticky top-0 bg-background/85 backdrop-blur-sm z-10 py-3 border-b border-border/40 -mx-6 px-6">
        {items.map((it) => {
          const isActive = activeId === it.id;
          return (
            <li key={it.id} className="shrink-0">
              <button
                type="button"
                onClick={() => handleClick(it.id)}
                aria-current={isActive ? "true" : undefined}
                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors min-h-[36px] ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Themes
        </p>
        <ul className="space-y-1 border-l border-border">
          {items.map((it) => {
            const isActive = activeId === it.id;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => handleClick(it.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`block w-full text-left text-sm leading-snug pl-4 py-2 -ml-px border-l-2 transition-colors ${
                    isActive
                      ? "border-primary text-primary font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {it.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

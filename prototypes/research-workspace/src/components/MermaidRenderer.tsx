import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
}

export default function MermaidRenderer({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    let cancelled = false;

    async function renderChart() {
      try {
        // Dynamic import to avoid SSR issues
        const { default: mermaid } = await import("mermaid");

        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            darkMode: true,
            background: "transparent",
            primaryColor: "var(--color-primary-container)",
            primaryTextColor: "var(--color-on-surface)",
            primaryBorderColor: "var(--color-outline-variant)",
            lineColor: "var(--color-outline)",
            secondaryColor: "var(--color-secondary-container)",
            tertiaryColor: "var(--color-tertiary-container)",
            fontFamily: "Inter, sans-serif",
          },
          securityLevel: "loose",
        });

        if (cancelled || !containerRef.current) return;

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = svg;
        setRendered(true);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
          setRendered(false);
        }
      }
    }

    renderChart();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-4">
        <p className="font-label text-xs text-error mb-2">Diagram rendering error</p>
        <pre className="font-mono text-xs text-on-surface-variant whitespace-pre-wrap">
          {error}
        </pre>
        <details className="mt-3">
          <summary className="font-label text-xs text-on-surface-variant/60 cursor-pointer">
            Show source
          </summary>
          <pre className="mt-2 font-mono text-xs text-on-surface-variant/80 whitespace-pre-wrap bg-surface-container-lowest p-3 rounded-md">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 overflow-x-auto">
      {!rendered && (
        <div className="flex items-center gap-2 py-8 justify-center">
          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-label text-sm text-on-surface-variant">
            Rendering diagram...
          </span>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
      />
    </div>
  );
}

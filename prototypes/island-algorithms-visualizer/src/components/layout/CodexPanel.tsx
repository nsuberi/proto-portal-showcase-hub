import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { ALGORITHMS } from "@/algorithms/registry";
import { ComplexityTable } from "@/components/codex/ComplexityTable";
import { DataStructurePanel } from "@/components/codex/DataStructurePanel";
import { VisitedTrail } from "@/components/codex/VisitedTrail";
import { WhenToUsePanel } from "@/components/codex/WhenToUsePanel";
import { PseudocodeBlock } from "@/components/codex/PseudocodeBlock";
import { GotchasPanel } from "@/components/codex/GotchasPanel";

export function CodexPanel() {
  const algorithm = useVisualizerStore((s) => s.algorithm);
  const meta = ALGORITHMS[algorithm].meta;

  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-surface/50 p-4">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-widest text-cyan">
          Codex
        </div>
        <h2 className="mt-1 text-lg font-semibold text-text">{meta.label}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-text-mid">{meta.tagline}</p>
      </header>

      <ComplexityTable />

      <Accordion.Root
        type="multiple"
        defaultValue={["datastructure", "visited", "pseudocode", "when", "gotchas"]}
        className="space-y-2"
      >
        <Section id="datastructure" title="Live data structure">
          <DataStructurePanel />
        </Section>
        <Section id="visited" title="Visited trail">
          <VisitedTrail />
        </Section>
        <Section id="pseudocode" title="Pseudocode (line highlights step)">
          <PseudocodeBlock />
        </Section>
        <Section id="when" title="When to use">
          <WhenToUsePanel />
        </Section>
        <Section id="gotchas" title="Gotchas & interview notes">
          <GotchasPanel />
        </Section>
      </Accordion.Root>
    </aside>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item
      value={id}
      className="overflow-hidden rounded border border-border bg-bg"
    >
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-text-mid hover:text-text">
          {title}
          <ChevronDown
            size={14}
            className="transition-transform group-data-[state=open]:rotate-180"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="px-3 pb-3">{children}</Accordion.Content>
    </Accordion.Item>
  );
}

import * as Tabs from "@radix-ui/react-tabs";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, ExternalLink } from "lucide-react";
import { ALGORITHMS, ALGORITHM_ORDER } from "@/algorithms/registry";
import { CHEATSHEET_PATTERNS, TEMPLATES } from "@/data/didactic-copy";
import type { AlgorithmId } from "@/types";

export function MobileCheatSheet() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-3 py-4">
      <header>
        <div className="font-mono text-[10px] uppercase tracking-widest text-cyan">
          Island Algorithms · Cheat Sheet
        </div>
        <h1 className="mt-1 text-lg font-semibold text-text">
          LeetCode-ready summaries
        </h1>
        <p className="text-[11px] leading-relaxed text-text-mid">
          The WebGL visualizer is hidden at this width. The algorithm reference
          and Python toolkit below are the same content used on desktop.
        </p>
      </header>

      <Tabs.Root defaultValue="dfs" className="flex flex-1 flex-col">
        <Tabs.List className="flex gap-1 overflow-x-auto rounded border border-border bg-surface p-1">
          {ALGORITHM_ORDER.map((id) => (
            <Tabs.Trigger
              key={id}
              value={id}
              className="shrink-0 rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-mid data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan"
            >
              {ALGORITHMS[id].meta.label}
            </Tabs.Trigger>
          ))}
          <Tabs.Trigger
            value="patterns"
            className="shrink-0 rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-mid data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan"
          >
            Patterns
          </Tabs.Trigger>
          <Tabs.Trigger
            value="templates"
            className="shrink-0 rounded px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-mid data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan"
          >
            Templates
          </Tabs.Trigger>
        </Tabs.List>

        {ALGORITHM_ORDER.map((id) => (
          <Tabs.Content key={id} value={id} className="mt-3 flex-1 space-y-2">
            <AlgorithmTab id={id} />
          </Tabs.Content>
        ))}

        <Tabs.Content value="patterns" className="mt-3 flex-1 space-y-3">
          <PatternsTab />
        </Tabs.Content>
        <Tabs.Content value="templates" className="mt-3 flex-1 space-y-2">
          <TemplatesTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function AlgorithmTab({ id }: { id: AlgorithmId }) {
  const meta = ALGORITHMS[id].meta;
  return (
    <Accordion.Root
      type="multiple"
      defaultValue={["when", "bigO"]}
      className="space-y-2"
    >
      <Accordion.Item
        value="bigO"
        className="overflow-hidden rounded border border-border bg-bg"
      >
        <Head>Complexity</Head>
        <Accordion.Content className="grid grid-cols-2 gap-2 px-3 pb-3">
          <div className="rounded border border-border bg-surface p-2">
            <div className="text-[10px] uppercase tracking-widest text-text-mid">
              Time
            </div>
            <div className="font-mono text-sm text-cyan">{meta.bigO.time}</div>
          </div>
          <div className="rounded border border-border bg-surface p-2">
            <div className="text-[10px] uppercase tracking-widest text-text-mid">
              Space
            </div>
            <div className="font-mono text-sm text-cyan">{meta.bigO.space}</div>
          </div>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item
        value="structure"
        className="overflow-hidden rounded border border-border bg-bg"
      >
        <Head>Data structure</Head>
        <Accordion.Content className="px-3 pb-3 text-sm text-text">
          {meta.dataStructure}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item
        value="when"
        className="overflow-hidden rounded border border-border bg-bg"
      >
        <Head>When to use</Head>
        <Accordion.Content className="px-3 pb-3">
          <ul className="space-y-1 text-sm text-text">
            {meta.whenToUse.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-cyan" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item
        value="pseudo"
        className="overflow-hidden rounded border border-border bg-bg"
      >
        <Head>Template</Head>
        <Accordion.Content className="px-3 pb-3">
          <pre className="overflow-x-auto rounded border border-border bg-bg p-2 text-[10px] leading-[1.5] text-text">
            {meta.pseudocode}
          </pre>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item
        value="gotchas"
        className="overflow-hidden rounded border border-border bg-bg"
      >
        <Head>Gotchas</Head>
        <Accordion.Content className="px-3 pb-3">
          <ul className="space-y-1 text-sm text-text">
            {meta.gotchas.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-magenta" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PatternsTab() {
  return (
    <Accordion.Root type="multiple" defaultValue={["graphs"]} className="space-y-2">
      {CHEATSHEET_PATTERNS.map((pat) => (
        <Accordion.Item
          key={pat.id}
          value={pat.id}
          className="overflow-hidden rounded border border-border bg-bg"
        >
          <Head>{pat.name}</Head>
          <Accordion.Content className="space-y-3 px-3 pb-3">
            <p className="text-xs italic leading-relaxed text-text-mid">{pat.why}</p>
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-cyan">
                Concepts
              </div>
              <ul className="space-y-0.5 text-[12px] text-text">
                {pat.concepts.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-cyan">
                Python toolkit
              </div>
              <ul className="space-y-0.5 text-[12px]">
                {pat.pythonEssentials.map((p) => (
                  <li key={p.tool}>
                    <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-magenta">
                      {p.tool}
                    </code>
                    <span className="ml-2 text-text-mid">— {p.use}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-cyan">
                Problems
              </div>
              <div className="space-y-1.5">
                {pat.problems.map((pr) => (
                  <a
                    key={pr.id}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 rounded border border-border bg-surface p-2 text-[12px] hover:border-cyan-dim"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-text">{pr.name}</div>
                      <div className="text-[11px] text-text-mid">{pr.focus}</div>
                    </div>
                    <span
                      className={
                        pr.diff === "Hard"
                          ? "rounded bg-magenta/10 px-1.5 py-0.5 font-mono text-[10px] text-magenta"
                          : "rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan"
                      }
                    >
                      {pr.diff}
                    </span>
                    <ExternalLink size={12} className="mt-0.5 text-text-mid" />
                  </a>
                ))}
              </div>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function TemplatesTab() {
  return (
    <Accordion.Root type="multiple" defaultValue={[TEMPLATES[0].name]} className="space-y-2">
      {TEMPLATES.map((t) => (
        <Accordion.Item
          key={t.name}
          value={t.name}
          className="overflow-hidden rounded border border-border bg-bg"
        >
          <Head>{t.name}</Head>
          <Accordion.Content className="px-3 pb-3">
            <pre className="overflow-x-auto rounded border border-border bg-bg p-2 text-[10px] leading-[1.5] text-text">
              {t.code}
            </pre>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function Head({ children }: { children: React.ReactNode }) {
  return (
    <Accordion.Header>
      <Accordion.Trigger className="group flex w-full items-center justify-between px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-text-mid hover:text-text">
        {children}
        <ChevronDown
          size={14}
          className="transition-transform group-data-[state=open]:rotate-180"
        />
      </Accordion.Trigger>
    </Accordion.Header>
  );
}

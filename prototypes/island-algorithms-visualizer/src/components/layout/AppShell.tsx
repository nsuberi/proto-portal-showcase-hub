import { useResponsiveMode } from "@/hooks/useResponsiveMode";
import { VisualizerCanvas } from "@/components/canvas/VisualizerCanvas";
import { ControlDock } from "@/components/controls/ControlDock";
import { AlgorithmPicker } from "@/components/controls/AlgorithmPicker";
import { ViewModeToggle } from "@/components/controls/ViewModeToggle";
import { GridEditor } from "@/components/controls/GridEditor";
import { StepContextBand } from "@/components/codex/StepContextBand";
import { CodexPanel } from "./CodexPanel";
import { MobileCheatSheet } from "@/components/mobile/MobileCheatSheet";

export function AppShell() {
  const { isMobile } = useResponsiveMode();

  if (isMobile) {
    return (
      <div className="flex h-screen w-screen flex-col bg-bg text-text">
        <MobileCheatSheet />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col gap-3 bg-bg p-3 text-text">
      <header className="flex flex-shrink-0 flex-wrap items-center gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan">
            Island Algorithms
          </div>
          <h1 className="text-lg font-semibold">
            Connected Components · Visualizer & Cheat Sheet
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <ViewModeToggle />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_360px] gap-3">
        <aside className="flex flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-surface/50 p-3">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-cyan">
              Algorithm
            </div>
            <AlgorithmPicker />
          </div>
          <GridEditor />
        </aside>

        <main className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1">
            <VisualizerCanvas />
          </div>
          <StepContextBand />
          <ControlDock />
        </main>

        <CodexPanel />
      </div>
    </div>
  );
}

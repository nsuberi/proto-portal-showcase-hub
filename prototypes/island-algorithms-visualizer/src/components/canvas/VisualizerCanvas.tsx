import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { useStepMaterialization } from "@/hooks/useStepMaterialization";
import { Scene2D } from "./Scene2D";
import { Scene3D } from "./Scene3D";
import { PostFX } from "./PostFX";
import { useResponsiveMode } from "@/hooks/useResponsiveMode";
import { THREE_HEX } from "@/lib/color-mapping";

export function VisualizerCanvas() {
  const viewMode = useVisualizerStore((s) => s.viewMode);
  const grid = useVisualizerStore((s) => s.grid);
  const toggleCell = useVisualizerStore((s) => s.toggleCell);
  const { cells, step } = useStepMaterialization();
  const { width } = useResponsiveMode();

  const postFxEnabled = width >= 768;
  const scanCursor = step?.state.scanCursor ?? -1;

  const onCellClick = (index: number) => {
    if (grid.mode !== "2d") return;
    const x = index % grid.width;
    const y = Math.floor(index / grid.width);
    toggleCell(x, y);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border bg-bg">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }} shadows={false}>
        <color attach="background" args={[THREE_HEX.bg]} />
        <fog attach="fog" args={[THREE_HEX.bg, 18, 60]} />
        <Suspense fallback={null}>
          {viewMode === "2d" && grid.mode === "2d" && (
            <Scene2D
              grid={grid}
              cells={cells}
              scanCursor={scanCursor}
              onCellClick={onCellClick}
            />
          )}
          {viewMode === "3d" && grid.mode === "3d" && (
            <Scene3D grid={grid} cells={cells} scanCursor={scanCursor} />
          )}
          <PostFX enabled={postFxEnabled} />
        </Suspense>
      </Canvas>
    </div>
  );
}

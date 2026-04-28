import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { CellView, Grid3D } from "@/types";
import { CellInstances } from "./CellInstances";
import { GridFloor } from "./GridFloor";
import { ScanCursor } from "./ScanCursor";
import { THREE_HEX } from "@/lib/color-mapping";

interface Props {
  grid: Grid3D;
  cells: CellView[];
  scanCursor: number;
}

const DOT_RADIUS_3D = 0.18;

export function Scene3D({ grid, cells, scanCursor }: Props) {
  const extent = Math.max(grid.width, grid.height, grid.depth);
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[extent * 1.4, extent * 1.1, extent * 1.6]}
        fov={50}
      />
      <OrbitControls enableDamping dampingFactor={0.08} />
      <ambientLight intensity={0.3} />
      <pointLight position={[extent, extent * 2, extent]} intensity={1} color={THREE_HEX.cyan} />
      <pointLight position={[-extent, extent, -extent]} intensity={0.6} color={THREE_HEX.magenta} />
      <GridFloor size={extent * 3.2} divisions={grid.width} />
      <CellInstances
        cells={cells}
        width={grid.width}
        height={grid.height}
        depth={grid.depth}
        radius={DOT_RADIUS_3D}
      />
      <ScanCursor
        cursorIndex={scanCursor}
        width={grid.width}
        height={grid.height}
        depth={grid.depth}
        radius={DOT_RADIUS_3D + 0.12}
      />
    </>
  );
}

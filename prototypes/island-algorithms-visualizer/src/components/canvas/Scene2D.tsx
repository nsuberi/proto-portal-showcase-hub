import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { CellView, Grid2D } from "@/types";
import { CellInstances } from "./CellInstances";
import { GridFloor } from "./GridFloor";
import { ScanCursor } from "./ScanCursor";
import { THREE_HEX } from "@/lib/color-mapping";

interface Props {
  grid: Grid2D;
  cells: CellView[];
  scanCursor: number;
  onCellClick?: (index: number) => void;
}

const DOT_RADIUS_2D = 0.32;

export function Scene2D({ grid, cells, scanCursor, onCellClick }: Props) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5.5, 12]} fov={45} />
      <OrbitControls
        enableRotate={false}
        enablePan
        enableZoom
        minDistance={6}
        maxDistance={22}
      />
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 12, 8]} intensity={1.1} color={THREE_HEX.cyan} />
      <pointLight position={[-10, 6, -8]} intensity={0.6} color={THREE_HEX.magenta} />
      <GridFloor size={Math.max(grid.width, grid.height) * 2.2} divisions={grid.width} />
      <group rotation-x={-0.3}>
        <CellInstances
          cells={cells}
          width={grid.width}
          height={grid.height}
          depth={1}
          radius={DOT_RADIUS_2D}
          onCellClick={onCellClick}
        />
        <ScanCursor
          cursorIndex={scanCursor}
          width={grid.width}
          height={grid.height}
          depth={1}
          radius={DOT_RADIUS_2D + 0.15}
        />
      </group>
    </>
  );
}

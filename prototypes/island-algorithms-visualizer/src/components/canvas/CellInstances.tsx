import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CellView } from "@/types";
import { islandColor, roleColor } from "@/lib/color-mapping";

interface Props {
  cells: CellView[];
  /** Grid dimensions for centering. */
  width: number;
  height: number;
  depth: number;
  /** Visual mode — 2D uses cubes, 3D uses spheres. */
  shape: "cube" | "sphere";
  /** Spacing between cells. */
  spacing?: number;
  onCellClick?: (index: number) => void;
}

const tmpMatrix = new THREE.Matrix4();
const tmpColor = new THREE.Color();
const tmpScale = new THREE.Vector3();
const tmpPos = new THREE.Vector3();
const EMPTY_COLOR = new THREE.Color(0x0d1526);
const CURRENT_COLOR = new THREE.Color(0xffffff);
const PATH_COLOR = new THREE.Color(0xffdd00);

export function CellInstances({
  cells,
  width,
  height,
  depth,
  shape,
  spacing = 1.1,
  onCellClick,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = cells.length;

  const geometry = useMemo(() => {
    if (shape === "sphere") {
      return new THREE.SphereGeometry(0.3, 16, 16);
    }
    // 2D tile — same footprint for all cells; thickness unchanged
    return new THREE.BoxGeometry(0.85, 0.85, 0.2);
  }, [shape]);

  const offsetX = ((width - 1) * spacing) / 2;
  const offsetY = ((height - 1) * spacing) / 2;
  const offsetZ = ((depth - 1) * spacing) / 2;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Uniform scale — presence is encoded by color only, never size.
    tmpScale.set(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const cell = cells[i];
      tmpPos.set(
        cell.x * spacing - offsetX,
        cell.y * spacing - offsetY,
        cell.z * spacing - offsetZ,
      );
      tmpMatrix.compose(tmpPos, new THREE.Quaternion(), tmpScale);
      mesh.setMatrixAt(i, tmpMatrix);

      switch (cell.role) {
        case "empty":
          tmpColor.copy(EMPTY_COLOR);
          break;
        case "current":
          tmpColor.copy(CURRENT_COLOR);
          break;
        case "path":
          tmpColor.copy(PATH_COLOR);
          break;
        case "visited":
          tmpColor.copy(
            cell.islandId != null ? islandColor(cell.islandId) : roleColor("visited"),
          );
          break;
        case "frontier":
          tmpColor.copy(
            cell.islandId != null ? islandColor(cell.islandId) : roleColor("frontier"),
          );
          tmpColor.lerp(CURRENT_COLOR, 0.25);
          break;
        case "filled":
        default:
          tmpColor.copy(
            cell.islandId != null ? islandColor(cell.islandId) : roleColor("filled"),
          );
          break;
      }
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells, count, offsetX, offsetY, offsetZ, spacing]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      castShadow={false}
      receiveShadow={false}
      onClick={(e) => {
        if (!onCellClick) return;
        e.stopPropagation();
        if (typeof e.instanceId === "number") onCellClick(e.instanceId);
      }}
    >
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial attach="material" toneMapped={false} vertexColors={false} />
    </instancedMesh>
  );
}

import { useMemo } from "react";
import * as THREE from "three";
import { THREE_HEX } from "@/lib/color-mapping";

interface Props {
  cursorIndex: number;
  width: number;
  height: number;
  depth: number;
  spacing?: number;
  /** Radius of the outline ring — typically matches CellInstances radius + a hair. */
  radius?: number;
}

export function ScanCursor({
  cursorIndex,
  width,
  height,
  depth,
  spacing = 1.1,
  radius = 0.45,
}: Props) {
  const geometry = useMemo(() => new THREE.SphereGeometry(radius, 24, 16), [radius]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  if (cursorIndex < 0) return null;

  const plane = width * height;
  const z = Math.floor(cursorIndex / plane);
  const rem = cursorIndex - z * plane;
  const y = Math.floor(rem / width);
  const x = rem % width;

  const offsetX = ((width - 1) * spacing) / 2;
  const offsetY = ((height - 1) * spacing) / 2;
  const offsetZ = ((depth - 1) * spacing) / 2;

  const position: [number, number, number] = [
    x * spacing - offsetX,
    y * spacing - offsetY,
    z * spacing - offsetZ,
  ];

  return (
    <lineSegments geometry={edges} position={position}>
      <lineBasicMaterial attach="material" color={THREE_HEX.cyan} toneMapped={false} />
    </lineSegments>
  );
}

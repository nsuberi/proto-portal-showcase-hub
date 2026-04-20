import { useMemo } from "react";
import * as THREE from "three";
import { THREE_HEX } from "@/lib/color-mapping";

interface Props {
  cursorIndex: number;
  width: number;
  height: number;
  depth: number;
  spacing?: number;
  shape: "cube" | "sphere";
}

export function ScanCursor({
  cursorIndex,
  width,
  height,
  depth,
  spacing = 1.1,
  shape,
}: Props) {
  const geometry = useMemo(() => {
    if (shape === "sphere") return new THREE.SphereGeometry(0.5, 24, 16);
    return new THREE.BoxGeometry(1, 1, 0.35);
  }, [shape]);

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

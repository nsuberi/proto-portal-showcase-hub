import { useMemo } from "react";
import { fibSphere, buildEdges, rotYAxis } from "../lib/geometry";
import type { ProjectedNode, Edge } from "../types";

interface UseSphereProjectionParams {
  cx: number;
  cy: number;
  radius: number;
  count: number;
  thresh: number;
  speed: number;
  time: number;
  seedOffset?: number;
}

export function useSphereProjection({
  cx,
  cy,
  radius,
  count,
  thresh,
  speed,
  time,
  seedOffset = 0,
}: UseSphereProjectionParams): { edges: Edge[]; projected: ProjectedNode[] } {
  const { nodes3d, edges } = useMemo(() => {
    const n = fibSphere(count, radius, seedOffset);
    return { nodes3d: n, edges: buildEdges(n, thresh) };
  }, [count, radius, thresh, seedOffset]);

  const angle = time * speed;
  const projected = useMemo(
    () =>
      nodes3d.map((n, i) => {
        const r = rotYAxis(n.x, n.y, n.z, angle);
        const depth = (r.z + radius) / (2 * radius);
        return {
          px: cx + r.x,
          py: cy + r.y,
          depth,
          i,
          size: n.size * (0.4 + depth * 0.75),
          opacity: n.op * (0.2 + depth * 0.8),
        };
      }),
    [nodes3d, angle, cx, cy, radius]
  );

  return { edges, projected };
}

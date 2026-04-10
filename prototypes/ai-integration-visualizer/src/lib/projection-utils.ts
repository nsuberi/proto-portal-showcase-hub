import type { ProjectedNode } from "../types";

export function getNodePos(
  projected: ProjectedNode[],
  index: number
): { x: number; y: number; depth: number } | null {
  if (!projected || index >= projected.length || index < 0) return null;
  const p = projected[index];
  if (p.depth < 0.12) return null;
  return { x: p.px, y: p.py, depth: p.depth };
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  size: number;
  op: number;
}

/**
 * Distribute points evenly across a sphere surface using the golden angle
 * (Fibonacci sphere). Each point gets a size and base opacity derived from
 * its index for visual variety.
 */
export function fibSphere(
  count: number,
  radius: number,
  seed: number = 0
): Point3D[] {
  const pts: Point3D[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rY = Math.sqrt(1 - y * y);
    const th = ga * i + seed;
    pts.push({
      x: Math.cos(th) * rY * radius,
      y: y * radius,
      z: Math.sin(th) * rY * radius,
      size: 1.2 + (((i * 7 + Math.abs(seed) * 100) % 100) / 100) * 1.8,
      op: 0.22 + (((i * 13 + Math.abs(seed) * 50) % 100) / 100) * 0.33,
    });
  }
  return pts;
}

/**
 * Build edges connecting all node pairs closer than the distance threshold.
 */
export function buildEdges(
  nodes: Point3D[],
  thresh: number
): { a: number; b: number }[] {
  const e: { a: number; b: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < thresh) {
        e.push({ a: i, b: j });
      }
    }
  }
  return e;
}

/**
 * Rotate a point around the Y axis by angle `a` radians.
 */
export function rotYAxis(
  x: number,
  y: number,
  z: number,
  a: number
): { x: number; y: number; z: number } {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: x * c + z * s, y, z: -x * s + z * c };
}

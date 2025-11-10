import countryBorders from "../../country_borders.geo.json";

type LonLat = [number, number];
type PolygonRings = LonLat[][];
type MultiPolygon = LonLat[][][];
type FeatureGeometry =
  | { type: "Polygon"; coordinates: PolygonRings }
  | { type: "MultiPolygon"; coordinates: MultiPolygon };
type CountryFeature = { type: "Feature"; properties: { name: string }; geometry: FeatureGeometry };
type FeatureCollection = { type: "FeatureCollection"; features: CountryFeature[] };

export type CountryRings = {
  name: string;
  ringsGroups: PolygonRings[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

const CACHE_KEY = "lp-country-rings-v2";

function geometryToRings(geom: FeatureGeometry): PolygonRings[] {
  if (geom.type === "Polygon") {
    return [geom.coordinates];
  }
  return geom.coordinates;
}

function computeBounds(featuresRings: PolygonRings[]): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const rings of featuresRings) {
    for (const ring of rings) {
      for (const [lon, lat] of ring) {
        if (lon < minX) minX = lon;
        if (lon > maxX) maxX = lon;
        if (lat < minY) minY = lat;
        if (lat > maxY) maxY = lat;
      }
    }
  }
  return { minX, maxX, minY, maxY };
}

function ensureClosed(ring: LonLat[]): LonLat[] {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  const isClosed = first[0] === last[0] && first[1] === last[1];
  return isClosed ? ring : [...ring, first];
}

function decimateRing(ring: LonLat[], targetPoints: number): LonLat[] {
  const closed = ensureClosed(ring);
  const n = closed.length;
  if (n <= targetPoints) return closed;
  const step = Math.max(1, Math.floor(n / targetPoints));
  const out: LonLat[] = [];
  for (let i = 0; i < n - 1; i += step) {
    out.push(closed[i]);
  }
  out.push(closed[0]);
  if (out.length < 4) return closed;
  return out;
}

function buildPrecomputed(): Record<string, CountryRings> {
  const fc = countryBorders as unknown as FeatureCollection;
  const out: Record<string, CountryRings> = {};
  for (const f of fc.features) {
    const name = f.properties?.name;
    if (!name) continue;
    const ringsGroups = geometryToRings(f.geometry).map(rings => {
      return rings
        .map(r => decimateRing(r, name === "India" ? 600 : 1500))
        .filter(r => r.length >= 4);
    });
    const bounds = computeBounds(ringsGroups);
    out[name] = { name, ringsGroups, bounds };
  }
  return out;
}

export function getPrecomputedCountryRings(): Map<string, CountryRings> {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const cached = window.localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, CountryRings>;
        return new Map(Object.entries(parsed));
      }
      const computed = buildPrecomputed();
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(computed));
      return new Map(Object.entries(computed));
    }
  } catch {
    // ignore storage errors
  }
  // Fallback: compute without storage
  const computed = buildPrecomputed();
  return new Map(Object.entries(computed));
}



import { useEffect, useMemo, useRef, useState } from "react";
import { cuisineClusters } from "../data/recipes";
import { Cuisine, CuisineCluster, Recipe } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import Sigma from "sigma";
import Graph from "graphology";
// Load country borders (contains only relevant countries for our cuisines)
// File lives at: prototypes/learning-path/country_borders.geo.json
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow JSON import outside src typing
import countryBorders from "../../country_borders.geo.json";
import { getPrecomputedCountryRings } from "../data/country_silhouette_cache";

type Props = {
  selectedRecipe?: Recipe | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onVisibleClustersChange?: (clusters: CuisineCluster[]) => void;
  recipeProgress: Record<string, number>;
};

export default function Section1({ selectedRecipe, onSelectRecipe, onVisibleClustersChange, recipeProgress }: Props) {
  const clusters = cuisineClusters;
  const [activeIndex, setActiveIndex] = useState<number>(2); // middle cluster selected by default
  const [viewportStart, setViewportStart] = useState<number>(1); // starting index of visible window
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<Sigma | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperSize, setWrapperSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const viewport = useMemo(() => {
    const len = clusters.length;
    const atEnds = activeIndex === 0 || activeIndex === len - 1;
    const size = atEnds ? 2 : 3;
    let start = Math.min(Math.max(0, viewportStart), Math.max(0, len - size));

    // Ensure active is visible; align appropriately
    if (activeIndex < start) {
      start = atEnds ? (activeIndex === 0 ? 0 : len - size) : Math.max(0, activeIndex - 1);
    } else if (activeIndex > start + size - 1) {
      start = atEnds ? (activeIndex === len - 1 ? len - size : 0) : Math.min(len - size, activeIndex - 1);
    } else if (!atEnds && size === 3) {
      // Prefer centering when possible
      start = Math.min(Math.max(0, activeIndex - 1), len - 3);
    } else if (atEnds && size === 2) {
      start = activeIndex === 0 ? 0 : len - 2;
    }

    const end = start + size;
    const slice = clusters.slice(start, end);
    onVisibleClustersChange?.(slice);
    return { start, end, size, slice };
  }, [viewportStart, clusters, onVisibleClustersChange, activeIndex]);

  const canScrollLeft = viewport.start > 0;
  const canScrollRight = viewport.end < clusters.length;

  const selectCluster = (idx: number) => {
    setActiveIndex(idx);
    const len = clusters.length;
    const atEnds = idx === 0 || idx === len - 1;
    const size = atEnds ? 2 : 3;
    // Snap viewport so selected is centered when possible or aligned on ends
    const newStart = atEnds
      ? (idx === 0 ? 0 : Math.max(0, len - size))
      : Math.min(Math.max(0, idx - 1), Math.max(0, len - size));
    setViewportStart(newStart);
  };

  // --- Country silhouette helpers ---
  type LonLat = [number, number];
  type PolygonRings = LonLat[][];
  type MultiPolygon = LonLat[][][];
  type FeatureGeometry =
    | { type: "Polygon"; coordinates: PolygonRings }
    | { type: "MultiPolygon"; coordinates: MultiPolygon };
  type CountryFeature = { type: "Feature"; properties: { name: string }; geometry: FeatureGeometry };
  type FeatureCollection = { type: "FeatureCollection"; features: CountryFeature[] };

  const countryNameToFeature = useMemo(() => {
    const fc = countryBorders as unknown as FeatureCollection;
    const map = new Map<string, CountryFeature>();
    fc.features.forEach((f) => {
      const name = f.properties?.name;
      if (name) map.set(name, f);
    });
    return map;
  }, []);
  const precomputedRings = useMemo(() => getPrecomputedCountryRings(), []);

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

  // Build a single SVG path string from a country geometry, scaled to fit width/height with padding
  function buildCountryPath(feature: CountryFeature, width: number, height: number, padding: number): string {
    const ringsGroups = geometryToRings(feature.geometry);
    const bounds = computeBounds(ringsGroups);
    const targetW = Math.max(0, width - padding * 2);
    const targetH = Math.max(0, height - padding * 2);
    const srcW = Math.max(1e-6, bounds.maxX - bounds.minX);
    const srcH = Math.max(1e-6, bounds.maxY - bounds.minY);
    const scale = Math.min(targetW / srcW, targetH / srcH);
    const xOffset = (width - srcW * scale) / 2;
    const yOffset = (height - srcH * scale) / 2;

    const toPx = (lon: number, lat: number): [number, number] => {
      const x = (lon - bounds.minX) * scale + xOffset;
      // Invert Y for SVG (lat increases upwards)
      const y = (bounds.maxY - lat) * scale + yOffset;
      return [x, y];
    };

    const isIndia = feature.properties?.name === "India";
    const maxPointsCap = isIndia ? 400 : 1200;
    const pixelTolerance = isIndia ? 1.6 : 0.9; // minimum pixel move to keep a vertex
    const minRingBBoxAreaPx = isIndia ? 900 : 256; // skip tiny rings

    // Ensure ring is closed
    function ensureClosed(ring: LonLat[]): LonLat[] {
      if (ring.length === 0) return ring;
      const first = ring[0];
      const last = ring[ring.length - 1];
      const isClosed = first[0] === last[0] && first[1] === last[1];
      return isClosed ? ring : [...ring, first];
    }

    // Drop rings with tiny projected bounding boxes to reduce complexity
    function ringProjectedBBoxAreaPx(ring: LonLat[]): number {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [lon, lat] of ring) {
        const [x, y] = toPx(lon, lat);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const w = Math.max(0, maxX - minX);
      const h = Math.max(0, maxY - minY);
      return w * h;
    }

    // Simple pixel-distance based decimation in projected (screen) space
    function simplifyByPixelTolerance(ring: LonLat[], tolPx: number, cap: number): LonLat[] {
      const closed = ensureClosed(ring);
      const n = closed.length;
      if (n <= 2) return closed;
      const kept: LonLat[] = [];
      const tolSq = tolPx * tolPx;
      const first = closed[0];
      kept.push(first);
      let [lastX, lastY] = toPx(first[0], first[1]);
      for (let i = 1; i < n - 1; i++) {
        const [lon, lat] = closed[i];
        const [x, y] = toPx(lon, lat);
        const dx = x - lastX;
        const dy = y - lastY;
        if (dx * dx + dy * dy >= tolSq) {
          kept.push([lon, lat]);
          lastX = x;
          lastY = y;
          if (kept.length >= cap - 1) {
            break;
          }
        }
      }
      // ensure closure
      kept.push(first);
      if (kept.length < 4) {
        // fall back to sampling evenly to reach minimum polygon
        const step = Math.max(1, Math.floor(n / 4));
        const sampled: LonLat[] = [];
        for (let i = 0; i < n - 1; i += step) sampled.push(closed[i]);
        sampled.push(first);
        return sampled;
      }
      return kept;
    }

    // Ensure ring is closed and decimate points for performance on complex countries
    function normalizeAndSimplifyRing(ring: LonLat[], maxPoints = maxPointsCap, tolPx = pixelTolerance): LonLat[] {
      const closed = ensureClosed(ring);
      // Skip if tiny
      if (ringProjectedBBoxAreaPx(closed) < minRingBBoxAreaPx) {
        return [];
      }
      const n = closed.length;
      if (n <= maxPoints) {
        // still run a small pixel simplification to avoid near-duplicates
        return simplifyByPixelTolerance(closed, tolPx, maxPoints);
      }
      return simplifyByPixelTolerance(closed, tolPx, maxPoints);
    }

    let d = "";
    for (const rings of ringsGroups) {
      // Outer ring first, then holes
      rings.forEach((ring) => {
        const simplified = normalizeAndSimplifyRing(ring);
        if (simplified.length === 0) return;
        simplified.forEach((pt, idx) => {
          const [x, y] = toPx(pt[0], pt[1]);
          if (idx === 0) {
            d += `M${x.toFixed(2)},${y.toFixed(2)}`;
          } else {
            d += `L${x.toFixed(2)},${y.toFixed(2)}`;
          }
        });
        // Close each ring
        d += "Z";
      });
    }
    return d;
  }

  // Build path from precomputed rings without simplification
  function buildCountryPathFromPrecomputed(name: string, width: number, height: number, padding: number): string | null {
    const data = precomputedRings.get(name);
    if (!data) return null;
    const { ringsGroups, bounds } = data;
    const targetW = Math.max(0, width - padding * 2);
    const targetH = Math.max(0, height - padding * 2);
    const srcW = Math.max(1e-6, bounds.maxX - bounds.minX);
    const srcH = Math.max(1e-6, bounds.maxY - bounds.minY);
    const scale = Math.min(targetW / srcW, targetH / srcH);
    const xOffset = (width - srcW * scale) / 2;
    const yOffset = (height - srcH * scale) / 2;
    const toPx = (lon: number, lat: number): [number, number] => {
      const x = (lon - bounds.minX) * scale + xOffset;
      const y = (bounds.maxY - lat) * scale + yOffset;
      return [x, y];
    };
    let d = "";
    for (const rings of ringsGroups) {
      for (const ring of rings) {
        if (!ring || ring.length === 0) continue;
        ring.forEach((pt, idx) => {
          const [x, y] = toPx(pt[0], pt[1]);
          if (idx === 0) d += `M${x.toFixed(2)},${y.toFixed(2)}`;
          else d += `L${x.toFixed(2)},${y.toFixed(2)}`;
        });
        d += "Z";
      }
    }
    return d;
  }

  // Measure wrapper size for positioning the silhouettes
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setWrapperSize({ width: rect.width, height: rect.height });
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Build Sigma graph for visible clusters
  useEffect(() => {
    if (!containerRef.current) return;
    // Cleanup previous renderer
    if (rendererRef.current) {
      rendererRef.current.kill();
      rendererRef.current = null;
    }

    const graph = new Graph();

    // Stable hue/lightness per cuisine; saturation varies by progress (0..3)
    const CUISINE_HL: Record<Cuisine, { h: number; l: number }> = {
      "Indian": { h: 265, l: 55 },         // violet
      "Japanese": { h: 145, l: 45 },       // green
      "Peruvian": { h: 0, l: 50 },         // red
      "Italian": { h: 38, l: 52 },         // amber
      "Irish": { h: 200, l: 50 },          // sky
    };
    function hslToHex(h: number, s: number, l: number): string {
      // h in [0,360], s,l in [0,100]
      s /= 100;
      l /= 100;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hp = h / 60;
      const x = c * (1 - Math.abs((hp % 2) - 1));
      let r1 = 0, g1 = 0, b1 = 0;
      if (hp >= 0 && hp < 1) { r1 = c; g1 = x; b1 = 0; }
      else if (hp >= 1 && hp < 2) { r1 = x; g1 = c; b1 = 0; }
      else if (hp >= 2 && hp < 3) { r1 = 0; g1 = c; b1 = x; }
      else if (hp >= 3 && hp < 4) { r1 = 0; g1 = x; b1 = c; }
      else if (hp >= 4 && hp < 5) { r1 = x; g1 = 0; b1 = c; }
      else { r1 = c; g1 = 0; b1 = x; }
      const m = l - c / 2;
      const r = Math.round((r1 + m) * 255);
      const g = Math.round((g1 + m) * 255);
      const b = Math.round((b1 + m) * 255);
      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    const colorFor = (cuisine: Cuisine, recipeName: string) => {
      const base = CUISINE_HL[cuisine];
      const count = Math.max(0, Math.min(3, recipeProgress[recipeName] ?? 0));
      // More pronounced saturation steps
      const s = count === 0 ? 30 : count === 1 ? 75 : count === 2 ? 90 : 100;
      return hslToHex(base.h, s, base.l);
    };
    const nodeIdToRecipe = new Map<string, Recipe>();

    // Position clusters along a horizontal line y ~ 0, dynamic centers based on viewport size
    const centers = viewport.size === 2 ? [-30, 30] : [-50, 0, 50];
    // deterministic seeded PRNG to keep node positions stable across viewport changes
    function stringToSeed(str: string): number {
      let h = 2166136261; // FNV-1a basis
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }
    function mulberry32(a: number) {
      return function () {
        let t = (a += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    viewport.slice.forEach((cluster, clusterIdx) => {
      const centerX = centers[clusterIdx] ?? 0;
      const centerY = 0;
      // color computed per-recipe below to reflect progress saturation

      // cap nodes per cluster for readability
      const nodes = cluster.recipes.slice(0, 20);
      nodes.forEach((r, i) => {
        const id = `${cluster.cuisine}-${i}`;

        // Radial: random inside a circle (deterministic per cuisine+recipe)
        const seed = stringToSeed(`${cluster.cuisine}|${r.name}`);
        const rand = mulberry32(seed);
        const u = rand(); // 0..1
        const v = rand(); // 0..1
        const maxRadius = 22; // cluster radius
        const radius = Math.sqrt(u) * maxRadius; // uniform in circle
        const angle = 2 * Math.PI * v;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        graph.addNode(id, {
          x,
          y,
          size: 6,
          label: r.name,
          color: colorFor(cluster.cuisine as Cuisine, r.name),
          cluster: cluster.cuisine,
        });
        nodeIdToRecipe.set(id, r);
      });
    });

    const renderer = new Sigma(graph, containerRef.current, {
      renderLabels: false,
      allowInvalidContainer: false,
    } as any);

    // Lock camera zoom to current ratio and prevent panning/zooming interactions
    const camera = renderer.getCamera();
    const current = camera.getState();
    try {
      (renderer as any).setSetting?.("minCameraRatio", current.ratio);
      (renderer as any).setSetting?.("maxCameraRatio", current.ratio);
    } catch {}
    camera.on("updated", () => {
      // Re-lock camera state (ratio, position) if anything attempts to change it
      const st = camera.getState();
      if (st.ratio !== current.ratio || st.x !== current.x || st.y !== current.y) {
        camera.setState({ x: current.x, y: current.y, ratio: current.ratio });
      }
    });
    const mouse = renderer.getMouseCaptor();
    const touch = renderer.getTouchCaptor();
    const preventAll = (e: any) => {
      if (e?.preventSigmaDefault) e.preventSigmaDefault();
    };
    mouse.on("wheel", preventAll);
    mouse.on("mousedown", preventAll);
    mouse.on("mousemove", preventAll);
    mouse.on("mouseup", preventAll);
    mouse.on("rightClick", preventAll);
    // Note: touch events omitted to satisfy typings; camera state lock prevents pan/zoom on touch as well

    renderer.on("clickNode", ({ node }) => {
      const recipe = nodeIdToRecipe.get(node);
      if (recipe) onSelectRecipe(recipe);
    });

    rendererRef.current = renderer;

    return () => {
      renderer.kill();
      rendererRef.current = null;
    };
  }, [viewport.slice, onSelectRecipe, recipeProgress]);

  return (
    <section className="py-mobile px-mobile">
      <div className="container-mobile">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Recipe Cluster Viewer</h2>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 mb-6 w-full">
          {clusters.map((c, idx) => {
            const isVisible = idx >= viewport.start && idx < viewport.end;
            return (
              <button
                key={c.cuisine}
                onClick={() => selectCluster(idx)}
                className={clsx(
                  "w-full px-3 py-2 rounded-md border transition-smooth text-sm sm:text-base",
                  isVisible ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  idx === activeIndex ? "ring-2 ring-ring" : "ring-0"
                )}
                title={c.cuisine}
              >
                {c.cuisine}
              </button>
            );
          })}
        </div>

        {/* Line with arrows */}
        <div className="flex items-center gap-2 mb-4">
          <ChevronLeft
            className={clsx("w-5 h-5", canScrollLeft ? "text-foreground cursor-pointer" : "text-muted-foreground/50")}
            onClick={() => canScrollLeft && setViewportStart(v => Math.max(0, v - 1))}
          />
          <div className="h-0.5 w-full bg-border relative">
            {/* simple indicators for hidden clusters */}
            {canScrollLeft && <div className="absolute left-0 -top-1 text-xs text-muted-foreground">◀</div>}
            {canScrollRight && <div className="absolute right-0 -top-1 text-xs text-muted-foreground">▶</div>}
          </div>
          <ChevronRight
            className={clsx("w-5 h-5", canScrollRight ? "text-foreground cursor-pointer" : "text-muted-foreground/50")}
            onClick={() => canScrollRight && setViewportStart(v => Math.min(clusters.length - 3, v + 1))}
          />
        </div>

        {/* Sigma viewport with country silhouettes overlay */}
        <div ref={wrapperRef} className="border rounded-md h-64 sm:h-80 mb-6 bg-muted/20 relative">
          {/* Silhouettes overlay (behind graph) */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Render one silhouette per visible cluster */}
            {wrapperSize.width > 0 && wrapperSize.height > 0 && viewport.slice.map((cluster, idx) => {
              // Determine country by recipe origin (consistent within cluster)
              const countryName = cluster.recipes[0]?.origin;
              const feat = countryName ? countryNameToFeature.get(countryName) : undefined;
              if (!feat) return null;

              // Position horizontally by evenly spaced columns
              const n = viewport.size;
              const fracX = (idx + 0.5) / n; // 0..1 center of column
              const centerX = wrapperSize.width * fracX;
              const centerY = wrapperSize.height * 0.5;

              // Size: fit within column width with margins
              const columnWidth = wrapperSize.width / n;
              const maxW = columnWidth * 0.7;
              const maxH = wrapperSize.height * 0.75;
              const svgW = maxW;
              const svgH = maxH;
              const left = centerX - svgW / 2;
              const top = centerY - svgH / 2;

              const precomputed = buildCountryPathFromPrecomputed(countryName, svgW, svgH, 8);
              const pathD = precomputed ?? buildCountryPath(feat, svgW, svgH, 8);
              // Subtle neutral fill behind points
              try {
                return (
                  <svg
                    key={`${cluster.cuisine}-${countryName}`}
                    width={svgW}
                    height={svgH}
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    style={{ position: "absolute", left, top, opacity: 0.16, transform: "translateZ(0)" }}
                    aria-hidden="true"
                  >
                    <path d={pathD} fill="currentColor" className="text-foreground" fillRule="evenodd" />
                  </svg>
                );
              } catch {
                return null;
              }
            })}
          </div>

          {/* Sigma canvas (above) */}
          <div ref={containerRef} className="absolute inset-0 z-10 w-full h-full bg-muted/20" />
        </div>

        {/* List view removed as requested */}
      </div>
    </section>
  );
}



// design-token-lint-ignore — inline hex literals for Three.js material params; tracked for refactor.
import { C } from "../../lib/colors";
import type { ProjectedNode, Edge } from "../../types";
import { NODE_LABELS } from "../../data/node-labels";

interface TrackedNode {
  index: number;
  color: string;
}

interface HLNode {
  index: number;
  label?: string;
}

interface GreenZone {
  from: number;
  to: number;
}

interface NodeMeshRendererProps {
  projected: ProjectedNode[];
  edges: Edge[];
  baseColor?: string;
  greenSet?: Set<number>;
  activeNodes?: number[];
  trackedNodes?: TrackedNode[];
  hlNodes?: HLNode[];
  greenZones?: GreenZone[];
  hlColor?: string;
  onNodeClick?: (nodeId: number) => void;
}

export function NodeMeshRenderer({
  projected,
  edges,
  baseColor = C.brown,
  greenSet = new Set(),
  activeNodes = [],
  trackedNodes = [],
  hlNodes = [],
  greenZones = [],
  hlColor = C.brownLight,
  onNodeClick,
}: NodeMeshRendererProps) {
  const activeSet = new Set(activeNodes);

  return (
    <g>
      {/* Edges */}
      {edges.map((e, idx) => {
        const a = projected[e.a];
        const b = projected[e.b];
        const avg = (a.depth + b.depth) / 2;
        const aGreen =
          greenSet.has(e.a) ||
          greenZones.some((gz) => e.a >= gz.from && e.a <= gz.to);
        const bGreen =
          greenSet.has(e.b) ||
          greenZones.some((gz) => e.b >= gz.from && e.b <= gz.to);
        const bothGreen = aGreen && bGreen;
        return (
          <line
            key={idx}
            x1={a.px} y1={a.py} x2={b.px} y2={b.py}
            stroke={bothGreen ? C.green : C.brownDark}
            strokeWidth={0.5}
            opacity={avg * (bothGreen ? 0.22 : 0.12)}
          />
        );
      })}

      {/* Nodes — depth-sorted */}
      {[...projected]
        .sort((a, b) => a.depth - b.depth)
        .map((p) => {
          const isConverted = greenSet.has(p.i);
          const isActive = activeSet.has(p.i);
          const isHL = hlNodes.some((h) => h.index === p.i);
          const hn = hlNodes.find((h) => h.index === p.i);
          const isGZ = greenZones.some(
            (gz) => p.i >= gz.from && p.i <= gz.to
          );
          const isTracked = trackedNodes.some((t) => t.index === p.i);
          const trackInfo = trackedNodes.find((t) => t.index === p.i);

          // Core dot color
          let dotColor = baseColor;
          if (isConverted || isGZ) dotColor = C.green;
          else if (isHL) dotColor = hlColor;
          else if (isTracked) dotColor = trackInfo!.color;

          const isSpecial = isConverted || isActive || isHL || isGZ || isTracked;
          const label = isActive
            ? NODE_LABELS[p.i]
            : isHL && hn?.label
              ? hn.label
              : undefined;

          return (
            <g
              key={p.i}
              style={onNodeClick && p.depth > 0.3 ? { cursor: "pointer" } : undefined}
              onClick={
                onNodeClick && p.depth > 0.3
                  ? () => onNodeClick(p.i)
                  : undefined
              }
            >
              {/* Active target: BLUE HALO */}
              {isActive && p.depth > 0.15 && (
                <>
                  <circle
                    cx={p.px} cy={p.py} r={p.size * 8}
                    fill={C.activeGlow} opacity={p.depth * 0.04}
                  >
                    <animate
                      attributeName="opacity"
                      values={`${p.depth * 0.02};${p.depth * 0.05};${p.depth * 0.02}`}
                      dur="3s" repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={p.px} cy={p.py} r={p.size * 5}
                    fill={C.activeSoft} opacity={p.depth * 0.06}
                  >
                    <animate
                      attributeName="opacity"
                      values={`${p.depth * 0.04};${p.depth * 0.08};${p.depth * 0.04}`}
                      dur="2.5s" repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={p.px} cy={p.py} r={p.size * 3.2}
                    fill={C.active} opacity={p.depth * 0.08}
                  />
                  <circle
                    cx={p.px} cy={p.py} r={p.size * 3}
                    fill="none" stroke={C.active} strokeWidth={0.8}
                    opacity={p.depth * 0.2} strokeDasharray="2 3"
                  >
                    <animate
                      attributeName="r"
                      values={`${p.size * 2.8};${p.size * 3.8};${p.size * 2.8}`}
                      dur="2.2s" repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values={`${p.depth * 0.15};${p.depth * 0.25};${p.depth * 0.15}`}
                      dur="2.2s" repeatCount="indefinite"
                    />
                  </circle>
                </>
              )}

              {/* Non-active special glow */}
              {!isActive && isSpecial && (
                <circle
                  cx={p.px} cy={p.py}
                  r={p.size * (isTracked ? 4 : 3)}
                  fill={dotColor} opacity={p.depth * 0.07}
                />
              )}

              {/* Tracked node ring */}
              {isTracked && !isActive && p.depth > 0.3 && (
                <circle
                  cx={p.px} cy={p.py} r={p.size * 2.5}
                  fill="none" stroke={trackInfo!.color} strokeWidth={0.8}
                  opacity={p.depth * 0.3} strokeDasharray="2 3"
                />
              )}

              {/* Converted: subtle green pulse */}
              {isConverted && p.depth > 0.3 && (
                <circle
                  cx={p.px} cy={p.py} r={p.size * 2}
                  fill={C.green} opacity={p.depth * 0.08}
                >
                  <animate
                    attributeName="opacity"
                    values={`${p.depth * 0.04};${p.depth * 0.1};${p.depth * 0.04}`}
                    dur="3s" repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* The dot itself */}
              <circle
                cx={p.px} cy={p.py}
                r={
                  isActive
                    ? p.size * 1.8
                    : isSpecial
                      ? p.size * 1.4
                      : p.size
                }
                fill={isActive ? baseColor : dotColor}
                opacity={
                  isActive
                    ? Math.max(0.7, p.depth)
                    : isSpecial
                      ? Math.max(0.5, p.depth)
                      : p.opacity
                }
              />

              {/* Label tooltip */}
              {label && p.depth > 0.4 && (
                <g>
                  <rect
                    x={p.px + 8} y={p.py - 8} rx={3}
                    width={label.length * 5.5 + 12} height={15}
                    fill={
                      isConverted
                        ? C.greenDark
                        : isActive
                          ? "#1e3a5f"
                          : "#292524"
                    }
                    stroke={
                      isConverted
                        ? "#166534"
                        : isActive
                          ? "#3b82f6"
                          : "#44403c"
                    }
                    strokeWidth={0.5} opacity={0.85 * p.depth}
                  />
                  <text
                    x={p.px + 14} y={p.py + 2.5}
                    fill={
                      isConverted
                        ? C.greenLight
                        : isActive
                          ? C.active
                          : C.brightText
                    }
                    fontSize="7.5" fontFamily="'IBM Plex Mono', monospace"
                    opacity={p.depth}
                  >
                    {label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
    </g>
  );
}

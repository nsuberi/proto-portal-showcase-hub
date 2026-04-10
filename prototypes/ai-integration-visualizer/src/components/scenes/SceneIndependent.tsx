import { useMemo } from "react";
import { C } from "../../lib/colors";
import { getNodePos } from "../../lib/projection-utils";
import { useSphereProjection } from "../../hooks/useSphereProjection";
import { PILLAR_CYCLE, SQUAD_CYCLE, P3 } from "../../hooks/useConversion";
import { NodeMeshRenderer } from "../sphere/NodeMeshRenderer";
import { TeamDot } from "../sphere/TeamDot";
import { Spotlight } from "../sphere/Spotlight";
import type { TeamMode } from "../../types";

interface SceneIndependentProps {
  time: number;
  teamMode: TeamMode;
  onNodeClick?: (nodeId: number) => void;
}

export function SceneIndependent({ time, teamMode, onNodeClick }: SceneIndependentProps) {
  const cx = 220, cy = 210, r = 85;
  const m1 = { cx: 460, cy: 170, r: 40 };
  const m2 = { cx: 530, cy: 250, r: 35 };

  const brown = useSphereProjection({
    cx, cy, radius: r, count: 45, thresh: 42, speed: 0.00025, time,
  });
  const g1 = useSphereProjection({
    cx: m1.cx, cy: m1.cy, radius: m1.r, count: 18, thresh: 30,
    speed: 0.0006, time, seedOffset: 3,
  });
  const g2 = useSphereProjection({
    cx: m2.cx, cy: m2.cy, radius: m2.r, count: 15, thresh: 28,
    speed: 0.0008, time, seedOffset: 5,
  });

  const totalSec = time / 1000;
  const cycleDur = teamMode === "pillared" ? PILLAR_CYCLE : SQUAD_CYCLE;
  const totalCycles = Math.floor(totalSec / cycleDur);
  const cycleTime = totalSec % cycleDur;

  const m1Converted = Math.min(totalCycles, 18) % 19;
  const m2Converted =
    Math.min(
      Math.max(0, totalCycles - (teamMode === "pillared" ? 1 : 0)),
      15
    ) % 16;

  const m1GreenSet = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < m1Converted; i++) s.add(i);
    return s;
  }, [m1Converted]);

  const m2GreenSet = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < m2Converted; i++) s.add(i);
    return s;
  }, [m2Converted]);

  const m1Active = m1Converted < 18 ? m1Converted : -1;
  const m2Active = m2Converted < 15 ? m2Converted : -1;
  const m1Pos = m1Active >= 0 ? getNodePos(g1.projected, m1Active) : null;
  const m2Pos = m2Active >= 0 ? getNodePos(g2.projected, m2Active) : null;

  const sq1 = { x: m1.cx - 30, y: m1.cy - m1.r - 45 };
  const sq2 = { x: m2.cx + 10, y: m2.cy - m2.r - 40 };

  const sObs = cycleTime < 3 * P3;
  const sChg = cycleTime >= 3 * P3 && cycleTime < 6 * P3;

  return (
    <g>
      {/* Brown sphere — no conversion */}
      <NodeMeshRenderer
        projected={brown.projected} edges={brown.edges}
        onNodeClick={onNodeClick}
      />

      {/* Boundary */}
      <line
        x1={350} y1={100} x2={350} y2={320}
        stroke={C.line} strokeWidth={0.5} strokeDasharray="3 6" opacity={0.3}
      />
      <text
        x={350} y={92} textAnchor="middle" fill={C.dimText}
        fontSize="6" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2"
      >
        NO CONNECTION
      </text>

      {/* Green moons */}
      <NodeMeshRenderer
        projected={g1.projected} edges={g1.edges}
        baseColor={C.line} greenSet={m1GreenSet}
        activeNodes={m1Active >= 0 ? [m1Active] : []}
      />
      <NodeMeshRenderer
        projected={g2.projected} edges={g2.edges}
        baseColor={C.line} greenSet={m2GreenSet}
        activeNodes={m2Active >= 0 ? [m2Active] : []}
      />

      <text
        x={cx} y={cy + r + 18} textAnchor="middle" fill={C.brown}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="1.5" opacity={0.5}
      >
        BROWNFIELD
      </text>
      <text
        x={(m1.cx + m2.cx) / 2} y={290} textAnchor="middle" fill={C.green}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="1.5" opacity={0.5}
      >
        GREENFIELD
      </text>

      {teamMode === "pillared" ? (
        <g>
          <text
            x={m1.cx} y={m1.cy - m1.r - 30} textAnchor="middle" fill={C.pm}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5" opacity={0.4}
          >
            PRODUCT
          </text>
          {[-10, 0, 10].map((dx, i) => (
            <TeamDot
              key={`p${i}`} x={m1.cx + dx} y={m1.cy - m1.r - 18}
              color={C.pm} pulse={totalCycles % 2 === 0} size={4}
            />
          ))}
          {totalCycles % 2 === 0 && m1Pos && (
            <Spotlight
              fromX={m1.cx} fromY={m1.cy - m1.r - 10}
              toX={m1Pos.x} toY={m1Pos.y} color={C.green} label="building"
            />
          )}
          <text
            x={m2.cx} y={m2.cy - m2.r - 30} textAnchor="middle" fill={C.eng}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5" opacity={0.4}
          >
            ENGINEERING
          </text>
          {[-10, 0, 10].map((dx, i) => (
            <TeamDot
              key={`e${i}`} x={m2.cx + dx} y={m2.cy - m2.r - 18}
              color={C.eng} pulse={totalCycles % 2 === 1} size={4}
            />
          ))}
          {totalCycles % 2 === 1 && m2Pos && (
            <Spotlight
              fromX={m2.cx} fromY={m2.cy - m2.r - 10}
              toX={m2Pos.x} toY={m2Pos.y} color={C.green} label="building"
            />
          )}
        </g>
      ) : (
        <g>
          <text
            x={sq1.x} y={sq1.y - 18} textAnchor="middle" fill={C.brightText}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1" opacity={0.4}
          >
            SQUAD {"\u03b1"}
          </text>
          <TeamDot x={sq1.x - 10} y={sq1.y} color={C.pm} pulse={sObs} size={4} />
          <TeamDot x={sq1.x} y={sq1.y - 7} color={C.eng} pulse={sChg} size={4} />
          <TeamDot x={sq1.x + 10} y={sq1.y} color={C.biz} pulse={!sObs && !sChg} size={4} />
          {m1Pos && (sObs || sChg) && (
            <Spotlight
              fromX={sq1.x} fromY={sq1.y + 10}
              toX={m1Pos.x} toY={m1Pos.y} color={C.green}
              label={sObs ? "building" : "activating"}
            />
          )}

          <text
            x={sq2.x} y={sq2.y - 18} textAnchor="middle" fill={C.brightText}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1" opacity={0.4}
          >
            SQUAD {"\u03b2"}
          </text>
          <TeamDot x={sq2.x - 8} y={sq2.y} color={C.eng} pulse={sObs} size={4} />
          <TeamDot x={sq2.x + 4} y={sq2.y - 6} color={C.pm} pulse={sChg} size={3.5} />
          <TeamDot x={sq2.x + 10} y={sq2.y + 2} color={C.biz} pulse={!sObs && !sChg} size={4} />
          {m2Pos && (sObs || sChg) && (
            <Spotlight
              fromX={sq2.x} fromY={sq2.y + 10}
              toX={m2Pos.x} toY={m2Pos.y} color={C.green}
              label={sObs ? "building" : "activating"}
            />
          )}
        </g>
      )}

      <text
        x={350} y={cy + r + 32} textAnchor="middle" fill={C.dimText}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5"
      >
        {"\u25b8"} Teams build independent green systems from scratch
      </text>
    </g>
  );
}

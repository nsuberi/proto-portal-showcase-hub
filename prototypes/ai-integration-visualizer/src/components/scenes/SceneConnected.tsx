import { useMemo } from "react";
import { C } from "../../lib/colors";
import { getNodePos } from "../../lib/projection-utils";
import { useSphereProjection } from "../../hooks/useSphereProjection";
import { getCurrentPhase, PILLAR_PHASES, PILLAR_CYCLE, SQUAD_CYCLE, P3 } from "../../hooks/useConversion";
import { NodeMeshRenderer } from "../sphere/NodeMeshRenderer";
import { TeamDot } from "../sphere/TeamDot";
import { Spotlight } from "../sphere/Spotlight";
import { DataFlowArc } from "../sphere/DataFlowArc";
import type { TeamMode } from "../../types";

interface SceneConnectedProps {
  time: number;
  teamMode: TeamMode;
  selectedNodeId?: number | null;
  onNodeClick?: (nodeId: number) => void;
}

export function SceneConnected({
  time,
  teamMode,
  selectedNodeId,
  onNodeClick,
}: SceneConnectedProps) {
  const cx = 260, cy = 210, r = 90;
  const moonCx = 500, moonCy = 195, moonR = 45;

  const brown = useSphereProjection({
    cx, cy, radius: r, count: 50, thresh: 44, speed: 0.0003, time,
  });
  const greenMoon = useSphereProjection({
    cx: moonCx, cy: moonCy, radius: moonR, count: 20, thresh: 32,
    speed: 0.0007, time, seedOffset: 2,
  });

  const totalSec = time / 1000;
  const brownTotal = 50;
  const moonTotal = 20;

  const cycleDur = teamMode === "pillared" ? PILLAR_CYCLE : SQUAD_CYCLE;
  const totalCycles = Math.floor(totalSec / cycleDur);
  const cycleTime = totalSec % cycleDur;

  const brownConverted =
    teamMode === "pillared"
      ? Math.min(Math.floor((totalCycles + 1) / 2), brownTotal)
      : Math.min(totalCycles, brownTotal);
  const moonConverted =
    teamMode === "pillared"
      ? Math.min(Math.floor(totalCycles / 2), moonTotal)
      : Math.min(totalCycles, moonTotal);

  const brownGreenSet = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < brownConverted; i++) s.add(i);
    return s;
  }, [brownConverted]);

  const moonGreenSet = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < moonConverted; i++) s.add(i);
    return s;
  }, [moonConverted]);

  const isPillarBrownTurn = teamMode === "pillared" && totalCycles % 2 === 0;
  const isPillarMoonTurn = teamMode === "pillared" && totalCycles % 2 === 1;

  const brownActiveNode = brownConverted < brownTotal ? brownConverted : -1;
  const moonActiveNode = moonConverted < moonTotal ? moonConverted : -1;

  const brownActivePos =
    brownActiveNode >= 0 ? getNodePos(brown.projected, brownActiveNode) : null;
  const moonActivePos =
    moonActiveNode >= 0
      ? getNodePos(greenMoon.projected, moonActiveNode)
      : null;

  const pmZone = { x: cx - 140, y: cy - 130 };
  const engZone = {
    x: (cx + moonCx) / 2,
    y: Math.min(cy, moonCy) - 145,
  };
  const bizZone = { x: moonCx + 60, y: moonCy - 100 };
  const sq1 = { x: cx - 80, y: cy - r - 50 };
  const sq2 = { x: moonCx, y: moonCy - moonR - 50 };

  const sPhaseTime = cycleTime;
  const sObs = sPhaseTime < 3 * P3;
  const sChg = sPhaseTime >= 3 * P3 && sPhaseTime < 6 * P3;

  const phase =
    teamMode === "pillared" ? getCurrentPhase(PILLAR_PHASES, cycleTime) : null;

  // Connected moons: show data exchange annotations when a node is selected
  const hasSelection = selectedNodeId != null;

  return (
    <g>
      {/* Brown sphere */}
      <NodeMeshRenderer
        projected={brown.projected} edges={brown.edges}
        greenSet={brownGreenSet}
        activeNodes={
          teamMode === "pillared"
            ? isPillarBrownTurn && brownActiveNode >= 0
              ? [brownActiveNode]
              : []
            : brownActiveNode >= 0
              ? [brownActiveNode]
              : []
        }
        onNodeClick={onNodeClick}
      />

      {/* Green moon */}
      <NodeMeshRenderer
        projected={greenMoon.projected} edges={greenMoon.edges}
        baseColor={C.line} hlColor={C.greenLight}
        greenSet={moonGreenSet}
        activeNodes={
          teamMode === "pillared"
            ? isPillarMoonTurn && moonActiveNode >= 0
              ? [moonActiveNode]
              : []
            : moonActiveNode >= 0
              ? [moonActiveNode]
              : []
        }
      />

      {/* Data flow arcs */}
      <DataFlowArc
        x1={cx + r - 5} y1={cy - 25}
        x2={moonCx - moonR + 5} y2={moonCy - 15}
        curveY={-50} color={C.brownLight}
        highlight={hasSelection}
        annotation={hasSelection ? "data bundle \u2192" : undefined}
      />
      <DataFlowArc
        x1={moonCx - moonR + 5} y1={moonCy + 15}
        x2={cx + r - 5} y2={cy + 25}
        curveY={40} color={C.green}
        highlight={hasSelection}
        annotation={hasSelection ? "\u2190 enriched result" : undefined}
      />

      <text
        x={cx} y={cy + r + 18} textAnchor="middle" fill={C.brown}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="1.5" opacity={0.5}
      >
        SYSTEM OF RECORD
      </text>
      <text
        x={moonCx} y={moonCy + moonR + 18} textAnchor="middle" fill={C.green}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="1.5" opacity={0.5}
      >
        AI MOON
      </text>

      {teamMode === "pillared" ? (
        <g>
          <text
            x={pmZone.x} y={pmZone.y - 25} textAnchor="middle" fill={C.pm}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5" opacity={phase?.who === "pm" ? 0.8 : 0.3}
          >
            PRODUCT
          </text>
          <text
            x={engZone.x} y={engZone.y - 25} textAnchor="middle" fill={C.eng}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5" opacity={phase?.who === "eng" ? 0.8 : 0.3}
          >
            ENGINEERING
          </text>
          <text
            x={bizZone.x} y={bizZone.y - 25} textAnchor="middle" fill={C.biz}
            fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="1.5" opacity={phase?.who === "biz" ? 0.8 : 0.3}
          >
            BUSINESS
          </text>
          {[-10, 0, 10].map((dx, i) => (
            <TeamDot key={`pm${i}`} x={pmZone.x + dx} y={pmZone.y} color={C.pm} pulse={phase?.who === "pm"} size={4} />
          ))}
          {[-10, 0, 10].map((dx, i) => (
            <TeamDot key={`eng${i}`} x={engZone.x + dx} y={engZone.y} color={C.eng} pulse={phase?.who === "eng"} size={4} />
          ))}
          {[-10, 0, 10].map((dx, i) => (
            <TeamDot key={`biz${i}`} x={bizZone.x + dx} y={bizZone.y} color={C.biz} pulse={phase?.who === "biz"} size={4} />
          ))}
          {phase?.action === "observe" && isPillarBrownTurn && brownActivePos && (
            <Spotlight
              fromX={phase.who === "pm" ? pmZone.x : phase.who === "eng" ? engZone.x : bizZone.x}
              fromY={(phase.who === "pm" ? pmZone.y : phase.who === "eng" ? engZone.y : bizZone.y) + 8}
              toX={brownActivePos.x} toY={brownActivePos.y}
              color={phase.who === "pm" ? C.pm : phase.who === "eng" ? C.eng : C.biz}
            />
          )}
          {phase?.action === "observe" && isPillarMoonTurn && moonActivePos && (
            <Spotlight
              fromX={phase.who === "pm" ? pmZone.x : phase.who === "eng" ? engZone.x : bizZone.x}
              fromY={(phase.who === "pm" ? pmZone.y : phase.who === "eng" ? engZone.y : bizZone.y) + 8}
              toX={moonActivePos.x} toY={moonActivePos.y}
              color={C.green}
            />
          )}
          <text
            x={(cx + moonCx) / 2} y={cy + r + 32} textAnchor="middle"
            fill={C.dimText} fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="0.5"
          >
            {isPillarBrownTurn
              ? "\u25b8 Pillars working on brown sphere"
              : "\u25b8 Pillars adding green nodes to moon"}
          </text>
        </g>
      ) : (
        <g>
          {/* Squad alpha → brown sphere */}
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
          {brownActivePos && (sObs || sChg) && (
            <Spotlight
              fromX={sq1.x} fromY={sq1.y + 10}
              toX={brownActivePos.x} toY={brownActivePos.y}
              color={C.pm} label={sObs ? "observing" : "changing"}
            />
          )}
          {/* Squad beta → green moon */}
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
          {moonActivePos && (sObs || sChg) && (
            <Spotlight
              fromX={sq2.x} fromY={sq2.y + 10}
              toX={moonActivePos.x} toY={moonActivePos.y}
              color={C.green} label={sObs ? "building" : "activating"}
            />
          )}
          <text
            x={(cx + moonCx) / 2} y={cy + r + 32} textAnchor="middle"
            fill={C.dimText} fontSize="7" fontFamily="'IBM Plex Mono', monospace"
            letterSpacing="0.5"
          >
            {"\u25b8"} Squad {"\u03b1"} converts brown {"\u00b7"} Squad {"\u03b2"} builds green moon
          </text>
        </g>
      )}
    </g>
  );
}

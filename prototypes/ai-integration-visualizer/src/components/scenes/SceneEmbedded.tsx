import { useMemo } from "react";
import { C } from "../../lib/colors";
import { getNodePos } from "../../lib/projection-utils";
import { useSphereProjection } from "../../hooks/useSphereProjection";
import {
  useConversion,
  getCurrentPhase,
  PILLAR_PHASES,
  P3,
} from "../../hooks/useConversion";
import { CONVERSION_ORDER } from "../../data/conversion-order";
import { NodeMeshRenderer } from "../sphere/NodeMeshRenderer";
import { TeamDot } from "../sphere/TeamDot";
import { Spotlight } from "../sphere/Spotlight";
import { DocPacket } from "../sphere/DocPacket";
import type { TeamMode } from "../../types";

interface SceneEmbeddedProps {
  time: number;
  teamMode: TeamMode;
  onNodeClick?: (nodeId: number) => void;
}

export function SceneEmbedded({ time, teamMode, onNodeClick }: SceneEmbeddedProps) {
  const cx = 350,
    cy = 210,
    r = 95;
  const { projected, edges } = useSphereProjection({
    cx, cy, radius: r, count: 55, thresh: 46, speed: 0.0003, time,
  });

  const totalSec = time / 1000;
  const totalNodes = CONVERSION_ORDER.length;
  const { greenCount, allDone, cycleTime } = useConversion(
    totalSec, teamMode, totalNodes, 3
  );

  const pmZone = { x: cx - 150, y: cy - 135 };
  const engZone = { x: cx, y: cy - 155 };
  const bizZone = { x: cx + 150, y: cy - 135 };
  const s1 = { x: cx - 95, y: cy - r - 45 };
  const s2 = { x: cx + 85, y: cy - r - 38 };

  // Green set: first greenCount nodes in conversion order
  const greenSet = useMemo(() => {
    const s = new Set<number>();
    for (let i = 0; i < greenCount; i++) s.add(CONVERSION_ORDER[i]);
    return s;
  }, [greenCount]);

  // Active targets: next unconverted nodes
  const squadCount = teamMode === "pillared" ? 1 : 3;
  const activeCount = allDone
    ? 0
    : Math.min(squadCount, totalNodes - greenCount);
  const activeIndices: number[] = [];
  for (let i = 0; i < activeCount; i++) {
    activeIndices.push(CONVERSION_ORDER[greenCount + i]);
  }

  // Squad: lights off at 6*P3
  const lightsOff = teamMode !== "pillared" && cycleTime >= 6 * P3;

  const displayGreen = useMemo(() => {
    const s = new Set(greenSet);
    if (lightsOff) activeIndices.forEach((n) => s.add(n));
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greenSet, lightsOff, activeIndices.join(",")]);

  const displayActive = lightsOff ? [] : activeIndices;
  const displayCount = displayGreen.size;
  const progress = displayCount / totalNodes;

  // ── PILLARED ──
  if (teamMode === "pillared") {
    const activeNode = activeIndices[0] ?? -1;
    const activePos =
      activeNode >= 0 ? getNodePos(projected, activeNode) : null;
    const phase = getCurrentPhase(PILLAR_PHASES, cycleTime);
    const pmActive = phase.who === "pm";
    const engActive = phase.who === "eng";
    const bizActive = phase.who === "biz";
    const isDoc = phase.action === "doc";
    const isWrite = phase.action === "write";
    let docProgress = 0;
    if (isDoc) {
      docProgress = Math.min(
        1,
        (cycleTime - phase.start) / (phase.end - phase.start)
      );
    }
    const zones: Record<string, { x: number; y: number }> = {
      pm: pmZone,
      eng: engZone,
      biz: bizZone,
    };

    return (
      <g>
        <NodeMeshRenderer
          projected={projected} edges={edges}
          greenSet={greenSet}
          activeNodes={activeNode >= 0 ? [activeNode] : []}
          onNodeClick={onNodeClick}
        />
        <text
          x={pmZone.x} y={pmZone.y - 28} textAnchor="middle" fill={C.pm}
          fontSize="7" fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="1.5" opacity={pmActive ? 0.8 : 0.3}
        >
          PRODUCT
        </text>
        <text
          x={engZone.x} y={engZone.y - 28} textAnchor="middle" fill={C.eng}
          fontSize="7" fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="1.5" opacity={engActive ? 0.8 : 0.3}
        >
          ENGINEERING
        </text>
        <text
          x={bizZone.x} y={bizZone.y - 28} textAnchor="middle" fill={C.biz}
          fontSize="7" fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="1.5" opacity={bizActive ? 0.8 : 0.3}
        >
          BUSINESS
        </text>
        <line
          x1={cx - 70} y1={cy - 175} x2={cx - 70} y2={cy - 105}
          stroke={C.line} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.2}
        />
        <line
          x1={cx + 70} y1={cy - 175} x2={cx + 70} y2={cy - 105}
          stroke={C.line} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.2}
        />
        {[-10, 0, 10].map((dx, i) => (
          <TeamDot key={`pm${i}`} x={pmZone.x + dx} y={pmZone.y} color={C.pm} pulse={pmActive} size={4} />
        ))}
        {[-10, 0, 10].map((dx, i) => (
          <TeamDot key={`eng${i}`} x={engZone.x + dx} y={engZone.y} color={C.eng} pulse={engActive} size={4} />
        ))}
        {[-10, 0, 10].map((dx, i) => (
          <TeamDot key={`biz${i}`} x={bizZone.x + dx} y={bizZone.y} color={C.biz} pulse={bizActive} size={4} />
        ))}
        {pmActive && activePos && phase.action === "observe" && (
          <Spotlight
            fromX={pmZone.x} fromY={pmZone.y + 8}
            toX={activePos.x} toY={activePos.y} color={C.pm}
            label={phase.id === "pm_review" ? "reviewing" : "observing"}
          />
        )}
        {engActive && activePos && phase.action === "observe" && (
          <Spotlight
            fromX={engZone.x} fromY={engZone.y + 8}
            toX={activePos.x} toY={activePos.y} color={C.eng}
            label={phase.id.includes("2") ? "implementing" : "analyzing"}
          />
        )}
        {bizActive && activePos && phase.action === "observe" && (
          <Spotlight
            fromX={bizZone.x} fromY={bizZone.y + 8}
            toX={activePos.x} toY={activePos.y} color={C.biz}
            label="validating"
          />
        )}
        {isWrite && phase.who && (
          <g>
            <rect
              x={zones[phase.who].x - 16} y={zones[phase.who].y + 14}
              width={32} height={11} rx={2} fill={C.doc} opacity={0.12}
            />
            <text
              x={zones[phase.who].x} y={zones[phase.who].y + 22}
              textAnchor="middle" fill={C.doc} fontSize="5.5"
              fontFamily="'IBM Plex Mono', monospace" opacity={0.55}
            >
              writing...
            </text>
          </g>
        )}
        {isDoc && phase.from && phase.to && (
          <DocPacket
            fromX={
              zones[phase.from].x +
              (zones[phase.from].x > cx ? -20 : 20)
            }
            fromY={zones[phase.from].y}
            toX={
              zones[phase.to].x +
              (zones[phase.to].x > cx
                ? -20
                : zones[phase.to].x < cx
                  ? 20
                  : 0)
            }
            toY={zones[phase.to].y}
            progress={docProgress}
          />
        )}
        <text
          x={cx} y={cy + r + 32} textAnchor="middle" fill={C.dimText}
          fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5"
        >
          {allDone
            ? "\u25b8 All nodes converted \u2014 resetting..."
            : phase.label}
        </text>
        <g>
          <text
            x={cx - 80} y={cy + r + 50} fill={C.dimText} fontSize="6"
            fontFamily="'IBM Plex Mono', monospace"
          >
            {greenCount}/{totalNodes} converted
          </text>
          <rect
            x={cx - 80} y={cy + r + 54} width={160} height={3}
            rx={1.5} fill={C.line}
          />
          <rect
            x={cx - 80} y={cy + r + 54}
            width={160 * (greenCount / totalNodes)}
            height={3} rx={1.5} fill={C.green} opacity={0.7}
          />
        </g>
      </g>
    );
  }

  // ── SQUADS ──
  const sPositions = activeIndices.map((n) => getNodePos(projected, n));
  const squadPhases = [
    { start: 0, end: 3 * P3, id: "observe", label: "\u25b8 Each squad observes their target node" },
    { start: 3 * P3, end: 6 * P3, id: "change", label: "\u25b8 Squads implement changes on their nodes" },
    { start: 6 * P3, end: 7.5 * P3, id: "review", label: "\u25b8 Nodes converted \u2014 squads review outcomes" },
    { start: 7.5 * P3, end: 8 * P3, id: "convert", label: "\u25b8 Moving to next targets..." },
  ];
  const sPhase =
    squadPhases.find((p) => cycleTime >= p.start && cycleTime < p.end) ||
    squadPhases[squadPhases.length - 1];
  const sObs = sPhase.id === "observe";
  const sChg = sPhase.id === "change";

  const s3 = { x: cx, y: cy - r - 55 };
  const squadDefs = [
    {
      pos: s1, name: "SQUAD \u03b1", color: C.pm,
      dots: [
        { dx: -10, dy: 0, c: C.pm, s: 4 },
        { dx: 0, dy: -7, c: C.eng, s: 4 },
        { dx: 10, dy: 0, c: C.biz, s: 4 },
        { dx: 3, dy: 8, c: C.eng, s: 3.5 },
      ],
    },
    {
      pos: s3, name: "SQUAD \u03b2", color: C.eng,
      dots: [
        { dx: -8, dy: 0, c: C.eng, s: 4 },
        { dx: 4, dy: -6, c: C.pm, s: 3.5 },
        { dx: 10, dy: 2, c: C.biz, s: 4 },
      ],
    },
    {
      pos: s2, name: "SQUAD \u03b3", color: C.biz,
      dots: [
        { dx: -10, dy: 0, c: C.biz, s: 4 },
        { dx: 0, dy: -7, c: C.pm, s: 3.5 },
        { dx: 10, dy: 0, c: C.eng, s: 4 },
      ],
    },
  ];

  return (
    <g>
      <NodeMeshRenderer
        projected={projected} edges={edges}
        greenSet={displayGreen} activeNodes={displayActive}
        onNodeClick={onNodeClick}
      />
      {squadDefs.map((sq, si) => {
        const hasTarget = si < activeIndices.length;
        const isIdle = !hasTarget;
        return (
          <g key={sq.name}>
            <text
              x={sq.pos.x} y={sq.pos.y - 18} textAnchor="middle"
              fill={C.brightText} fontSize="7"
              fontFamily="'IBM Plex Mono', monospace"
              letterSpacing="1" opacity={isIdle ? 0.2 : 0.4}
            >
              {sq.name}
              {isIdle ? " (idle)" : ""}
            </text>
            {sq.dots.map((d, di) => (
              <TeamDot
                key={di}
                x={sq.pos.x + d.dx} y={sq.pos.y + d.dy}
                color={d.c}
                pulse={
                  !isIdle &&
                  (di === 0 ? sObs : di === 1 ? sChg : !sObs && !sChg)
                }
                size={d.s}
              />
            ))}
            {hasTarget && sPositions[si] && (sObs || sChg) && (
              <Spotlight
                fromX={sq.pos.x} fromY={sq.pos.y + 10}
                toX={sPositions[si]!.x} toY={sPositions[si]!.y}
                color={sq.color}
                label={sObs ? "observing" : "changing"}
              />
            )}
          </g>
        );
      })}
      <text
        x={cx} y={cy + r + 32} textAnchor="middle" fill={C.dimText}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5"
      >
        {allDone
          ? "\u25b8 All nodes converted \u2014 resetting..."
          : sPhase.label}
      </text>
      <g>
        <text
          x={cx - 80} y={cy + r + 50} fill={C.dimText} fontSize="6"
          fontFamily="'IBM Plex Mono', monospace"
        >
          {displayCount}/{totalNodes} converted
        </text>
        <rect
          x={cx - 80} y={cy + r + 54} width={160} height={3}
          rx={1.5} fill={C.line}
        />
        <rect
          x={cx - 80} y={cy + r + 54} width={160 * progress} height={3}
          rx={1.5} fill={C.green} opacity={0.7}
        />
      </g>
    </g>
  );
}

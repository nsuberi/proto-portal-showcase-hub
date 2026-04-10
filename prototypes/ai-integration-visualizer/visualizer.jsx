import { useState, useEffect, useRef, useMemo } from "react";

const C = {
  bg: "#08080c",
  pm: "#818cf8",
  eng: "#f472b6",
  biz: "#fbbf24",
  doc: "#c4b5fd",
  brown: "#d97706",      // amber — the default sphere node color
  brownLight: "#f59e0b", // lighter amber for highlights
  brownDark: "#92400e",  // darker amber for edges
  green: "#10b981",
  greenLight: "#6ee7b7",
  greenDark: "#14532d",
  // Active target: soft blue halo
  active: "#60a5fa",       // blue-400
  activeSoft: "#3b82f6",   // blue-500
  activeGlow: "#2563eb",   // blue-600
  line: "#27272a",
  dimText: "#3f3f46",
  midText: "#52525b",
  brightText: "#a1a1aa",
  white: "#f4f4f5",
};

// All 55 sphere nodes — targets for embedded conversion
const EMBED_TARGET_NODES = Array.from({ length: 55 }, (_, i) => i);

const NODE_LABELS = {
  0: "intake-router", 1: "auth-gateway", 2: "session-mgr",
  3: "form-validator", 4: "data-mapper", 5: "intake-flow",
  6: "queue-handler", 7: "event-bus", 8: "cache-layer",
  9: "rate-limiter", 10: "risk-scoring", 11: "credit-check",
  12: "identity-verify", 13: "doc-classifier", 14: "ocr-engine",
  15: "pdf-parser", 16: "data-enrichment", 17: "approval-gate",
  18: "workflow-engine", 19: "notification-svc", 20: "email-sender",
  21: "sms-gateway", 22: "doc-review", 23: "audit-logger",
  24: "compliance-rule", 25: "reg-matcher", 26: "policy-engine",
  27: "eligibility", 28: "pricing-calc", 29: "fee-schedule",
  30: "payment-proc", 31: "escrow-mgr", 32: "fund-transfer",
  33: "compliance-chk", 34: "fraud-detect", 35: "aml-screen",
  36: "sanctions-chk", 37: "report-gen", 38: "audit-trail",
  39: "archive-svc", 40: "search-index", 41: "analytics-agg",
  42: "data-extract", 43: "etl-pipeline", 44: "data-warehouse",
  45: "bi-connector", 46: "dashboard-api", 47: "alert-engine",
  48: "routing-logic", 49: "load-balancer", 50: "disclosure-gen",
  51: "template-mgr", 52: "signing-svc", 53: "delivery-track",
  54: "feedback-loop",
};

/* ═══════════════════════════
   GEOMETRY
   ═══════════════════════════ */
function fibSphere(count, radius, seed = 0) {
  const pts = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rY = Math.sqrt(1 - y * y);
    const th = ga * i + seed;
    pts.push({
      x: Math.cos(th) * rY * radius, y: y * radius, z: Math.sin(th) * rY * radius,
      size: 1.2 + ((i * 7 + Math.abs(seed) * 100) % 100) / 100 * 1.8,
      op: 0.22 + ((i * 13 + Math.abs(seed) * 50) % 100) / 100 * 0.33,
    });
  }
  return pts;
}

function buildEdges(nodes, thresh) {
  const e = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, dz = nodes[i].z - nodes[j].z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < thresh) e.push({ a: i, b: j });
    }
  return e;
}

function rotYAxis(x, y, z, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: x * c + z * s, y, z: -x * s + z * c };
}

function useSphereProjection({ cx, cy, radius, count, thresh, speed, time, seedOffset = 0 }) {
  const { nodes3d, edges } = useMemo(() => {
    const n = fibSphere(count, radius, seedOffset);
    return { nodes3d: n, edges: buildEdges(n, thresh) };
  }, [count, radius, thresh, seedOffset]);

  const angle = time * speed;
  const projected = useMemo(() =>
    nodes3d.map((n, i) => {
      const r = rotYAxis(n.x, n.y, n.z, angle);
      const depth = (r.z + radius) / (2 * radius);
      return {
        px: cx + r.x, py: cy + r.y, depth, i,
        size: n.size * (0.4 + depth * 0.75),
        opacity: n.op * (0.2 + depth * 0.8),
      };
    }), [nodes3d, angle, cx, cy, radius]);

  return { edges, projected };
}

/* ═══════════════════════════════════════
   NodeMeshRenderer
   
   Active node rendering:
   - Outer: soft blue halo glow (multiple rings)
   - Middle: brown dot (same as all other nodes)
   - Only turns green AFTER conversion is complete
   ═══════════════════════════════════════ */
function NodeMeshRenderer({ projected, edges, baseColor = C.brown,
  greenSet = new Set(), activeNodes = [],
  trackedNodes = [], hlNodes = [],
  greenZones = [], hlColor = C.brownLight }) {

  const activeSet = new Set(activeNodes.map(a => typeof a === 'number' ? a : a));

  return (
    <g>
      {/* Edges */}
      {edges.map((e, idx) => {
        const a = projected[e.a], b = projected[e.b];
        const avg = (a.depth + b.depth) / 2;
        const aGreen = greenSet.has(e.a) || greenZones.some(gz => e.a >= gz.from && e.a <= gz.to);
        const bGreen = greenSet.has(e.b) || greenZones.some(gz => e.b >= gz.from && e.b <= gz.to);
        const bothGreen = aGreen && bGreen;
        return <line key={idx} x1={a.px} y1={a.py} x2={b.px} y2={b.py}
          stroke={bothGreen ? C.green : C.brownDark} strokeWidth={0.5}
          opacity={avg * (bothGreen ? 0.22 : 0.12)} />;
      })}

      {/* Nodes — depth-sorted */}
      {[...projected].sort((a, b) => a.depth - b.depth).map(p => {
        const isConverted = greenSet.has(p.i);
        const isActive = activeSet.has(p.i);
        const isHL = hlNodes.some(h => h.index === p.i);
        const hn = hlNodes.find(h => h.index === p.i);
        const isGZ = greenZones.some(gz => p.i >= gz.from && p.i <= gz.to);
        const isTracked = trackedNodes.some(t => t.index === p.i);
        const trackInfo = trackedNodes.find(t => t.index === p.i);

        // Core dot color: brown by default, green only if converted
        let dotColor = baseColor;
        if (isConverted || isGZ) dotColor = C.green;
        else if (isHL) dotColor = hlColor;
        else if (isTracked) dotColor = trackInfo.color;
        // Active node: dot stays BROWN — the blue is only the halo
        // (dotColor stays baseColor for active nodes)

        const isSpecial = isConverted || isActive || isHL || isGZ || isTracked;
        const label = isActive ? NODE_LABELS[p.i] : (isHL && hn?.label);

        return (
          <g key={p.i}>
            {/* ── Active target: BLUE HALO (outer glow layers) ── */}
            {isActive && p.depth > 0.15 && (
              <>
                {/* Outermost soft wash */}
                <circle cx={p.px} cy={p.py} r={p.size * 8}
                  fill={C.activeGlow} opacity={p.depth * 0.04}>
                  <animate attributeName="opacity"
                    values={`${p.depth * 0.02};${p.depth * 0.05};${p.depth * 0.02}`}
                    dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Mid glow ring */}
                <circle cx={p.px} cy={p.py} r={p.size * 5}
                  fill={C.activeSoft} opacity={p.depth * 0.06}>
                  <animate attributeName="opacity"
                    values={`${p.depth * 0.04};${p.depth * 0.08};${p.depth * 0.04}`}
                    dur="2.5s" repeatCount="indefinite" />
                </circle>
                {/* Inner glow */}
                <circle cx={p.px} cy={p.py} r={p.size * 3.2}
                  fill={C.active} opacity={p.depth * 0.08} />
                {/* Pulsing ring */}
                <circle cx={p.px} cy={p.py} r={p.size * 3}
                  fill="none" stroke={C.active} strokeWidth={0.8}
                  opacity={p.depth * 0.2} strokeDasharray="2 3">
                  <animate attributeName="r"
                    values={`${p.size * 2.8};${p.size * 3.8};${p.size * 2.8}`}
                    dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity"
                    values={`${p.depth * 0.15};${p.depth * 0.25};${p.depth * 0.15}`}
                    dur="2.2s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Non-active special glow */}
            {!isActive && isSpecial && (
              <circle cx={p.px} cy={p.py}
                r={p.size * (isTracked ? 4 : 3)}
                fill={dotColor} opacity={p.depth * 0.07} />
            )}

            {/* Tracked node ring (non-active) */}
            {isTracked && !isActive && p.depth > 0.3 && (
              <circle cx={p.px} cy={p.py} r={p.size * 2.5}
                fill="none" stroke={trackInfo.color} strokeWidth={0.8}
                opacity={p.depth * 0.3} strokeDasharray="2 3" />
            )}

            {/* Converted: subtle green pulse */}
            {isConverted && p.depth > 0.3 && (
              <circle cx={p.px} cy={p.py} r={p.size * 2}
                fill={C.green} opacity={p.depth * 0.08}>
                <animate attributeName="opacity"
                  values={`${p.depth * 0.04};${p.depth * 0.1};${p.depth * 0.04}`}
                  dur="3s" repeatCount="indefinite" />
              </circle>
            )}

            {/* ── The dot itself ── */}
            {/* Active node: dot is BROWN (slightly larger), blue is only the halo */}
            <circle cx={p.px} cy={p.py}
              r={isActive ? p.size * 1.8 : isSpecial ? p.size * 1.4 : p.size}
              fill={isActive ? baseColor : dotColor}
              opacity={isActive ? Math.max(0.7, p.depth) : isSpecial ? Math.max(0.5, p.depth) : p.opacity} />

            {/* Label tooltip */}
            {label && p.depth > 0.4 && (
              <g>
                <rect x={p.px + 8} y={p.py - 8} rx={3}
                  width={label.length * 5.5 + 12} height={15}
                  fill={isConverted ? C.greenDark : isActive ? "#1e3a5f" : "#292524"}
                  stroke={isConverted ? "#166534" : isActive ? "#3b82f6" : "#44403c"}
                  strokeWidth={0.5} opacity={0.85 * p.depth} />
                <text x={p.px + 14} y={p.py + 2.5}
                  fill={isConverted ? C.greenLight : isActive ? C.active : C.brightText}
                  fontSize="7.5" fontFamily="'IBM Plex Mono', monospace"
                  opacity={p.depth}>{label}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ═══════════════════════════
   TeamDot
   ═══════════════════════════ */
function TeamDot({ x, y, color, pulse = false, size = 5 }) {
  return (
    <g>
      {pulse && <circle cx={x} cy={y} r={size * 2.5} fill={color} opacity={0.06}>
        <animate attributeName="r" values={`${size * 2};${size * 3.5};${size * 2}`}
          dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.06;0.12;0.06"
          dur="2.5s" repeatCount="indefinite" />
      </circle>}
      <circle cx={x} cy={y} r={size} fill={color} opacity={0.8} />
      <circle cx={x} cy={y} r={size * 0.4} fill="white" opacity={0.3} />
    </g>
  );
}

/* ═══════════════════════════
   Spotlight
   ═══════════════════════════ */
function Spotlight({ fromX, fromY, toX, toY, color, active = true, label = null }) {
  if (!active || toX == null || toY == null) return null;
  return (
    <g>
      <line x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={color} strokeWidth={12} opacity={0.03} strokeLinecap="round" />
      <line x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={color} strokeWidth={2} opacity={0.18} strokeDasharray="2 5">
        <animate attributeName="strokeDashoffset" from="0" to="-14"
          dur="1.5s" repeatCount="indefinite" />
      </line>
      <circle cx={toX} cy={toY} r={10} fill={color} opacity={0.06} />
      <circle cx={toX} cy={toY} r={4} fill="none" stroke={color}
        strokeWidth={0.8} opacity={0.2} />
      {label && (
        <text x={toX} y={toY + 18} textAnchor="middle"
          fill={color} fontSize="6" fontFamily="'IBM Plex Mono', monospace"
          opacity={0.35}>{label}</text>
      )}
    </g>
  );
}

/* ═══════════════════════════
   DocPacket
   ═══════════════════════════ */
function DocPacket({ fromX, fromY, toX, toY, progress, color = C.doc }) {
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress - Math.sin(progress * Math.PI) * 20;
  return (
    <g>
      <rect x={x - 5} y={y - 4} width={10} height={8} rx={1.5}
        fill={color} opacity={0.7} stroke="white" strokeWidth={0.3} strokeOpacity={0.2} />
      <line x1={x - 3} y1={y - 1} x2={x + 3} y2={y - 1}
        stroke="white" strokeWidth={0.5} opacity={0.3} />
      <line x1={x - 3} y1={y + 1} x2={x + 2} y2={y + 1}
        stroke="white" strokeWidth={0.5} opacity={0.2} />
    </g>
  );
}

/* ═══════════════════════════
   DataFlowArc
   ═══════════════════════════ */
function DataFlowArc({ x1, y1, x2, y2, curveY, color }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + curveY;
  const path = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth={0.4} opacity={0.08} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5}
        strokeDasharray="5 12" opacity={0.35}>
        <animate attributeName="stroke-dashoffset" from="0" to="-34"
          dur="3s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

function getNodePos(projected, index) {
  if (!projected || index >= projected.length || index < 0) return null;
  const p = projected[index];
  if (p.depth < 0.12) return null;
  return { x: p.px, y: p.py, depth: p.depth };
}

/* ═══════════════════════════════════════════
   CONVERSION HOOK — reusable across scenes
   
   Tracks how many nodes have been converted.
   Persists across team mode switches.
   Handles variable nodes-per-cycle (1 for pillared, N for squads).
   Properly handles last batch with fewer than N remaining.
   ═══════════════════════════════════════════ */

const PILLAR_CYCLE = 20 / 3;
const SQUAD_CYCLE = 8 / 3;
const P3 = 1/3;

const PILLAR_PHASES = [
  { start: 0*P3,    end: 2.5*P3,  id: "pm_observe",   who: "pm",  action: "observe",  label: "▸ Product observes target node" },
  { start: 2.5*P3,  end: 4*P3,    id: "pm_write",     who: "pm",  action: "write",    label: "▸ Product writes requirements doc" },
  { start: 4*P3,    end: 5.5*P3,  id: "doc_pm_eng",   who: null,  action: "doc",      from: "pm", to: "eng", label: "▸ Requirements doc → Engineering" },
  { start: 5.5*P3,  end: 8*P3,    id: "eng_observe1", who: "eng", action: "observe",  label: "▸ Engineering observes target node" },
  { start: 8*P3,    end: 9.5*P3,  id: "eng_write1",   who: "eng", action: "write",    label: "▸ Engineering writes technical spec" },
  { start: 9.5*P3,  end: 11*P3,   id: "doc_eng_biz",  who: null,  action: "doc",      from: "eng", to: "biz", label: "▸ Technical spec → Business" },
  { start: 11*P3,   end: 13*P3,   id: "biz_validate", who: "biz", action: "observe",  label: "▸ Business validates against target node" },
  { start: 13*P3,   end: 14*P3,   id: "biz_write",    who: "biz", action: "write",    label: "▸ Business writes approval" },
  { start: 14*P3,   end: 15.5*P3, id: "doc_biz_eng",  who: null,  action: "doc",      from: "biz", to: "eng", label: "▸ Approval → Engineering" },
  { start: 15.5*P3, end: 17*P3,   id: "eng_observe2", who: "eng", action: "observe",  label: "▸ Engineering implements changes" },
  { start: 17*P3,   end: 18*P3,   id: "eng_write2",   who: "eng", action: "write",    label: "▸ Engineering writes completion update" },
  { start: 18*P3,   end: 19*P3,   id: "doc_eng_pm",   who: null,  action: "doc",      from: "eng", to: "pm", label: "▸ Update → Product for review" },
  { start: 19*P3,   end: 20*P3,   id: "pm_review",    who: "pm",  action: "observe",  label: "▸ Product reviews — node converting green ✓" },
];

function getCurrentPhase(phases, t) {
  return phases.find(p => t >= p.start && t < p.end) || phases[phases.length - 1];
}

function useConversion(totalSec, teamMode, totalNodes, squadCount = 3) {
  const convertedRef = useRef(0);
  const prevModeRef = useRef(teamMode);
  const modeStartRef = useRef(totalSec);
  const lastCycleRef = useRef(-1); // track last committed cycle to prevent double-counting

  // Mode switch: reset cycle timer, keep green count
  if (prevModeRef.current !== teamMode) {
    prevModeRef.current = teamMode;
    modeStartRef.current = totalSec;
    lastCycleRef.current = -1;
  }

  const elapsed = totalSec - modeStartRef.current;
  const cycleDur = teamMode === "pillared" ? PILLAR_CYCLE : SQUAD_CYCLE;
  const completedCycles = Math.floor(elapsed / cycleDur);
  const cycleTime = elapsed % cycleDur;

  // Advance one cycle at a time to properly handle variable batch sizes
  if (completedCycles > lastCycleRef.current && convertedRef.current < totalNodes) {
    // How many new cycles since last commit
    const newCycles = completedCycles - Math.max(0, lastCycleRef.current);
    for (let c = 0; c < newCycles && convertedRef.current < totalNodes; c++) {
      const nodesThisCycle = teamMode === "pillared"
        ? 1
        : Math.min(squadCount, totalNodes - convertedRef.current);
      convertedRef.current += nodesThisCycle;
    }
    lastCycleRef.current = completedCycles;
  }

  const greenCount = Math.min(convertedRef.current, totalNodes);
  const allDone = greenCount >= totalNodes;

  // Reset after all done + one extra cycle pause
  if (allDone && completedCycles > lastCycleRef.current) {
    convertedRef.current = 0;
    lastCycleRef.current = -1;
    modeStartRef.current = totalSec;
  }

  return { greenCount, allDone, cycleTime, cycleDur };
}

/* ═══════════════════════════════════════════
   SCENE: EMBEDDED
   ═══════════════════════════════════════════ */
function SceneEmbedded({ time, teamMode }) {
  const cx = 350, cy = 210, r = 95;
  const { projected, edges } = useSphereProjection({
    cx, cy, radius: r, count: 55, thresh: 46, speed: 0.0003, time
  });

  const totalSec = time / 1000;
  const totalNodes = EMBED_TARGET_NODES.length; // 55
  const { greenCount, allDone, cycleTime } = useConversion(totalSec, teamMode, totalNodes, 3);

  const pmZone = { x: cx - 150, y: cy - 135 };
  const engZone = { x: cx, y: cy - 155 };
  const bizZone = { x: cx + 150, y: cy - 135 };
  const s1 = { x: cx - 95, y: cy - r - 45 };
  const s2 = { x: cx + 85, y: cy - r - 38 };

  // Green set: first greenCount nodes
  const greenSet = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < greenCount; i++) s.add(EMBED_TARGET_NODES[i]);
    return s;
  }, [greenCount]);

  // Active targets: next unconverted nodes
  const squadCount = teamMode === "pillared" ? 1 : 3;
  const activeCount = allDone ? 0 : Math.min(squadCount, totalNodes - greenCount);
  const activeIndices = [];
  for (let i = 0; i < activeCount; i++) activeIndices.push(EMBED_TARGET_NODES[greenCount + i]);

  // Squad: lights off at 6*P3, show green visually before commit
  const lightsOff = teamMode !== "pillared" && cycleTime >= 6 * P3;

  const displayGreen = useMemo(() => {
    const s = new Set(greenSet);
    if (lightsOff) activeIndices.forEach(n => s.add(n));
    return s;
  }, [greenSet, lightsOff, activeIndices.join(",")]);

  const displayActive = lightsOff ? [] : activeIndices;
  const displayCount = displayGreen.size;
  const progress = displayCount / totalNodes;

  // Debug: unconverted / converted lists
  const unconverted = EMBED_TARGET_NODES.filter(n => !displayGreen.has(n));
  const converted = EMBED_TARGET_NODES.filter(n => displayGreen.has(n));

  const debugPanels = (
    <g>
      <foreignObject x={-10} y={30} width={90} height={360}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: "6.5px", color: "#52525b", lineHeight: 1.4,
        }}>
          <div style={{ color: "#d97706", fontSize: "7px", letterSpacing: "1px", marginBottom: "4px" }}>
            REMAINING ({unconverted.length})</div>
          <div style={{ color: "#3f3f46", maxHeight: "330px", overflow: "hidden" }}>
            [{unconverted.slice(0, 25).join(",")}
            {unconverted.length > 25 ? `...+${unconverted.length - 25}` : ""}]
          </div>
        </div>
      </foreignObject>
      <foreignObject x={610} y={30} width={90} height={360}>
        <div xmlns="http://www.w3.org/1999/xhtml" style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: "6.5px", color: "#52525b", lineHeight: 1.4,
        }}>
          <div style={{ color: "#10b981", fontSize: "7px", letterSpacing: "1px", marginBottom: "4px" }}>
            CONVERTED ({converted.length})</div>
          <div style={{ color: "#3f3f46", maxHeight: "330px", overflow: "hidden" }}>
            [{converted.slice(0, 25).join(",")}
            {converted.length > 25 ? `...+${converted.length - 25}` : ""}]
          </div>
        </div>
      </foreignObject>
    </g>
  );

  // ── PILLARED ──
  if (teamMode === "pillared") {
    const activeNode = activeIndices[0] ?? -1;
    const activePos = activeNode >= 0 ? getNodePos(projected, activeNode) : null;
    const phase = getCurrentPhase(PILLAR_PHASES, cycleTime);
    const pmActive = phase.who === "pm";
    const engActive = phase.who === "eng";
    const bizActive = phase.who === "biz";
    const isDoc = phase.action === "doc";
    const isWrite = phase.action === "write";
    let docProgress = 0;
    if (isDoc) docProgress = Math.min(1, (cycleTime - phase.start) / (phase.end - phase.start));
    const zones = { pm: pmZone, eng: engZone, biz: bizZone };

    return (
      <g>
        <NodeMeshRenderer projected={projected} edges={edges}
          greenSet={greenSet} activeNodes={activeNode >= 0 ? [activeNode] : []} />
        <text x={pmZone.x} y={pmZone.y - 28} textAnchor="middle" fill={C.pm} fontSize="7"
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={pmActive ? 0.8 : 0.3}>PRODUCT</text>
        <text x={engZone.x} y={engZone.y - 28} textAnchor="middle" fill={C.eng} fontSize="7"
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={engActive ? 0.8 : 0.3}>ENGINEERING</text>
        <text x={bizZone.x} y={bizZone.y - 28} textAnchor="middle" fill={C.biz} fontSize="7"
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={bizActive ? 0.8 : 0.3}>BUSINESS</text>
        <line x1={cx - 70} y1={cy - 175} x2={cx - 70} y2={cy - 105} stroke={C.line} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.2} />
        <line x1={cx + 70} y1={cy - 175} x2={cx + 70} y2={cy - 105} stroke={C.line} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.2} />
        {[-10, 0, 10].map((dx, i) => <TeamDot key={`pm${i}`} x={pmZone.x + dx} y={pmZone.y} color={C.pm} pulse={pmActive} size={4} />)}
        {[-10, 0, 10].map((dx, i) => <TeamDot key={`eng${i}`} x={engZone.x + dx} y={engZone.y} color={C.eng} pulse={engActive} size={4} />)}
        {[-10, 0, 10].map((dx, i) => <TeamDot key={`biz${i}`} x={bizZone.x + dx} y={bizZone.y} color={C.biz} pulse={bizActive} size={4} />)}
        {pmActive && activePos && phase.action === "observe" && (
          <Spotlight fromX={pmZone.x} fromY={pmZone.y + 8} toX={activePos.x} toY={activePos.y} color={C.pm}
            label={phase.id === "pm_review" ? "reviewing" : "observing"} />)}
        {engActive && activePos && phase.action === "observe" && (
          <Spotlight fromX={engZone.x} fromY={engZone.y + 8} toX={activePos.x} toY={activePos.y} color={C.eng}
            label={phase.id.includes("2") ? "implementing" : "analyzing"} />)}
        {bizActive && activePos && phase.action === "observe" && (
          <Spotlight fromX={bizZone.x} fromY={bizZone.y + 8} toX={activePos.x} toY={activePos.y} color={C.biz}
            label="validating" />)}
        {isWrite && phase.who && (
          <g>
            <rect x={zones[phase.who].x - 16} y={zones[phase.who].y + 14} width={32} height={11} rx={2} fill={C.doc} opacity={0.12} />
            <text x={zones[phase.who].x} y={zones[phase.who].y + 22} textAnchor="middle" fill={C.doc} fontSize="5.5"
              fontFamily="'IBM Plex Mono', monospace" opacity={0.55}>writing...</text>
          </g>)}
        {isDoc && phase.from && phase.to && (
          <DocPacket fromX={zones[phase.from].x + (zones[phase.from].x > cx ? -20 : 20)} fromY={zones[phase.from].y}
            toX={zones[phase.to].x + (zones[phase.to].x > cx ? -20 : zones[phase.to].x < cx ? 20 : 0)} toY={zones[phase.to].y}
            progress={docProgress} />)}
        <text x={cx} y={cy + r + 32} textAnchor="middle" fill={C.dimText} fontSize="7"
          fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5">
          {allDone ? "▸ All nodes converted — resetting..." : phase.label}</text>
        <g>
          <text x={cx - 80} y={cy + r + 50} fill={C.dimText} fontSize="6"
            fontFamily="'IBM Plex Mono', monospace">{greenCount}/{totalNodes} converted</text>
          <rect x={cx - 80} y={cy + r + 54} width={160} height={3} rx={1.5} fill={C.line} />
          <rect x={cx - 80} y={cy + r + 54} width={160 * (greenCount / totalNodes)} height={3} rx={1.5} fill={C.green} opacity={0.7} />
        </g>
        {debugPanels}
      </g>
    );
  }

  // ── SQUADS (3 squads, each targets different node; idle if none left) ──
  const sPositions = activeIndices.map(n => getNodePos(projected, n));
  const squadPhases = [
    { start: 0, end: 3*P3, id: "observe", label: "▸ Each squad observes their target node" },
    { start: 3*P3, end: 6*P3, id: "change", label: "▸ Squads implement changes on their nodes" },
    { start: 6*P3, end: 7.5*P3, id: "review", label: "▸ Nodes converted — squads review outcomes" },
    { start: 7.5*P3, end: 8*P3, id: "convert", label: "▸ Moving to next targets..." },
  ];
  const sPhase = getCurrentPhase(squadPhases, cycleTime);
  const sObs = sPhase.id === "observe";
  const sChg = sPhase.id === "change";

  const s3 = { x: cx, y: cy - r - 55 };
  const squadDefs = [
    { pos: s1, name: "SQUAD α", color: C.pm, dots: [
      { dx: -10, dy: 0, c: C.pm, s: 4 }, { dx: 0, dy: -7, c: C.eng, s: 4 },
      { dx: 10, dy: 0, c: C.biz, s: 4 }, { dx: 3, dy: 8, c: C.eng, s: 3.5 },
    ]},
    { pos: s3, name: "SQUAD β", color: C.eng, dots: [
      { dx: -8, dy: 0, c: C.eng, s: 4 }, { dx: 4, dy: -6, c: C.pm, s: 3.5 },
      { dx: 10, dy: 2, c: C.biz, s: 4 },
    ]},
    { pos: s2, name: "SQUAD γ", color: C.biz, dots: [
      { dx: -10, dy: 0, c: C.biz, s: 4 }, { dx: 0, dy: -7, c: C.pm, s: 3.5 },
      { dx: 10, dy: 0, c: C.eng, s: 4 },
    ]},
  ];

  return (
    <g>
      <NodeMeshRenderer projected={projected} edges={edges}
        greenSet={displayGreen} activeNodes={displayActive} />
      {squadDefs.map((sq, si) => {
        const hasTarget = si < activeIndices.length;
        const isIdle = !hasTarget;
        return (
          <g key={sq.name}>
            <text x={sq.pos.x} y={sq.pos.y - 18} textAnchor="middle"
              fill={C.brightText} fontSize="7" fontFamily="'IBM Plex Mono', monospace"
              letterSpacing="1" opacity={isIdle ? 0.2 : 0.4}>
              {sq.name}{isIdle ? " (idle)" : ""}</text>
            {sq.dots.map((d, di) => (
              <TeamDot key={di} x={sq.pos.x + d.dx} y={sq.pos.y + d.dy}
                color={d.c} pulse={!isIdle && (di === 0 ? sObs : di === 1 ? sChg : !sObs && !sChg)}
                size={d.s} />
            ))}
            {hasTarget && sPositions[si] && (sObs || sChg) && (
              <Spotlight fromX={sq.pos.x} fromY={sq.pos.y + 10}
                toX={sPositions[si].x} toY={sPositions[si].y} color={sq.color}
                active label={sObs ? "observing" : "changing"} />
            )}
          </g>
        );
      })}
      <text x={cx} y={cy + r + 32} textAnchor="middle" fill={C.dimText} fontSize="7"
        fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5">
        {allDone ? "▸ All nodes converted — resetting..." : sPhase.label}</text>
      <g>
        <text x={cx - 80} y={cy + r + 50} fill={C.dimText} fontSize="6"
          fontFamily="'IBM Plex Mono', monospace">{displayCount}/{totalNodes} converted</text>
        <rect x={cx - 80} y={cy + r + 54} width={160} height={3} rx={1.5} fill={C.line} />
        <rect x={cx - 80} y={cy + r + 54} width={160 * progress} height={3} rx={1.5} fill={C.green} opacity={0.7} />
      </g>
      {debugPanels}
    </g>
  );
}

/* ═══════════════════════════════════════
   SCENE: CONNECTED MOONS
   Squad α works on brown nodes.
   Squad β adds green nodes to the moon mesh.
   Pillared alternates: brown node → green node → brown → green...
   ═══════════════════════════════════════ */
function SceneConnected({ time, teamMode }) {
  const cx = 260, cy = 210, r = 90;
  const moonCx = 500, moonCy = 195, moonR = 45;

  const brown = useSphereProjection({ cx, cy, radius: r, count: 50, thresh: 44, speed: 0.0003, time });
  const greenMoon = useSphereProjection({ cx: moonCx, cy: moonCy, radius: moonR, count: 20, thresh: 32, speed: 0.0007, time, seedOffset: 2 });

  const totalSec = time / 1000;
  const brownTotal = 50;
  const moonTotal = 20;

  // Brown sphere conversion (squad α or pillared odd cycles)
  const { greenCount: brownGreen, cycleTime: brownCycleTime } = useConversion(totalSec, teamMode, brownTotal, 1);
  // Moon node activation (squad β or pillared even cycles)
  const { greenCount: moonGreen, cycleTime: moonCycleTime } = useConversion(totalSec, teamMode, moonTotal, 1);

  // Since useConversion shares refs across calls, we need separate instances.
  // Workaround: use time-based derivation instead for these simpler scenes
  const cycleDur = teamMode === "pillared" ? PILLAR_CYCLE : SQUAD_CYCLE;
  const elapsed = totalSec;
  const totalCycles = Math.floor(elapsed / cycleDur);
  const cycleTime = elapsed % cycleDur;

  // Pillared: alternating — odd cycles do brown, even do moon
  // Squads: parallel — each cycle does one brown + one moon
  const brownConverted = teamMode === "pillared"
    ? Math.min(Math.floor((totalCycles + 1) / 2), brownTotal)
    : Math.min(totalCycles, brownTotal);
  const moonConverted = teamMode === "pillared"
    ? Math.min(Math.floor(totalCycles / 2), moonTotal)
    : Math.min(totalCycles, moonTotal);

  const brownGreenSet = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < brownConverted; i++) s.add(i);
    return s;
  }, [brownConverted]);

  const moonGreenSet = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < moonConverted; i++) s.add(i);
    return s;
  }, [moonConverted]);

  const isPillarBrownTurn = teamMode === "pillared" && totalCycles % 2 === 0;
  const isPillarMoonTurn = teamMode === "pillared" && totalCycles % 2 === 1;

  const brownActiveNode = brownConverted < brownTotal ? brownConverted : -1;
  const moonActiveNode = moonConverted < moonTotal ? moonConverted : -1;

  const brownActivePos = brownActiveNode >= 0 ? getNodePos(brown.projected, brownActiveNode) : null;
  const moonActivePos = moonActiveNode >= 0 ? getNodePos(greenMoon.projected, moonActiveNode) : null;

  const pmZone = { x: cx - 140, y: cy - 130 };
  const engZone = { x: (cx + moonCx) / 2, y: Math.min(cy, moonCy) - 145 };
  const bizZone = { x: moonCx + 60, y: moonCy - 100 };
  const sq1 = { x: cx - 80, y: cy - r - 50 };
  const sq2 = { x: moonCx, y: moonCy - moonR - 50 };

  const sPhaseTime = cycleTime;
  const sObs = sPhaseTime < 3 * P3;
  const sChg = sPhaseTime >= 3 * P3 && sPhaseTime < 6 * P3;

  const phase = teamMode === "pillared" ? getCurrentPhase(PILLAR_PHASES, cycleTime) : null;

  return (
    <g>
      {/* Brown sphere */}
      <NodeMeshRenderer projected={brown.projected} edges={brown.edges}
        greenSet={brownGreenSet}
        activeNodes={
          teamMode === "pillared"
            ? (isPillarBrownTurn && brownActiveNode >= 0 ? [brownActiveNode] : [])
            : (brownActiveNode >= 0 ? [brownActiveNode] : [])
        } />

      {/* Green moon — starts as just mesh edges, green nodes appear */}
      <NodeMeshRenderer projected={greenMoon.projected} edges={greenMoon.edges}
        baseColor={C.line} hlColor={C.greenLight}
        greenSet={moonGreenSet}
        activeNodes={
          teamMode === "pillared"
            ? (isPillarMoonTurn && moonActiveNode >= 0 ? [moonActiveNode] : [])
            : (moonActiveNode >= 0 ? [moonActiveNode] : [])
        } />

      {/* Data flow arcs */}
      <DataFlowArc x1={cx + r - 5} y1={cy - 25} x2={moonCx - moonR + 5} y2={moonCy - 15}
        curveY={-50} color={C.brownLight} />
      <DataFlowArc x1={moonCx - moonR + 5} y1={moonCy + 15} x2={cx + r - 5} y2={cy + 25}
        curveY={40} color={C.green} />

      <text x={cx} y={cy + r + 18} textAnchor="middle" fill={C.brown}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={0.5}>
        SYSTEM OF RECORD</text>
      <text x={moonCx} y={moonCy + moonR + 18} textAnchor="middle" fill={C.green}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={0.5}>
        AI MOON</text>

      {teamMode === "pillared" ? (
        <g>
          <text x={pmZone.x} y={pmZone.y - 25} textAnchor="middle" fill={C.pm} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={phase?.who === "pm" ? 0.8 : 0.3}>PRODUCT</text>
          <text x={engZone.x} y={engZone.y - 25} textAnchor="middle" fill={C.eng} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={phase?.who === "eng" ? 0.8 : 0.3}>ENGINEERING</text>
          <text x={bizZone.x} y={bizZone.y - 25} textAnchor="middle" fill={C.biz} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={phase?.who === "biz" ? 0.8 : 0.3}>BUSINESS</text>
          {[-10, 0, 10].map((dx, i) => <TeamDot key={`pm${i}`} x={pmZone.x + dx} y={pmZone.y} color={C.pm} pulse={phase?.who === "pm"} size={4} />)}
          {[-10, 0, 10].map((dx, i) => <TeamDot key={`eng${i}`} x={engZone.x + dx} y={engZone.y} color={C.eng} pulse={phase?.who === "eng"} size={4} />)}
          {[-10, 0, 10].map((dx, i) => <TeamDot key={`biz${i}`} x={bizZone.x + dx} y={bizZone.y} color={C.biz} pulse={phase?.who === "biz"} size={4} />)}
          {/* Spotlight targets: brown or moon depending on turn */}
          {phase?.action === "observe" && isPillarBrownTurn && brownActivePos && (
            <Spotlight fromX={phase.who === "pm" ? pmZone.x : phase.who === "eng" ? engZone.x : bizZone.x}
              fromY={(phase.who === "pm" ? pmZone.y : phase.who === "eng" ? engZone.y : bizZone.y) + 8}
              toX={brownActivePos.x} toY={brownActivePos.y} color={phase.who === "pm" ? C.pm : phase.who === "eng" ? C.eng : C.biz} />
          )}
          {phase?.action === "observe" && isPillarMoonTurn && moonActivePos && (
            <Spotlight fromX={phase.who === "pm" ? pmZone.x : phase.who === "eng" ? engZone.x : bizZone.x}
              fromY={(phase.who === "pm" ? pmZone.y : phase.who === "eng" ? engZone.y : bizZone.y) + 8}
              toX={moonActivePos.x} toY={moonActivePos.y} color={C.green} />
          )}
          <text x={(cx + moonCx) / 2} y={cy + r + 32} textAnchor="middle" fill={C.dimText} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5">
            {isPillarBrownTurn ? "▸ Pillars working on brown sphere" : "▸ Pillars adding green nodes to moon"}</text>
        </g>
      ) : (
        <g>
          {/* Squad α → brown sphere */}
          <text x={sq1.x} y={sq1.y - 18} textAnchor="middle" fill={C.brightText} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1" opacity={0.4}>SQUAD α</text>
          <TeamDot x={sq1.x - 10} y={sq1.y} color={C.pm} pulse={sObs} size={4} />
          <TeamDot x={sq1.x} y={sq1.y - 7} color={C.eng} pulse={sChg} size={4} />
          <TeamDot x={sq1.x + 10} y={sq1.y} color={C.biz} pulse={!sObs && !sChg} size={4} />
          {brownActivePos && (sObs || sChg) && (
            <Spotlight fromX={sq1.x} fromY={sq1.y + 10} toX={brownActivePos.x} toY={brownActivePos.y}
              color={C.pm} active label={sObs ? "observing" : "changing"} />
          )}
          {/* Squad β → green moon */}
          <text x={sq2.x} y={sq2.y - 18} textAnchor="middle" fill={C.brightText} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1" opacity={0.4}>SQUAD β</text>
          <TeamDot x={sq2.x - 8} y={sq2.y} color={C.eng} pulse={sObs} size={4} />
          <TeamDot x={sq2.x + 4} y={sq2.y - 6} color={C.pm} pulse={sChg} size={3.5} />
          <TeamDot x={sq2.x + 10} y={sq2.y + 2} color={C.biz} pulse={!sObs && !sChg} size={4} />
          {moonActivePos && (sObs || sChg) && (
            <Spotlight fromX={sq2.x} fromY={sq2.y + 10} toX={moonActivePos.x} toY={moonActivePos.y}
              color={C.green} active label={sObs ? "building" : "activating"} />
          )}
          <text x={(cx + moonCx) / 2} y={cy + r + 32} textAnchor="middle" fill={C.dimText} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5">
            ▸ Squad α converts brown · Squad β builds green moon</text>
        </g>
      )}
    </g>
  );
}

/* ═══════════════════════════════════════
   SCENE: INDEPENDENT MOONS
   Brown sphere stays. Squads build green moons from scratch.
   ═══════════════════════════════════════ */
function SceneIndependent({ time, teamMode }) {
  const cx = 220, cy = 210, r = 85;
  const m1 = { cx: 460, cy: 170, r: 40 };
  const m2 = { cx: 530, cy: 250, r: 35 };

  const brown = useSphereProjection({ cx, cy, radius: r, count: 45, thresh: 42, speed: 0.00025, time });
  const g1 = useSphereProjection({ cx: m1.cx, cy: m1.cy, radius: m1.r, count: 18, thresh: 30, speed: 0.0006, time, seedOffset: 3 });
  const g2 = useSphereProjection({ cx: m2.cx, cy: m2.cy, radius: m2.r, count: 15, thresh: 28, speed: 0.0008, time, seedOffset: 5 });

  const totalSec = time / 1000;
  const cycleDur = teamMode === "pillared" ? PILLAR_CYCLE : SQUAD_CYCLE;
  const totalCycles = Math.floor(totalSec / cycleDur);
  const cycleTime = totalSec % cycleDur;

  // Moon 1 and Moon 2 node activation
  const m1Converted = Math.min(totalCycles, 18) % 19; // wraps
  const m2Converted = Math.min(Math.max(0, totalCycles - (teamMode === "pillared" ? 1 : 0)), 15) % 16;

  const m1GreenSet = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < m1Converted; i++) s.add(i);
    return s;
  }, [m1Converted]);

  const m2GreenSet = useMemo(() => {
    const s = new Set();
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
      {/* Brown sphere — no conversion, stays as-is */}
      <NodeMeshRenderer projected={brown.projected} edges={brown.edges} />

      {/* Boundary */}
      <line x1={350} y1={100} x2={350} y2={320}
        stroke={C.line} strokeWidth={0.5} strokeDasharray="3 6" opacity={0.3} />
      <text x={350} y={92} textAnchor="middle" fill={C.dimText}
        fontSize="6" fontFamily="'IBM Plex Mono', monospace" letterSpacing="2">NO CONNECTION</text>

      {/* Green moons — mesh with green nodes appearing */}
      <NodeMeshRenderer projected={g1.projected} edges={g1.edges}
        baseColor={C.line} greenSet={m1GreenSet}
        activeNodes={m1Active >= 0 ? [m1Active] : []} />
      <NodeMeshRenderer projected={g2.projected} edges={g2.edges}
        baseColor={C.line} greenSet={m2GreenSet}
        activeNodes={m2Active >= 0 ? [m2Active] : []} />

      <text x={cx} y={cy + r + 18} textAnchor="middle" fill={C.brown}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={0.5}>BROWNFIELD</text>
      <text x={(m1.cx + m2.cx) / 2} y={290} textAnchor="middle" fill={C.green}
        fontSize="7" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={0.5}>GREENFIELD</text>

      {teamMode === "pillared" ? (
        <g>
          <text x={m1.cx} y={m1.cy - m1.r - 30} textAnchor="middle" fill={C.pm} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={0.4}>PRODUCT</text>
          {[-10, 0, 10].map((dx, i) => <TeamDot key={`p${i}`} x={m1.cx + dx} y={m1.cy - m1.r - 18} color={C.pm} pulse={totalCycles % 2 === 0} size={4} />)}
          {totalCycles % 2 === 0 && m1Pos && (
            <Spotlight fromX={m1.cx} fromY={m1.cy - m1.r - 10} toX={m1Pos.x} toY={m1Pos.y} color={C.green} active label="building" />
          )}
          <text x={m2.cx} y={m2.cy - m2.r - 30} textAnchor="middle" fill={C.eng} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5" opacity={0.4}>ENGINEERING</text>
          {[-10, 0, 10].map((dx, i) => <TeamDot key={`e${i}`} x={m2.cx + dx} y={m2.cy - m2.r - 18} color={C.eng} pulse={totalCycles % 2 === 1} size={4} />)}
          {totalCycles % 2 === 1 && m2Pos && (
            <Spotlight fromX={m2.cx} fromY={m2.cy - m2.r - 10} toX={m2Pos.x} toY={m2Pos.y} color={C.green} active label="building" />
          )}
        </g>
      ) : (
        <g>
          <text x={sq1.x} y={sq1.y - 18} textAnchor="middle" fill={C.brightText} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1" opacity={0.4}>SQUAD α</text>
          <TeamDot x={sq1.x - 10} y={sq1.y} color={C.pm} pulse={sObs} size={4} />
          <TeamDot x={sq1.x} y={sq1.y - 7} color={C.eng} pulse={sChg} size={4} />
          <TeamDot x={sq1.x + 10} y={sq1.y} color={C.biz} pulse={!sObs && !sChg} size={4} />
          {m1Pos && (sObs || sChg) && (
            <Spotlight fromX={sq1.x} fromY={sq1.y + 10} toX={m1Pos.x} toY={m1Pos.y} color={C.green}
              active label={sObs ? "building" : "activating"} />
          )}

          <text x={sq2.x} y={sq2.y - 18} textAnchor="middle" fill={C.brightText} fontSize="7"
            fontFamily="'IBM Plex Mono', monospace" letterSpacing="1" opacity={0.4}>SQUAD β</text>
          <TeamDot x={sq2.x - 8} y={sq2.y} color={C.eng} pulse={sObs} size={4} />
          <TeamDot x={sq2.x + 4} y={sq2.y - 6} color={C.pm} pulse={sChg} size={3.5} />
          <TeamDot x={sq2.x + 10} y={sq2.y + 2} color={C.biz} pulse={!sObs && !sChg} size={4} />
          {m2Pos && (sObs || sChg) && (
            <Spotlight fromX={sq2.x} fromY={sq2.y + 10} toX={m2Pos.x} toY={m2Pos.y} color={C.green}
              active label={sObs ? "building" : "activating"} />
          )}
        </g>
      )}

      <text x={350} y={cy + r + 32} textAnchor="middle" fill={C.dimText} fontSize="7"
        fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.5">
        ▸ Teams build independent green systems from scratch</text>
    </g>
  );
}

/* ═══════════════════════════
   MAIN APP
   ═══════════════════════════ */
export default function App() {
  const [pattern, setPattern] = useState(0);
  const [teamMode, setTeamMode] = useState("pillared");
  const [time, setTime] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let last = null;
    const tick = (ts) => {
      if (last !== null) setTime(t => t + (ts - last));
      last = ts;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const patternDefs = [
    { id: "embedded", num: "001", name: "Embedded Replacement",
      sub: "Replace components inside the brown sphere",
      desc: "Each node goes through the full team workflow before converting from brown to green. The active target glows blue while being worked on — its center stays brown until the cycle completes.",
      insight: "Highest org impact · Requires governance foundation · Transform from within" },
    { id: "connected", num: "002", name: "Connected Moons",
      sub: "Green moons that exchange data with brown",
      desc: "AI capability orbits the brownfield as a connected satellite. Data flows out, gets transformed, flows back. The brownfield remains the system of record.",
      insight: "Preserves existing investment · AI augments without replacing · Medium integration risk" },
    { id: "independent", num: "003", name: "Independent Moons",
      sub: "Green moons with no brown connection",
      desc: "Fully separate AI-powered systems that own specific outcomes independently. No dependency on brownfield architecture. Clean boundaries, fast iteration.",
      insight: "Lowest integration risk · Fastest time to value · Easiest pilot" },
  ];

  const p = patternDefs[pattern];
  const scenes = [SceneEmbedded, SceneConnected, SceneIndependent];
  const ActiveScene = scenes[pattern];

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", width: "100%",
      display: "flex", flexDirection: "column",
      fontFamily: "'IBM Plex Mono', monospace", color: C.white, overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%",
            background: pattern === 1 ? C.brownLight : C.green }} />
          <span style={{ fontSize: "9px", color: C.midText, letterSpacing: "3px" }}>
            AI INTEGRATION STRATEGY</span>
        </div>
        <span style={{ fontSize: "9px", color: C.dimText }}>{p.num} / 003</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", flexDirection: "column", width: "240px",
          borderRight: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div style={{ padding: "10px 16px 6px", fontSize: "7px", color: C.dimText, letterSpacing: "2px" }}>
            INTEGRATION PATTERN</div>
          {patternDefs.map((pd, i) => (
            <button key={pd.id} onClick={() => setPattern(i)} style={{
              background: i === pattern ? "rgba(255,255,255,0.03)" : "transparent",
              border: "none", borderBottom: `1px solid ${C.line}`,
              borderLeft: i === pattern ? `2px solid ${i === 1 ? C.brownLight : C.green}` : "2px solid transparent",
              padding: "10px 16px", textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
            }}>
              <div style={{ fontSize: "10px", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                color: i === pattern ? C.white : C.midText, marginBottom: "2px" }}>{pd.name}</div>
              <div style={{ fontSize: "8px", color: C.dimText, lineHeight: 1.4 }}>{pd.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "200px",
          borderRight: `1px solid ${C.line}`, flexShrink: 0 }}>
          <div style={{ padding: "10px 16px 6px", fontSize: "7px", color: C.dimText, letterSpacing: "2px" }}>
            TEAM STRUCTURE</div>
          {[
            { key: "pillared", name: "Pillared", dots: [C.pm, C.pm, null, C.eng, C.eng, null, C.biz, C.biz],
              sub: "Tribes observe → write → handoff" },
            { key: "squads", name: "Cross-Functional Squads", dots: [C.pm, C.eng, C.biz, null, C.eng, C.pm, C.biz],
              sub: "Mixed teams observe + change directly" },
          ].map(tm => (
            <button key={tm.key} onClick={() => setTeamMode(tm.key)} style={{
              background: teamMode === tm.key ? "rgba(255,255,255,0.03)" : "transparent",
              border: "none", borderBottom: `1px solid ${C.line}`,
              borderLeft: teamMode === tm.key ? `2px solid ${tm.key === "pillared" ? C.doc : C.green}` : "2px solid transparent",
              padding: "10px 16px", textAlign: "left", cursor: "pointer",
            }}>
              <div style={{ fontSize: "10px", fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                color: teamMode === tm.key ? C.white : C.midText, marginBottom: "3px" }}>{tm.name}</div>
              <div style={{ display: "flex", gap: tm.key === "pillared" ? "5px" : "3px", marginBottom: "3px" }}>
                {tm.dots.map((c, i) => c
                  ? <span key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: c }} />
                  : <span key={i} style={{ width: "2px" }} />
                )}
              </div>
              <div style={{ fontSize: "7.5px", color: C.dimText, lineHeight: 1.3 }}>{tm.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: "10px 16px", display: "flex", flexDirection: "column",
          justifyContent: "center", gap: "5px" }}>
          <div style={{ fontSize: "7px", color: C.dimText, letterSpacing: "2px", marginBottom: "3px" }}>LEGEND</div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[{ color: C.pm, label: "Product" }, { color: C.eng, label: "Engineering" }, { color: C.biz, label: "Business" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: l.color }} />
                <span style={{ fontSize: "8px", color: C.midText }}>{l.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[
              { color: C.brown, label: "Amber (existing)" },
              { color: C.green, label: "Green (converted)" },
              { color: C.active, label: "Blue halo (active target)" },
              { color: C.doc, label: "Document", r: "1px" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: l.r || "50%", background: l.color, opacity: 0.7 }} />
                <span style={{ fontSize: "8px", color: C.dimText }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main visualization */}
      <div style={{ flex: 1, position: "relative", minHeight: "420px" }}>
        <svg viewBox="0 0 700 420" width="100%" height="100%" style={{ overflow: "visible" }}>
          <ActiveScene time={time} teamMode={teamMode} />
        </svg>
      </div>

      {/* Bottom info */}
      <div style={{ borderTop: `1px solid ${C.line}`, padding: "14px 24px", display: "flex", gap: "24px" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "18px",
            margin: "0 0 4px", color: C.white }}>{p.name}</h2>
          <p style={{ fontSize: "11px", color: C.midText, lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
        </div>
        <div style={{ width: "240px", flexShrink: 0 }}>
          <div style={{ fontSize: "7px", color: C.dimText, letterSpacing: "2px", marginBottom: "4px" }}>KEY INSIGHT</div>
          <div style={{ fontSize: "9.5px", color: C.midText, lineHeight: 1.5 }}>{p.insight}</div>
        </div>
      </div>
    </div>
  );
}

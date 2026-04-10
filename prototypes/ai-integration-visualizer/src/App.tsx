import { useState, useCallback } from "react";
import { C } from "./lib/colors";
import { useAnimationFrame } from "./hooks/useAnimationFrame";
import { SceneEmbedded } from "./components/scenes/SceneEmbedded";
import { SceneConnected } from "./components/scenes/SceneConnected";
import { SceneIndependent } from "./components/scenes/SceneIndependent";
import { NodeListPanel } from "./components/panels/NodeListPanel";
import { NodeDetailDrawer } from "./components/panels/NodeDetailDrawer";
import { StageProgressBar } from "./components/panels/StageProgressBar";
import type { IntegrationPattern, TeamMode } from "./types";
import { CONVERSION_ORDER } from "./data/conversion-order";
import { useConversion } from "./hooks/useConversion";

const patternDefs = [
  {
    id: "embedded" as IntegrationPattern,
    num: "001",
    name: "Embedded Replacement",
    sub: "Replace components inside the brown sphere",
    desc: "Each node goes through the full team workflow before converting from brown to green. The active target glows blue while being worked on \u2014 its center stays brown until the cycle completes.",
    insight: "Highest org impact \u00b7 Requires governance foundation \u00b7 Transform from within",
  },
  {
    id: "connected" as IntegrationPattern,
    num: "002",
    name: "Connected Moons",
    sub: "Green moons that exchange data with brown",
    desc: "AI capability orbits the brownfield as a connected satellite. Data flows out, gets transformed, flows back. The brownfield remains the system of record.",
    insight: "Preserves existing investment \u00b7 AI augments without replacing \u00b7 Medium integration risk",
  },
  {
    id: "independent" as IntegrationPattern,
    num: "003",
    name: "Independent Moons",
    sub: "Green moons with no brown connection",
    desc: "Fully separate AI-powered systems that own specific outcomes independently. No dependency on brownfield architecture. Clean boundaries, fast iteration.",
    insight: "Lowest integration risk \u00b7 Fastest time to value \u00b7 Easiest pilot",
  },
];

type MobilePanel = "remaining" | "converted" | null;

export default function App() {
  const [pattern, setPattern] = useState(0);
  const [teamMode, setTeamMode] = useState<TeamMode>("pillared");
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const time = useAnimationFrame();

  const totalSec = time / 1000;
  const { greenCount } = useConversion(totalSec, teamMode, CONVERSION_ORDER.length, 3);

  const greenSet = new Set<number>();
  for (let i = 0; i < greenCount; i++) greenSet.add(CONVERSION_ORDER[i]);

  const handleNodeClick = useCallback((nodeId: number) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
    setMobilePanel(null);
  }, []);

  const p = patternDefs[pattern];
  const scenes = [SceneEmbedded, SceneConnected, SceneIndependent] as const;
  const ActiveScene = scenes[pattern];

  const remaining = CONVERSION_ORDER.length - greenSet.size;
  const converted = greenSet.size;

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'IBM Plex Mono', monospace",
        color: C.white,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: pattern === 1 ? C.brownLight : C.green,
            }}
          />
          <span
            style={{ fontSize: "12px", color: C.midText, letterSpacing: "3px" }}
          >
            AI INTEGRATION STRATEGY
          </span>
        </div>
        <span style={{ fontSize: "12px", color: C.dimText }}>
          {p.num} / 003
        </span>
      </div>

      {/* Controls */}
      <div
        className="controls-row"
        style={{
          display: "flex",
          alignItems: "stretch",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "240px",
            borderRight: `1px solid ${C.line}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "10px 16px 6px",
              fontSize: "10px",
              color: C.dimText,
              letterSpacing: "2px",
            }}
          >
            INTEGRATION PATTERN
          </div>
          {patternDefs.map((pd, i) => (
            <button
              key={pd.id}
              onClick={() => setPattern(i)}
              style={{
                background:
                  i === pattern ? "rgba(255,255,255,0.03)" : "transparent",
                border: "none",
                borderBottom: `1px solid ${C.line}`,
                borderLeft:
                  i === pattern
                    ? `2px solid ${i === 1 ? C.brownLight : C.green}`
                    : "2px solid transparent",
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  color: i === pattern ? C.white : C.midText,
                  marginBottom: "2px",
                }}
              >
                {pd.name}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: C.dimText,
                  lineHeight: 1.4,
                }}
              >
                {pd.sub}
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "200px",
            borderRight: `1px solid ${C.line}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "10px 16px 6px",
              fontSize: "10px",
              color: C.dimText,
              letterSpacing: "2px",
            }}
          >
            TEAM STRUCTURE
          </div>
          {(
            [
              {
                key: "pillared" as TeamMode,
                name: "Pillared",
                dots: [C.pm, C.pm, null, C.eng, C.eng, null, C.biz, C.biz],
                sub: "Tribes observe \u2192 write \u2192 handoff",
              },
              {
                key: "squads" as TeamMode,
                name: "Cross-Functional Squads",
                dots: [C.pm, C.eng, C.biz, null, C.eng, C.pm, C.biz],
                sub: "Mixed teams observe + change directly",
              },
            ] as const
          ).map((tm) => (
            <button
              key={tm.key}
              onClick={() => setTeamMode(tm.key)}
              style={{
                background:
                  teamMode === tm.key
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                border: "none",
                borderBottom: `1px solid ${C.line}`,
                borderLeft:
                  teamMode === tm.key
                    ? `2px solid ${tm.key === "pillared" ? C.doc : C.green}`
                    : "2px solid transparent",
                padding: "12px 16px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  color: teamMode === tm.key ? C.white : C.midText,
                  marginBottom: "3px",
                }}
              >
                {tm.name}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: tm.key === "pillared" ? "5px" : "3px",
                  marginBottom: "3px",
                }}
              >
                {tm.dots.map((c, i) =>
                  c ? (
                    <span
                      key={i}
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ) : (
                    <span key={i} style={{ width: "3px" }} />
                  )
                )}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: C.dimText,
                  lineHeight: 1.3,
                }}
              >
                {tm.sub}
              </div>
            </button>
          ))}
        </div>

        <div
          className="legend-panel"
          style={{
            flex: 1,
            padding: "10px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: C.dimText,
              letterSpacing: "2px",
              marginBottom: "3px",
            }}
          >
            LEGEND
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[
              { color: C.pm, label: "Product" },
              { color: C.eng, label: "Engineering" },
              { color: C.biz, label: "Business" },
            ].map((l) => (
              <div
                key={l.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: l.color,
                  }}
                />
                <span style={{ fontSize: "12px", color: C.midText }}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[
              { color: C.brown, label: "Amber (existing)" },
              { color: C.green, label: "Green (converted)" },
              { color: C.active, label: "Blue halo (active target)" },
              { color: C.doc, label: "Document", r: "1px" },
            ].map((l) => (
              <div
                key={l.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: l.r || "50%",
                    background: l.color,
                    opacity: 0.7,
                  }}
                />
                <span style={{ fontSize: "12px", color: C.dimText }}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main visualization area — flex row, height set by SVG, sidebars stretch to match */}
      <div
        className="main-viz-area"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {/* Left sidebar: Remaining — stretches to SVG height, scrolls */}
        <div className="sidebar-desktop">
          <NodeListPanel
            side="remaining"
            greenSet={greenSet}
            activePattern={patternDefs[pattern].id}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* SVG visualization — renders at natural aspect ratio, sets row height */}
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            viewBox="0 0 700 420"
            width="100%"
            style={{ display: "block" }}
          >
            <ActiveScene
              time={time}
              teamMode={teamMode}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
            />
          </svg>
        </div>

        {/* Right sidebar: Converted — stretches to SVG height, scrolls */}
        <div className="sidebar-desktop">
          <NodeListPanel
            side="converted"
            greenSet={greenSet}
            activePattern={patternDefs[pattern].id}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Detail drawer — absolute, stretches full height of viz area */}
        {selectedNodeId != null && (
          <div className="drawer-desktop">
            <NodeDetailDrawer
              nodeId={selectedNodeId}
              isConverted={greenSet.has(selectedNodeId)}
              activePattern={patternDefs[pattern].id}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile: panel toggle buttons — visible only on small screens */}
      <div className="mobile-panel-toggles">
        <button
          onClick={() => setMobilePanel(mobilePanel === "remaining" ? null : "remaining")}
          style={{
            flex: 1,
            background: mobilePanel === "remaining" ? "rgba(217,119,6,0.1)" : "transparent",
            border: "none",
            borderRight: `1px solid ${C.line}`,
            padding: "10px 8px",
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: C.brown,
            minHeight: "44px",
          }}
        >
          {"\u25b8"} Remaining ({remaining})
        </button>
        <button
          onClick={() => setMobilePanel(mobilePanel === "converted" ? null : "converted")}
          style={{
            flex: 1,
            background: mobilePanel === "converted" ? "rgba(16,185,129,0.1)" : "transparent",
            border: "none",
            padding: "10px 8px",
            cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: C.green,
            minHeight: "44px",
          }}
        >
          {"\u2713"} Converted ({converted})
        </button>
      </div>

      {/* Mobile: sliding panel — shown when a toggle is active */}
      {mobilePanel && (
        <div className="mobile-panel-sheet">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: "11px", color: mobilePanel === "remaining" ? C.brown : C.green, letterSpacing: "1px" }}>
              {mobilePanel === "remaining" ? "REMAINING" : "CONVERTED"}
            </span>
            <button
              onClick={() => setMobilePanel(null)}
              style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.brightText, cursor: "pointer", padding: "4px 10px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace", borderRadius: "3px", minHeight: "36px" }}
            >
              {"\u2715"}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <NodeListPanel
              side={mobilePanel}
              greenSet={greenSet}
              activePattern={patternDefs[pattern].id}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>
      )}

      {/* Mobile: node detail bottom sheet */}
      {selectedNodeId != null && (
        <div className="drawer-mobile">
          <NodeDetailDrawer
            nodeId={selectedNodeId}
            isConverted={greenSet.has(selectedNodeId)}
            activePattern={patternDefs[pattern].id}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      )}

      {/* Stage progress bar */}
      <StageProgressBar greenSet={greenSet} />

      {/* Bottom info */}
      <div
        className="bottom-info"
        style={{
          borderTop: `1px solid ${C.line}`,
          padding: "14px 24px",
          display: "flex",
          gap: "24px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "22px",
              margin: "0 0 6px",
              color: C.white,
            }}
          >
            {p.name}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: C.midText,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {p.desc}
          </p>
        </div>
        <div className="insight-panel" style={{ width: "240px", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "10px",
              color: C.dimText,
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            KEY INSIGHT
          </div>
          <div
            style={{ fontSize: "13px", color: C.midText, lineHeight: 1.5 }}
          >
            {p.insight}
          </div>
        </div>
      </div>
    </div>
  );
}

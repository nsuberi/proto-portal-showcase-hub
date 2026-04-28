import { C } from "../../lib/colors";
import { STAGES } from "../../data/stages";
import { CONVERSION_ORDER } from "../../data/conversion-order";
import { NODE_LABELS } from "../../data/node-labels";
import type { IntegrationPattern } from "../../types";

interface NodeListPanelProps {
  side: "remaining" | "converted";
  greenSet: Set<number>;
  activePattern: IntegrationPattern;
  selectedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
}

export function NodeListPanel({
  side,
  greenSet,
  activePattern: _activePattern,
  selectedNodeId,
  onNodeClick,
}: NodeListPanelProps) {
  const isConverted = side === "converted";

  const filteredNodes = CONVERSION_ORDER.filter((id) =>
    isConverted ? greenSet.has(id) : !greenSet.has(id)
  );

  const grouped = STAGES.map((stage) => ({
    stage,
    nodes: filteredNodes.filter((id) => stage.nodeIds.includes(id)),
  })).filter((g) => g.nodes.length > 0);

  return (
    <div
      className="node-list-panel"
      style={{
        width: "160px",
        height: "100%",
        flexShrink: 0,
        borderRight: side === "remaining" ? `1px solid ${C.line}` : "none",
        borderLeft: side === "converted" ? `1px solid ${C.line}` : "none",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "10px 8px",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "1px",
          marginBottom: "8px",
          color: isConverted ? C.green : C.brown,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {isConverted ? "CONVERTED" : "REMAINING"} ({filteredNodes.length})
      </div>

      {grouped.map(({ stage, nodes }) => (
        <div key={stage.id} style={{ marginBottom: "10px" }}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "1.5px",
              color: stage.color,
              opacity: 0.6,
              marginBottom: "4px",
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {stage.label}
          </div>
          {nodes.map((nodeId) => {
            const label = NODE_LABELS[nodeId] ?? `node-${nodeId}`;
            const isSelected = selectedNodeId === nodeId;
            return (
              <button
                key={nodeId}
                onClick={() => onNodeClick(nodeId)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: isSelected
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                  border: "none",
                  borderLeft: isSelected
                    ? `2px solid ${stage.color}`
                    : "2px solid transparent",
                  padding: "4px 6px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: isConverted ? C.greenLight : C.brightText,
                  opacity: isSelected ? 1 : 0.7,
                  lineHeight: 1.6,
                  transition: "all 0.15s ease",
                  minHeight: "28px",
                }}
              >
                {isConverted ? "\u2713 " : "\u25b8 "}
                {label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

import { C } from "../../lib/colors";
import { STAGES } from "../../data/stages";

interface StageProgressBarProps {
  greenSet: Set<number>;
}

export function StageProgressBar({ greenSet }: StageProgressBarProps) {
  return (
    <div
      className="stage-progress-bar"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "8px 24px",
        borderTop: `1px solid ${C.line}`,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        flexWrap: "wrap",
      }}
    >
      {STAGES.map((stage, i) => {
        const converted = stage.nodeIds.filter((id) => greenSet.has(id)).length;
        const total = stage.nodeIds.length;
        const pct = total > 0 ? converted / total : 0;
        const isComplete = converted === total;
        const isActive = converted > 0 && !isComplete;

        return (
          <div
            key={stage.id}
            style={{
              flex: 1,
              minWidth: "120px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              borderRight:
                i < STAGES.length - 1 ? `1px solid ${C.line}` : "none",
              paddingRight: i < STAGES.length - 1 ? "8px" : 0,
              marginRight: i < STAGES.length - 1 ? "8px" : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: stage.color,
                  opacity: isActive ? 0.8 : 0.4,
                  letterSpacing: "1px",
                }}
              >
                {isComplete ? "\u2713 " : ""}
                {stage.label}
              </span>
              <span style={{ color: C.dimText }}>
                {converted}/{total}
              </span>
            </div>
            <div
              style={{
                height: "3px",
                background: C.line,
                borderRadius: "1.5px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct * 100}%`,
                  background: stage.color,
                  opacity: 0.7,
                  borderRadius: "1.5px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

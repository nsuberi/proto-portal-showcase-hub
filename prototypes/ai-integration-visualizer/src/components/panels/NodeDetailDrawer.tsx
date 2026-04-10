import { C } from "../../lib/colors";
import { NODE_LABELS } from "../../data/node-labels";
import { getStageForNode } from "../../data/stages";
import { getNodeModel } from "../../data/nodes";
import type { DataField, IntegrationPattern } from "../../types";

interface NodeDetailDrawerProps {
  nodeId: number;
  isConverted: boolean;
  activePattern: IntegrationPattern;
  onClose: () => void;
}

function FieldList({
  fields,
  showNew,
}: {
  fields: DataField[];
  showNew?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {fields.map((f) => (
        <div
          key={f.name}
          style={{
            fontSize: "12px",
            fontFamily: "'IBM Plex Mono', monospace",
            color: f.isNew && showNew ? C.greenLight : C.brightText,
            opacity: f.isNew && showNew ? 1 : 0.7,
            lineHeight: 1.5,
          }}
        >
          {f.isNew && showNew ? "+ " : "  "}
          {f.name}: <span style={{ color: C.dimText }}>{f.type}</span>
          {f.source && (
            <span style={{ color: C.dimText, fontSize: "10px" }}>
              {" "}
              {"\u2190"} {f.source}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function NodeDetailDrawer({
  nodeId,
  isConverted,
  activePattern,
  onClose,
}: NodeDetailDrawerProps) {
  const label = NODE_LABELS[nodeId] ?? `node-${nodeId}`;
  const stage = getStageForNode(nodeId);
  const model = getNodeModel(nodeId);

  return (
    <div
      className="node-detail-drawer"
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(8, 8, 12, 0.95)",
        borderLeft: `1px solid ${C.line}`,
        overflowY: "auto",
        padding: "20px",
        fontFamily: "'IBM Plex Mono', monospace",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "18px",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              color: isConverted ? C.green : C.white,
              marginBottom: "6px",
            }}
          >
            {label}
          </div>
          {stage && (
            <span
              style={{
                display: "inline-block",
                fontSize: "10px",
                letterSpacing: "1.5px",
                color: stage.color,
                background: `${stage.color}15`,
                padding: "3px 8px",
                borderRadius: "3px",
                border: `1px solid ${stage.color}30`,
              }}
            >
              {stage.label}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: `1px solid ${C.line}`,
            color: C.brightText,
            cursor: "pointer",
            padding: "6px 12px",
            fontSize: "12px",
            fontFamily: "'IBM Plex Mono', monospace",
            borderRadius: "3px",
            minHeight: "36px",
          }}
        >
          {"\u2715"} CLOSE
        </button>
      </div>

      {!model ? (
        <div style={{ color: C.dimText, fontSize: "13px", fontStyle: "italic" }}>
          Data model details loading...
        </div>
      ) : (
        <>
          {/* BEFORE card */}
          <div
            style={{
              background: "rgba(217, 119, 6, 0.05)",
              border: `1px solid ${C.brownDark}40`,
              borderRadius: "6px",
              padding: "14px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "1.5px",
                color: C.brown,
                marginBottom: "8px",
              }}
            >
              BEFORE
            </div>
            <div
              style={{
                fontSize: "13px",
                color: C.brightText,
                lineHeight: 1.5,
                marginBottom: "10px",
              }}
            >
              {model.before.summary}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: C.dimText,
                letterSpacing: "1px",
                marginBottom: "4px",
              }}
            >
              IN:
            </div>
            <FieldList fields={model.before.inputFields} />

            <div
              style={{
                fontSize: "10px",
                color: C.dimText,
                letterSpacing: "1px",
                marginTop: "8px",
                marginBottom: "4px",
              }}
            >
              OUT:
            </div>
            <FieldList fields={model.before.outputFields} />

            <div
              style={{
                fontSize: "10px",
                color: C.dimText,
                letterSpacing: "1px",
                marginTop: "10px",
                marginBottom: "4px",
              }}
            >
              LOGIC:
            </div>
            <div
              style={{ fontSize: "12px", color: C.midText, lineHeight: 1.5 }}
            >
              {model.before.logic}
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "12px",
                color: C.brownLight,
                lineHeight: 1.5,
              }}
            >
              {"\u26a0"} {model.before.pain}
            </div>
          </div>

          {/* AFTER card */}
          <div
            style={{
              background: "rgba(16, 185, 129, 0.05)",
              border: `1px solid ${C.greenDark}60`,
              borderRadius: "6px",
              padding: "14px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "1.5px",
                color: C.green,
                marginBottom: "8px",
              }}
            >
              AFTER
            </div>
            <div
              style={{
                fontSize: "13px",
                color: C.brightText,
                lineHeight: 1.5,
                marginBottom: "10px",
              }}
            >
              {model.after.summary}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: C.dimText,
                letterSpacing: "1px",
                marginBottom: "4px",
              }}
            >
              IN:
            </div>
            <FieldList fields={model.after.inputFields} showNew />

            <div
              style={{
                fontSize: "10px",
                color: C.dimText,
                letterSpacing: "1px",
                marginTop: "8px",
                marginBottom: "4px",
              }}
            >
              OUT:
            </div>
            <FieldList fields={model.after.outputFields} showNew />

            <div
              style={{
                fontSize: "10px",
                color: C.dimText,
                letterSpacing: "1px",
                marginTop: "10px",
                marginBottom: "4px",
              }}
            >
              LOGIC:
            </div>
            <div
              style={{ fontSize: "12px", color: C.midText, lineHeight: 1.5 }}
            >
              {model.after.logic}
            </div>

            <div
              style={{
                marginTop: "10px",
                fontSize: "12px",
                color: C.greenLight,
                lineHeight: 1.5,
              }}
            >
              {"\u2726"} {model.after.gain}
            </div>
          </div>

          {/* Pattern narrative */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${C.line}`,
              borderRadius: "6px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "1.5px",
                color: C.midText,
                marginBottom: "8px",
              }}
            >
              PATTERN:{" "}
              {activePattern === "embedded"
                ? "EMBEDDED REPLACEMENT"
                : activePattern === "connected"
                  ? "CONNECTED MOONS"
                  : "INDEPENDENT MOONS"}
            </div>
            <div
              style={{ fontSize: "12px", color: C.brightText, lineHeight: 1.6 }}
            >
              {model.patterns[activePattern].action}
            </div>

            {activePattern === "connected" &&
              model.patterns.connected.integrationWork && (
                <div style={{ marginTop: "12px" }}>
                  {model.patterns.connected.apiEmits &&
                    model.patterns.connected.apiEmits.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div
                          style={{
                            fontSize: "10px",
                            color: C.brownLight,
                            letterSpacing: "1px",
                            marginBottom: "4px",
                          }}
                        >
                          API EMITS:
                        </div>
                        <FieldList fields={model.patterns.connected.apiEmits} />
                      </div>
                    )}
                  {model.patterns.connected.apiReceives &&
                    model.patterns.connected.apiReceives.length > 0 && (
                      <div style={{ marginBottom: "8px" }}>
                        <div
                          style={{
                            fontSize: "10px",
                            color: C.greenLight,
                            letterSpacing: "1px",
                            marginBottom: "4px",
                          }}
                        >
                          API RECEIVES:
                        </div>
                        <FieldList
                          fields={model.patterns.connected.apiReceives}
                        />
                      </div>
                    )}
                  <div
                    style={{
                      fontSize: "10px",
                      color: C.dimText,
                      letterSpacing: "1px",
                      marginBottom: "4px",
                    }}
                  >
                    INTEGRATION WORK:
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: C.midText,
                      lineHeight: 1.5,
                    }}
                  >
                    {model.patterns.connected.integrationWork}
                  </div>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
}

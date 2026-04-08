import { useState, useEffect, useRef } from "react";
import { tokens } from "@/design-system/tokens";
import { useAppLogger } from "@/components/AppLogger";

const defaultTranscript = `Sarah: Let's review the Q4 launch timeline. The API integration is on track but we need to finalize the auth flow by Friday.

Marcus: I can have the OAuth implementation ready by Wednesday. The token refresh logic is the last piece.

Priya: Design review for the dashboard is done. I'll share the updated Figma link after this call. One concern — the mobile breakpoints need another pass.

Sarah: Good. Marcus, loop in the security team on the OAuth spec. Priya, can you pair with Jordan on mobile?

Priya: Sure, we'll sync tomorrow morning.

Sarah: Last thing — the load testing results came back. P95 latency is at 240ms, which is under our 300ms target. Ship it.`;

interface ActionItem {
  text: string;
  owner: string;
  checked: boolean;
}

interface SummaryResult {
  summary: string;
  actions: ActionItem[];
  sentiment: { label: string; value: number; color: string }[];
  topics: string[];
}

const mockResult: SummaryResult = {
  summary:
    "Q4 launch review — API integration on track, OAuth auth flow due Wednesday with security review. Dashboard design complete, mobile breakpoints need refinement. Load testing passed (P95 240ms < 300ms target). Team aligned to ship.",
  actions: [
    { text: "Complete OAuth implementation with token refresh", owner: "Marcus \u00B7 Due Wednesday", checked: false },
    { text: "Loop security team in on OAuth spec review", owner: "Marcus \u00B7 This week", checked: false },
    { text: "Share updated Figma dashboard link", owner: "Priya \u00B7 Today", checked: false },
    { text: "Pair on mobile breakpoint refinements", owner: "Priya + Jordan \u00B7 Tomorrow AM", checked: false },
  ],
  sentiment: [
    { label: "Productive", value: 85, color: "#27C93F" },
    { label: "Aligned", value: 72, color: tokens.color.primary },
    { label: "Concern", value: 15, color: tokens.color.tertiary },
  ],
  topics: ["OAuth", "Dashboard", "Mobile", "Load Testing", "Q4 Launch"],
};

export default function MeetingSummarizerApp() {
  const { log } = useAppLogger();
  const [transcript, setTranscript] = useState(defaultTranscript);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    log("Meeting Summarizer initialized", "info");
    log("NLP pipeline ready (Claude API simulated)", "info");
    log(`Default transcript loaded: ${defaultTranscript.length} chars`, "info");
  }, [log]);

  const summarize = () => {
    if (!transcript.trim()) {
      log("Cannot summarize empty transcript", "warn");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    log(`Summarizing transcript (${transcript.length} chars)...`, "action");
    log("Extracting key topics...", "info");

    setTimeout(() => {
      log("Identifying action items...", "info");
    }, 500);

    setTimeout(() => {
      log("Analyzing sentiment...", "info");
    }, 900);

    setTimeout(() => {
      setResult(mockResult);
      setActions(mockResult.actions.map((a) => ({ ...a })));
      setIsProcessing(false);
      log(`Summary generated: ${mockResult.actions.length} action items, ${mockResult.topics.length} topics`, "success");
      log(`Sentiment: ${mockResult.sentiment.map((s) => `${s.label} ${s.value}%`).join(", ")}`, "info");
    }, 1400);
  };

  const toggleAction = (idx: number) => {
    setActions((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], checked: !next[idx].checked };
      const item = next[idx];
      log(
        `Action ${item.checked ? "completed" : "reopened"}: "${item.text}"`,
        item.checked ? "success" : "action",
      );
      return next;
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h2
        style={{
          fontFamily: tokens.font.headline,
          fontSize: 20,
          fontWeight: 600,
          color: tokens.color.onSurface,
          marginBottom: 4,
        }}
      >
        Meeting Summarizer
      </h2>
      <p style={{ fontFamily: tokens.font.body, fontSize: 13, color: tokens.color.outline, marginBottom: 20 }}>
        AI-powered meeting transcript analysis
      </p>

      {/* Input area */}
      <div
        style={{
          background: tokens.color.surfaceContainerLow,
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <textarea
          ref={textareaRef}
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
          }}
          onFocus={() => log("Transcript editor focused", "info")}
          placeholder="Paste meeting transcript here..."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: tokens.color.onSurface,
            fontFamily: tokens.font.body,
            fontSize: 12,
            lineHeight: 1.6,
            resize: "none",
            outline: "none",
            minHeight: 100,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <span style={{ fontSize: 10, color: tokens.color.outlineVariant }}>
            {transcript.length} chars
          </span>
          <button
            onClick={summarize}
            disabled={isProcessing}
            style={{
              background: tokens.color.primary,
              color: tokens.color.primaryContainer,
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: tokens.font.label,
              cursor: isProcessing ? "default" : "pointer",
              opacity: isProcessing ? 0.4 : 1,
              transition: "all 0.2s",
            }}
          >
            {isProcessing ? "Analyzing..." : "Summarize"}
          </button>
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ display: "inline-flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: tokens.color.primary,
                  display: "inline-block",
                  animation: `bounce 1.4s infinite ${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: tokens.color.outline, marginTop: 8 }}>
            Analyzing transcript...
          </p>
        </div>
      )}

      {/* Results */}
      {result && !isProcessing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Topics */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {result.topics.map((topic) => (
              <span
                key={topic}
                onClick={() => log(`Topic selected: ${topic}`, "action")}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: tokens.color.primaryContainer,
                  color: tokens.color.primary,
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: tokens.font.label,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {topic}
              </span>
            ))}
          </div>

          {/* Summary */}
          <div
            style={{
              background: tokens.color.surfaceContainerLow,
              borderRadius: 10,
              padding: "14px 16px",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  background: tokens.color.primaryContainer,
                }}
              >
                {"\u{1F4DD}"}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.onSurface }}>
                Summary
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: tokens.color.onSurfaceVariant,
                fontFamily: tokens.font.body,
              }}
            >
              {result.summary}
            </p>
          </div>

          {/* Action items */}
          <div
            style={{
              background: tokens.color.surfaceContainerLow,
              borderRadius: 10,
              padding: "14px 16px",
              animation: "fadeIn 0.4s ease-out 0.15s both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  background: "#261700",
                }}
              >
                {"\u2705"}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.onSurface }}>
                Action Items
              </span>
            </div>
            {actions.map((action, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "6px 0",
                }}
              >
                <div
                  onClick={() => toggleAction(i)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${action.checked ? "#27C93F" : tokens.color.outlineVariant}`,
                    background: action.checked ? "#27C93F" : "transparent",
                    flexShrink: 0,
                    marginTop: 1,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: tokens.color.surface,
                  }}
                >
                  {action.checked && "\u2713"}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: tokens.color.onSurfaceVariant,
                      lineHeight: 1.4,
                      textDecoration: action.checked ? "line-through" : "none",
                      opacity: action.checked ? 0.5 : 1,
                    }}
                  >
                    {action.text}
                  </div>
                  <div style={{ fontSize: 10, color: tokens.color.outline, marginTop: 2 }}>
                    {action.owner}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sentiment */}
          <div
            style={{
              background: tokens.color.surfaceContainerLow,
              borderRadius: 10,
              padding: "14px 16px",
              animation: "fadeIn 0.4s ease-out 0.3s both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  background: "#0f2e1a",
                }}
              >
                {"\u{1F4C8}"}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: tokens.color.onSurface }}>
                Tone & Sentiment
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {result.sentiment.map((s) => (
                <div key={s.label} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: 6,
                      background: tokens.color.surfaceContainerHighest,
                      borderRadius: 3,
                      overflow: "hidden",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${s.value}%`,
                        borderRadius: 3,
                        background: s.color,
                        animation: "growBar 0.8s ease-out both",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: tokens.color.outline }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginTop: 2 }}>
                    {s.value}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes growBar {
          from { width: 0; }
        }
      `}</style>
    </div>
  );
}

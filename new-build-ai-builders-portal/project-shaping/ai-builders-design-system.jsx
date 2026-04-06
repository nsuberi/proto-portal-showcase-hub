import { useState, useRef, useEffect } from "react";

// ============================================================
// AI BUILDERS PORTAL — DESIGN SYSTEM SHOWCASE
// ============================================================
// Design tokens, component definitions, and live demonstrations
// System font stack only (enterprise CDN constraint)
// shadcn/ui token architecture with space-exploration metaphor
// ============================================================

// --- DESIGN TOKENS ---
const tokens = {
  color: {
    deepSpace: "#0F1B2D",
    orbitalBlue: "#1E3A5F",
    instrumentBlue: "#3B82C4",
    signalOrange: "#D4763A",
    atmosphereTeal: "#2A9D8F",
    regolith: "#F4F1EC",
    shelterWhite: "#FAFAF8",
    sediment: "#E8E3DA",
    dust: "#8B8178",
    darkText: "#2D2926",
    borderWarm: "#D5CEC4",
    // Phase gradients
    phase1: "#1E3A5F",
    phase2: "#2A9D8F",
    phase3: "#D4A03A",
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Code", "Fira Code", "JetBrains Mono", ui-monospace, monospace',
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
  },
};

// --- SHARED STYLES ---
const sectionStyle = {
  marginBottom: "64px",
};

const sectionTitleStyle = {
  fontFamily: tokens.font.sans,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: tokens.color.dust,
  marginBottom: "24px",
  paddingBottom: "12px",
  borderBottom: `1px solid ${tokens.color.borderWarm}`,
};

const componentLabelStyle = {
  fontFamily: tokens.font.mono,
  fontSize: "11px",
  color: tokens.color.instrumentBlue,
  marginBottom: "8px",
  display: "block",
};

const componentDescStyle = {
  fontFamily: tokens.font.sans,
  fontSize: "13px",
  color: tokens.color.dust,
  marginBottom: "16px",
  lineHeight: 1.5,
};

// ============================================================
// COMPONENT: ChallengeCard
// ============================================================
function ChallengeCard({ phase = 1, title, description, deliverables = [], status = "not-started", tags = [] }) {
  const phaseColors = {
    1: { accent: tokens.color.phase1, bg: "#E8EEF4", label: "Guided" },
    2: { accent: tokens.color.phase2, bg: "#E6F4F1", label: "Constrained" },
    3: { accent: tokens.color.phase3, bg: "#F4EFE6", label: "Discovery" },
  };
  const p = phaseColors[phase] || phaseColors[1];
  const statusMap = {
    "not-started": { label: "Not started", bg: tokens.color.sediment, color: tokens.color.dust },
    "in-progress": { label: "In progress", bg: "#E0F0FA", color: tokens.color.instrumentBlue },
    submitted: { label: "Submitted", bg: "#FDE8D8", color: tokens.color.signalOrange },
    reviewed: { label: "Reviewed", bg: "#D8F0E8", color: tokens.color.atmosphereTeal },
  };
  const s = statusMap[status] || statusMap["not-started"];

  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      overflow: "hidden",
      transition: "box-shadow 0.2s ease",
    }}>
      <div style={{ height: "4px", background: p.accent }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{
              fontFamily: tokens.font.sans, fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              background: p.bg, color: p.accent,
              padding: "3px 10px", borderRadius: tokens.radius.full,
            }}>{p.label}</span>
            {tags.map((t, i) => (
              <span key={i} style={{
                fontFamily: tokens.font.sans, fontSize: "10px",
                color: tokens.color.dust,
                padding: "3px 8px", borderRadius: tokens.radius.full,
                border: `0.5px solid ${tokens.color.borderWarm}`,
              }}>{t}</span>
            ))}
          </div>
          <span style={{
            fontFamily: tokens.font.sans, fontSize: "11px", fontWeight: 500,
            background: s.bg, color: s.color,
            padding: "3px 10px", borderRadius: tokens.radius.full,
          }}>{s.label}</span>
        </div>
        <h3 style={{
          fontFamily: tokens.font.sans, fontSize: "16px", fontWeight: 600,
          color: tokens.color.deepSpace, margin: "0 0 8px",
        }}>{title}</h3>
        <p style={{
          fontFamily: tokens.font.sans, fontSize: "13px", lineHeight: 1.6,
          color: tokens.color.dust, margin: "0 0 16px",
        }}>{description}</p>
        {deliverables.length > 0 && (
          <div style={{
            background: tokens.color.regolith, borderRadius: tokens.radius.md,
            padding: "12px 16px",
          }}>
            <div style={{
              fontFamily: tokens.font.sans, fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: tokens.color.dust, marginBottom: "8px",
            }}>Deliverables</div>
            {deliverables.map((d, i) => (
              <div key={i} style={{
                fontFamily: tokens.font.sans, fontSize: "12px", color: tokens.color.darkText,
                padding: "4px 0", display: "flex", gap: "8px", alignItems: "center",
              }}>
                <span style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: p.accent, flexShrink: 0,
                }} />
                {d}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: DevlogEntry
// ============================================================
function DevlogEntry({ title, date, sections = {}, author }) {
  const [expanded, setExpanded] = useState(null);
  const sectionMeta = {
    architecture: { label: "Architecture decisions", icon: "◇" },
    design: { label: "Design decisions", icon: "△" },
    organization: { label: "Organizational context", icon: "○" },
    learned: { label: "What I learned", icon: "☆" },
    change: { label: "What I'd change", icon: "↻" },
  };

  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      overflow: "hidden",
    }}>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <h3 style={{
            fontFamily: tokens.font.sans, fontSize: "15px", fontWeight: 600,
            color: tokens.color.deepSpace, margin: 0,
          }}>{title}</h3>
          <span style={{
            fontFamily: tokens.font.mono, fontSize: "11px",
            color: tokens.color.dust,
          }}>{date}</span>
        </div>
        {author && (
          <div style={{
            fontFamily: tokens.font.sans, fontSize: "12px",
            color: tokens.color.dust, marginBottom: "16px",
          }}>{author}</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {Object.entries(sections).map(([key, content]) => {
            const meta = sectionMeta[key];
            if (!meta || !content) return null;
            const isOpen = expanded === key;
            return (
              <div key={key} style={{
                borderRadius: tokens.radius.md,
                overflow: "hidden",
                border: `0.5px solid ${isOpen ? tokens.color.instrumentBlue + "40" : tokens.color.borderWarm}`,
                transition: "border-color 0.2s",
              }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 14px", border: "none", cursor: "pointer",
                    background: isOpen ? tokens.color.instrumentBlue + "08" : tokens.color.regolith,
                    fontFamily: tokens.font.sans, fontSize: "12px", fontWeight: 500,
                    color: isOpen ? tokens.color.instrumentBlue : tokens.color.darkText,
                    textAlign: "left", transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "14px", opacity: 0.7 }}>{meta.icon}</span>
                  <span style={{ flex: 1 }}>{meta.label}</span>
                  <span style={{
                    fontSize: "11px", transition: "transform 0.2s",
                    transform: isOpen ? "rotate(90deg)" : "none",
                  }}>›</span>
                </button>
                {isOpen && (
                  <div style={{
                    padding: "12px 14px 14px",
                    fontFamily: tokens.font.sans, fontSize: "13px",
                    lineHeight: 1.7, color: tokens.color.darkText,
                    background: tokens.color.shelterWhite,
                    borderTop: `0.5px solid ${tokens.color.borderWarm}`,
                  }}>{content}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: VideoViewer (Loom embed)
// ============================================================
function VideoViewer({ loomUrl, caption }) {
  const extractId = (url) => {
    const match = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
    return match ? match[1] : null;
  };
  const videoId = extractId(loomUrl);

  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      overflow: "hidden",
    }}>
      <div style={{
        position: "relative", paddingBottom: "56.25%",
        background: tokens.color.deepSpace,
      }}>
        {videoId ? (
          <iframe
            src={`https://www.loom.com/embed/${videoId}?hide_owner=true&hide_share=true&hide_title=true`}
            frameBorder="0"
            allowFullScreen
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: tokens.color.dust, fontFamily: tokens.font.sans, fontSize: "13px",
          }}>Invalid Loom URL</div>
        )}
      </div>
      {caption && (
        <div style={{
          padding: "12px 16px",
          fontFamily: tokens.font.sans, fontSize: "12px",
          color: tokens.color.dust, lineHeight: 1.5,
        }}>{caption}</div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT: ArtifactRenderer (simulated)
// ============================================================
function ArtifactRenderer({ title, status = "running", language = "jsx", code }) {
  const statusColors = {
    running: { bg: "#D8F0E8", color: tokens.color.atmosphereTeal, label: "● Running" },
    building: { bg: "#E0F0FA", color: tokens.color.instrumentBlue, label: "◌ Building…" },
    error: { bg: "#FDE8D8", color: "#C0442A", label: "● Error" },
  };
  const s = statusColors[status] || statusColors.running;

  return (
    <div style={{
      background: tokens.color.deepSpace,
      borderRadius: tokens.radius.lg,
      overflow: "hidden",
      border: `0.5px solid ${tokens.color.orbitalBlue}`,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 16px",
        background: "#0A1420",
        borderBottom: `0.5px solid ${tokens.color.orbitalBlue}`,
      }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "5px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6059" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} />
          </div>
          <span style={{
            fontFamily: tokens.font.mono, fontSize: "11px", color: "#6B8BA4",
            marginLeft: "8px",
          }}>{title}</span>
        </div>
        <span style={{
          fontFamily: tokens.font.mono, fontSize: "10px", fontWeight: 500,
          color: s.color, background: s.bg + "20",
          padding: "2px 8px", borderRadius: tokens.radius.full,
        }}>{s.label}</span>
      </div>
      <div style={{ padding: "16px 20px", minHeight: "120px" }}>
        <pre style={{
          fontFamily: tokens.font.mono, fontSize: "12px", lineHeight: 1.7,
          color: "#B8CDE0", margin: 0, overflow: "auto",
        }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: JourneyMap (private self-assessment)
// ============================================================
function JourneyMap({ phases }) {
  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      padding: "24px",
    }}>
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px" }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            flex: 1, height: "6px",
            borderRadius: i === 0 ? "3px 0 0 3px" : i === phases.length - 1 ? "0 3px 3px 0" : 0,
            background: p.complete ? tokens.color.atmosphereTeal : tokens.color.sediment,
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            display: "flex", gap: "16px", alignItems: "flex-start",
            opacity: p.complete ? 1 : 0.5,
          }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: p.complete ? tokens.color.atmosphereTeal : tokens.color.sediment,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: p.complete ? "#fff" : tokens.color.dust,
              fontFamily: tokens.font.sans, fontSize: "11px", fontWeight: 600,
              flexShrink: 0, marginTop: "2px",
            }}>{p.complete ? "✓" : i + 1}</div>
            <div>
              <div style={{
                fontFamily: tokens.font.sans, fontSize: "13px", fontWeight: 600,
                color: tokens.color.deepSpace, marginBottom: "2px",
              }}>{p.title}</div>
              <div style={{
                fontFamily: tokens.font.sans, fontSize: "12px",
                color: tokens.color.dust, lineHeight: 1.5,
              }}>{p.insight}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: OnboardingFlow (goal articulation)
// ============================================================
function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const steps = [
    {
      question: "What's your current role?",
      followUp: "What does a typical week look like in that role?",
      placeholder: "e.g. Business analyst in mortgage operations",
    },
    {
      question: "Have you built anything with code before?",
      followUp: "What made you want to start — or what's held you back?",
      options: ["Yes, regularly", "A little — tutorials, small scripts", "Not yet"],
    },
    {
      question: "What's a problem you see in your work that you wish you could solve?",
      followUp: "Who else is affected by this problem?",
      placeholder: "Describe something that frustrates you or your team",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 24px",
        background: tokens.color.deepSpace,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{
          fontFamily: tokens.font.sans, fontSize: "13px", fontWeight: 500,
          color: "#C8D6E5",
        }}>Getting started</span>
        <div style={{ display: "flex", gap: "6px" }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? "20px" : "6px", height: "6px",
              borderRadius: "3px",
              background: i <= step ? tokens.color.instrumentBlue : tokens.color.orbitalBlue,
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>
      </div>
      <div style={{ padding: "24px" }}>
        <div style={{
          fontFamily: tokens.font.sans, fontSize: "15px", fontWeight: 600,
          color: tokens.color.deepSpace, marginBottom: "16px",
        }}>{current.question}</div>
        {current.options ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers({ ...answers, [step]: opt })}
                style={{
                  padding: "10px 16px", borderRadius: tokens.radius.md,
                  border: `0.5px solid ${answers[step] === opt ? tokens.color.instrumentBlue : tokens.color.borderWarm}`,
                  background: answers[step] === opt ? tokens.color.instrumentBlue + "0A" : tokens.color.regolith,
                  fontFamily: tokens.font.sans, fontSize: "13px",
                  color: answers[step] === opt ? tokens.color.instrumentBlue : tokens.color.darkText,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >{opt}</button>
            ))}
          </div>
        ) : (
          <textarea
            placeholder={current.placeholder}
            value={answers[step] || ""}
            onChange={(e) => setAnswers({ ...answers, [step]: e.target.value })}
            style={{
              width: "100%", minHeight: "60px", padding: "12px 14px",
              borderRadius: tokens.radius.md,
              border: `0.5px solid ${tokens.color.borderWarm}`,
              background: tokens.color.regolith,
              fontFamily: tokens.font.sans, fontSize: "13px",
              color: tokens.color.darkText, resize: "vertical",
              lineHeight: 1.6, marginBottom: "20px",
              outline: "none",
            }}
          />
        )}
        <div style={{
          padding: "12px 16px",
          background: tokens.color.instrumentBlue + "08",
          borderRadius: tokens.radius.md,
          borderLeft: `3px solid ${tokens.color.instrumentBlue}`,
          marginBottom: "20px",
        }}>
          <div style={{
            fontFamily: tokens.font.sans, fontSize: "10px", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: tokens.color.instrumentBlue, marginBottom: "4px",
          }}>AI follow-up</div>
          <div style={{
            fontFamily: tokens.font.sans, fontSize: "13px",
            color: tokens.color.darkText, lineHeight: 1.5, fontStyle: "italic",
          }}>{current.followUp}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            style={{
              padding: "8px 16px", borderRadius: tokens.radius.md,
              border: `0.5px solid ${tokens.color.borderWarm}`,
              background: "transparent",
              fontFamily: tokens.font.sans, fontSize: "12px", fontWeight: 500,
              color: tokens.color.dust, cursor: step > 0 ? "pointer" : "default",
              opacity: step > 0 ? 1 : 0.3,
            }}
          >Back</button>
          <button
            onClick={() => !isLast && setStep(step + 1)}
            style={{
              padding: "8px 20px", borderRadius: tokens.radius.md,
              border: "none",
              background: isLast ? tokens.color.signalOrange : tokens.color.deepSpace,
              fontFamily: tokens.font.sans, fontSize: "12px", fontWeight: 500,
              color: "#fff", cursor: "pointer",
            }}
          >{isLast ? "Complete profile" : "Continue"}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: GoalEvolution
// ============================================================
function GoalEvolution({ goals }) {
  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      padding: "20px 24px",
    }}>
      <div style={{ position: "relative", paddingLeft: "24px" }}>
        <div style={{
          position: "absolute", left: "7px", top: "8px", bottom: "8px",
          width: "1.5px", background: tokens.color.borderWarm,
        }} />
        {goals.map((g, i) => (
          <div key={i} style={{
            position: "relative", marginBottom: i < goals.length - 1 ? "20px" : 0,
          }}>
            <div style={{
              position: "absolute", left: "-20px", top: "6px",
              width: "10px", height: "10px", borderRadius: "50%",
              background: i === goals.length - 1 ? tokens.color.atmosphereTeal : tokens.color.sediment,
              border: `2px solid ${i === goals.length - 1 ? tokens.color.atmosphereTeal : tokens.color.borderWarm}`,
            }} />
            <div style={{
              fontFamily: tokens.font.mono, fontSize: "10px",
              color: tokens.color.dust, marginBottom: "4px",
            }}>{g.date}</div>
            <div style={{
              fontFamily: tokens.font.sans, fontSize: "13px",
              color: i === goals.length - 1 ? tokens.color.deepSpace : tokens.color.dust,
              fontWeight: i === goals.length - 1 ? 500 : 400,
              lineHeight: 1.5,
              textDecoration: i < goals.length - 1 ? "line-through" : "none",
              textDecorationColor: tokens.color.borderWarm,
            }}>{g.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: ProfileCard
// ============================================================
function ProfileCard({ name, role, phase, stats }) {
  const phaseLabels = { 1: "Developing intuition", 2: "Exercising judgment", 3: "Navigating independently" };
  const phaseColors = { 1: tokens.color.phase1, 2: tokens.color.phase2, 3: tokens.color.phase3 };

  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "24px 24px 20px",
        background: `linear-gradient(135deg, ${tokens.color.deepSpace} 0%, ${tokens.color.orbitalBlue} 100%)`,
      }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: tokens.color.instrumentBlue + "30",
            border: `2px solid ${tokens.color.instrumentBlue}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: tokens.font.sans, fontSize: "18px", fontWeight: 600,
            color: "#C8D6E5",
          }}>{name.split(" ").map(n => n[0]).join("")}</div>
          <div>
            <div style={{
              fontFamily: tokens.font.sans, fontSize: "16px", fontWeight: 600,
              color: "#E8F0F8",
            }}>{name}</div>
            <div style={{
              fontFamily: tokens.font.sans, fontSize: "12px",
              color: "#8BA4BD",
            }}>{role}</div>
          </div>
        </div>
        <div style={{
          marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 12px", borderRadius: tokens.radius.full,
          background: phaseColors[phase] + "30",
          border: `0.5px solid ${phaseColors[phase]}50`,
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: phaseColors[phase] }} />
          <span style={{
            fontFamily: tokens.font.sans, fontSize: "11px", fontWeight: 500,
            color: "#C8D6E5",
          }}>{phaseLabels[phase]}</span>
        </div>
      </div>
      <div style={{
        padding: "16px 24px",
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px",
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: tokens.font.sans, fontSize: "20px", fontWeight: 600,
              color: tokens.color.deepSpace,
            }}>{s.value}</div>
            <div style={{
              fontFamily: tokens.font.sans, fontSize: "10px",
              color: tokens.color.dust, textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: ShowcaseGalleryItem
// ============================================================
function ShowcaseGalleryItem({ title, author, tags, reactions }) {
  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${tokens.color.borderWarm}`,
      overflow: "hidden",
      cursor: "pointer",
      transition: "border-color 0.2s",
    }}>
      <div style={{
        height: "100px", background: `linear-gradient(135deg, ${tokens.color.deepSpace}, ${tokens.color.orbitalBlue})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: tokens.font.mono, fontSize: "11px",
          color: tokens.color.instrumentBlue, opacity: 0.7,
        }}>▶ artifact preview</span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{
          fontFamily: tokens.font.sans, fontSize: "13px", fontWeight: 600,
          color: tokens.color.deepSpace, marginBottom: "4px",
        }}>{title}</div>
        <div style={{
          fontFamily: tokens.font.sans, fontSize: "11px",
          color: tokens.color.dust, marginBottom: "10px",
        }}>by {author}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {tags.map((t, i) => (
              <span key={i} style={{
                fontFamily: tokens.font.mono, fontSize: "9px",
                color: tokens.color.dust, padding: "2px 6px",
                borderRadius: tokens.radius.sm,
                background: tokens.color.regolith,
              }}>{t}</span>
            ))}
          </div>
          <div style={{
            fontFamily: tokens.font.sans, fontSize: "11px", color: tokens.color.dust,
          }}>{reactions}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: LiveRoomCard
// ============================================================
function LiveRoomCard({ theme, time, attendees, status = "upcoming" }) {
  const isLive = status === "live";
  return (
    <div style={{
      background: tokens.color.shelterWhite,
      borderRadius: tokens.radius.lg,
      border: `0.5px solid ${isLive ? tokens.color.signalOrange + "60" : tokens.color.borderWarm}`,
      padding: "16px 20px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
          {isLive && (
            <span style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: tokens.color.signalOrange,
              boxShadow: `0 0 0 3px ${tokens.color.signalOrange}20`,
              animation: "pulse 2s ease infinite",
            }} />
          )}
          <span style={{
            fontFamily: tokens.font.sans, fontSize: "13px", fontWeight: 600,
            color: tokens.color.deepSpace,
          }}>{theme}</span>
        </div>
        <span style={{
          fontFamily: tokens.font.sans, fontSize: "11px", color: tokens.color.dust,
        }}>{time} · {attendees} attendees</span>
      </div>
      <button style={{
        padding: "6px 14px", borderRadius: tokens.radius.md,
        border: isLive ? "none" : `0.5px solid ${tokens.color.borderWarm}`,
        background: isLive ? tokens.color.signalOrange : "transparent",
        fontFamily: tokens.font.sans, fontSize: "11px", fontWeight: 500,
        color: isLive ? "#fff" : tokens.color.darkText,
        cursor: "pointer",
      }}>{isLive ? "Join now" : "RSVP"}</button>
    </div>
  );
}

// ============================================================
// COMPONENT: ReferencePanel
// ============================================================
function ReferencePanel({ title, content, category }) {
  const [open, setOpen] = useState(false);
  const catColors = {
    architecture: tokens.color.instrumentBlue,
    building: tokens.color.atmosphereTeal,
    data: tokens.color.phase3,
    design: tokens.color.signalOrange,
  };
  const accent = catColors[category] || tokens.color.instrumentBlue;

  return (
    <div style={{
      borderRadius: tokens.radius.md,
      border: `0.5px solid ${open ? accent + "40" : tokens.color.borderWarm}`,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 14px", border: "none", cursor: "pointer",
          background: open ? accent + "08" : tokens.color.shelterWhite,
          fontFamily: tokens.font.sans, fontSize: "12px", fontWeight: 500,
          color: open ? accent : tokens.color.darkText,
          textAlign: "left", transition: "all 0.15s",
        }}
      >
        <span style={{
          width: "3px", height: "14px", borderRadius: "2px",
          background: accent, flexShrink: 0,
        }} />
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{
          fontFamily: tokens.font.mono, fontSize: "9px",
          color: tokens.color.dust, padding: "2px 6px",
          borderRadius: tokens.radius.sm, background: tokens.color.regolith,
        }}>{category}</span>
        <span style={{
          fontSize: "11px", transition: "transform 0.2s",
          transform: open ? "rotate(90deg)" : "none", color: tokens.color.dust,
        }}>›</span>
      </button>
      {open && (
        <div style={{
          padding: "14px", borderTop: `0.5px solid ${tokens.color.borderWarm}`,
          background: tokens.color.regolith,
          fontFamily: tokens.font.sans, fontSize: "13px",
          lineHeight: 1.7, color: tokens.color.darkText,
        }}>
          {content}
          <div style={{
            marginTop: "12px", padding: "10px 12px",
            background: tokens.color.shelterWhite,
            borderRadius: tokens.radius.md,
            borderLeft: `3px solid ${accent}`,
            fontFamily: tokens.font.sans, fontSize: "12px",
            color: tokens.color.dust, fontStyle: "italic",
          }}>
            This matters because you want to be in power to fix things — not waiting for someone else.
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN SHOWCASE
// ============================================================
export default function DesignSystemShowcase() {
  return (
    <div style={{
      fontFamily: tokens.font.sans,
      background: tokens.color.regolith,
      minHeight: "100vh",
      padding: "40px 24px",
      maxWidth: "800px",
      margin: "0 auto",
    }}>
      {/* HEADER */}
      <div style={{ marginBottom: "56px" }}>
        <div style={{
          fontSize: "10px", fontWeight: 600, letterSpacing: "0.15em",
          textTransform: "uppercase", color: tokens.color.instrumentBlue,
          marginBottom: "8px",
        }}>Design System v0.1</div>
        <h1 style={{
          fontSize: "28px", fontWeight: 700, color: tokens.color.deepSpace,
          margin: "0 0 8px", lineHeight: 1.2,
        }}>AI Builders Portal</h1>
        <p style={{
          fontSize: "14px", color: tokens.color.dust, lineHeight: 1.6,
          margin: "0 0 24px", maxWidth: "500px",
        }}>
          Component library and design tokens. System font stack, shadcn/ui token architecture,
          space-exploration visual metaphor grounded in habitation.
        </p>
        {/* Token swatches */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {[
            { c: tokens.color.deepSpace, n: "Deep space" },
            { c: tokens.color.orbitalBlue, n: "Orbital" },
            { c: tokens.color.instrumentBlue, n: "Instrument" },
            { c: tokens.color.signalOrange, n: "Signal" },
            { c: tokens.color.atmosphereTeal, n: "Atmosphere" },
            { c: tokens.color.regolith, n: "Regolith" },
            { c: tokens.color.sediment, n: "Sediment" },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            }}>
              <div style={{
                width: "40px", height: "24px", borderRadius: "4px",
                background: s.c,
                border: `0.5px solid ${tokens.color.borderWarm}`,
              }} />
              <span style={{ fontSize: "8px", color: tokens.color.dust, letterSpacing: "0.02em" }}>{s.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- PROFILE ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Profile</div>
        <span style={componentLabelStyle}>{"<ProfileCard />"}</span>
        <p style={componentDescStyle}>
          The central living document. Shows goals, portfolio stats, phase, and community footprint.
          Private layer includes self-assessment; public layer is what gets shared via link.
        </p>
        <ProfileCard
          name="Jordan Rivera"
          role="Senior Business Analyst · Mortgage Operations"
          phase={2}
          stats={[
            { value: "7", label: "Challenges" },
            { value: "12", label: "Devlogs" },
            { value: "3", label: "Presentations" },
            { value: "42", label: "Reactions" },
          ]}
        />
      </div>

      {/* ---- ONBOARDING ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Onboarding Flow</div>
        <span style={componentLabelStyle}>{"<OnboardingFlow />"}</span>
        <p style={componentDescStyle}>
          Conversational goal articulation. Designed questions with AI follow-ups draw out
          grounded goals. Interactive — try clicking through the steps.
        </p>
        <OnboardingFlow />
      </div>

      {/* ---- GOAL EVOLUTION ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Goal Evolution</div>
        <span style={componentLabelStyle}>{"<GoalEvolution />"}</span>
        <p style={componentDescStyle}>
          Timeline of how goals evolved — evidence of developing judgment.
          Early goals are vague; later goals are problem-focused and organizationally grounded.
        </p>
        <GoalEvolution goals={[
          { date: "Jan 2026", text: "Learn to build AI apps" },
          { date: "Feb 2026", text: "Build a chatbot for my team" },
          { date: "Mar 2026", text: "Prototype a document triage tool that reduces initial review time for loan applications" },
          { date: "Apr 2026", text: "Pitch the document triage prototype to ops leadership with evidence from a 2-week pilot" },
        ]} />
      </div>

      {/* ---- CHALLENGE CARDS ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Challenge Cards</div>
        <span style={componentLabelStyle}>{"<ChallengeCard />"}</span>
        <p style={componentDescStyle}>
          Bounded units of work. Scaffolding density communicates phase without labeling it.
          Top accent bar color shifts with phase. Status tracks submission lifecycle.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ChallengeCard
            phase={1}
            title="Walk the terrain: Your first deployment"
            description="Follow a guided walkthrough to deploy a simple Flask application with hot module reload. You'll learn how your dev environment works — proxy configuration, log access, and what happens when things break."
            deliverables={["Running application deployed to dev", "Screenshot of successful log inspection"]}
            status="reviewed"
            tags={["Architecture", "Building"]}
          />
          <ChallengeCard
            phase={2}
            title="Design a data privacy layer"
            description="Given a schema with mixed PII classifications, design and implement a cleansing pipeline that handles each classification appropriately. You choose the approach — justify your trade-offs in your devlog."
            deliverables={["Working pipeline artifact", "Devlog with architecture and design sections", "2-min video walkthrough"]}
            status="in-progress"
            tags={["Data Modeling"]}
          />
          <ChallengeCard
            phase={3}
            title="Discovery: Find and shape your own problem"
            description="Identify a real problem in your organization through stakeholder conversations. Create a prototype that drives the conversation about how to prioritize, resource, and solve it. Present your discovery to the community."
            deliverables={["1-pager product brief", "Working prototype", "Presentation recording", "Devlog"]}
            status="not-started"
            tags={["Discovery", "Go-to-Market"]}
          />
        </div>
      </div>

      {/* ---- ARTIFACT RENDERER ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Artifact Renderer</div>
        <span style={componentLabelStyle}>{"<ArtifactRenderer />"}</span>
        <p style={componentDescStyle}>
          Runs and renders code inline from a README. The "show, don't tell" engine.
          Error states reinforce the "visibility as power" disposition — logs are always accessible.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ArtifactRenderer
            title="document-triage/app.jsx"
            status="running"
            code={`// Document Triage Prototype — Jordan Rivera
import { useState } from "react";
import { classifyDocument } from "./classifier";
import { PrivacyBadge } from "./components";

export default function TriageView({ documents }) {
  const [results, setResults] = useState([]);

  const handleUpload = async (files) => {
    const classified = await Promise.all(
      files.map(f => classifyDocument(f))
    );
    setResults(classified);
  };

  return (
    <div className="triage-container">
      <DropZone onUpload={handleUpload} />
      {results.map(doc => (
        <DocumentCard key={doc.id} {...doc}>
          <PrivacyBadge level={doc.piiLevel} />
        </DocumentCard>
      ))}
    </div>
  );
}`}
          />
          <ArtifactRenderer
            title="pipeline/cleanse.py"
            status="error"
            code={`Traceback (most recent call last):
  File "cleanse.py", line 42, in process_batch
    result = redact_pii(record, classification)
  File "cleanse.py", line 18, in redact_pii
    raise ValueError(
ValueError: Unknown PII classification: "RESTRICTED"
  > Known classifications: PUBLIC, INTERNAL, CONFIDENTIAL

Hint: Check your schema mapping in config/classifications.yaml
      The RESTRICTED level was added in v2.3 of the data governance policy.`}
          />
        </div>
      </div>

      {/* ---- DEVLOG ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Devlog</div>
        <span style={componentLabelStyle}>{"<DevlogEntry />"}</span>
        <p style={componentDescStyle}>
          Structured reflection. Sections map to areas of professional judgment.
          Not every section needed per entry — the structure provides scaffolding, not rigidity.
          Click sections to expand.
        </p>
        <DevlogEntry
          title="Document triage prototype — iteration 2"
          date="2026-04-02"
          author="Jordan Rivera"
          sections={{
            architecture: "Switched from a monolithic classifier to a pipeline pattern with separate stages for extraction, classification, and redaction. This lets us swap the classification model without touching the other stages. The trade-off is more complexity in the data flow — each stage needs to agree on the document schema.",
            design: "Replaced the results table with individual document cards that show the PII classification as a color-coded badge. The badge uses our design tokens — CONFIDENTIAL gets signal orange, INTERNAL gets instrument blue. Users said the table felt like a spreadsheet; the cards feel like they're reviewing actual documents.",
            organization: "Met with the compliance team to validate our PII classification mapping. They flagged that RESTRICTED was added in v2.3 of the governance policy but wasn't in our config. This is exactly the kind of thing you only find by talking to the people who own the policy.",
            learned: "The pipeline pattern made testing dramatically easier — I could write unit tests for each stage independently. Also learned that our compliance team maintains a classification matrix that I should have found earlier. Lesson: always ask 'who owns this data standard?' before building your own mapping.",
            change: "I would start with the compliance team conversation first, not after building the initial prototype. The governance policy document was the source of truth, and I was guessing at classifications that already had formal definitions.",
          }}
        />
      </div>

      {/* ---- VIDEO VIEWER ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Video Viewer</div>
        <span style={componentLabelStyle}>{"<VideoViewer />"}</span>
        <p style={componentDescStyle}>
          Embeds Loom recordings inline. Appears in devlogs, showcase gallery, challenge submissions,
          and shareable portfolios. Auto-detects Loom share links.
        </p>
        <VideoViewer
          loomUrl="https://www.loom.com/share/b6eb7fadcd124848ac8dfe4118788697"
          caption="Discovery presentation — Document triage prototype walkthrough and stakeholder feedback summary."
        />
      </div>

      {/* ---- JOURNEY MAP ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Journey Map / Self-Assessment</div>
        <span style={componentLabelStyle}>{"<JourneyMap />"}</span>
        <p style={componentDescStyle}>
          Private progression view. Draws on submitted devlogs and artifacts to reflect growth.
          AI-powered insights surface patterns in terminology, reasoning, and decision-making over time.
        </p>
        <JourneyMap phases={[
          { title: "Environment setup", insight: "Completed first deployment. Logs accessed independently.", complete: true },
          { title: "Guided building", insight: "Your devlog used 'trade-off' for the first time here — a shift from describing what to articulating why.", complete: true },
          { title: "Constrained project", insight: "Pipeline architecture decision shows systems thinking. You chose testability over simplicity — and explained the reasoning.", complete: true },
          { title: "Organizational navigation", insight: "Compliance team meeting was a turning point — your later devlogs reference governance sources directly.", complete: true },
          { title: "Independent discovery", insight: "In progress. Your 1-pager draft focuses on the problem more than the solution — that's the right instinct.", complete: false },
          { title: "Community presentation", insight: "Upcoming. You've submitted a topic for the leadership pitch room.", complete: false },
        ]} />
      </div>

      {/* ---- SHOWCASE GALLERY ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Showcase Gallery</div>
        <span style={componentLabelStyle}>{"<ShowcaseGalleryItem />"}</span>
        <p style={componentDescStyle}>
          Browsable peer work. Running artifacts paired with devlogs and video.
          The legitimate peripheral participation engine — Phase 1 people see what's possible.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <ShowcaseGalleryItem
            title="Loan doc classifier"
            author="Jordan R."
            tags={["data", "AI"]}
            reactions="12 reactions"
          />
          <ShowcaseGalleryItem
            title="Rate lock dashboard"
            author="Priya K."
            tags={["design", "API"]}
            reactions="8 reactions"
          />
          <ShowcaseGalleryItem
            title="Compliance checker"
            author="Marcus T."
            tags={["eval", "risk"]}
            reactions="15 reactions"
          />
        </div>
      </div>

      {/* ---- LIVE ROOM ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Live Room</div>
        <span style={componentLabelStyle}>{"<LiveRoomCard />"}</span>
        <p style={componentDescStyle}>
          Themed session spaces. The theme tells participants what kind of feedback to give.
          "Leadership pitch" gives different feedback than "technical architecture."
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <LiveRoomCard
            theme="Presenting discovery work to leadership"
            time="Live now"
            attendees={6}
            status="live"
          />
          <LiveRoomCard
            theme="Technical architecture review"
            time="Tomorrow, 2:00 PM EST"
            attendees={4}
            status="upcoming"
          />
          <LiveRoomCard
            theme="Demo day: Cohort 3 final presentations"
            time="Apr 12, 10:00 AM EST"
            attendees={18}
            status="upcoming"
          />
        </div>
      </div>

      {/* ---- REFERENCE PANEL ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Reference Panel</div>
        <span style={componentLabelStyle}>{"<ReferencePanel />"}</span>
        <p style={componentDescStyle}>
          Contextual knowledge that surfaces alongside active work. Not a docs site — inline and
          connected to what you're building. Click to expand.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <ReferencePanel
            title="How proxies interact with hot module reload"
            category="architecture"
            content="When your dev server runs behind a corporate proxy, WebSocket connections for HMR need special handling. The proxy must forward the Upgrade header for the WebSocket handshake. If your changes aren't reflecting in the browser, this is the first place to look — check your proxy configuration for WebSocket support."
          />
          <ReferencePanel
            title="When to use mock data vs. real data flows"
            category="building"
            content="Use mock data when you're exploring a UI concept and the shape of the data matters more than its accuracy. Switch to real data flows as soon as you're testing integration points, performance, or data transformation logic. The danger zone is staying on mocks too long — you build confidence in something that doesn't reflect production reality."
          />
          <ReferencePanel
            title="PII classification levels and cleansing requirements"
            category="data"
            content="Your organization's data governance policy defines classification levels. Don't invent your own — find the canonical source. Each level has specific handling requirements: PUBLIC data can flow freely, INTERNAL requires access controls, CONFIDENTIAL requires encryption at rest and in transit, RESTRICTED requires additional audit logging."
          />
          <ReferencePanel
            title="Killing your darlings — when to abandon a prototype"
            category="design"
            content="A prototype exists to learn, not to ship. If you've learned what you needed to learn, the prototype did its job — even if you throw it away. The danger is becoming attached to code you wrote. Ask: am I defending this because it's the right approach, or because I already built it?"
          />
        </div>
      </div>

      {/* ---- GO-TO-MARKET TOOLKIT ---- */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Go-to-Market Toolkit</div>
        <span style={componentLabelStyle}>{"<ToolkitItem />"}</span>
        <p style={componentDescStyle}>
          Downloadable templates for organizational artifacts. These are instruments you take
          out of the portal and into your enterprise — not content you consume.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { title: "1-pager product brief", desc: "Problem, evidence, proposed solution, ask", icon: "◫" },
            { title: "Video recording guide", desc: "Structure, timing, what to show", icon: "▷" },
            { title: "Stakeholder pitch deck", desc: "3-slide template for leadership", icon: "◧" },
            { title: "Manager check-in template", desc: "Positioning your learning as organizational value", icon: "◱" },
          ].map((t, i) => (
            <div key={i} style={{
              background: tokens.color.shelterWhite,
              borderRadius: tokens.radius.lg,
              border: `0.5px solid ${tokens.color.borderWarm}`,
              padding: "16px 20px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{
                  fontSize: "18px", color: tokens.color.instrumentBlue,
                  lineHeight: 1,
                }}>{t.icon}</span>
                <div>
                  <div style={{
                    fontFamily: tokens.font.sans, fontSize: "13px", fontWeight: 600,
                    color: tokens.color.deepSpace, marginBottom: "4px",
                  }}>{t.title}</div>
                  <div style={{
                    fontFamily: tokens.font.sans, fontSize: "11px",
                    color: tokens.color.dust, lineHeight: 1.4,
                  }}>{t.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: "40px", paddingTop: "24px",
        borderTop: `1px solid ${tokens.color.borderWarm}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{
          fontFamily: tokens.font.sans, fontSize: "11px", color: tokens.color.dust,
        }}>AI Builders Portal · Design System v0.1</span>
        <span style={{
          fontFamily: tokens.font.mono, fontSize: "10px", color: tokens.color.borderWarm,
        }}>shadcn/ui + custom tokens</span>
      </div>
    </div>
  );
}

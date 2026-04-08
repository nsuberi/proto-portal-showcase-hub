import { useState, useEffect } from "react";
import { tokens } from "@/design-system/tokens";
import { useAppLogger } from "@/components/AppLogger";

interface StepConfig {
  title: string;
  desc: string;
  fields: StepField[];
}

type StepField =
  | { type: "input"; label: string; placeholder: string }
  | { type: "select"; label: string; options: string[] }
  | { type: "grid"; options: { emoji: string; label: string }[] };

const steps: StepConfig[] = [
  {
    title: "Welcome aboard!",
    desc: "Let\u2019s get you set up. We\u2019ll walk through a few quick steps.",
    fields: [
      { type: "input", label: "Full name", placeholder: "Jordan Rivera" },
      { type: "select", label: "Role", options: ["Engineer", "Designer", "Product Manager", "Data Scientist"] },
    ],
  },
  {
    title: "Your focus area",
    desc: "What are you most excited to work on?",
    fields: [
      {
        type: "grid",
        options: [
          { emoji: "\u{1F916}", label: "AI/ML" },
          { emoji: "\u{1F3A8}", label: "Frontend" },
          { emoji: "\u2699\uFE0F", label: "Platform" },
          { emoji: "\u{1F4CA}", label: "Data" },
        ],
      },
    ],
  },
  {
    title: "Preferred tools",
    desc: "Pick your preferred tools to get started.",
    fields: [
      {
        type: "grid",
        options: [
          { emoji: "\u{1F4BB}", label: "VS Code" },
          { emoji: "\u26A1", label: "Cursor" },
          { emoji: "\u{1F5A5}\uFE0F", label: "Terminal" },
          { emoji: "\u{1F310}", label: "Cloud IDE" },
        ],
      },
    ],
  },
  {
    title: "Notification preferences",
    desc: "How would you like to stay in the loop?",
    fields: [
      {
        type: "grid",
        options: [
          { emoji: "\u{1F4E7}", label: "Email" },
          { emoji: "\u{1F4AC}", label: "Slack" },
          { emoji: "\u{1F514}", label: "Push" },
          { emoji: "\u{1F4F1}", label: "SMS" },
        ],
      },
    ],
  },
];

export default function OnboardingWizardApp() {
  const { log } = useAppLogger();
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedGrid, setSelectedGrid] = useState<Record<number, Set<string>>>({});
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    log("Onboarding Wizard initialized", "info");
    log(`${steps.length} steps configured`, "info");
    log("Step 1: Welcome — collecting user info", "action");
  }, [log]);

  const handleNext = () => {
    if (current >= steps.length - 1) {
      setComplete(true);
      log("Onboarding complete!", "success");
      log("Provisioning workspace...", "action");
      setTimeout(() => log("Invite email queued", "success"), 600);
      return;
    }
    const next = current + 1;
    setCurrent(next);
    log(`Step ${next + 1}: ${steps[next].title}`, "action");
  };

  const handleBack = () => {
    if (current > 0) {
      setCurrent(current - 1);
      log(`Navigated back to Step ${current}: ${steps[current - 1].title}`, "info");
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setComplete(false);
    setFormData({});
    setSelectedGrid({});
    log("Wizard reset to Step 1", "action");
  };

  const handleInputChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
    if (value.length > 0 && value.length % 5 === 0) {
      log(`Field "${label}" updated: "${value}"`, "info");
    }
  };

  const handleSelectChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
    log(`Selected ${label}: ${value}`, "action");
  };

  const toggleGridItem = (stepIdx: number, label: string) => {
    setSelectedGrid((prev) => {
      const current = new Set(prev[stepIdx] || []);
      if (current.has(label)) {
        current.delete(label);
        log(`Deselected: ${label}`, "info");
      } else {
        current.add(label);
        log(`Selected: ${label}`, "action");
      }
      return { ...prev, [stepIdx]: current };
    });
  };

  const total = steps.length;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "60vh",
        justifyContent: "center",
      }}
    >
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={`step-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                height: 8,
                borderRadius: complete ? 4 : i === current ? 4 : "50%",
                background: complete || i < current ? "#27C93F" : i === current ? tokens.color.primary : tokens.color.surfaceContainerHighest,
                width: !complete && i === current ? 24 : 8,
                transition: "all 0.3s",
              }}
            />
            {i < total - 1 && (
              <div
                style={{
                  width: 20,
                  height: 2,
                  background: complete || i < current ? "#27C93F" : tokens.color.surfaceContainerHighest,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        key={complete ? "complete" : current}
        style={{
          background: tokens.color.surfaceContainerLow,
          borderRadius: 14,
          padding: "28px 24px",
          width: "100%",
          animation: "fadeUp 0.3s ease-out",
        }}
      >
        {complete ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#0f2e1a",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 24,
                animation: "pop 0.4s ease-out",
              }}
            >
              {"\u2713"}
            </div>
            <h3
              style={{
                fontFamily: tokens.font.headline,
                fontSize: 15,
                fontWeight: 600,
                color: tokens.color.onSurface,
                marginBottom: 8,
              }}
            >
              You&apos;re all set!
            </h3>
            <p
              style={{
                fontSize: 12,
                color: tokens.color.outline,
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              Your workspace is being configured. You&apos;ll receive an invite in your inbox shortly.
            </p>
            <button onClick={handleReset} style={primaryBtnStyle}>
              Start over
            </button>
          </div>
        ) : (
          <>
            <h3
              style={{
                fontFamily: tokens.font.headline,
                fontSize: 15,
                fontWeight: 600,
                color: tokens.color.onSurface,
                marginBottom: 6,
              }}
            >
              {steps[current].title}
            </h3>
            <p
              style={{
                fontSize: 12,
                color: tokens.color.outline,
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              {steps[current].desc}
            </p>

            {/* Fields */}
            {steps[current].fields.map((field, fi) => {
              if (field.type === "input") {
                return (
                  <div key={fi} style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 500,
                        color: tokens.color.onSurfaceVariant,
                        marginBottom: 6,
                        fontFamily: tokens.font.label,
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.label] || ""}
                      onChange={(e) => handleInputChange(field.label, e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                );
              }
              if (field.type === "select") {
                return (
                  <div key={fi} style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 500,
                        color: tokens.color.onSurfaceVariant,
                        marginBottom: 6,
                        fontFamily: tokens.font.label,
                      }}
                    >
                      {field.label}
                    </label>
                    <select
                      value={formData[field.label] || field.options[0]}
                      onChange={(e) => handleSelectChange(field.label, e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }
              if (field.type === "grid") {
                const selected = selectedGrid[current] || new Set();
                return (
                  <div
                    key={fi}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {field.options.map((opt) => (
                      <div
                        key={opt.label}
                        onClick={() => toggleGridItem(current, opt.label)}
                        style={{
                          background: selected.has(opt.label)
                            ? tokens.color.primaryContainer
                            : tokens.color.surface,
                          border: `1px solid ${selected.has(opt.label) ? tokens.color.primary : tokens.color.outlineVariant}`,
                          borderRadius: 10,
                          padding: "14px 12px",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          fontSize: 12,
                          color: tokens.color.onSurface,
                        }}
                      >
                        <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>
                          {opt.emoji}
                        </span>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              {current > 0 && (
                <button onClick={handleBack} style={secondaryBtnStyle}>
                  Back
                </button>
              )}
              <button onClick={handleNext} style={primaryBtnStyle}>
                {current === total - 1 ? "Finish" : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.outlineVariant}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  color: tokens.color.onSurface,
  outline: "none",
  fontFamily: tokens.font.body,
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  background: tokens.color.primary,
  color: tokens.color.primaryContainer,
  fontFamily: tokens.font.label,
  transition: "all 0.2s",
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  background: tokens.color.surfaceContainerHighest,
  color: tokens.color.onSurfaceVariant,
  fontFamily: tokens.font.label,
  transition: "all 0.2s",
};

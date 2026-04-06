export const tokens = {
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
} as const;

export type Phase = 1 | 2 | 3;
export type ChallengeStatus = "not-started" | "in-progress" | "submitted" | "reviewed";
export type ArtifactStatus = "running" | "building" | "error";
export type RoomStatus = "upcoming" | "live";
export type DevlogSectionKey = "architecture" | "design" | "organization" | "learned" | "change";
export type DevlogSections = Partial<Record<DevlogSectionKey, string>>;

export const phaseConfig = {
  1: { accent: tokens.color.phase1, bg: "#E8EEF4", label: "Guided" },
  2: { accent: tokens.color.phase2, bg: "#E6F4F1", label: "Constrained" },
  3: { accent: tokens.color.phase3, bg: "#F4EFE6", label: "Discovery" },
} as const;

export const statusConfig = {
  "not-started": { label: "Not started", bg: tokens.color.sediment, color: tokens.color.dust },
  "in-progress": { label: "In progress", bg: "#E0F0FA", color: tokens.color.instrumentBlue },
  submitted: { label: "Submitted", bg: "#FDE8D8", color: tokens.color.signalOrange },
  reviewed: { label: "Reviewed", bg: "#D8F0E8", color: tokens.color.atmosphereTeal },
} as const;

export const devlogSectionMeta: Record<DevlogSectionKey, { label: string; icon: string }> = {
  architecture: { label: "Architecture decisions", icon: "◇" },
  design: { label: "Design decisions", icon: "△" },
  organization: { label: "Organizational context", icon: "○" },
  learned: { label: "What I learned", icon: "☆" },
  change: { label: "What I'd change", icon: "↻" },
};

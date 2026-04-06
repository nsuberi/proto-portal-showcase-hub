export const tokens = {
  color: {
    surface: "#121317",
    surfaceContainerLowest: "#0d0e12",
    surfaceContainerLow: "#1a1b20",
    surfaceContainer: "#1f1f24",
    surfaceContainerHigh: "#292a2e",
    surfaceContainerHighest: "#343439",
    surfaceVariant: "#343439",
    primary: "#bbc6e2",
    primaryContainer: "#0f1a2e",
    onPrimary: "#263046",
    onPrimaryContainer: "#78839c",
    secondary: "#ffb4a5",
    secondaryContainer: "#802918",
    onSecondaryContainer: "#ff9a85",
    tertiary: "#ffba38",
    tertiaryContainer: "#261700",
    onTertiaryContainer: "#ad7900",
    onSurface: "#e3e2e8",
    onSurfaceVariant: "#c4c6cc",
    outline: "#8e9196",
    outlineVariant: "#44474c",
    error: "#ffb4ab",
    errorContainer: "#93000a",
    phase1: "#bbc6e2",
    phase2: "#ffba38",
    phase3: "#ffb4a5",
  },
  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1.5rem",
    full: "9999px",
  },
  font: {
    headline: '"Space Grotesk", sans-serif',
    body: '"Newsreader", serif',
    label: '"Inter", sans-serif',
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
  1: { accent: tokens.color.phase1, bg: "#0f1a2e", label: "Guided" },
  2: { accent: tokens.color.phase2, bg: "#261700", label: "Constrained" },
  3: { accent: tokens.color.phase3, bg: "#3e0500", label: "Discovery" },
} as const;

export const statusConfig = {
  "not-started": { label: "Not started", bg: "#292a2e", color: "#8e9196" },
  "in-progress": { label: "In progress", bg: "#0f1a2e", color: "#bbc6e2" },
  submitted: { label: "Submitted", bg: "#261700", color: "#ffba38" },
  reviewed: { label: "Reviewed", bg: "#3e0500", color: "#ffb4a5" },
} as const;

export const devlogSectionMeta: Record<DevlogSectionKey, { label: string; icon: string }> = {
  architecture: { label: "Architecture decisions", icon: "deployed_code" },
  design: { label: "Design decisions", icon: "palette" },
  organization: { label: "Organizational context", icon: "workspaces" },
  learned: { label: "What I learned", icon: "school" },
  change: { label: "What I'd change", icon: "sync" },
};

/** Galaxy nebula background image from the Star Chart */
export const GALAXY_BG_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCEL2BcM694zDF_R2D4MhpefPrK8zOoo4dic57ShfGrouD6GgzSXU4hryliJvEbthccnUd7uR1cN9MZ1iKgzpYVWXz1eCcAqmkjP36bOFcIHL6guPKNu7LyT7MSRbsll1dURaM7NStlL8ywGPZJba2uMlKAToYQt8dcgZW-Knag1W1ROodnaOMMzgI2iSnokmlqQeizoxTN4w74DIM87hLZZ3zJiCDxOBcbLwva3fnTyim3U97Lw6Xj9_9p6R1fQnS7DIzIW7ubw_U";

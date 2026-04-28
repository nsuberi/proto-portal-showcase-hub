// design-token-lint-ignore
/**
 * Hex color constants for SVG rendering.
 *
 * These are used directly in SVG attributes (fill, stroke) where CSS custom
 * properties are not supported. The authoritative color definitions live in
 * design-system/tokens.css for Tailwind usage.
 */
export const C = {
  bg: "#08080c",
  pm: "#818cf8",
  eng: "#f472b6",
  biz: "#fbbf24",
  doc: "#c4b5fd",
  brown: "#d97706",
  brownLight: "#f59e0b",
  brownDark: "#92400e",
  green: "#10b981",
  greenLight: "#6ee7b7",
  greenDark: "#14532d",
  active: "#60a5fa",
  activeSoft: "#3b82f6",
  activeGlow: "#2563eb",
  line: "#27272a",
  dimText: "#3f3f46",
  midText: "#52525b",
  brightText: "#a1a1aa",
  white: "#f4f4f5",
} as const;

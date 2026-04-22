// design-token-lint-ignore
// This file deliberately holds hex color literals that mirror the CSS custom
// properties in src/design-system/theme.css. THREE.js materials need raw hex
// integers, and CSS var lookup at runtime isn't practical during render loops.
// Keep these in sync with theme.css — they are the single source of truth for
// numeric RGB used inside WebGL.

import * as THREE from "three";
import type { CellRole } from "@/types";

const ROLE_HEX: Record<CellRole, number> = {
  empty: 0x0d1526,
  filled: 0x00e5ff,
  visited: 0x003d4d,
  frontier: 0xff00cc,
  current: 0xffffff,
  path: 0xffdd00,
};

const ISLAND_HEX = [
  0xff7b2e, // orange
  0x35cf77, // green
  0xb56cff, // violet
  0xff4f7d, // rose
  0x5a9bff, // periwinkle
  0xffa726, // amber
  0x9effe0, // light mint
  0xe04dff, // orchid
];

export function roleColor(role: CellRole): THREE.Color {
  return new THREE.Color(ROLE_HEX[role]);
}

export function islandColor(islandId: number | null, fallback: CellRole = "filled"): THREE.Color {
  if (islandId == null) return roleColor(fallback);
  return new THREE.Color(ISLAND_HEX[islandId % ISLAND_HEX.length]);
}

export function islandCssVar(islandId: number): string {
  return `var(--island-${islandId % 8})`;
}

export function hexString(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}

/**
 * String hex constants used by THREE.js JSX props (background, fog, light color).
 * These mirror theme.css tokens and must stay in sync. Centralized here so the
 * file-level lint-ignore applies instead of scattering per-line ignores.
 */
export const THREE_HEX = {
  bg: "#070b14",
  cyan: "#00e5ff",
  magenta: "#ff00cc",
} as const;

/** RGBA strings used in inline styles where a Tailwind class can't express the blend. */
export const THREE_RGBA = {
  pseudocodeHighlight: "rgba(0,229,255,0.08)",
} as const;

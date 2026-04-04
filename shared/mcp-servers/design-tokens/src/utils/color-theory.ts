/**
 * Color Theory & Accessibility Utilities
 *
 * Pure TypeScript implementation of:
 * - HSL parsing/formatting (matches our design token format: "263 70% 60%")
 * - Color space conversions (HSL → RGB → hex, relative luminance)
 * - WCAG 2.1 contrast ratio calculation and checking
 * - Color harmony generation (complementary, analogous, triadic, etc.)
 * - Palette analysis (identify harmony type, pairwise contrast matrix)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export const WCAG_THRESHOLDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5,
} as const;

export interface ContrastResult {
  foreground: string;
  background: string;
  context?: string;
  ratio: number;
  ratioFormatted: string;
  passes: {
    AA_normal: boolean;
    AA_large: boolean;
    AAA_normal: boolean;
    AAA_large: boolean;
  };
  suggestion?: {
    foreground: string;
    background: string;
  };
}

export type HarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic";

export interface PaletteColor {
  hsl: string;
  hex: string;
}

export interface PaletteResult {
  harmony: HarmonyType;
  baseColor: PaletteColor;
  colors: PaletteColor[];
  contrastMatrix: { pair: [number, number]; ratio: number; ratioFormatted: string }[];
}

export interface PaletteAnalysis {
  harmony: HarmonyType | "custom";
  hueSpread: number;
  contrastMatrix: { pair: [string, string]; ratio: number; ratioFormatted: string }[];
}

// ---------------------------------------------------------------------------
// Parsing & Formatting
// ---------------------------------------------------------------------------

/**
 * Parse a design-token HSL string like "263 70% 60%" into numeric components.
 */
export function parseHSL(hslString: string): HSL {
  const parts = hslString.trim().split(/\s+/);
  if (parts.length !== 3) {
    throw new Error(`Invalid HSL string: "${hslString}". Expected "H S% L%" format.`);
  }
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace("%", "")) / 100;
  const l = parseFloat(parts[2].replace("%", "")) / 100;
  if (isNaN(h) || isNaN(s) || isNaN(l)) {
    throw new Error(`Invalid HSL values in: "${hslString}"`);
  }
  return { h: ((h % 360) + 360) % 360, s: clamp01(s), l: clamp01(l) };
}

/**
 * Format an HSL object back into our design-token string format.
 */
export function formatHSL(hsl: HSL): string {
  const h = round(((hsl.h % 360) + 360) % 360, 1);
  const s = round(clamp01(hsl.s) * 100, 1);
  const l = round(clamp01(hsl.l) * 100, 1);
  return `${h} ${s}% ${l}%`;
}

// ---------------------------------------------------------------------------
// Color Space Conversion
// ---------------------------------------------------------------------------

/**
 * Convert HSL (h: 0-360, s: 0-1, l: 0-1) to RGB (each 0-255).
 */
export function hslToRGB(h: number, s: number, l: number): RGB {
  s = clamp01(s);
  l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hPrime = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (hPrime < 1)      { r1 = c; g1 = x; b1 = 0; }
  else if (hPrime < 2) { r1 = x; g1 = c; b1 = 0; }
  else if (hPrime < 3) { r1 = 0; g1 = c; b1 = x; }
  else if (hPrime < 4) { r1 = 0; g1 = x; b1 = c; }
  else if (hPrime < 5) { r1 = x; g1 = 0; b1 = c; }
  else                 { r1 = c; g1 = 0; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/**
 * Convert a design-token HSL string to a hex color string.
 */
export function hslToHex(hslString: string): string {
  const { h, s, l } = parseHSL(hslString);
  const { r, g, b } = hslToRGB(h, s, l);
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

// ---------------------------------------------------------------------------
// Luminance & Contrast (WCAG 2.1)
// ---------------------------------------------------------------------------

/**
 * Compute relative luminance per WCAG 2.1 from linear RGB (0-255 input).
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rLin, gLin, bLin] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Compute WCAG contrast ratio between two HSL strings.
 * Returns a value >= 1 (1:1 = identical, 21:1 = max white-on-black).
 */
export function contrastRatio(hsl1: string, hsl2: string): number {
  const c1 = parseHSL(hsl1);
  const c2 = parseHSL(hsl2);
  const rgb1 = hslToRGB(c1.h, c1.s, c1.l);
  const rgb2 = hslToRGB(c2.h, c2.s, c2.l);
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check contrast between a foreground and background HSL string.
 * Returns pass/fail for all WCAG levels plus a suggested fix if AA_normal fails.
 */
export function checkContrast(
  foreground: string,
  background: string,
  context?: string,
): ContrastResult {
  const ratio = contrastRatio(foreground, background);
  const result: ContrastResult = {
    foreground,
    background,
    context,
    ratio: round(ratio, 2),
    ratioFormatted: `${round(ratio, 2)}:1`,
    passes: {
      AA_normal: ratio >= WCAG_THRESHOLDS.AA_NORMAL,
      AA_large: ratio >= WCAG_THRESHOLDS.AA_LARGE,
      AAA_normal: ratio >= WCAG_THRESHOLDS.AAA_NORMAL,
      AAA_large: ratio >= WCAG_THRESHOLDS.AAA_LARGE,
    },
  };

  if (!result.passes.AA_normal) {
    result.suggestion = {
      foreground: suggestAccessibleColor(foreground, background, WCAG_THRESHOLDS.AA_NORMAL, "foreground"),
      background: suggestAccessibleColor(background, foreground, WCAG_THRESHOLDS.AA_NORMAL, "background"),
    };
  }

  return result;
}

/**
 * Binary-search on lightness to find an adjusted color that meets the target contrast ratio.
 * Keeps hue and saturation fixed; only adjusts lightness.
 *
 * @param hslString   The color to adjust
 * @param againstHsl  The color it must contrast against
 * @param targetRatio Minimum contrast ratio to achieve
 * @param role        Whether hslString is the "foreground" or "background"
 */
export function suggestAccessibleColor(
  hslString: string,
  againstHsl: string,
  targetRatio: number,
  _role: "foreground" | "background",
): string {
  const base = parseHSL(hslString);
  const against = parseHSL(againstHsl);
  const againstRGB = hslToRGB(against.h, against.s, against.l);
  const againstLum = relativeLuminance(againstRGB.r, againstRGB.g, againstRGB.b);

  // Determine whether to go lighter or darker.
  // If the "against" color is dark, we need to go lighter to create contrast.
  // If the "against" color is light, we need to go darker.
  // This applies regardless of whether we're adjusting foreground or background.
  const needLighter = againstLum < 0.5;

  let lo = needLighter ? base.l : 0;
  let hi = needLighter ? 1 : base.l;

  // Binary search (30 iterations → high precision)
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const testRGB = hslToRGB(base.h, base.s, mid);
    const testLum = relativeLuminance(testRGB.r, testRGB.g, testRGB.b);
    const lighter = Math.max(testLum, againstLum);
    const darker = Math.min(testLum, againstLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    if (ratio >= targetRatio) {
      // We meet the target — try to stay closer to the original color.
      if (needLighter) hi = mid;
      else lo = mid;
    } else {
      // Not enough contrast — push further away.
      if (needLighter) lo = mid;
      else hi = mid;
    }
  }

  // Overshoot slightly to ensure the formatted (rounded) value still meets the target.
  const finalL = needLighter ? (lo + hi) / 2 + 0.005 : (lo + hi) / 2 - 0.005;
  return formatHSL({ h: base.h, s: base.s, l: clamp01(finalL) });
}

// ---------------------------------------------------------------------------
// Color Harmony Generation
// ---------------------------------------------------------------------------

/**
 * Generate a color harmony palette from a base HSL string.
 */
export function generateHarmony(
  hslString: string,
  type: HarmonyType,
  options?: { steps?: number },
): string[] {
  switch (type) {
    case "complementary":
      return complementary(hslString);
    case "analogous":
      return analogous(hslString);
    case "triadic":
      return triadic(hslString);
    case "split-complementary":
      return splitComplementary(hslString);
    case "tetradic":
      return tetradic(hslString);
    case "monochromatic":
      return monochromatic(hslString, options?.steps ?? 5);
  }
}

export function complementary(hslString: string): string[] {
  const base = parseHSL(hslString);
  return [
    formatHSL(base),
    formatHSL({ ...base, h: (base.h + 180) % 360 }),
  ];
}

export function analogous(hslString: string): string[] {
  const base = parseHSL(hslString);
  return [
    formatHSL({ ...base, h: ((base.h - 30) + 360) % 360 }),
    formatHSL(base),
    formatHSL({ ...base, h: (base.h + 30) % 360 }),
  ];
}

export function triadic(hslString: string): string[] {
  const base = parseHSL(hslString);
  return [
    formatHSL(base),
    formatHSL({ ...base, h: (base.h + 120) % 360 }),
    formatHSL({ ...base, h: (base.h + 240) % 360 }),
  ];
}

export function splitComplementary(hslString: string): string[] {
  const base = parseHSL(hslString);
  return [
    formatHSL(base),
    formatHSL({ ...base, h: (base.h + 150) % 360 }),
    formatHSL({ ...base, h: (base.h + 210) % 360 }),
  ];
}

export function tetradic(hslString: string): string[] {
  const base = parseHSL(hslString);
  return [
    formatHSL(base),
    formatHSL({ ...base, h: (base.h + 90) % 360 }),
    formatHSL({ ...base, h: (base.h + 180) % 360 }),
    formatHSL({ ...base, h: (base.h + 270) % 360 }),
  ];
}

export function monochromatic(hslString: string, steps: number = 5): string[] {
  const base = parseHSL(hslString);
  const result: string[] = [];
  const minL = 0.15;
  const maxL = 0.85;
  const stepSize = (maxL - minL) / (steps - 1);
  for (let i = 0; i < steps; i++) {
    result.push(formatHSL({ h: base.h, s: base.s, l: minL + stepSize * i }));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Palette Analysis
// ---------------------------------------------------------------------------

/**
 * Analyze a set of HSL strings to identify the color harmony rule they follow
 * and compute a pairwise contrast matrix.
 */
export function analyzePalette(colors: string[]): PaletteAnalysis {
  if (colors.length < 2) {
    throw new Error("Need at least 2 colors to analyze a palette.");
  }

  const parsed = colors.map(parseHSL);
  const hues = parsed.map((c) => c.h);

  // Compute pairwise contrast matrix
  const contrastMatrix: PaletteAnalysis["contrastMatrix"] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const ratio = contrastRatio(colors[i], colors[j]);
      contrastMatrix.push({
        pair: [colors[i], colors[j]],
        ratio: round(ratio, 2),
        ratioFormatted: `${round(ratio, 2)}:1`,
      });
    }
  }

  // Compute hue spread (max angular distance)
  const hueSpread = maxHueSpread(hues);

  // Identify harmony type based on hue relationships
  const harmony = identifyHarmony(parsed);

  return { harmony, hueSpread: round(hueSpread, 1), contrastMatrix };
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function componentToHex(c: number): string {
  const hex = Math.max(0, Math.min(255, c)).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function hueDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function maxHueSpread(hues: number[]): number {
  let maxSpread = 0;
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      maxSpread = Math.max(maxSpread, hueDiff(hues[i], hues[j]));
    }
  }
  return maxSpread;
}

/**
 * Identify which harmony rule a set of parsed HSL colors follows.
 * Uses a tolerance of ±15° for hue matching.
 */
function identifyHarmony(colors: HSL[]): HarmonyType | "custom" {
  const tolerance = 15;
  const n = colors.length;

  // Check if all hues are essentially the same → monochromatic
  const allSameHue = colors.every((c) => hueDiff(c.h, colors[0].h) < tolerance);
  if (allSameHue) return "monochromatic";

  if (n === 2) {
    if (Math.abs(hueDiff(colors[0].h, colors[1].h) - 180) < tolerance) {
      return "complementary";
    }
  }

  if (n === 3) {
    const diffs = [
      hueDiff(colors[0].h, colors[1].h),
      hueDiff(colors[1].h, colors[2].h),
      hueDiff(colors[0].h, colors[2].h),
    ].sort((a, b) => a - b);

    // Analogous: all diffs are ~30°, max spread ~60°
    if (diffs.every((d) => d <= 30 + tolerance)) return "analogous";

    // Triadic: all diffs ~120°
    if (diffs.every((d) => Math.abs(d - 120) < tolerance)) return "triadic";

    // Split-complementary: two diffs ~150° and ~210° (or equivalently ~150° and ~150°, spread = 60°)
    const sorted = [...diffs];
    if (
      sorted.some((d) => Math.abs(d - 150) < tolerance) &&
      sorted.some((d) => Math.abs(d - 60) < tolerance || Math.abs(d - 150) < tolerance)
    ) {
      return "split-complementary";
    }
  }

  if (n === 4) {
    const diffs: number[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        diffs.push(hueDiff(colors[i].h, colors[j].h));
      }
    }
    diffs.sort((a, b) => a - b);

    // Tetradic/square: diffs should include pairs at ~90° and ~180°
    const has90 = diffs.filter((d) => Math.abs(d - 90) < tolerance).length >= 2;
    const has180 = diffs.filter((d) => Math.abs(d - 180) < tolerance).length >= 1;
    if (has90 && has180) return "tetradic";
  }

  return "custom";
}

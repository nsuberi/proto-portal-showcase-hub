import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseHSL,
  formatHSL,
  hslToRGB,
  hslToHex,
  relativeLuminance,
  contrastRatio,
  checkContrast,
  suggestAccessibleColor,
  generateHarmony,
  complementary,
  analogous,
  triadic,
  splitComplementary,
  tetradic,
  monochromatic,
  analyzePalette,
  WCAG_THRESHOLDS,
} from "../utils/color-theory.js";

// ---------------------------------------------------------------------------
// Parsing & Formatting
// ---------------------------------------------------------------------------

describe("parseHSL", () => {
  it("parses standard HSL string", () => {
    const result = parseHSL("263 70% 60%");
    assert.equal(result.h, 263);
    assert.ok(Math.abs(result.s - 0.7) < 0.001);
    assert.ok(Math.abs(result.l - 0.6) < 0.001);
  });

  it("parses zero saturation", () => {
    const result = parseHSL("0 0% 98%");
    assert.equal(result.h, 0);
    assert.equal(result.s, 0);
    assert.ok(Math.abs(result.l - 0.98) < 0.001);
  });

  it("parses decimal values", () => {
    const result = parseHSL("240.5 3.7% 15.9%");
    assert.ok(Math.abs(result.h - 240.5) < 0.001);
    assert.ok(Math.abs(result.s - 0.037) < 0.001);
    assert.ok(Math.abs(result.l - 0.159) < 0.001);
  });

  it("throws on invalid input", () => {
    assert.throws(() => parseHSL("not-a-color"), /Invalid HSL/);
    assert.throws(() => parseHSL("263 70%"), /Invalid HSL/);
  });
});

describe("formatHSL", () => {
  it("round-trips with parseHSL", () => {
    const original = "263 70% 60%";
    const parsed = parseHSL(original);
    const formatted = formatHSL(parsed);
    assert.equal(formatted, original);
  });

  it("normalizes hue to 0-360", () => {
    const result = formatHSL({ h: 400, s: 0.5, l: 0.5 });
    assert.equal(result, "40 50% 50%");
  });

  it("clamps saturation and lightness", () => {
    const result = formatHSL({ h: 0, s: 1.5, l: -0.1 });
    assert.equal(result, "0 100% 0%");
  });
});

// ---------------------------------------------------------------------------
// Color Conversion
// ---------------------------------------------------------------------------

describe("hslToRGB", () => {
  it("converts pure white", () => {
    const { r, g, b } = hslToRGB(0, 0, 1);
    assert.equal(r, 255);
    assert.equal(g, 255);
    assert.equal(b, 255);
  });

  it("converts pure black", () => {
    const { r, g, b } = hslToRGB(0, 0, 0);
    assert.equal(r, 0);
    assert.equal(g, 0);
    assert.equal(b, 0);
  });

  it("converts pure red", () => {
    const { r, g, b } = hslToRGB(0, 1, 0.5);
    assert.equal(r, 255);
    assert.equal(g, 0);
    assert.equal(b, 0);
  });

  it("converts a mid-range color", () => {
    // HSL(120, 100%, 25%) should be dark green
    const { r, g, b } = hslToRGB(120, 1, 0.25);
    assert.equal(r, 0);
    assert.equal(g, 128);
    assert.equal(b, 0);
  });
});

describe("hslToHex", () => {
  it("converts white", () => {
    assert.equal(hslToHex("0 0% 100%"), "#ffffff");
  });

  it("converts black", () => {
    assert.equal(hslToHex("0 0% 0%"), "#000000");
  });

  it("converts red", () => {
    assert.equal(hslToHex("0 100% 50%"), "#ff0000");
  });
});

// ---------------------------------------------------------------------------
// Luminance & Contrast
// ---------------------------------------------------------------------------

describe("relativeLuminance", () => {
  it("white has luminance ~1", () => {
    const l = relativeLuminance(255, 255, 255);
    assert.ok(Math.abs(l - 1) < 0.001);
  });

  it("black has luminance ~0", () => {
    const l = relativeLuminance(0, 0, 0);
    assert.equal(l, 0);
  });
});

describe("contrastRatio", () => {
  it("white on black = 21:1", () => {
    const ratio = contrastRatio("0 0% 100%", "0 0% 0%");
    assert.ok(Math.abs(ratio - 21) < 0.1);
  });

  it("black on black = 1:1", () => {
    const ratio = contrastRatio("0 0% 0%", "0 0% 0%");
    assert.equal(ratio, 1);
  });

  it("is symmetric", () => {
    const r1 = contrastRatio("263 70% 60%", "0 0% 98%");
    const r2 = contrastRatio("0 0% 98%", "263 70% 60%");
    assert.ok(Math.abs(r1 - r2) < 0.01);
  });

  it("base theme foreground on background passes AAA", () => {
    // foreground: "0 0% 98%", background: "240 10% 3.9%"
    const ratio = contrastRatio("0 0% 98%", "240 10% 3.9%");
    assert.ok(ratio >= WCAG_THRESHOLDS.AAA_NORMAL, `Expected ratio >= 7, got ${ratio}`);
  });
});

// ---------------------------------------------------------------------------
// checkContrast
// ---------------------------------------------------------------------------

describe("checkContrast", () => {
  it("returns correct structure for a passing pair", () => {
    const result = checkContrast("0 0% 100%", "0 0% 0%", "white on black");
    assert.equal(result.foreground, "0 0% 100%");
    assert.equal(result.background, "0 0% 0%");
    assert.equal(result.context, "white on black");
    assert.ok(result.ratio >= 20);
    assert.equal(result.passes.AA_normal, true);
    assert.equal(result.passes.AA_large, true);
    assert.equal(result.passes.AAA_normal, true);
    assert.equal(result.passes.AAA_large, true);
    assert.equal(result.suggestion, undefined);
  });

  it("provides suggestions for a failing pair", () => {
    // Light gray on white — should fail AA
    const result = checkContrast("0 0% 80%", "0 0% 100%", "light gray on white");
    assert.equal(result.passes.AA_normal, false);
    assert.ok(result.suggestion);
    assert.ok(result.suggestion.foreground);
    assert.ok(result.suggestion.background);
  });
});

// ---------------------------------------------------------------------------
// suggestAccessibleColor
// ---------------------------------------------------------------------------

describe("suggestAccessibleColor", () => {
  it("suggests a foreground that meets the target ratio", () => {
    const suggested = suggestAccessibleColor("0 0% 80%", "0 0% 100%", 4.5, "foreground");
    const ratio = contrastRatio(suggested, "0 0% 100%");
    assert.ok(ratio >= 4.5, `Suggested foreground ratio ${ratio} should be >= 4.5`);
  });

  it("suggests a background that meets the target ratio", () => {
    const suggested = suggestAccessibleColor("0 0% 100%", "0 0% 80%", 4.5, "background");
    const ratio = contrastRatio("0 0% 80%", suggested);
    assert.ok(ratio >= 4.5, `Suggested background ratio ${ratio} should be >= 4.5`);
  });

  it("preserves hue and saturation", () => {
    const suggested = suggestAccessibleColor("263 70% 80%", "0 0% 100%", 4.5, "foreground");
    const parsed = parseHSL(suggested);
    assert.equal(parsed.h, 263);
    assert.ok(Math.abs(parsed.s - 0.7) < 0.01);
  });
});

// ---------------------------------------------------------------------------
// Color Harmony Generation
// ---------------------------------------------------------------------------

describe("complementary", () => {
  it("returns 2 colors 180 degrees apart", () => {
    const result = complementary("0 100% 50%");
    assert.equal(result.length, 2);
    const p0 = parseHSL(result[0]);
    const p1 = parseHSL(result[1]);
    assert.ok(Math.abs(p0.h - 0) < 0.1);
    assert.ok(Math.abs(p1.h - 180) < 0.1);
  });
});

describe("analogous", () => {
  it("returns 3 colors with hues 30 degrees apart", () => {
    const result = analogous("120 50% 50%");
    assert.equal(result.length, 3);
    const hues = result.map((c) => parseHSL(c).h);
    assert.ok(Math.abs(hues[0] - 90) < 0.1);
    assert.ok(Math.abs(hues[1] - 120) < 0.1);
    assert.ok(Math.abs(hues[2] - 150) < 0.1);
  });
});

describe("triadic", () => {
  it("returns 3 colors 120 degrees apart", () => {
    const result = triadic("0 100% 50%");
    assert.equal(result.length, 3);
    const hues = result.map((c) => parseHSL(c).h);
    assert.ok(Math.abs(hues[0] - 0) < 0.1);
    assert.ok(Math.abs(hues[1] - 120) < 0.1);
    assert.ok(Math.abs(hues[2] - 240) < 0.1);
  });
});

describe("splitComplementary", () => {
  it("returns 3 colors at H, H+150, H+210", () => {
    const result = splitComplementary("0 100% 50%");
    assert.equal(result.length, 3);
    const hues = result.map((c) => parseHSL(c).h);
    assert.ok(Math.abs(hues[0] - 0) < 0.1);
    assert.ok(Math.abs(hues[1] - 150) < 0.1);
    assert.ok(Math.abs(hues[2] - 210) < 0.1);
  });
});

describe("tetradic", () => {
  it("returns 4 colors 90 degrees apart", () => {
    const result = tetradic("0 100% 50%");
    assert.equal(result.length, 4);
    const hues = result.map((c) => parseHSL(c).h);
    assert.ok(Math.abs(hues[0] - 0) < 0.1);
    assert.ok(Math.abs(hues[1] - 90) < 0.1);
    assert.ok(Math.abs(hues[2] - 180) < 0.1);
    assert.ok(Math.abs(hues[3] - 270) < 0.1);
  });
});

describe("monochromatic", () => {
  it("returns requested number of steps", () => {
    const result = monochromatic("200 60% 50%", 7);
    assert.equal(result.length, 7);
  });

  it("preserves hue and saturation across all steps", () => {
    const result = monochromatic("200 60% 50%", 5);
    for (const color of result) {
      const parsed = parseHSL(color);
      assert.equal(parsed.h, 200);
      assert.ok(Math.abs(parsed.s - 0.6) < 0.01);
    }
  });

  it("produces evenly spaced lightness", () => {
    const result = monochromatic("0 50% 50%", 5);
    const lightnesses = result.map((c) => parseHSL(c).l);
    // Should go from 0.15 to 0.85 in 4 equal steps of 0.175
    for (let i = 1; i < lightnesses.length; i++) {
      const diff = lightnesses[i] - lightnesses[i - 1];
      assert.ok(Math.abs(diff - 0.175) < 0.01, `Step ${i} lightness diff = ${diff}`);
    }
  });
});

describe("generateHarmony", () => {
  it("dispatches to the correct harmony function", () => {
    const comp = generateHarmony("0 100% 50%", "complementary");
    assert.equal(comp.length, 2);

    const tri = generateHarmony("0 100% 50%", "triadic");
    assert.equal(tri.length, 3);

    const mono = generateHarmony("0 100% 50%", "monochromatic", { steps: 4 });
    assert.equal(mono.length, 4);
  });
});

// ---------------------------------------------------------------------------
// Palette Analysis
// ---------------------------------------------------------------------------

describe("analyzePalette", () => {
  it("identifies complementary", () => {
    const result = analyzePalette(["0 100% 50%", "180 100% 50%"]);
    assert.equal(result.harmony, "complementary");
    assert.ok(Math.abs(result.hueSpread - 180) < 1);
  });

  it("identifies triadic", () => {
    const result = analyzePalette(["0 100% 50%", "120 100% 50%", "240 100% 50%"]);
    assert.equal(result.harmony, "triadic");
  });

  it("identifies monochromatic", () => {
    const result = analyzePalette(["200 60% 20%", "200 60% 50%", "200 60% 80%"]);
    assert.equal(result.harmony, "monochromatic");
  });

  it("returns contrast matrix", () => {
    const result = analyzePalette(["0 0% 0%", "0 0% 100%"]);
    assert.equal(result.contrastMatrix.length, 1);
    assert.ok(result.contrastMatrix[0].ratio >= 20);
  });

  it("throws for fewer than 2 colors", () => {
    assert.throws(() => analyzePalette(["0 0% 50%"]), /Need at least 2 colors/);
  });
});

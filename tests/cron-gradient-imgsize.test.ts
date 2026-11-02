import { describe, expect, it } from "vitest";
import { normalizeCron, parseCron } from "@/tools/_lib/cron";
import {
  gradientCss,
  hexToHsl,
  hslToHex,
  normalizeAngle,
  rotateHue,
} from "@/tools/_lib/gradient";
import { searchQuality } from "@/tools/_lib/imgsize";

/* ---------------- cron: 结构与展开 ---------------- */

describe("parseCron: field order and seconds detection", () => {
  it("splits a standard 5-field expression in canonical order", () => {
    const r = parseCron("0 9 * * *");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.breakdown.hasSeconds).toBe(false);
    expect(r.breakdown.fields.map((f) => f.unit)).toEqual([
      "minute", "hour", "dayOfMonth", "month", "dayOfWeek",
    ]);
    const [minute, hour, dom, month, dow] = r.breakdown.fields;
    expect(minute.values).toEqual([0]);
    expect(minute.isWildcard).toBe(false);
    expect(hour.values).toEqual([9]);
    expect(dom.isWildcard).toBe(true);
    expect(dom.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);
    expect(month.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(dow.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("detects a 6-field pattern whose first field is seconds", () => {
    const r = parseCron("*/15 * * * * *");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.breakdown.hasSeconds).toBe(true);
    expect(r.breakdown.fields[0].unit).toBe("second");
    expect(r.breakdown.fields[0].values).toEqual([0, 15, 30, 45]);
    expect(r.breakdown.fields).toHaveLength(6);
  });

  it("expands */n steps (*/6 hours → 0,6,12,18)", () => {
    const r = parseCron("0 */6 * * *");
    if (!r.ok) throw new Error("expected ok");
    expect(r.breakdown.fields[1].values).toEqual([0, 6, 12, 18]);
    expect(r.breakdown.fields[1].step).toBe(6);
  });

  it("expands stepped ranges (10-20/2 hours)", () => {
    const r = parseCron("0 10-20/2 * * *");
    if (!r.ok) throw new Error("expected ok");
    expect(r.breakdown.fields[1].values).toEqual([10, 12, 14, 16, 18, 20]);
  });

  it("expands plain ranges and lists, including mixed members", () => {
    const r1 = parseCron("0 9-17 * * *");
    if (!r1.ok) throw new Error("expected ok");
    expect(r1.breakdown.fields[1].values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    const r2 = parseCron("0 0 1,15 * *");
    if (!r2.ok) throw new Error("expected ok");
    expect(r2.breakdown.fields[2].values).toEqual([1, 15]);
    const r3 = parseCron("0 0 1-3,10 * *");
    if (!r3.ok) throw new Error("expected ok");
    expect(r3.breakdown.fields[2].values).toEqual([1, 2, 3, 10]);
  });
});

describe("parseCron: names and normalization", () => {
  it("resolves JAN-MAR in the month field", () => {
    const r = parseCron("30 9 * JAN-MAR *");
    if (!r.ok) throw new Error("expected ok");
    expect(r.breakdown.fields[3].values).toEqual([1, 2, 3]);
  });

  it("resolves weekday names MON-FRI (case-insensitive) to 1..5", () => {
    const r1 = parseCron("0 9 * * MON-FRI");
    if (!r1.ok) throw new Error("expected ok");
    expect(r1.breakdown.fields[4].values).toEqual([1, 2, 3, 4, 5]);
    const r2 = parseCron("0 9 * * mon-fri");
    if (!r2.ok) throw new Error("expected ok");
    expect(r2.breakdown.fields[4].values).toEqual([1, 2, 3, 4, 5]);
  });

  it("resolves a single month name (1 JAN)", () => {
    const r = parseCron("0 0 1 JAN *");
    if (!r.ok) throw new Error("expected ok");
    expect(r.breakdown.fields[3].values).toEqual([1]);
  });

  it("normalizes day-of-week 7 to Sunday (0), deduped and sorted", () => {
    const r1 = parseCron("0 0 * * 7");
    if (!r1.ok) throw new Error("expected ok");
    expect(r1.breakdown.fields[4].values).toEqual([0]);
    const r2 = parseCron("0 0 * * 6-7");
    if (!r2.ok) throw new Error("expected ok");
    expect(r2.breakdown.fields[4].values).toEqual([0, 6]);
  });

  it("treats ? as a wildcard in day-of-month and day-of-week", () => {
    const r = parseCron("0 0 ? * ?");
    if (!r.ok) throw new Error("expected ok");
    expect(r.breakdown.fields[2].isWildcard).toBe(true);
    expect(r.breakdown.fields[4].isWildcard).toBe(true);
  });

  it("normalizeCron collapses whitespace and rejects invalid input with null", () => {
    expect(normalizeCron("0   9  * * *")).toBe("0 9 * * *");
    expect(normalizeCron("  0 0 * * *  ")).toBe("0 0 * * *");
    expect(normalizeCron("99 99 * * *")).toBeNull();
    expect(normalizeCron("garbage")).toBeNull();
  });
});

describe("parseCron: invalid input produces friendly structured errors", () => {
  it("empty and shorthand forms", () => {
    expect(parseCron("")).toEqual({ ok: false, code: "empty" });
    expect(parseCron("   ")).toEqual({ ok: false, code: "empty" });
    expect(parseCron("@daily")).toMatchObject({ ok: false, code: "shorthand", detail: "@daily" });
  });

  it("wrong field count reports how many fields were found", () => {
    expect(parseCron("0 0 * *")).toMatchObject({ ok: false, code: "fieldCount", detail: "4" });
    expect(parseCron("* * * * * * 2027")).toMatchObject({ ok: false, code: "fieldCount", detail: "7" });
  });

  it("out-of-range values per field", () => {
    expect(parseCron("99 * * * *")).toMatchObject({ ok: false, code: "outOfRange", unit: "minute", detail: "99" });
    expect(parseCron("0 24 * * *")).toMatchObject({ ok: false, code: "outOfRange", unit: "hour" });
    expect(parseCron("0 0 32 * *")).toMatchObject({ ok: false, code: "outOfRange", unit: "dayOfMonth" });
    expect(parseCron("0 0 * 13 *")).toMatchObject({ ok: false, code: "outOfRange", unit: "month" });
    expect(parseCron("* * * * 8")).toMatchObject({ ok: false, code: "outOfRange", unit: "dayOfWeek" });
  });

  it("backwards ranges are rejected with a specific code", () => {
    expect(parseCron("0 17-9 * * *")).toMatchObject({ ok: false, code: "badRange", detail: "17-9" });
    expect(parseCron("0 0 5-2 * *")).toMatchObject({ ok: false, code: "badRange", unit: "dayOfMonth" });
  });

  it("zero or negative steps are rejected", () => {
    expect(parseCron("*/0 * * * *")).toMatchObject({ ok: false, code: "badStep", detail: "*/0" });
    expect(parseCron("1-5/0 * * * *")).toMatchObject({ ok: false, code: "badStep", unit: "minute" });
  });

  it("unknown tokens and Quartz extensions are rejected, never thrown", () => {
    expect(parseCron("L * * * *")).toMatchObject({ ok: false, code: "badChar", detail: "L" });
    expect(parseCron("abc * * * *")).toMatchObject({ ok: false, code: "badChar" });
    expect(parseCron("0 0 * * MON#2")).toMatchObject({ ok: false, code: "badChar", detail: "MON#2" });
    expect(parseCron("0 0 15W * *")).toMatchObject({ ok: false, code: "badChar", detail: "15W" });
    // 数字前缀步进:cron 本身不支持
    expect(parseCron("5/15 * * * *")).toMatchObject({ ok: false, code: "unsupported", detail: "5/15" });
    // ? 只在 日/周 合法
    expect(parseCron("? * * * *")).toMatchObject({ ok: false, code: "badChar", unit: "minute", detail: "?" });
  });

  it("empty list members are caught", () => {
    expect(parseCron("0,,5 * * * *")).toMatchObject({ ok: false, code: "emptyPart", unit: "minute" });
  });

  it("garbage, unicode and oversized input never throw", () => {
    expect(parseCron("%%%").ok).toBe(false);
    expect(parseCron("🎉 * * * *").ok).toBe(false);
    expect(parseCron("1e4 * * * *").ok).toBe(false);
    expect(parseCron("*".repeat(10001)).ok).toBe(false);
    expect(parseCron(`0 ${"1,".repeat(500)}2 * * *`).ok).toBe(true);
  });
});

/* ---------------- gradient ---------------- */

describe("gradientCss: linear", () => {
  const two = [
    { color: "#ff0000", position: 0 },
    { color: "#0000ff", position: 100 },
  ];

  it("renders a standard two-stop gradient verbatim", () => {
    expect(gradientCss(two, "linear", 135)).toBe(
      "linear-gradient(135deg, #ff0000 0%, #0000ff 100%)",
    );
  });

  it("wraps angles into 0–359 (−45 → 315, 405 → 45, 720 → 0)", () => {
    expect(gradientCss(two, "linear", -45)).toBe("linear-gradient(315deg, #ff0000 0%, #0000ff 100%)");
    expect(gradientCss(two, "linear", 405)).toContain("linear-gradient(45deg, ");
    expect(gradientCss(two, "linear", 720)).toContain("linear-gradient(0deg, ");
    expect(normalizeAngle(-1)).toBe(359);
    expect(normalizeAngle(360)).toBe(0);
  });

  it("distributes unpositioned stops evenly (5 stops → 0/25/50/75/100)", () => {
    const css = gradientCss(
      ["#111111", "#222222", "#333333", "#444444", "#555555"].map((color) => ({ color })),
      "linear",
      90,
    );
    expect(css).toBe(
      "linear-gradient(90deg, #111111 0%, #222222 25%, #333333 50%, #444444 75%, #555555 100%)",
    );
  });

  it("interpolates missing positions between defined neighbors", () => {
    const css = gradientCss(
      [{ color: "#a", position: 10 }, { color: "#b" }, { color: "#c", position: 60 }],
      "linear",
      90,
    );
    expect(css).toBe("linear-gradient(90deg, #a 10%, #b 35%, #c 60%)");
  });

  it("clamps positions into 0–100 and rounds to 2 decimals", () => {
    const css = gradientCss(
      [{ color: "#a", position: -20 }, { color: "#b", position: 33.333 }],
      "linear",
      0,
    );
    expect(css).toBe("linear-gradient(0deg, #a 0%, #b 33.33%)");
    const css2 = gradientCss(
      [{ color: "#a", position: 0 }, { color: "#b", position: 150 }],
      "linear",
      0,
    );
    expect(css2).toBe("linear-gradient(0deg, #a 0%, #b 100%)");
  });

  it("sorts stops by position while preserving order of equals (hard stop)", () => {
    const css = gradientCss(
      [{ color: "#ff0000", position: 50 }, { color: "#0000ff", position: 0 }],
      "linear",
      90,
    );
    expect(css).toBe("linear-gradient(90deg, #0000ff 0%, #ff0000 50%)");
    const hard = gradientCss(
      [{ color: "#ff0000", position: 50 }, { color: "#0000ff", position: 50 }],
      "linear",
      90,
    );
    expect(hard).toBe("linear-gradient(90deg, #ff0000 50%, #0000ff 50%)");
  });
});

describe("gradientCss: radial, conic and error contract", () => {
  const two = [
    { color: "#ff0000", position: 0 },
    { color: "#0000ff", position: 100 },
  ];

  it("renders radial with explicit shape and ignores the angle", () => {
    expect(gradientCss(two, "radial", NaN)).toBe("radial-gradient(circle at center, #ff0000 0%, #0000ff 100%)");
    expect(gradientCss(two, "radial", 123, "ellipse")).toBe(
      "radial-gradient(ellipse at center, #ff0000 0%, #0000ff 100%)",
    );
  });

  it("renders conic with a from-angle", () => {
    expect(gradientCss(two, "conic", 45)).toBe("conic-gradient(from 45deg, #ff0000 0%, #0000ff 100%)");
  });

  it("returns null for fewer than two stops", () => {
    expect(gradientCss([], "linear", 0)).toBeNull();
    expect(gradientCss([{ color: "#ff0000", position: 0 }], "linear", 0)).toBeNull();
  });

  it("returns null for empty colors, NaN positions and NaN angles", () => {
    expect(gradientCss([{ color: "  ", position: 0 }, { color: "#0000ff", position: 100 }], "linear", 0)).toBeNull();
    expect(gradientCss([{ color: "#ff0000", position: NaN }, { color: "#0000ff", position: 100 }], "linear", 0)).toBeNull();
    expect(gradientCss([{ color: "#ff0000", position: Infinity }, { color: "#0000ff", position: 100 }], "linear", 0)).toBeNull();
    expect(gradientCss(two, "linear", NaN)).toBeNull();
    expect(gradientCss(two, "conic", NaN)).toBeNull();
  });

  it("trims color values", () => {
    expect(gradientCss(
      [{ color: "  #ff0000 ", position: 0 }, { color: "#0000ff", position: 100 }],
      "linear",
      0,
    )).toContain("#ff0000 0%");
  });
});

describe("HSL rotation (harmonize)", () => {
  it("converts known colors exactly (#ff0000 → hsl 0,100,50)", () => {
    expect(hexToHsl("#ff0000")).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl("#f00")).toEqual({ h: 0, s: 100, l: 50 });
    const navy = hexToHsl("#336699");
    expect(navy).not.toBeNull();
    expect(navy!.h).toBeCloseTo(210, 6);
    expect(navy!.s).toBeCloseTo(50, 6);
    expect(navy!.l).toBeCloseTo(40, 6);
  });

  it("rotates hue: red +120° → green, #336699 +180° → #996633", () => {
    expect(rotateHue(["#ff0000"], 120)).toEqual(["#00ff00"]);
    expect(rotateHue(["#336699"], 180)).toEqual(["#996633"]);
  });

  it("leaves grays unchanged at any angle", () => {
    expect(rotateHue(["#808080", "#ffffff", "#000000"], 137)).toEqual(["#808080", "#ffffff", "#000000"]);
  });

  it("round-trips hex → HSL → hex within one bit per channel", () => {
    const colors = ["#1F2937", "#F97316", "#0EA5E9", "#84CC16", "#EC4899", "#7C3AED", "#F3F4F6", "#CAFE12"];
    for (const c of colors) {
      const hsl = hexToHsl(c);
      expect(hsl, c).not.toBeNull();
      const back = hslToHex(hsl!.h, hsl!.s, hsl!.l);
      const a = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
      const b = [1, 3, 5].map((i) => parseInt(back.slice(i, i + 2), 16));
      for (let k = 0; k < 3; k++) expect(Math.abs(a[k] - b[k]), `${c} → ${back}`).toBeLessThanOrEqual(1);
    }
  });

  it("passes invalid colors through and ignores non-finite angles", () => {
    expect(rotateHue(["nope", "#ff0000"], 90)).toEqual(["nope", rotateHue(["#ff0000"], 90)[0]]);
    expect(rotateHue(["#ff0000"], NaN)).toEqual(["#ff0000"]);
    expect(hexToHsl("nope")).toBeNull();
    expect(hexToHsl("")).toBeNull();
    expect(hexToHsl("#12")).toBeNull();
  });
});

/* ---------------- searchQuality ---------------- */

describe("searchQuality: increasing probe (real encoder behavior)", () => {
  // size(q) = 20000 + 100000·q → 目标 60000 的边界在 q* = 0.4
  const probe = (q: number) => 20000 + 100000 * q;

  it("converges to the exact boundary q = 0.4 for target 60000", async () => {
    const r = await searchQuality(probe, 60000, 0.05, 0.95);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Math.abs(r.quality - 0.4)).toBeLessThanOrEqual(1e-6);
    expect(probe(r.quality)).toBeLessThanOrEqual(60000);
    expect(r.probes).toBeLessThanOrEqual(30);
  });

  it("returns the max bound when the whole range fits", async () => {
    const r = await searchQuality(probe, 200000, 0.05, 0.95);
    expect(r).toEqual({ ok: true, quality: 0.95, probes: 2 });
  });

  it("fails honestly when even the minimum quality exceeds the target", async () => {
    const r = await searchQuality(probe, 10000, 0.05, 0.95);
    expect(r).toEqual({ ok: false, reason: "unreachable", bestQuality: 0.05, bestBytes: 25000, probes: 2 });
  });

  it("swaps inverted bounds", async () => {
    const r = await searchQuality(probe, 60000, 0.95, 0.05);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Math.abs(r.quality - 0.4)).toBeLessThanOrEqual(1e-6);
  });

  it("supports async probes", async () => {
    const r = await searchQuality(async (q) => 20000 + 100000 * q, 60000, 0.05, 0.95);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Math.abs(r.quality - 0.4)).toBeLessThanOrEqual(1e-6);
  });

  it("converges against a piecewise (discrete encoder) probe and always fits", async () => {
    const stepProbe = (q: number) => (q < 0.5 ? 55000 : 90000);
    const r = await searchQuality(stepProbe, 70000, 0.05, 0.95);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(stepProbe(r.quality)).toBeLessThanOrEqual(70000);
    expect(r.quality).toBeGreaterThan(0.5 - 1e-6);
    expect(r.quality).toBeLessThanOrEqual(0.5);
  });
});

describe("searchQuality: decreasing probe (size = 100000·(1−q))", () => {
  const probe = (q: number) => 100000 * (1 - q);

  it("converges to the exact boundary q = 0.4 for target 60000", async () => {
    const r = await searchQuality(probe, 60000, 0.05, 0.95);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Math.abs(r.quality - 0.4)).toBeLessThanOrEqual(1e-6);
    expect(probe(r.quality)).toBeLessThanOrEqual(60000);
  });

  it("reports the smaller endpoint honestly when nothing fits", async () => {
    const r = await searchQuality(probe, 1000, 0.05, 0.95);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("unreachable");
    expect(r.bestQuality).toBe(0.95);
    expect(r.bestBytes).toBeCloseTo(5000, 6);
    expect(r.probes).toBe(2);
  });
});

describe("searchQuality: degenerate probes", () => {
  it("a flat probe either fits at max or fails at min", async () => {
    const flat = (q: number) => 50000;
    const fits = await searchQuality(flat, 60000, 0.05, 0.95);
    expect(fits).toEqual({ ok: true, quality: 0.95, probes: 2 });
    const fails = await searchQuality(flat, 40000, 0.05, 0.95);
    expect(fails).toMatchObject({ ok: false, reason: "unreachable", bestQuality: 0.05, bestBytes: 50000 });
  });

  it("a NaN-emitting probe is treated as not fitting, never as a crash", async () => {
    const r = await searchQuality((q) => (q < 0.5 ? NaN : 80000), 60000, 0.05, 0.95);
    expect(r).toEqual({ ok: false, reason: "unreachable", bestQuality: 0.95, bestBytes: 80000, probes: 2 });
  });

  it("zero-size probe always fits at the top bound", async () => {
    const r = await searchQuality(() => 0, 1, 0.05, 0.95);
    expect(r).toEqual({ ok: true, quality: 0.95, probes: 2 });
  });
});

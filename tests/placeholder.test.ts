import { describe, expect, it } from "vitest";
import { PLACEHOLDER_MAX, placeholderSvg } from "@/tools/_lib/placeholder";

const BASE = { width: 800, height: 400, bg: "#111827", color: "#ffffff", text: "" };

describe("placeholderSvg: basic output", () => {
  it("renders a valid standalone SVG with dimensions and viewBox", () => {
    const svg = placeholderSvg(BASE)!;
    expect(svg).toBeTruthy();
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="400"');
    expect(svg).toContain('viewBox="0 0 800 400"');
    expect(svg).toContain('fill="#111827"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it("defaults empty text to the dimensions 800×400", () => {
    const svg = placeholderSvg(BASE)!;
    expect(svg).toContain(">800×400</text>");
  });

  it("keeps non-trivial whitespace-only text as the default too", () => {
    expect(placeholderSvg({ ...BASE, text: "   " })!).toContain(">800×400</text>");
  });

  it("uses the provided text when present", () => {
    const svg = placeholderSvg({ ...BASE, text: "Hero banner" })!;
    expect(svg).toContain(">Hero banner</text>");
    expect(svg).not.toContain(">800×400</text>");
  });

  it("accepts 3-digit hex colors", () => {
    const svg = placeholderSvg({ ...BASE, bg: "#abc", color: "#000" })!;
    expect(svg).toContain('fill="#abc"');
    expect(svg).toContain('fill="#000"');
  });

  it("scales the font size down for longer text and up for shorter", () => {
    const short = placeholderSvg({ ...BASE, text: "Hi" })!;
    const long = placeholderSvg({ ...BASE, text: "X".repeat(50) })!;
    const size = (s: string) => Number(/font-size="([\d.]+)"/.exec(s)![1]);
    expect(size(short)).toBeGreaterThan(size(long));
    expect(Number.isFinite(size(long))).toBe(true);
  });
});

describe("placeholderSvg: escaping and Unicode", () => {
  it("escapes XML specials in the text node and aria-label", () => {
    const svg = placeholderSvg({ ...BASE, text: `<b>&"'` })!;
    expect(svg).toContain("&lt;b&gt;&amp;&quot;&apos;");
    expect(svg).not.toContain("<b>");
  });

  it("passes CJK text through", () => {
    const svg = placeholderSvg({ ...BASE, text: "占位图 900×300" })!;
    expect(svg).toContain(">占位图 900×300</text>");
  });

  it("passes emoji through", () => {
    const svg = placeholderSvg({ ...BASE, text: "🚀 Launch" })!;
    expect(svg).toContain(">🚀 Launch</text>");
  });

  it("escapes default dimension text safely as well", () => {
    const svg = placeholderSvg(BASE)!;
    expect(svg).toContain("aria-label=\"800×400\"");
  });
});

describe("placeholderSvg: boundaries", () => {
  it("handles the 1×1 minimum without NaN", () => {
    const svg = placeholderSvg({ ...BASE, width: 1, height: 1 })!;
    expect(svg).toContain('viewBox="0 0 1 1"');
    expect(svg).toContain('width="1"');
    expect(svg).toContain('height="1"');
    expect(svg).not.toContain("NaN");
    const fs = Number(/font-size="([\d.]+)"/.exec(svg)![1]);
    expect(Number.isFinite(fs)).toBe(true);
    expect(fs).toBeGreaterThanOrEqual(1);
  });

  it("handles very wide aspect ratios", () => {
    const svg = placeholderSvg({ ...BASE, width: 2000, height: 60 })!;
    expect(svg).toContain('viewBox="0 0 2000 60"');
    expect(svg).not.toContain("NaN");
  });

  it("rounds fractional dimensions to integers", () => {
    const svg = placeholderSvg({ ...BASE, width: 300.4, height: 150.6 })!;
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="151"');
  });

  it("caps the accepted size at 5000 and rejects 5001", () => {
    expect(placeholderSvg({ ...BASE, width: PLACEHOLDER_MAX, height: 10 })).toBeTruthy();
    expect(placeholderSvg({ ...BASE, width: PLACEHOLDER_MAX + 1, height: 10 })).toBeNull();
    expect(placeholderSvg({ ...BASE, height: PLACEHOLDER_MAX + 1 })).toBeNull();
  });
});

describe("placeholderSvg: invalid inputs return null (documented)", () => {
  it.each([
    ["width 0", { ...BASE, width: 0 }],
    ["negative width", { ...BASE, width: -5 }],
    ["NaN width", { ...BASE, width: NaN }],
    ["Infinity height", { ...BASE, height: Infinity }],
    ["named color bg", { ...BASE, bg: "red" }],
    ["5-digit hex", { ...BASE, bg: "#12345" }],
    ["missing hash", { ...BASE, color: "ffffff" }],
    ["empty color", { ...BASE, color: "" }],
  ])("rejects %s", (_name, opts) => {
    expect(placeholderSvg(opts)).toBeNull();
  });
});

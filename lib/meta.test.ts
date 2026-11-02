import { describe, it, expect } from "vitest";
import { metaTitle } from "./meta";

describe("metaTitle", () => {
  it("放得下就原样拼接", () => {
    expect(metaTitle("Tool | Site", "Free", 60)).toBe("Tool | Site — Free");
  });
  it("超长时截掉较长一侧(头)", () => {
    const out = metaTitle("X".repeat(80), "Free · No upload", 60);
    expect(out.length).toBeLessThanOrEqual(61);
    expect(out.endsWith("— Free · No upload")).toBe(true);
  });
  it("超长时截掉较长一侧(尾)", () => {
    const out = metaTitle("Site", "Y".repeat(80), 60);
    expect(out.length).toBeLessThanOrEqual(61);
    expect(out.startsWith("Site — ")).toBe(true);
  });
  it("永远不会短于下限", () => {
    const out = metaTitle("A".repeat(200), "B".repeat(200), 60);
    expect(out.length).toBeGreaterThan(30);
  });
});

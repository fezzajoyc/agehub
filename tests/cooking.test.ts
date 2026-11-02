import { describe, expect, it } from "vitest";
import {
  COOKING_DENSITY,
  CUP_ML,
  DENSITY_KEYS,
  OVEN_STEPS,
  cToF,
  cookConvert as convert,
  fToC,
} from "@/tools/_lib/cooking";

describe("density table integrity", () => {
  it("has at least 20 ingredients with unique keys", () => {
    expect(DENSITY_KEYS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(DENSITY_KEYS).size).toBe(DENSITY_KEYS.length);
  });

  it("every density is a finite positive number", () => {
    for (const key of DENSITY_KEYS) {
      expect(Number.isFinite(COOKING_DENSITY[key])).toBe(true);
      expect(COOKING_DENSITY[key]).toBeGreaterThan(0);
    }
  });

  it("pins the required reference values (g per US cup)", () => {
    expect(COOKING_DENSITY["All-purpose flour"]).toBe(120);
    expect(COOKING_DENSITY["Granulated sugar"]).toBe(200);
    expect(COOKING_DENSITY["Butter"]).toBe(227);
    expect(COOKING_DENSITY["Water"]).toBe(240);
    expect(COOKING_DENSITY["Milk"]).toBe(240);
    expect(COOKING_DENSITY["Honey"]).toBe(340);
    expect(COOKING_DENSITY["Cocoa powder (unsweetened)"]).toBe(100);
    expect(COOKING_DENSITY["White rice (uncooked)"]).toBe(185);
    expect(COOKING_DENSITY["Rolled oats"]).toBe(90);
  });
});

describe("cookConvert: hand-computed volume→weight vectors", () => {
  it("2 cups flour = 240 g (120 g per cup)", () => {
    expect(convert(2, "cup", "g", "All-purpose flour")).toBeCloseTo(240, 9);
  });

  it("1 cup water = 240 g and 1 cup butter = 227 g", () => {
    expect(convert(1, "cup", "g", "Water")).toBe(240);
    expect(convert(1, "cup", "g", "Butter")).toBe(227);
  });

  it("1 tbsp honey = 21.25 g (340 g/cup ÷ 16 tbsp)", () => {
    expect(convert(1, "tbsp", "g", "Honey")).toBeCloseTo(340 / 16, 9);
  });

  it("1 cup sugar → oz: 200 g / 28.3495 = 7.0548 oz", () => {
    expect(convert(1, "cup", "oz", "Granulated sugar")).toBeCloseTo(200 / 28.349523125, 6);
  });

  it("500 g flour → cups: 500 / 120 ≈ 4.1667", () => {
    expect(convert(500, "g", "cup", "All-purpose flour")).toBeCloseTo(500 / 120, 9);
  });
});

describe("cookConvert: same-dimension conversions ignore the ingredient", () => {
  it("volume → volume: 2 cups = 480 ml regardless of ingredient", () => {
    expect(convert(2, "cup", "ml", "")).toBe(480);
    expect(convert(2, "cup", "ml", "Nonexistent")).toBe(480);
  });

  it("1 cup = 16 tbsp = 48 tsp; 1 l = 1000 ml", () => {
    expect(convert(1, "cup", "tbsp", "")).toBe(16);
    expect(convert(1, "cup", "tsp", "")).toBe(48);
    expect(convert(1, "l", "ml", "")).toBe(1000);
  });

  it("weight → weight: 1 lb = 16 oz; 1 kg = 1000 g", () => {
    expect(convert(1, "lb", "oz", "")).toBeCloseTo(16, 9);
    expect(convert(1, "kg", "g", "")).toBe(1000);
  });

  it("identity conversion returns the value even with no ingredient", () => {
    expect(convert(7, "cup", "cup", "")).toBe(7);
    expect(convert(7, "g", "g", "")).toBe(7);
  });
});

describe("cookConvert: round trips", () => {
  const samples: Array<[number, "cup" | "tbsp" | "ml" | "l", string]> = [
    [2, "cup", "All-purpose flour"],
    [1, "cup", "Honey"],
    [3, "tbsp", "Cocoa powder (unsweetened)"],
    [250, "ml", "Rolled oats"],
    [1.5, "l", "Water"],
  ];

  it.each(samples)("volume→g→volume round-trips for %p %p of %p", (v, unit, ing) => {
    const grams = convert(v, unit, "g", ing);
    expect(convert(grams, "g", unit, ing)).toBeCloseTo(v, 9);
  });

  it("cups → kg → cups round-trips", () => {
    const kg = convert(3, "cup", "kg", "Granulated sugar");
    expect(convert(kg, "kg", "cup", "Granulated sugar")).toBeCloseTo(3, 9);
  });

  it("0 converts to 0 in every direction", () => {
    expect(convert(0, "cup", "g", "Butter")).toBe(0);
    expect(convert(0, "g", "cup", "Butter")).toBe(0);
    expect(convert(0, "cup", "tsp", "")).toBe(0);
  });
});

describe("cookConvert: invalid inputs are documented NaN", () => {
  it("volume↔weight with an unknown ingredient → NaN", () => {
    expect(convert(1, "cup", "g", "Unobtainium")).toBeNaN();
    expect(convert(1, "g", "cup", "")).toBeNaN();
  });

  it("negative values → NaN in every dimension", () => {
    expect(convert(-1, "cup", "g", "Butter")).toBeNaN();
    expect(convert(-1, "cup", "tsp", "")).toBeNaN();
    expect(convert(-1, "kg", "lb", "")).toBeNaN();
  });

  it.each([NaN, Infinity])("non-finite value %p → NaN", (v) => {
    expect(convert(v, "cup", "g", "Butter")).toBeNaN();
  });

  it("unknown units → NaN (and never throw)", () => {
    // @ts-expect-error 故意的非法单位
    expect(convert(1, "gallon", "g", "Water")).toBeNaN();
    // @ts-expect-error 故意的非法单位
    expect(convert(1, "cup", "stone", "Water")).toBeNaN();
  });
});

describe("oven temperature conversions", () => {
  it("converts exactly both ways", () => {
    expect(fToC(350)).toBeCloseTo(176.6667, 3);
    expect(cToF(175)).toBe(347);
    expect(cToF(fToC(400))).toBeCloseTo(400, 9);
    expect(fToC(cToF(180))).toBeCloseTo(180, 9);
  });

  it("ships the standard oven steps with ≤ 5 °C rounding error", () => {
    expect(OVEN_STEPS.length).toBeGreaterThanOrEqual(8);
    for (const [f, c] of OVEN_STEPS) {
      expect(Math.abs(fToC(f) - c)).toBeLessThanOrEqual(5);
    }
  });

  it("pins the famous 350 °F → 175 °C row and stays ascending", () => {
    expect(OVEN_STEPS).toContainEqual([350, 175]);
    for (let i = 1; i < OVEN_STEPS.length; i++) {
      expect(OVEN_STEPS[i][0]).toBeGreaterThan(OVEN_STEPS[i - 1][0]);
      expect(OVEN_STEPS[i][1]).toBeGreaterThan(OVEN_STEPS[i - 1][1]);
    }
  });
});

describe("cup definition", () => {
  it("uses the 240 ml cooking cup", () => {
    expect(CUP_ML).toBe(240);
    expect(convert(1, "cup", "ml", "")).toBe(CUP_ML);
  });
});

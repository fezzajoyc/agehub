/**
 * 烹饪换算纯逻辑:美制体积 ↔ 重量(按食材密度)、体积 ↔ 体积、重量 ↔ 重量、
 * 烤箱 °F ↔ °C。密度表为每 1 美制量杯(240 ml)的克数,取常见出版数据的平均值。
 * 非法输入(负数、非有限、未知单位/食材、跨维度缺食材)→ NaN,不抛异常。
 */

/** 1 美制量杯按 240 ml 计(烹饪通用约定) */
export const CUP_ML = 240;

export const VOLUME_ML: Record<string, number> = {
  cup: 240,
  tbsp: 15,
  tsp: 5,
  "fl-oz": 30,
  ml: 1,
  l: 1000,
};

export const WEIGHT_G: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

/**
 * 食材密度表:克 / 1 美制量杯。数值为常见参考(King Arthur、USDA 等)的平均,
 * 因受压实程度、湿度、研磨粗细影响,只作厨房级精度。
 */
export const COOKING_DENSITY: Record<string, number> = {
  "All-purpose flour": 120,
  "Whole wheat flour": 113,
  "Granulated sugar": 200,
  "Brown sugar (packed)": 213,
  "Powdered sugar": 121,
  "Cocoa powder (unsweetened)": 100,
  "Cornstarch": 125,
  "Salt (fine)": 273,
  "Butter": 227,
  "Vegetable oil": 218,
  "Olive oil": 216,
  "Water": 240,
  "Milk": 240,
  "Heavy cream": 238,
  "Yogurt": 245,
  "Honey": 340,
  "Maple syrup": 322,
  "Peanut butter": 258,
  "White rice (uncooked)": 185,
  "Rolled oats": 90,
  "Almond flour": 96,
  "Chocolate chips": 170,
  "Shredded coconut": 80,
  "Chopped walnuts": 117,
};

/** 密度表键的稳定顺序(引擎下拉框用) */
export const DENSITY_KEYS: string[] = Object.keys(COOKING_DENSITY);

export type CookUnit =
  | "cup" | "tbsp" | "tsp" | "fl-oz" | "ml" | "l" // 体积
  | "g" | "kg" | "oz" | "lb"; // 重量

function isVolume(u: CookUnit): boolean {
  return u in VOLUME_ML;
}

function isWeight(u: CookUnit): boolean {
  return u in WEIGHT_G;
}

/**
 * 通用换算。体积↔重量需要食材(用其密度);同维度换算忽略食材。
 * - 体积→重量:克 = ml × (克每杯 / 240)
 * - 重量→体积:ml = 克 × 240 / 克每杯
 * 非法 → NaN。
 */
export function cookConvert(
  value: number,
  from: CookUnit,
  to: CookUnit,
  ingredient: string,
): number {
  if (!Number.isFinite(value) || value < 0) return NaN;
  if (!isVolume(from) && !isWeight(from)) return NaN;
  if (!isVolume(to) && !isWeight(to)) return NaN;
  if (from === to) return value;

  if (isVolume(from) && isVolume(to)) {
    return (value * VOLUME_ML[from]) / VOLUME_ML[to];
  }
  if (isWeight(from) && isWeight(to)) {
    return (value * WEIGHT_G[from]) / WEIGHT_G[to];
  }

  const gPerCup = COOKING_DENSITY[ingredient];
  if (!Number.isFinite(gPerCup) || gPerCup <= 0) return NaN;

  if (isVolume(from)) {
    const grams = (value * VOLUME_ML[from] * gPerCup) / CUP_ML;
    return grams / WEIGHT_G[to];
  }
  const grams = value * WEIGHT_G[from];
  const ml = (grams * CUP_ML) / gPerCup;
  return ml / VOLUME_ML[to];
}

/* ---------------- 烤箱温度 ---------------- */

/** °F → °C 精确换算 */
export function fToC(f: number): number {
  return ((f - 32) * 5) / 9;
}

/** °C → °F 精确换算 */
export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

/** 常用烤箱档位(°F, °C);°C 取出版物标准近似值(误差 ≤ 5 °C) */
export const OVEN_STEPS: Array<[number, number]> = [
  [275, 135],
  [300, 150],
  [325, 165],
  [350, 175],
  [375, 190],
  [400, 200],
  [425, 220],
  [450, 230],
  [475, 245],
  [500, 260],
];

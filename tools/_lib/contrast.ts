/**
 * WCAG 2.x 对比度的纯数学,Node 可测。
 * parseColor 支持 #RGB / #RRGGBB / rgb() / rgba();带 alpha 的颜色按 CSS 规则
 * 压平到白底(c ← c·a + 255·(1−a)),工具 FAQ 中如实说明。
 */

export type Rgb = { r: number; g: number; b: number };

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGBA = /^rgba?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?)\s*)?\)$/i;

/** 通道字符串 → 0–255;非有限值回退 0,超界截断(CSS 行为)。 */
function channel(s: string): number {
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return Math.min(255, Math.max(0, n));
}

/**
 * 解析颜色输入,失败返回 null。接受:#RGB、#RRGGBB(大小写不敏感)、
 * rgb(r,g,b)、rgba(r,g,b,a)。alpha < 1 时压平到白底。
 */
export function parseColor(input: string): Rgb | null {
  const s = input.trim();
  if (s === "") return null;

  const m6 = HEX6.exec(s);
  if (m6) {
    return {
      r: parseInt(m6[1], 16),
      g: parseInt(m6[2], 16),
      b: parseInt(m6[3], 16),
    };
  }

  const m3 = HEX3.exec(s);
  if (m3) {
    return {
      r: parseInt(m3[1] + m3[1], 16),
      g: parseInt(m3[2] + m3[2], 16),
      b: parseInt(m3[3] + m3[3], 16),
    };
  }

  const m = RGBA.exec(s);
  if (m) {
    const rgb = { r: channel(m[1]), g: channel(m[2]), b: channel(m[3]) };
    const a = m[4] === undefined ? 1 : Number(m[4]);
    if (!Number.isFinite(a) || a < 0 || a > 1) return null;
    if (a >= 1) return rgb;
    // CSS alpha 合成,底色取白
    return {
      r: rgb.r * a + 255 * (1 - a),
      g: rgb.g * a + 255 * (1 - a),
      b: rgb.b * a + 255 * (1 - a),
    };
  }

  return null;
}

/** WCAG 2.x 相对亮度:L = 0.2126·R + 0.7152·G + 0.0722·B(线性化后)。 */
export function relativeLuminance(c: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    // WCAG 2.x 规范阈值 0.03928;对 8-bit 输入与 sRGB 的 0.04045 等价
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/**
 * 两色对比度 (L1+0.05)/(L2+0.05),亮色作分子。任一输入非法 → NaN。
 * 返回全精度值;展示层再取 2 位小数(徽章判定必须用全精度,避免 4.4996 被舍成 4.5 误判)。
 */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return NaN;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

export type WcagBadges = {
  aaNormal: boolean;
  aaaNormal: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
};

/** WCAG 阈值:正文 AA ≥ 4.5 / AAA ≥ 7;大字(≥18pt 或 ≥14pt bold)AA ≥ 3 / AAA ≥ 4.5。 */
export function wcagBadges(ratio: number): WcagBadges {
  return {
    aaNormal: ratio >= 4.5,
    aaaNormal: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  };
}

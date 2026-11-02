/**
 * CSS 渐变纯数学,Node 可测。
 *
 * gradientCss:2–5 个色标 → 一行标准语法渐变。未给位置的色标按 CSS 规则
 * 在相邻已定位色标间线性插值(首尾缺失时贴边);位置裁剪到 0–100 并保留
 * 2 位小数;角度归一化到 0–359(−45 → 315)。非法输入返回 null,绝不抛异常。
 *
 * rotateHue:HSL 色相旋转(随机和谐配色的底层);灰度色旋转后仍是灰度。
 */

export type GradientKind = "linear" | "radial" | "conic";
export type RadialShape = "circle" | "ellipse";

export type GradientStop = {
  /** 任意 CSS 颜色串(生成器里来自取色器,总是 #rrggbb) */
  color: string;
  /** 0–100;缺省时按 CSS 规则插值 */
  position?: number;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** 归一化角度:任意数 → 0–359,保留 2 位小数;非有限值返回 null */
export function normalizeAngle(deg: number): number | null {
  if (!Number.isFinite(deg)) return null;
  const wrapped = ((deg % 360) + 360) % 360;
  return round2(wrapped);
}

/**
 * 计算每个色标的最终位置(0–100)。
 * 全部缺省 → 均匀分布;部分缺省 → 在相邻已定位色标间线性插值,
 * 首个定位之前的取首定位值,末位之后取末定位值(与 CSS 行为一致)。
 * 任一位置非有限值 → null。
 */
export function resolvePositions(stops: GradientStop[]): number[] | null {
  const n = stops.length;
  const defined = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const p = stops[i].position;
    if (p === undefined) continue;
    if (!Number.isFinite(p)) return null;
    defined.set(i, Math.min(100, Math.max(0, p)));
  }
  const out: number[] = new Array(n);
  const all = [...defined.entries()].sort((a, b) => a[0] - b[0]);
  if (all.length === 0) {
    // 全缺省:均匀分布
    for (let i = 0; i < n; i++) out[i] = n === 1 ? 0 : round2((i / (n - 1)) * 100);
    return out;
  }
  const [firstIdx, firstVal] = all[0];
  const [lastIdx, lastVal] = all[all.length - 1];
  for (let i = 0; i < n; i++) {
    const d = defined.get(i);
    if (d !== undefined) {
      out[i] = d;
      continue;
    }
    if (i < firstIdx) {
      out[i] = firstVal;
    } else if (i > lastIdx) {
      out[i] = lastVal;
    } else {
      // 在 i 两侧最近已定位色标间插值
      let prev = firstIdx;
      let next = lastIdx;
      for (const [idx] of all) {
        if (idx < i) prev = idx;
        if (idx > i) {
          next = idx;
          break;
        }
      }
      const p0 = defined.get(prev)!;
      const p1 = defined.get(next)!;
      const t = (i - prev) / (next - prev);
      out[i] = round2(p0 + (p1 - p0) * t);
    }
  }
  return out;
}

/**
 * 生成一行标准 CSS 渐变。非法输入返回 null:
 * 少于 2 个色标、颜色为空串、位置非有限值、linear/conic 角度非有限值。
 * 色标按最终位置稳定排序(等位色标保持书写顺序,渲染为硬分隔)。
 */
export function gradientCss(
  stops: GradientStop[],
  kind: GradientKind,
  angle: number,
  shape: RadialShape = "circle",
): string | null {
  if (!Array.isArray(stops) || stops.length < 2) return null;
  for (const s of stops) {
    if (typeof s.color !== "string" || s.color.trim() === "") return null;
  }
  const positions = resolvePositions(stops);
  if (positions === null) return null;

  const ordered = stops
    .map((s, i) => ({ color: s.color.trim(), pos: positions[i], order: i }))
    .sort((a, b) => a.pos - b.pos || a.order - b.order)
    .map((s) => `${s.color} ${round2(s.pos)}%`)
    .join(", ");

  if (kind === "linear") {
    const a = normalizeAngle(angle);
    if (a === null) return null;
    return `linear-gradient(${round2(a)}deg, ${ordered})`;
  }
  if (kind === "conic") {
    const a = normalizeAngle(angle);
    if (a === null) return null;
    return `conic-gradient(from ${round2(a)}deg, ${ordered})`;
  }
  // radial:角度无关;形状非法时退回 circle(引擎只传合法值)
  const sh = shape === "ellipse" ? "ellipse" : "circle";
  return `radial-gradient(${sh} at center, ${ordered})`;
}

/* ---------- HSL 色相旋转(和谐配色) ---------- */

export type Hsl = { h: number; s: number; l: number }; // h: 0–360, s/l: 0–100

/** #rgb / #rrggbb → HSL;非法返回 null */
export function hexToHsl(hex: string): Hsl | null {
  const s = hex.trim().replace(/^#/, "");
  let r: number, g: number, b: number;
  if (/^[0-9a-f]{6}$/i.test(s)) {
    r = parseInt(s.slice(0, 2), 16);
    g = parseInt(s.slice(2, 4), 16);
    b = parseInt(s.slice(4, 6), 16);
  } else if (/^[0-9a-f]{3}$/i.test(s)) {
    r = parseInt(s[0] + s[0], 16);
    g = parseInt(s[1] + s[1], 16);
    b = parseInt(s[2] + s[2], 16);
  } else {
    return null;
  }
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const cMax = Math.max(rn, gn, bn);
  const cMin = Math.min(rn, gn, bn);
  const d = cMax - cMin;
  const l = (cMax + cMin) / 2;
  let h = 0;
  if (d !== 0) {
    if (cMax === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (cMax === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: sat * 100, l: l * 100 };
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

/** HSL → #rrggbb(h 超界自动取模,s/l 裁剪到 0–100) */
export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const lig = Math.min(100, Math.max(0, l)) / 100;
  if (sat === 0) {
    const v = Math.round(lig * 255);
    const hx = v.toString(16).padStart(2, "0");
    return `#${hx}${hx}${hx}`;
  }
  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;
  const r = Math.round(hueToRgbChannel(p, q, hue / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgbChannel(p, q, hue / 360) * 255);
  const b = Math.round(hueToRgbChannel(p, q, hue / 360 - 1 / 3) * 255);
  const to = (v: number) => v.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * 对一组 hex 颜色做色相旋转。非法颜色原样返回(诚实透传,不让整批失败)。
 * #ff0000 旋转 120° → #00ff00;灰度色(如 #808080)旋转后不变。
 */
export function rotateHue(colors: string[], deg: number): string[] {
  if (!Number.isFinite(deg)) return [...colors];
  return colors.map((c) => {
    const hsl = hexToHsl(c);
    if (!hsl) return c;
    return hslToHex(hsl.h + deg, hsl.s, hsl.l);
  });
}

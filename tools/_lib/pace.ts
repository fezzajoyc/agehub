/**
 * 跑步配速 / Riegel 竞赛预测 / 单次最大重量(1RM)的纯逻辑。
 * 所有时间一律用秒,距离一律用公里;英制换算只在边界处做。
 * 非法输入(非有限数、≤0 距离/时间、超范围次数)一律返回 NaN / 空表,不抛异常。
 */

export const KM_PER_MI = 1.609344;

/** Peter Riegel (1977, Runner's World) 疲劳指数:T2 = T1 × (D2/D1)^1.06 */
export const RIEGEL_EXPONENT = 1.06;

/** 常见比赛距离(km);半马/全马为 IAAF 官方值 */
export const RACE_DISTANCES: Record<string, number> = {
  "5k": 5,
  "10k": 10,
  hm: 21.0975,
  marathon: 42.195,
};

export type PaceResult = {
  /** 配速:秒/公里 */
  secPerKm: number;
  /** 配速:秒/英里 */
  secPerMi: number;
  /** 速度:公里/小时 */
  kmh: number;
  /** 速度:英里/小时 */
  mph: number;
};

/** 由距离(km)与用时(秒)求配速与速度;距离或时间 ≤ 0 / 非有限 → 全 NaN */
export function paceFor(distanceKm: number, seconds: number): PaceResult {
  const ok =
    Number.isFinite(distanceKm) && distanceKm > 0 &&
    Number.isFinite(seconds) && seconds > 0;
  if (!ok) return { secPerKm: NaN, secPerMi: NaN, kmh: NaN, mph: NaN };
  const spk = seconds / distanceKm;
  return {
    secPerKm: spk,
    secPerMi: spk * KM_PER_MI,
    kmh: 3600 / spk,
    mph: 3600 / spk / KM_PER_MI,
  };
}

/** Riegel 预测:T1(秒)跑 D1(km),推算 D2(km)用时;输入非法 → NaN */
export function riegelPredict(t1Sec: number, d1Km: number, d2Km: number): number {
  const ok =
    Number.isFinite(t1Sec) && t1Sec > 0 &&
    Number.isFinite(d1Km) && d1Km > 0 &&
    Number.isFinite(d2Km) && d2Km > 0;
  if (!ok) return NaN;
  return t1Sec * Math.pow(d2Km / d1Km, RIEGEL_EXPONENT);
}

/** 秒 → "M:SS"(不足 1 小时)或 "H:MM:SS";非有限 → "—" */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

/* ---------------- 单次最大重量(1RM) ---------------- */

export type OneRepMax = {
  /** Epley 公式:w × (1 + reps/30) */
  epley: number;
  /** Brzycki 公式:w × 36 / (37 − reps) */
  brzycki: number;
};

/**
 * 估算 1RM。weight 单位任意(磅/公斤皆可,结果同单位)。
 * reps 为 1 时两式都恰为所举重量(1 次就是 1RM 本身)。
 * 有效域:weight > 0 且 reps 为 1–20 的整数;越界 → NaN。
 */
export function oneRepMax(weight: number, reps: number): OneRepMax {
  const ok =
    Number.isFinite(weight) && weight > 0 &&
    Number.isInteger(reps) && reps >= 1 && reps <= 20;
  if (!ok) return { epley: NaN, brzycki: NaN };
  if (reps === 1) return { epley: weight, brzycki: weight };
  return {
    epley: weight * (1 + reps / 30),
    brzycki: (weight * 36) / (37 - reps),
  };
}

/**
 * Epley 反推:能以 n 次重复完成的最大重量占 1RM 的比例(0–1)。
 * 与 oneRepMax 的 Epley 估计自洽:1RM × repsPercent(n) = 用 n 次完成的重量。
 */
export function repsPercent(reps: number): number {
  return 30 / (30 + reps);
}

export type OrmRow = {
  reps: number;
  /** 该次数下的预测最大重量(与输入同单位) */
  weight: number;
  /** 占 1RM 的百分比(0–100) */
  pct: number;
};

/** 1–12 次重复的训练表:各行 weight × pct/100 = 输入的 1RM(Epley) */
export function ormTable(oneRepMaxEpley: number): OrmRow[] {
  if (!Number.isFinite(oneRepMaxEpley) || oneRepMaxEpley <= 0) return [];
  const rows: OrmRow[] = [];
  for (let reps = 1; reps <= 12; reps++) {
    const pct = repsPercent(reps);
    rows.push({ reps, weight: oneRepMaxEpley * pct, pct: pct * 100 });
  }
  return rows;
}

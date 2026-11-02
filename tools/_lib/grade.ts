/**
 * 成绩计算纯数学,Node 可测、手算向量可核。
 * weighted:按权重加权得分率;points:总得分 / 总满分。
 * required-final:在剩余权重 / 剩余分数上反推达标所需分数,可为负(已稳过)
 * 或超过 100(理论上不可能),由 UI 如实呈现。
 */

export type GradeMode = "weighted" | "points";

export type GradeItem = {
  name?: string;
  score: number;
  max: number;
  weight?: number;
};

/** 等级表:按 min 降序排列的门槛;percent ≥ min 即命中。 */
export type LetterScale = { min: number; letter: string }[];

/** 美国 10 分制 A–F。 */
export const US_SCALE: LetterScale = [
  { min: 90, letter: "A" },
  { min: 80, letter: "B" },
  { min: 70, letter: "C" },
  { min: 60, letter: "D" },
  { min: 0, letter: "F" },
];

/** 带正负号的 13 级制。 */
export const PLUS_MINUS_SCALE: LetterScale = [
  { min: 93, letter: "A" },
  { min: 90, letter: "A-" },
  { min: 87, letter: "B+" },
  { min: 83, letter: "B" },
  { min: 80, letter: "B-" },
  { min: 77, letter: "C+" },
  { min: 73, letter: "C" },
  { min: 70, letter: "C-" },
  { min: 67, letter: "D+" },
  { min: 63, letter: "D" },
  { min: 60, letter: "D-" },
  { min: 0, letter: "F" },
];

/** 及格制。 */
export const PASS_FAIL_SCALE: LetterScale = [
  { min: 70, letter: "Pass" },
  { min: 0, letter: "Fail" },
];

/** 单条成绩是否可参与计算:分数非负有限、满分有限且 > 0。超满分合法(附加分)。 */
export function isValidItem(it: GradeItem): boolean {
  return (
    Number.isFinite(it.score) &&
    it.score >= 0 &&
    Number.isFinite(it.max) &&
    it.max > 0
  );
}

/**
 * 当前总评百分比。无效条目整条剔除;没有任何有效条目,或 weighted 模式下
 * 有效权重之和为 0,返回 NaN。结果可超过 100(附加分)。
 */
export function gradePercent(items: GradeItem[], mode: GradeMode): number {
  const valid = items.filter(isValidItem);
  if (valid.length === 0) return NaN;
  if (mode === "points") {
    const earned = valid.reduce((s, it) => s + it.score, 0);
    const possible = valid.reduce((s, it) => s + it.max, 0);
    return possible > 0 ? (earned / possible) * 100 : NaN;
  }
  let num = 0;
  let den = 0;
  for (const it of valid) {
    const w = it.weight;
    if (!Number.isFinite(w) || (w as number) < 0) continue;
    num += (w as number) * (it.score / it.max);
    den += w as number;
  }
  return den > 0 ? (num / den) * 100 : NaN;
}

/** 百分比 → 等级字母。NaN 或低于所有门槛时返回空串。 */
export function letterFor(percent: number, scale: LetterScale = US_SCALE): string {
  if (!Number.isFinite(percent)) return "";
  let best: string = "";
  let bestMin = -Infinity;
  for (const e of scale) {
    if (percent >= e.min && e.min > bestMin) {
      best = e.letter;
      bestMin = e.min;
    }
  }
  return best;
}

export type RequiredFinalWeightedOpts = {
  items: GradeItem[];
  /** 期末考试权重(百分比),必须 > 0,否则 NaN —— 零剩余权重无从反推。 */
  finalWeight: number;
  /** 目标总评百分比(0–100+,允许附加分目标)。 */
  targetPercent: number;
};

/**
 * 加权制下:期末要考多少分(百分比)才能达到目标总评。
 * f = (target% × (Σw_current + W) − Σ(w_i × s_i/m_i)) ÷ W × 100。
 * 结果 ≤ 0 表示已稳达目标,> 100 表示该目标已不可能。无有效当前条目时,
 * 等价于"期末须达到 target%"。
 */
export function requiredFinalWeighted({ items, finalWeight, targetPercent }: RequiredFinalWeightedOpts): number {
  if (!Number.isFinite(finalWeight) || finalWeight <= 0) return NaN;
  if (!Number.isFinite(targetPercent) || targetPercent < 0) return NaN;
  let current = 0;
  let currentWeight = 0;
  for (const it of items) {
    if (!isValidItem(it)) continue;
    const w = it.weight;
    if (!Number.isFinite(w) || (w as number) < 0) continue;
    current += (w as number) * (it.score / it.max);
    currentWeight += w as number;
  }
  const total = currentWeight + finalWeight;
  const need = (targetPercent / 100) * total - current;
  return (need / finalWeight) * 100;
}

export type RequiredFinalPointsOpts = {
  /** 已获总分(不含期末)。 */
  earned: number;
  /** 目前已开放的满分合计(不含期末),必须 > 0。 */
  possible: number;
  /** 期末满分,必须 > 0。 */
  finalPoints: number;
  /** 目标总评百分比,按 (possible + finalPoints) 计。 */
  targetPercent: number;
};

/**
 * 分数制下:期末要考的百分比。needed = target% × (possible + finalPoints) − earned,
 * 返回 needed ÷ finalPoints × 100;≤ 0 已稳过,> 100 不可能。
 */
export function requiredFinalPoints({ earned, possible, finalPoints, targetPercent }: RequiredFinalPointsOpts): number {
  if (!Number.isFinite(possible) || possible <= 0) return NaN;
  if (!Number.isFinite(finalPoints) || finalPoints <= 0) return NaN;
  if (!Number.isFinite(earned) || earned < 0) return NaN;
  if (!Number.isFinite(targetPercent) || targetPercent < 0) return NaN;
  const need = (targetPercent / 100) * (possible + finalPoints) - earned;
  return (need / finalPoints) * 100;
}

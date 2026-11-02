/**
 * 睡眠周期纯逻辑:平均一个睡眠周期 90 分钟 + 入睡耗时约 15 分钟。
 * 时间用"自当日 0 点的分钟数"表示(0–1439);跨午夜时结果会落在
 * [−1440, 2879],dayOffset() 给出 −1 / 0 / +1 的日期偏移。
 * 非法分钟数(非整数、<0、≥1440、非有限)→ 返回空数组。
 */

export const SLEEP_CYCLE_MIN = 90;
export const FALL_ASLEEP_MIN = 15;

/** 从 6 周期(9 小时睡眠)到 3 周期(4.5 小时),由长到短 */
export const SLEEP_CYCLES = [6, 5, 4, 3] as const;

export type CycleOption = {
  cycles: number;
  /** 睡眠总时长(分钟,不含入睡耗时) */
  sleepMinutes: number;
  /** 结果时间(自 0 点的分钟数,可能 <0 或 ≥1440,用 dayOffset 解释) */
  minutes: number;
};

/** 自 0 点的分钟数 → 日期偏移(−1 前一天 / 0 当天 / +1 次日) */
export function dayOffset(minutes: number): number {
  return Math.floor(minutes / 1440);
}

/** 分钟数 → "HH:MM"(自动取模到 0–1439) */
export function formatHm(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(Math.floor(m / 60))}:${two(m % 60)}`;
}

/** "HH:MM" / "H:MM" → 自 0 点的分钟数;格式或范围非法 → null */
export function parseHm(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * 已知起床时间 wakeMin(0–1439),倒推各周期数下的就寝时间:
 * 就寝 = 起床 − 入睡 15 分钟 − 周期数 × 90。
 * 输入非法 → [](文档化行为,不抛异常)。
 */
export function bedtimesFor(wakeMin: number): CycleOption[] {
  if (!Number.isInteger(wakeMin) || wakeMin < 0 || wakeMin >= 1440) return [];
  return SLEEP_CYCLES.map((cycles) => ({
    cycles,
    sleepMinutes: cycles * SLEEP_CYCLE_MIN,
    minutes: wakeMin - FALL_ASLEEP_MIN - cycles * SLEEP_CYCLE_MIN,
  }));
}

/**
 * 现在就睡(或指定时刻),顺推各周期数下的自然醒来时间:
 * 醒来 = 时刻 + 入睡 15 分钟 + 周期数 × 90。
 * 输入非法 → []。cycles 自定义时仅接受 1–12 的整数。
 */
export function wakeTimesFor(
  nowMin: number,
  cycles: readonly number[] = SLEEP_CYCLES,
): CycleOption[] {
  if (!Number.isInteger(nowMin) || nowMin < 0 || nowMin >= 1440) return [];
  const ok = cycles.every((c) => Number.isInteger(c) && c >= 1 && c <= 12);
  if (!ok) return [];
  return cycles.map((cycles2) => ({
    cycles: cycles2,
    sleepMinutes: cycles2 * SLEEP_CYCLE_MIN,
    minutes: nowMin + FALL_ASLEEP_MIN + cycles2 * SLEEP_CYCLE_MIN,
  }));
}

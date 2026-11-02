/**
 * 工作日(营业日)纯逻辑。全部使用 UTC 整数天数(自 epoch 起)做日历运算,
 * 与本地时区/DST 完全解耦——跨夏令时的区间不会出现 ±1 天漂移。
 * 日期一律用 ISO "YYYY-MM-DD";无法解析(含 2026-02-30 这类假日期)→ NaN / null。
 *
 * 语义约定:
 * - workdaysBetween:两端都含(闭区间),端点若是工作日则计入;方向对称。
 * - addWorkdays:Excel WORKDAY 语义——从 start 起数 n 个"非周末且非假日"日,
 *   start 本身不算;n = 0 原样返回(即使 start 是周末)。
 */

export type WeekendDef = "sat-sun" | "fri-sat";

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86400000;

/** ISO 日期 → 自 epoch 的整数天数;格式错或假日期(2 月 30 日等)→ null */
export function isoToDay(iso: string): number | null {
  const m = ISO_RE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const dt = new Date(ms);
  // 回读校验,拒绝 2026-02-30 / 2026-13-01 等被静默进位的输入
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return ms / MS_PER_DAY;
}

/** 自 epoch 的天数 → ISO "YYYY-MM-DD" */
export function dayToIso(day: number): string {
  const dt = new Date(day * MS_PER_DAY);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${two(dt.getUTCMonth() + 1)}-${two(dt.getUTCDate())}`;
}

function isWeekend(day: number, weekend: WeekendDef): boolean {
  const dow = new Date(day * MS_PER_DAY).getUTCDay();
  if (weekend === "fri-sat") return dow === 5 || dow === 6;
  return dow === 6 || dow === 0; // sat-sun(默认)
}

/** day 是否为工作日:非周末且不在假日集合内 */
export function isWorkday(day: number, weekend: WeekendDef, holidays: Set<string>): boolean {
  return !isWeekend(day, weekend) && !holidays.has(dayToIso(day));
}

/** 把用户粘贴的假日行清洗为合法 ISO 集合:去空白、去重、丢弃非法行 */
export function parseHolidays(lines: string[]): Set<string> {
  const out = new Set<string>();
  for (const raw of lines) {
    const s = raw.trim();
    if (!s) continue;
    if (isoToDay(s) !== null) out.add(s);
  }
  return out;
}

export type WorkdaysOptions = {
  weekend?: WeekendDef;
  /** ISO "YYYY-MM-DD" 列表(或已解析的 Set) */
  holidays?: string[] | Set<string>;
};

function holidaySet(holidays: string[] | Set<string> | undefined): Set<string> {
  if (!holidays) return new Set();
  return holidays instanceof Set ? holidays : parseHolidays(holidays);
}

/**
 * 两个日期之间的工作日数(闭区间,两端都含;方向对称,先后随意)。
 * 任一日期无法解析 → NaN。
 */
export function workdaysBetween(
  startIso: string,
  endIso: string,
  opts: WorkdaysOptions = {},
): number {
  const a = isoToDay(startIso);
  const b = isoToDay(endIso);
  if (a === null || b === null) return NaN;
  const weekend = opts.weekend ?? "sat-sun";
  const holidays = holidaySet(opts.holidays);
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  let count = 0;
  for (let d = lo; d <= hi; d++) {
    if (isWorkday(d, weekend, holidays)) count++;
  }
  return count;
}

/**
 * 从 startIso 起数 n 个工作日(Excel WORKDAY 语义),返回结果 ISO 日期。
 * n 为 0 → 原样返回;start 为周末/假日时按方向逐日计数,不预滚动。
 * 日期非法或 n 非整数 → null。
 */
export function addWorkdays(
  startIso: string,
  n: number,
  opts: WorkdaysOptions = {},
): string | null {
  const start = isoToDay(startIso);
  if (start === null) return null;
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  const weekend = opts.weekend ?? "sat-sun";
  const holidays = holidaySet(opts.holidays);
  let day = start;
  let remaining = Math.abs(n);
  const dir = n >= 0 ? 1 : -1;
  while (remaining > 0) {
    day += dir;
    if (isWorkday(day, weekend, holidays)) remaining--;
  }
  return dayToIso(day);
}

/** 附加统计:区间内周末天数与被排除的假日天数(供引擎展示) */
export function workdaysBreakdown(
  startIso: string,
  endIso: string,
  opts: WorkdaysOptions = {},
): { total: number; weekendDays: number; holidayDays: number; workdays: number } | null {
  const a = isoToDay(startIso);
  const b = isoToDay(endIso);
  if (a === null || b === null) return null;
  const weekend = opts.weekend ?? "sat-sun";
  const holidays = holidaySet(opts.holidays);
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  let total = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  for (let d = lo; d <= hi; d++) {
    total++;
    if (isWeekend(d, weekend)) weekendDays++;
    else if (holidays.has(dayToIso(d))) holidayDays++;
  }
  return { total, weekendDays, holidayDays, workdays: total - weekendDays - holidayDays };
}

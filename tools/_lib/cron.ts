/**
 * Cron 表达式纯解析(字段拆解 + 值展开),Node 可测。
 *
 * 覆盖标准 vixie 语法:5 段(分 时 日 月 周)与 6 段(秒 分 时 日 月 周,自动识别)。
 * 支持数字、月份/星期名称(JAN..DEC / SUN..SAT,大小写不敏感)、范围 a-b、
 * 列表 a,b,c(成员可为范围/步进)、步进 *\/n 与 a-b/n、* 与 ?(等价)。
 * dow 的 7 按 0(周日)归一,与主流 cron 一致。
 *
 * 明确不支持并给出友好错误码:Quartz 扩展(L / W / #)、数字前缀步进(5/15)、
 * @daily 简写、7 段(带年份)。下一次执行时间不在纯层计算 —— 引擎懒加载 croner 完成。
 */

export type CronUnit = "second" | "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export type CronAtom =
  | { type: "star" }
  | { type: "value"; value: number }
  | { type: "range"; from: number; to: number }
  | {
      type: "step";
      step: number;
      base: { type: "star" } | { type: "range"; from: number; to: number };
    };

export type CronFieldInfo = {
  unit: CronUnit;
  /** 原样保留的该段文本(已 trim) */
  raw: string;
  /** 整段为 * 或 ?(纯通配) */
  isWildcard: boolean;
  atoms: CronAtom[];
  /** 展开后的具体值:去重、升序、名称已解析、dow 的 7 归一为 0 */
  values: number[];
  /** 含步进原子时为最大步长,否则 null */
  step: number | null;
};

export type CronBreakdown = {
  /** true 表示 6 段(首段为秒) */
  hasSeconds: boolean;
  /** 规范顺序:秒(可选)、分、时、日、月、周 */
  fields: CronFieldInfo[];
};

export type CronErrorCode =
  | "empty"
  | "shorthand"
  | "fieldCount"
  | "badChar"
  | "outOfRange"
  | "badRange"
  | "badStep"
  | "emptyPart"
  | "unsupported";

export type CronParseOk = { ok: true; breakdown: CronBreakdown };
export type CronParseErr = { ok: false; code: CronErrorCode; unit?: CronUnit; detail?: string };
export type CronParseResult = CronParseOk | CronParseErr;

const MONTH_NAMES: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DOW_NAMES: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

/** 每段允许的数值区间 */
const UNIT_RANGE: Record<CronUnit, { min: number; max: number }> = {
  second: { min: 0, max: 59 },
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  dayOfWeek: { min: 0, max: 7 },
};

/** 字段规范顺序(有秒在前) */
const FIELD_ORDER: CronUnit[] = [
  "second", "minute", "hour", "dayOfMonth", "month", "dayOfWeek",
];

/** 名称 → 数值;非名称段返回 null */
function nameToNumber(raw: string, unit: CronUnit): number | null {
  const key = raw.toLowerCase();
  if (unit === "month") return MONTH_NAMES[key] ?? null;
  if (unit === "dayOfWeek") return DOW_NAMES[key] ?? null;
  return null;
}

/** 单个原子解析:成功返回 atom,失败返回错误码 + detail */
function parseAtom(
  raw: string,
  unit: CronUnit,
): { atom: CronAtom } | { err: CronErrorCode; detail: string } {
  const { min, max } = UNIT_RANGE[unit];
  const qmarkOk = unit === "dayOfMonth" || unit === "dayOfWeek";

  // * 或 ?(可带步进)
  const starStep = /^([*?])(?:\/(\d+))?$/.exec(raw);
  if (starStep) {
    if (starStep[1] === "?" && !qmarkOk) return { err: "badChar", detail: raw };
    if (starStep[2] !== undefined) {
      const step = Number(starStep[2]);
      if (step < 1) return { err: "badStep", detail: raw };
      return { atom: { type: "step", step, base: { type: "star" } } };
    }
    return { atom: { type: "star" } };
  }

  // a-b(/n) 形式:两端可为数字或名称
  const rangeStep = /^([^/]+)(?:\/(\d+))?$/.exec(raw);
  if (rangeStep) {
    const stepPart = rangeStep[2];
    const left = rangeStep[1];
    const dash = left.indexOf("-");
    if (dash > 0) {
      const fromRaw = left.slice(0, dash);
      const toRaw = left.slice(dash + 1);
      const from = parseValue(fromRaw, unit);
      const to = parseValue(toRaw, unit);
      if (from === null || to === null) return { err: "badChar", detail: raw };
      if (from < min || from > max || to < min || to > max) return { err: "outOfRange", detail: raw };
      if (from > to) return { err: "badRange", detail: raw };
      if (stepPart !== undefined) {
        const step = Number(stepPart);
        if (step < 1) return { err: "badStep", detail: raw };
        return { atom: { type: "step", step, base: { type: "range", from, to } } };
      }
      return { atom: { type: "range", from, to } };
    }
    if (stepPart !== undefined) {
      // 数字前缀步进 5/15:cron 本身也不接受,与 croner 行为一致
      return { err: "unsupported", detail: raw };
    }
    const v = parseValue(left, unit);
    if (v === null) return { err: "badChar", detail: raw };
    if (v < min || v > max) return { err: "outOfRange", detail: raw };
    return { atom: { type: "value", value: v } };
  }

  return { err: "badChar", detail: raw };
}

function parseValue(raw: string, unit: CronUnit): number | null {
  if (/^\d+$/.test(raw)) {
    if (raw.length > 3) return null;
    return Number(raw);
  }
  return nameToNumber(raw, unit);
}

/** 原子 → 具体值列表 */
function expandAtom(atom: CronAtom, unit: CronUnit): number[] {
  const { min, max } = UNIT_RANGE[unit];
  switch (atom.type) {
    case "star": {
      const out: number[] = [];
      for (let v = min; v <= max; v++) out.push(v);
      return out;
    }
    case "value":
      return [atom.value];
    case "range": {
      const out: number[] = [];
      for (let v = atom.from; v <= atom.to; v++) out.push(v);
      return out;
    }
    case "step": {
      const lo = atom.base.type === "star" ? min : atom.base.from;
      const hi = atom.base.type === "star" ? max : atom.base.to;
      const out: number[] = [];
      for (let v = lo; v <= hi; v += atom.step) out.push(v);
      return out;
    }
  }
}

function expandField(field: CronFieldInfo): number[] {
  const seen = new Set<number>();
  for (const atom of field.atoms) {
    for (const v of expandAtom(atom, field.unit)) {
      // dow 的 7 视作 0(周日)
      const norm = field.unit === "dayOfWeek" && v === 7 ? 0 : v;
      seen.add(norm);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

/**
 * 解析 cron 表达式。非法输入返回结构化错误(绝不抛异常):
 * err.code 供引擎映射成各语言的友好提示,detail 是出问题的原文片段。
 */
export function parseCron(expr: string): CronParseResult {
  const trimmed = expr.trim();
  if (trimmed === "") return { ok: false, code: "empty" };
  if (trimmed.startsWith("@")) return { ok: false, code: "shorthand", detail: trimmed };

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    return { ok: false, code: "fieldCount", detail: String(parts.length) };
  }

  const units: CronUnit[] = parts.length === 6 ? FIELD_ORDER : FIELD_ORDER.slice(1);
  const fields: CronFieldInfo[] = [];

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const raw = parts[i];
    if (raw === "") return { ok: false, code: "emptyPart", unit };
    const atoms: CronAtom[] = [];
    for (const piece of raw.split(",")) {
      if (piece === "") return { ok: false, code: "emptyPart", unit, detail: raw };
      const r = parseAtom(piece, unit);
      if ("err" in r) return { ok: false, code: r.err, unit, detail: r.detail };
      atoms.push(r.atom);
    }
    const field: CronFieldInfo = {
      unit,
      raw,
      isWildcard: atoms.length === 1 && atoms[0].type === "star",
      atoms,
      values: [],
      step: null,
    };
    for (const atom of atoms) {
      if (atom.type === "step") field.step = Math.max(field.step ?? 0, atom.step);
    }
    field.values = expandField(field);
    fields.push(field);
  }

  return { ok: true, breakdown: { hasSeconds: parts.length === 6, fields } };
}

/**
 * 归一化表达式:多空白折叠为单空格,其余原样保留(名称、大小写、?)。
 * 解析失败返回 null。引擎把该串交给 croner 计算下次执行时间。
 */
export function normalizeCron(expr: string): string | null {
  const r = parseCron(expr);
  return r.ok ? r.breakdown.fields.map((f) => f.raw).join(" ") : null;
}

import { z } from "zod";
import { UNIT_CATEGORIES, convertValue, formatNumber } from "../tools/_lib/units";
import {
  breakEven, compound, hourlyToSalary, mortgage, salaryBreakdown,
} from "../tools/_lib/finance";
import {
  bmr, idealWeightRange, navyBodyFat, tdee, waterIntake,
} from "../tools/_lib/health";
import { formatDuration, oneRepMax, paceFor, riegelPredict } from "../tools/_lib/pace";
import { addWorkdays, workdaysBetween } from "../tools/_lib/workdays";
import { bedtimesFor, formatHm, wakeTimesFor } from "../tools/_lib/sleep";
import { cookConvert } from "../tools/_lib/cooking";
import { contrastRatio, wcagBadges } from "../tools/_lib/contrast";
import { gradePercent, letterFor, US_SCALE, PLUS_MINUS_SCALE, PASS_FAIL_SCALE } from "../tools/_lib/grade";
import {
  cleanText, countTextStats, dedupeLines, removeExtraSpaces, reverseText, slugify,
  sortLines, toCamel, toKebab, toPascal, toSnake, toTitleCase,
} from "../tools/_lib/transforms";
import { detectDelimiter, jsonToXml, parseCsv } from "../tools/_lib/converters";

/**
 * MCP 工具注册表:把 tools/_lib 的纯函数暴露为 AI 可执行工具。
 * 站上的同名工具在浏览器里跑(交互式),这里跑同一份经过测试的实现——
 * 人和 AI 用同一套逻辑,而不是两套各写各的。
 */

const num = (n: number) => (Number.isFinite(n) ? String(n) : "invalid input — see tool description for accepted ranges");
const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

export type McpToolDef = {
  name: string;
  title: string;
  description: string;
  schema: Record<string, any>;
  run: (args: any) => { content: { type: "text"; text: string }[]; isError?: boolean };
};

export const MCP_TOOLS: McpToolDef[] = [
  // ── 单位换算 ──
  {
    name: "list_unit_categories",
    title: "List unit categories",
    description: "List all unit conversion categories available in convert_unit (length, weight, temperature, data, speed, volume, time, pressure, energy) with their unit ids and symbols.",
    schema: {},
    run: () => json(Object.fromEntries(
      Object.entries(UNIT_CATEGORIES).map(([id, cat]) => [
        id,
        cat.units.map((u) => `${u.id} (${u.symbol})`),
      ]),
    )),
  },
  {
    name: "convert_unit",
    title: "Convert unit",
    description: "Convert an amount between units. Get valid category/unit ids from list_unit_categories first. Examples: length m→ft, weight kg→lb, data GB→GiB, temperature c→f, pressure bar→psi, energy kcal→kj.",
    schema: {
      category: z.enum(["length", "weight", "area", "volume", "speed", "data", "time", "temperature", "pressure", "energy"]),
      from: z.string().describe("source unit id, e.g. 'm', 'kg', 'gb', 'c'"),
      to: z.string().describe("target unit id"),
      amount: z.number().describe("amount to convert"),
    },
    run: (a) => {
      const cat = UNIT_CATEGORIES[a.category];
      if (!cat) return { content: [{ type: "text", text: `unknown category: ${a.category}` }], isError: true };
      const value = convertValue(cat, a.amount, a.from, a.to);
      if (!Number.isFinite(value)) {
        return { content: [{ type: "text", text: `unknown units: ${a.from} → ${a.to} in category ${a.category} — call list_unit_categories for valid ids` }], isError: true };
      }
      return text(num(value));
    },
  },

  // ── 财务 ──
  {
    name: "mortgage_payment",
    title: "Mortgage payment",
    description: "Monthly mortgage payment (P&I) via standard amortization, plus loan amount, total interest and total paid. Also returns the yearly amortization schedule.",
    schema: {
      home_price: z.number().positive(),
      down_payment: z.number().min(0).describe("down payment in currency units (not %)"),
      annual_rate_pct: z.number().min(0),
      years: z.number().positive(),
    },
    run: (a) => {
      const r = mortgage(a.home_price - a.down_payment, a.annual_rate_pct, a.years);
      if (!Number.isFinite(r.monthlyPI)) {
        return { content: [{ type: "text", text: "invalid input: loan amount (price − down payment) must be positive" }], isError: true };
      }
      return json(r);
    },
  },
  {
    name: "compound_interest",
    title: "Compound interest",
    description: "Future value with regular contributions (annuity-due: contribution at period start). Returns total, contributed, interest and a year-by-year schedule.",
    schema: {
      principal: z.number().min(0),
      monthly_contribution: z.number().min(0).describe("monthly deposit"),
      annual_rate_pct: z.number().min(0),
      years: z.number().positive().max(100),
      periods_per_year: z.union([z.literal(1), z.literal(4), z.literal(12)]).default(12),
    },
    run: (a) => {
      const r = compound(a.principal, a.monthly_contribution, a.annual_rate_pct, a.years, a.periods_per_year === 1 ? "annually" : a.periods_per_year === 4 ? "quarterly" : "monthly");
      if (!Number.isFinite(r.total)) {
        return { content: [{ type: "text", text: "invalid input: values must be non-negative and years 1–100" }], isError: true };
      }
      return json(r);
    },
  },
  {
    name: "salary_breakdown",
    title: "Salary to hourly",
    description: "Break an annual salary down to hourly/daily/weekly/biweekly/monthly. Optional unpaid days off raise the effective hourly rate (same salary over fewer worked days).",
    schema: {
      annual_salary: z.number().positive(),
      hours_per_week: z.number().positive().max(168).default(40),
      weeks_per_year: z.number().positive().max(52).default(52),
      unpaid_days_off: z.number().min(0).default(0),
    },
    run: (a) => json(salaryBreakdown(a.annual_salary, a.hours_per_week, a.weeks_per_year, a.unpaid_days_off)),
  },
  {
    name: "hourly_to_salary",
    title: "Hourly to salary",
    description: "Convert an hourly rate to daily/weekly/biweekly/monthly/annual pay.",
    schema: {
      hourly_rate: z.number().positive(),
      hours_per_week: z.number().positive().max(168).default(40),
      weeks_per_year: z.number().positive().max(52).default(52),
    },
    run: (a) => json(hourlyToSalary(a.hourly_rate, a.hours_per_week, a.weeks_per_year)),
  },
  {
    name: "break_even",
    title: "Break-even point",
    description: "Break-even units and revenue for fixed costs, unit price and variable unit cost; includes contribution margin and profit at 0.5×/1×/1.5×/2× of break-even volume.",
    schema: {
      fixed_costs: z.number().min(0),
      price_per_unit: z.number().positive(),
      variable_cost_per_unit: z.number().min(0),
    },
    run: (a) => {
      const r = breakEven(a.fixed_costs, a.price_per_unit, a.variable_cost_per_unit);
      if (!Number.isFinite(r.units)) {
        return { content: [{ type: "text", text: "cannot break even: price per unit must exceed variable cost per unit" }], isError: true };
      }
      return json(r);
    },
  },

  // ── 健康(YMYL:描述固定声明是估算)──
  {
    name: "bmr",
    title: "Basal metabolic rate",
    description: "BMR via the Mifflin-St Jeor equation (1990). Estimate only — not medical advice. Metric units.",
    schema: {
      weight_kg: z.number().positive(),
      height_cm: z.number().positive(),
      age: z.number().positive(),
      sex: z.enum(["male", "female"]),
    },
    run: (a) => text(num(bmr(a.weight_kg, a.height_cm, a.age, a.sex)) + " kcal/day (Mifflin-St Jeor estimate)"),
  },
  {
    name: "tdee",
    title: "Daily calorie needs (TDEE)",
    description: "Total daily energy expenditure = BMR (Mifflin-St Jeor) × activity factor (sedentary 1.2 … very active 1.9). Estimate only — not medical advice.",
    schema: {
      weight_kg: z.number().positive(),
      height_cm: z.number().positive(),
      age: z.number().positive(),
      sex: z.enum(["male", "female"]),
      activity: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
    },
    run: (a) => text(num(tdee(bmr(a.weight_kg, a.height_cm, a.age, a.sex), a.activity)) + " kcal/day"),
  },
  {
    name: "body_fat_navy",
    title: "Body fat % (US Navy)",
    description: "Body fat percentage via the US Navy circumference method (Hodgdon & Beckett 1984). Metric cm. Hip is required for female. Estimate only.",
    schema: {
      sex: z.enum(["male", "female"]),
      height_cm: z.number().positive(),
      waist_cm: z.number().positive(),
      neck_cm: z.number().positive(),
      hip_cm: z.number().positive().optional().describe("required for female"),
    },
    run: (a) => {
      const v = navyBodyFat(a.sex, a.height_cm, a.waist_cm, a.neck_cm, a.hip_cm ?? 0);
      return text(num(v) + " % body fat (US Navy method estimate)");
    },
  },
  {
    name: "ideal_weight",
    title: "Ideal weight range",
    description: "Ideal weight by the Devine formula (1975, male and female) plus the healthy BMI 18.5–24.9 range for a given height. Metric cm.",
    schema: { height_cm: z.number().positive() },
    run: (a) => json(idealWeightRange(a.height_cm)),
  },
  {
    name: "water_intake",
    title: "Daily water intake",
    description: "Baseline 35 ml/kg body weight plus ~350 ml per 30 minutes of exercise. Returns baseline, exercise and total ml. General guideline, not medical advice.",
    schema: {
      weight_kg: z.number().positive(),
      exercise_minutes: z.number().min(0).default(0),
    },
    run: (a) => json(waterIntake(a.weight_kg, a.exercise_minutes)),
  },

  // ── 健身 ──
  {
    name: "running_pace",
    title: "Running pace",
    description: "Pace (per km and per mile) and speed from a race distance and finish time. Distance: '5k', '10k', 'half', 'marathon' or custom meters.",
    schema: {
      distance: z.union([z.enum(["5k", "10k", "half", "marathon"]), z.number().describe("custom distance in km")]),
      time_seconds: z.number().positive().describe("finish time in seconds (e.g. 1500 for 25:00)"),
    },
    run: (a) => {
      const km = a.distance === "5k" ? 5 : a.distance === "10k" ? 10 : a.distance === "half" ? 21.0975 : a.distance === "marathon" ? 42.195 : a.distance;
      const p = paceFor(km, a.time_seconds);
      return text(`pace ${formatDuration(p.secPerKm)} /km · ${formatDuration(p.secPerMi)} /mi · speed ${p.kmh} km/h (${p.mph} mph)`);
    },
  },
  {
    name: "race_time_predict",
    title: "Race time prediction",
    description: "Predict a race time from a recent result using Riegel's formula (exponent 1.06). Distances in km (5, 10, 21.0975, 42.195 or custom).",
    schema: {
      known_distance_km: z.number().positive(),
      known_time_seconds: z.number().positive(),
      target_distance_km: z.number().positive(),
    },
    run: (a) => text(formatDuration(riegelPredict(a.known_time_seconds, a.known_distance_km, a.target_distance_km))),
  },
  {
    name: "one_rep_max",
    title: "One-rep max",
    description: "Estimated 1RM from weight lifted and reps (Epley and Brzycki formulas).",
    schema: { weight: z.number().positive(), reps: z.number().int().positive() },
    run: (a) => json(oneRepMax(a.weight, a.reps)),
  },

  // ── 日期 ──
  {
    name: "workdays_between",
    title: "Business days between dates",
    description: "Count working days (Mon–Fri by default) between two ISO dates, inclusive. Optional holidays (YYYY-MM-DD).",
    schema: {
      start: z.string().describe("ISO date YYYY-MM-DD"),
      end: z.string().describe("ISO date YYYY-MM-DD"),
      holidays: z.array(z.string()).default([]),
    },
    run: (a) => json({ workdays: workdaysBetween(a.start, a.end, { holidays: a.holidays }) }),
  },
  {
    name: "add_workdays",
    title: "Add working days",
    description: "Add N working days to an ISO date (negative to subtract). Optional holidays. Returns the resulting ISO date.",
    schema: {
      start: z.string(),
      days: z.number().int(),
      holidays: z.array(z.string()).default([]),
    },
    run: (a) => text(addWorkdays(a.start, a.days, { holidays: a.holidays }) ?? "invalid date"),
  },
  {
    name: "sleep_schedule",
    title: "Sleep schedule",
    description: "Bedtimes to wake at a given time, or wake times if sleeping now — based on 90-minute sleep cycles plus 15 minutes to fall asleep. Cycles vary 80–120 min between individuals.",
    schema: {
      mode: z.enum(["bedtimes", "wake_times"]),
      time: z.string().describe("HH:MM (24h)"),
    },
    run: (a) => {
      const [h, m] = a.time.split(":").map(Number);
      const nowMin = h * 60 + m;
      if (!Number.isInteger(nowMin) || nowMin < 0 || nowMin >= 1440) {
        return { content: [{ type: "text", text: "invalid time — use HH:MM (24h)" }], isError: true };
      }
      const options = a.mode === "bedtimes" ? bedtimesFor(nowMin) : wakeTimesFor(nowMin);
      return json(options.map((o) => ({
        cycles: o.cycles,
        sleep_hours: o.sleepMinutes / 60,
        time: formatHm(o.minutes),
        day_offset: o.minutes < 0 || o.minutes >= 1440 ? 1 : 0,
      })));
    },
  },

  // ── 烹饪 ──
  {
    name: "cooking_convert",
    title: "Cooking conversion",
    description: "Convert between volume and weight for ~24 ingredients (flour, sugar, butter, honey…) using average densities. Units: cup, tbsp, tsp, fl-oz, ml, l, g, kg, oz, lb. Densities are averages — weigh for baking precision.",
    schema: {
      amount: z.number(),
      from: z.string(),
      to: z.string(),
      ingredient: z.string().describe("required for volume↔weight, e.g. flour, sugar, butter, honey"),
    },
    run: (a) => text(num(cookConvert(a.amount, a.from, a.to, a.ingredient ?? "")) + ""),
  },

  // ── 颜色/评分 ──
  {
    name: "contrast_ratio",
    title: "WCAG contrast ratio",
    description: "Contrast ratio between two colors (#RGB/#RRGGBB) with WCAG AA/AAA pass-fail for normal and large text.",
    schema: { foreground: z.string(), background: z.string() },
    run: (a) => {
      const ratio = contrastRatio(a.foreground, a.background);
      return json({ ratio: Math.round(ratio * 100) / 100, ...wcagBadges(ratio) });
    },
  },
  {
    name: "grade",
    title: "Grade calculator",
    description: "Weighted grade from scored items, plus letter grade on a configurable scale.",
    schema: {
      items: z.array(z.object({ score: z.number(), max: z.number().positive(), weight: z.number().positive() })),
      scale: z.enum(["us_10", "plus_minus", "pass_fail"]).default("us_10"),
    },
    run: (a) => {
      const pct = gradePercent(a.items, "weighted");
      const scale = a.scale === "plus_minus" ? PLUS_MINUS_SCALE : a.scale === "pass_fail" ? PASS_FAIL_SCALE : US_SCALE;
      return text(`${num(pct)}% — letter: ${letterFor(pct, scale)}`);
    },
  },

  // ── 文本 ──
  {
    name: "slugify",
    title: "URL slug",
    description: "Turn text into a URL-safe slug (lowercase, accents stripped, hyphens).",
    schema: { text: z.string() },
    run: (a) => text(slugify(a.text)),
  },
  {
    name: "text_stats",
    title: "Word/character statistics",
    description: "Word count (CJK-aware), characters with/without spaces, sentences, paragraphs, lines.",
    schema: { text: z.string() },
    run: (a) => json(countTextStats(a.text)),
  },
  {
    name: "transform_text",
    title: "Text transform",
    description: "Case and cleanup transforms: title_case, camel, pascal, snake, kebab, dedupe_lines, sort_lines, reverse, clean (collapse spaces/trim), remove_extra_spaces.",
    schema: {
      transform: z.enum(["title_case", "camel", "pascal", "snake", "kebab", "dedupe_lines", "sort_lines", "reverse", "clean", "remove_extra_spaces"]),
      text: z.string(),
    },
    run: (a) => {
      const f: Record<string, (s: string) => string> = {
        title_case: toTitleCase, camel: toCamel, pascal: toPascal, snake: toSnake, kebab: toKebab,
        dedupe_lines: (s) => dedupeLines(s), sort_lines: (s) => sortLines(s, "asc"), reverse: (s) => reverseText(s),
        clean: (s) => cleanText(s, { trimLines: true, collapseSpaces: true, removeEmpty: true }),
        remove_extra_spaces: (s) => removeExtraSpaces(s),
      };
      return text(f[a.transform](a.text));
    },
  },
  {
    name: "parse_csv",
    title: "Parse CSV",
    description: "Parse RFC-4180 CSV (quoted fields, embedded newlines, ,/;/tab delimiter auto-detect) into an array of row objects using the first row as header.",
    schema: { csv: z.string() },
    run: (a) => {
      const rows = parseCsv(a.csv, detectDelimiter(a.csv));
      const [head, ...body] = rows;
      return json(body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""]))));
    },
  },
  {
    name: "json_to_xml",
    title: "JSON to XML",
    description: "Convert a JSON object to XML. Arrays become repeated elements; '@'-prefixed keys become attributes; '#text' becomes text content. Mixed content is not representable.",
    schema: {
      json: z.string().describe("JSON document as a string"),
      root: z.string().default("root").describe("root element name"),
    },
    run: (a) => {
      try {
        return text(jsonToXml(JSON.parse(a.json), { rootName: a.root ?? "root" }));
      } catch (e) {
        return { content: [{ type: "text", text: `invalid JSON: ${(e as Error).message}` }], isError: true };
      }
    },
  },
];



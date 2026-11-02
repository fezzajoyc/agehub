import { describe, expect, it } from "vitest";
import {
  addWorkdays,
  dayToIso,
  isoToDay,
  parseHolidays,
  workdaysBetween,
  workdaysBreakdown,
} from "@/tools/_lib/workdays";

/**
 * 手算基准:2026-11-01 是周日,所以
 *   11-02 周一 … 11-06 周五、11-07 周六、11-08 周日、11-09 周一、
 *   11-23 周一 … 11-26 周四(2026 年感恩节)、11-27 周五、11-28 周六。
 * 美国夏令时:2026-11-01 结束,2027-03-14 开始(均为周日)。
 */
describe("workdaysBetween: hand-computed vectors", () => {
  it("counts a full Mon–Fri week as 5 (inclusive of both ends)", () => {
    expect(workdaysBetween("2026-11-02", "2026-11-06")).toBe(5);
  });

  it("counts across a weekend: Fri → Mon = 2", () => {
    expect(workdaysBetween("2026-11-06", "2026-11-09")).toBe(2);
  });

  it("a single workday counts as 1, a single weekend day as 0", () => {
    expect(workdaysBetween("2026-11-04", "2026-11-04")).toBe(1); // Wed
    expect(workdaysBetween("2026-11-07", "2026-11-07")).toBe(0); // Sat
  });

  it("is symmetric when start and end are swapped", () => {
    expect(workdaysBetween("2026-11-06", "2026-11-02")).toBe(
      workdaysBetween("2026-11-02", "2026-11-06"),
    );
  });

  it("excludes a holiday inside the range (Thanksgiving 2026-11-26)", () => {
    expect(workdaysBetween("2026-11-23", "2026-11-27")).toBe(5);
    expect(workdaysBetween("2026-11-23", "2026-11-27", { holidays: ["2026-11-26"] })).toBe(4);
  });

  it("ignores holidays that fall on a weekend day", () => {
    expect(
      workdaysBetween("2026-11-23", "2026-11-27", { holidays: ["2026-11-28"] }), // Sat
    ).toBe(5);
  });

  it("supports the Fri/Sat weekend definition", () => {
    // 周五变为休息日:Fri→Sun 区间只剩周日一天
    expect(workdaysBetween("2026-11-06", "2026-11-08", { weekend: "fri-sat" })).toBe(1);
    // 周五变为休息日:Mon–Sat 区间从 5 个工作日变成 4 个(Mon–Thu)
    expect(workdaysBetween("2026-11-02", "2026-11-07", { weekend: "fri-sat" })).toBe(4);
  });

  it("handles leap-day ranges (2028)", () => {
    expect(workdaysBetween("2028-02-28", "2028-03-01")).toBe(3); // Mon, Tue(29th), Wed
  });

  it("is stable across US DST transitions (UTC math, no ±1 drift)", () => {
    // DST 结束:2026-11-01(周日)
    expect(workdaysBetween("2026-10-30", "2026-11-02")).toBe(2); // Fri + Mon
    // DST 开始:2027-03-14(周日)
    expect(workdaysBetween("2027-03-12", "2027-03-15")).toBe(2); // Fri + Mon
  });
});

describe("addWorkdays: Excel WORKDAY semantics", () => {
  it("Fri + 1 workday = Mon", () => {
    expect(addWorkdays("2026-11-06", 1)).toBe("2026-11-09");
  });

  it("Mon − 1 workday = Fri", () => {
    expect(addWorkdays("2026-11-09", -1)).toBe("2026-11-06");
  });

  it("Fri + 5 workdays = the following Fri", () => {
    expect(addWorkdays("2026-11-06", 5)).toBe("2026-11-13");
  });

  it("Sat + 1 workday = Mon (start weekend day is not pre-rolled into the count)", () => {
    expect(addWorkdays("2026-11-07", 1)).toBe("2026-11-09");
  });

  it("n = 0 returns the start date unchanged, even on a weekend", () => {
    expect(addWorkdays("2026-11-04", 0)).toBe("2026-11-04"); // Wed
    expect(addWorkdays("2026-11-07", 0)).toBe("2026-11-07"); // Sat
  });

  it("skips holidays in the step path: Wed + 1 with Thursday holiday = Fri", () => {
    expect(addWorkdays("2026-11-25", 1, { holidays: ["2026-11-26"] })).toBe("2026-11-27");
  });

  it("steps backwards across holidays and weekends", () => {
    expect(addWorkdays("2026-11-30", -1, { holidays: ["2026-11-27"] })).toBe("2026-11-26");
  });

  it("respects the Fri/Sat weekend definition", () => {
    // 2026-11-08(周日)是工作日:fri-sat 下 Sun + 1 = Mon
    expect(addWorkdays("2026-11-08", 1, { weekend: "fri-sat" })).toBe("2026-11-09");
  });

  it.each([
    ["2026-02-30", 1], // fake date
    ["not-a-date", 1],
    ["2026-11-06", NaN],
    ["2026-11-06", 1.5],
    ["2026-11-06", Infinity],
  ])("returns null for invalid input (%p, %p)", (iso, n) => {
    expect(addWorkdays(iso, n)).toBeNull();
  });
});

describe("workdaysBetween: invalid inputs are documented NaN", () => {
  it.each([
    ["2026-02-30", "2026-11-06"],
    ["garbage", "2026-11-06"],
    ["2026-11-06", "2026-13-01"],
    ["2026-11-06", ""],
  ])("returns NaN for (%p, %p)", (a, b) => {
    expect(workdaysBetween(a, b)).toBeNaN();
  });
});

describe("isoToDay / dayToIso round trip and validation", () => {
  it("round-trips ISO dates through day numbers", () => {
    expect(dayToIso(isoToDay("2026-11-06")!)).toBe("2026-11-06");
    expect(dayToIso(isoToDay("1970-01-01")!)).toBe("1970-01-01");
    expect(isoToDay("1970-01-01")).toBe(0);
  });

  it("rejects malformed and impossible dates", () => {
    expect(isoToDay("2026-02-30")).toBeNull();
    expect(isoToDay("2026-2-6")).toBeNull(); // needs zero padding
    expect(isoToDay("2026-00-10")).toBeNull();
    expect(isoToDay("")).toBeNull();
    expect(isoToDay("2026-11-06T00:00:00Z")).toBeNull(); // datetime not accepted
  });
});

describe("parseHolidays and workdaysBreakdown", () => {
  it("keeps valid ISO lines, drops blanks and garbage, dedupes", () => {
    const set = parseHolidays(["2026-11-26", " 2026-11-26 ", "", "oops", "2026-02-30"]);
    expect(set.size).toBe(1);
    expect(set.has("2026-11-26")).toBe(true);
  });

  it("breaks a range into total / weekend / holiday / workdays", () => {
    const b = workdaysBreakdown("2026-11-23", "2026-11-29", { holidays: ["2026-11-26"] });
    expect(b).toEqual({ total: 7, weekendDays: 2, holidayDays: 1, workdays: 4 });
  });

  it("returns null for unparseable ranges", () => {
    expect(workdaysBreakdown("2026-11-23", "nope")).toBeNull();
  });
});

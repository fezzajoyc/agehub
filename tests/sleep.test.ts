import { describe, expect, it } from "vitest";
import {
  FALL_ASLEEP_MIN,
  SLEEP_CYCLES,
  SLEEP_CYCLE_MIN,
  bedtimesFor,
  dayOffset,
  formatHm,
  parseHm,
  wakeTimesFor,
} from "@/tools/_lib/sleep";

describe("constants: 90-minute cycles plus 15 minutes to fall asleep", () => {
  it("uses a 90 min cycle and 15 min sleep onset by default", () => {
    expect(SLEEP_CYCLE_MIN).toBe(90);
    expect(FALL_ASLEEP_MIN).toBe(15);
  });

  it("offers 6/5/4/3 cycles (9 h … 4.5 h of sleep)", () => {
    expect(SLEEP_CYCLES).toEqual([6, 5, 4, 3]);
    expect(SLEEP_CYCLES.map((c) => c * SLEEP_CYCLE_MIN)).toEqual([540, 450, 360, 270]);
  });
});

describe("bedtimesFor: wake at 07:00 (420 min)", () => {
  const rows = bedtimesFor(420);

  it("produces 4 options, longest first", () => {
    expect(rows.map((r) => r.cycles)).toEqual([6, 5, 4, 3]);
  });

  it("6 cycles → 21:45 the previous day", () => {
    expect(rows[0].minutes).toBe(420 - 15 - 540); // -135
    expect(dayOffset(rows[0].minutes)).toBe(-1);
    expect(formatHm(rows[0].minutes)).toBe("21:45");
  });

  it("5 cycles → 23:15 the previous day", () => {
    expect(formatHm(rows[1].minutes)).toBe("23:15");
    expect(dayOffset(rows[1].minutes)).toBe(-1);
  });

  it("4 cycles → 00:45 the same day", () => {
    expect(rows[2].minutes).toBe(45);
    expect(dayOffset(rows[2].minutes)).toBe(0);
    expect(formatHm(rows[2].minutes)).toBe("00:45");
  });

  it("3 cycles → 02:15 the same day", () => {
    expect(formatHm(rows[3].minutes)).toBe("02:15");
  });
});

describe("wakeTimesFor: fall asleep at 23:30 (1410 min)", () => {
  const rows = wakeTimesFor(1410);

  it("6 cycles → 08:45 the next day", () => {
    expect(rows[0].minutes).toBe(1410 + 15 + 540); // 1965
    expect(dayOffset(rows[0].minutes)).toBe(1);
    expect(formatHm(rows[0].minutes)).toBe("08:45");
  });

  it("5/4/3 cycles → 07:15 / 05:45 / 04:15", () => {
    expect(formatHm(rows[1].minutes)).toBe("07:15");
    expect(formatHm(rows[2].minutes)).toBe("05:45");
    expect(formatHm(rows[3].minutes)).toBe("04:15");
  });

  it("crossing midnight once lands on the same calendar day for short sleeps", () => {
    // 23:30 + 15 + 90 = 01:15 次日
    const one = wakeTimesFor(1410, [1])[0];
    expect(formatHm(one.minutes)).toBe("01:15");
    expect(dayOffset(one.minutes)).toBe(1);
  });

  it("accepts custom cycle lists (1–12 only)", () => {
    expect(wakeTimesFor(600, [2]).map((r) => r.minutes)).toEqual([600 + 15 + 180]);
    expect(wakeTimesFor(600, [13])).toEqual([]);
  });
});

describe("round-trip consistency", () => {
  it("bedtime + onset + cycles × 90 ≡ wake time (mod 24 h)", () => {
    for (const wake of [0, 60, 420, 720, 1439]) {
      for (const row of bedtimesFor(wake)) {
        const back = row.minutes + FALL_ASLEEP_MIN + row.cycles * SLEEP_CYCLE_MIN;
        expect(((back % 1440) + 1440) % 1440).toBe(wake);
      }
    }
  });

  it("sleep minutes are exact multiples of the cycle length", () => {
    for (const row of bedtimesFor(420)) {
      expect(row.sleepMinutes).toBe(row.cycles * 90);
    }
  });
});

describe("formatHm and parseHm", () => {
  it("normalizes any minute count into 00:00–23:59", () => {
    expect(formatHm(0)).toBe("00:00");
    expect(formatHm(45)).toBe("00:45");
    expect(formatHm(1440)).toBe("00:00");
    expect(formatHm(1965)).toBe("08:45");
    expect(formatHm(-135)).toBe("21:45");
  });

  it("parses HH:MM and H:MM strictly", () => {
    expect(parseHm("07:00")).toBe(420);
    expect(parseHm("7:05")).toBe(425);
    expect(parseHm(" 23:30 ")).toBe(1410);
  });

  it("rejects impossible clock values", () => {
    expect(parseHm("24:00")).toBeNull();
    expect(parseHm("07:60")).toBeNull();
    expect(parseHm("abc")).toBeNull();
    expect(parseHm("")).toBeNull();
    expect(parseHm("7")).toBeNull();
  });
});

describe("invalid minute-of-day inputs return [] (documented, no throw)", () => {
  it.each([-1, 1440, 420.5, NaN, Infinity])("bedtimesFor(%p) → []", (m) => {
    expect(bedtimesFor(m)).toEqual([]);
  });

  it.each([-1, 1440, 60.5, NaN])("wakeTimesFor(%p) → []", (m) => {
    expect(wakeTimesFor(m)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  KM_PER_MI,
  RACE_DISTANCES,
  RIEGEL_EXPONENT,
  formatDuration,
  oneRepMax,
  ormTable,
  paceFor,
  repsPercent,
  riegelPredict,
} from "@/tools/_lib/pace";

describe("paceFor: hand-computed vectors", () => {
  // 10K(10 km)50:00 = 3000 s → 300 s/km = 5:00/km;× 1.609344 = 482.8 s/mi(≈ 8:03/mi)
  const res = paceFor(10, 3000);

  it("gives 300 s/km (5:00/km) for 10 km in 50:00", () => {
    expect(res.secPerKm).toBe(300);
    expect(formatDuration(res.secPerKm)).toBe("5:00");
  });

  it("gives 482.80 s/mi (8:03/mi) for the same run", () => {
    expect(res.secPerMi).toBeCloseTo(300 * 1.609344, 6);
    expect(formatDuration(res.secPerMi)).toBe("8:03");
  });

  it("gives speed 12.0 km/h and 7.46 mph (5:00/km is 12 km/h, not 8)", () => {
    expect(res.kmh).toBeCloseTo(12, 9);
    expect(res.mph).toBeCloseTo(12 / 1.609344, 6);
  });

  it("inverts: 5 km in 15:00 → 180 s/km = 3:00/km", () => {
    expect(paceFor(5, 900).secPerKm).toBe(180);
  });
});

describe("formatDuration", () => {
  it("renders minutes-only under one hour and h:mm:ss above", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3599)).toBe("59:59");
    expect(formatDuration(3600)).toBe("1:00:00");
  });

  it("rounds sub-second remainder to the nearest second", () => {
    expect(formatDuration(299.6)).toBe("5:00");
    expect(formatDuration(299.4)).toBe("4:59");
  });

  it("returns — for non-finite values", () => {
    expect(formatDuration(NaN)).toBe("—");
    expect(formatDuration(Infinity)).toBe("—");
  });
});

describe("riegelPredict: Peter Riegel's 1977 exponent 1.06", () => {
  it("uses exponent 1.06", () => {
    expect(RIEGEL_EXPONENT).toBe(1.06);
  });

  it("predicts 10K 50:00 → half marathon ≈ 1:50:19 (canonical Riegel 1.06)", () => {
    // 3000 × (21.0975/10)^1.06 ≈ 6619 s,与 exp/log 独立实现互证
    const expected = 3000 * Math.exp(1.06 * Math.log(21.0975 / 10));
    expect(riegelPredict(3000, 10, 21.0975)).toBeCloseTo(expected, 6);
    expect(riegelPredict(3000, 10, 21.0975)).toBeGreaterThan(6610);
    expect(riegelPredict(3000, 10, 21.0975)).toBeLessThan(6630);
    expect(formatDuration(riegelPredict(3000, 10, 21.0975))).toBe("1:50:19");
  });

  it("predicts 10K 50:00 → marathon ≈ 3:50:01 (Riegel's published table ballpark)", () => {
    const t = riegelPredict(3000, 10, 42.195);
    expect(t).toBeGreaterThan(13770); // 3:49:30
    expect(t).toBeLessThan(13830); // 3:50:30
  });

  it("is the identity when target distance equals source distance", () => {
    expect(riegelPredict(3000, 10, 10)).toBe(3000);
  });

  it("slows per-km as distance grows (positive endurance fade)", () => {
    const t10k = riegelPredict(3000, 10, 10);
    const tHm = riegelPredict(3000, 10, 21.0975);
    expect(tHm / 21.0975).toBeGreaterThan(t10k / 10);
    // 全马用时 > 2 × 半马用时
    expect(riegelPredict(3000, 10, 42.195)).toBeGreaterThan(2 * tHm);
  });

  it("predicts faster times for shorter targets", () => {
    expect(riegelPredict(3000, 10, 5)).toBeLessThan(3000);
  });

  it.each([
    [0, 10, 21.0975],
    [-3000, 10, 21.0975],
    [3000, 0, 21.0975],
    [3000, 10, 0],
    [NaN, 10, 21.0975],
    [3000, NaN, 21.0975],
    [Infinity, 10, 21.0975],
  ])("returns NaN for invalid input (%p, %p, %p)", (t, d1, d2) => {
    expect(riegelPredict(t, d1, d2)).toBeNaN();
  });
});

describe("paceFor: boundaries and invalid inputs (documented NaN)", () => {
  it.each([
    [0, 3000], // 0 distance
    [-10, 3000],
    [10, 0],
    [10, -1],
    [NaN, 3000],
    [10, NaN],
    [Infinity, 3000],
  ])("returns all-NaN for paceFor(%p, %p)", (d, s) => {
    const r = paceFor(d, s);
    expect(r.secPerKm).toBeNaN();
    expect(r.secPerMi).toBeNaN();
    expect(r.kmh).toBeNaN();
    expect(r.mph).toBeNaN();
  });
});

describe("race distance constants (IAAF official)", () => {
  it("half marathon is 21.0975 km and marathon 42.195 km", () => {
    expect(RACE_DISTANCES.hm).toBe(21.0975);
    expect(RACE_DISTANCES.marathon).toBe(42.195);
    expect(RACE_DISTANCES["5k"]).toBe(5);
    expect(RACE_DISTANCES["10k"]).toBe(10);
  });

  it("mile constant matches the international definition", () => {
    expect(KM_PER_MI).toBe(1.609344);
  });
});

describe("oneRepMax: Epley and Brzycki", () => {
  it("100 kg × 5 → Epley 116.67, Brzycki 112.5", () => {
    const r = oneRepMax(100, 5);
    expect(r.epley).toBeCloseTo(100 * (1 + 5 / 30), 9);
    expect(r.brzycki).toBeCloseTo(112.5, 9);
  });

  it("225 × 10 → both formulas give exactly 300 (classic gym vector)", () => {
    const r = oneRepMax(225, 10);
    expect(r.epley).toBe(300);
    expect(r.brzycki).toBe(300);
  });

  it("1 rep returns the weight lifted for both formulas", () => {
    const r = oneRepMax(140, 1);
    expect(r.epley).toBe(140);
    expect(r.brzycki).toBe(140);
  });

  it("diverges at high reps: 100 × 20 → Epley 166.67 < Brzycki 211.76", () => {
    const r = oneRepMax(100, 20);
    expect(r.epley).toBeCloseTo(100 * (1 + 20 / 30), 9);
    expect(r.brzycki).toBeCloseTo(3600 / 17, 9);
    expect(r.epley).toBeLessThan(r.brzycki);
  });

  it("is linear in weight: doubling the set doubles the estimate", () => {
    expect(oneRepMax(60, 7).epley * 2).toBeCloseTo(oneRepMax(120, 7).epley, 9);
  });

  it.each([
    [0, 5],
    [-100, 5],
    [NaN, 5],
    [100, 0],
    [100, -1],
    [100, 21], // above the documented 1–20 range
    [100, 2.5], // non-integer reps
    [100, NaN],
    [100, Infinity],
  ])("returns NaN for oneRepMax(%p, %p)", (w, r) => {
    expect(oneRepMax(w, r).epley).toBeNaN();
    expect(oneRepMax(w, r).brzycki).toBeNaN();
  });
});

describe("ormTable: 1–12 rep training table", () => {
  const rows = ormTable(oneRepMax(100, 5).epley);

  it("has exactly 12 rows numbered 1…12", () => {
    expect(rows).toHaveLength(12);
    rows.forEach((row, i) => expect(row.reps).toBe(i + 1));
  });

  it("is self-consistent: the row at the lifted rep count returns the lifted weight", () => {
    // 1RM = 100 × (1 + 5/30);第 5 行应还原为 100 kg
    expect(rows[4].weight).toBeCloseTo(100, 9);
  });

  it("descends from ~96.8 % of 1RM at 1 rep to ~71.4 % at 12", () => {
    expect(rows[0].pct).toBeCloseTo((30 / 31) * 100, 6);
    expect(rows[11].pct).toBeCloseTo((30 / 42) * 100, 6);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].weight).toBeLessThan(rows[i - 1].weight);
      expect(rows[i].pct).toBeLessThan(rows[i - 1].pct);
    }
  });

  it("weight = 1RM × pct/100 on every row", () => {
    const max = oneRepMax(100, 5).epley;
    for (const row of rows) {
      expect(row.weight).toBeCloseTo(max * (row.pct / 100), 9);
    }
  });

  it("repsPercent(10) = 75 % (Epley inverse)", () => {
    expect(repsPercent(10)).toBe(0.75);
  });

  it("returns [] for invalid 1RM input", () => {
    expect(ormTable(NaN)).toEqual([]);
    expect(ormTable(0)).toEqual([]);
    expect(ormTable(-5)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  ACTIVITY_FACTORS,
  CM_PER_INCH,
  GOAL_ADJUSTMENTS,
  KG_PER_LB,
  bmr,
  calorieGoal,
  cmFromFtIn,
  idealWeightRange,
  kgFromLb,
  navyBodyFat,
  tdee,
  waterIntake,
  type ActivityKey,
  type GoalKey,
  type Sex,
} from "@/tools/_lib/health";

/**
 * Independent reimplementations of the published formulas, used to
 * cross-check the product code (same spirit as closedFV in finance.test.ts).
 */
const refBmr = (w: number, h: number, a: number, sex: Sex): number =>
  sex === "female"
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;

const refNavy = (sex: Sex, h: number, waist: number, neck: number, hip: number): number =>
  sex === "female"
    ? 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(h)) - 450
    : 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;

const refDevine = (h: number, sex: Sex): number =>
  (sex === "female" ? 45.5 : 50) + 2.3 * (h / CM_PER_INCH - 60);

const relDiff = (a: number, b: number): number => Math.abs(a - b) / Math.abs(b);

describe("bmr: hand-computed Mifflin-St Jeor (1990) vectors", () => {
  it("male 80 kg / 180 cm / 30 y = 800 + 1125 - 150 + 5 = 1780 kcal exactly", () => {
    expect(bmr(80, 180, 30, "male")).toBeCloseTo(1780, 9);
  });

  it("female 65 kg / 165 cm / 28 y = 650 + 1031.25 - 140 - 161 = 1380.25 kcal exactly", () => {
    expect(bmr(65, 165, 28, "female")).toBeCloseTo(1380.25, 9);
  });

  it("male 70 kg / 170 cm / 25 y = 1642.5 kcal and matches the independent implementation", () => {
    expect(bmr(70, 170, 25, "male")).toBeCloseTo(1642.5, 9);
    expect(bmr(70, 170, 25, "male")).toBeCloseTo(refBmr(70, 170, 25, "male"), 9);
  });

  it("agrees with the independent Mifflin-St Jeor implementation across ages and sexes", () => {
    const cases: Array<[number, number, number, Sex]> = [
      [50, 155, 20, "female"],
      [90, 190, 45, "male"],
      [55, 160, 65, "female"],
      [85, 175, 80, "male"],
    ];
    for (const [w, h, a, s] of cases) {
      expect(bmr(w, h, a, s)).toBeCloseTo(refBmr(w, h, a, s), 9);
    }
  });

  it("BMR falls as age rises (10 kg of lean mass never buried by the age term)", () => {
    expect(bmr(80, 180, 40, "male")).toBeLessThan(bmr(80, 180, 30, "male"));
    expect(bmr(80, 180, 30, "male") - bmr(80, 180, 40, "male")).toBeCloseTo(50, 9); // 5 kcal per year
  });
});

describe("bmr: metric/imperial parity (same person, both systems, ±0.5%)", () => {
  it("80 kg / 180 cm / 30 y male measured in lb + ft/in stays within 0.5%", () => {
    const metric = bmr(80, 180, 30, "male");
    const imperial = bmr(kgFromLb(80 / KG_PER_LB), cmFromFtIn(5, 180 / CM_PER_INCH - 60), 30, "male");
    expect(relDiff(imperial, metric)).toBeLessThan(0.005);
    expect(imperial).toBeCloseTo(metric, 6);
  });

  it("65 kg / 165 cm / 28 y female measured in lb + ft/in stays within 0.5%", () => {
    const metric = bmr(65, 165, 28, "female");
    const imperial = bmr(kgFromLb(65 / KG_PER_LB), cmFromFtIn(5, 165 / CM_PER_INCH - 60), 28, "female");
    expect(relDiff(imperial, metric)).toBeLessThan(0.005);
  });

  it("clean imperial defaults (5 ft 9 in, 159 lb, 30 y male) equal their metric equivalent", () => {
    const viaImperial = bmr(kgFromLb(159), cmFromFtIn(5, 9), 30, "male");
    const viaMetric = bmr(159 * KG_PER_LB, 69 * CM_PER_INCH, 30, "male");
    expect(viaImperial).toBeCloseTo(viaMetric, 9);
  });
});

describe("bmr: boundaries and invalid inputs (documented limits)", () => {
  it("age 10 and 130 compute; 9 and 131 → NaN (validated on adults)", () => {
    expect(bmr(80, 180, 10, "male")).toBeCloseTo(refBmr(80, 180, 10, "male"), 9);
    expect(bmr(80, 180, 130, "male")).toBeCloseTo(refBmr(80, 180, 130, "male"), 9);
    expect(bmr(80, 180, 9, "male")).toBeNaN();
    expect(bmr(80, 180, 131, "male")).toBeNaN();
  });

  it("height 50–272 cm computes; outside → NaN (272 cm = tallest recorded person)", () => {
    expect(Number.isFinite(bmr(80, 50, 30, "male"))).toBe(true);
    expect(Number.isFinite(bmr(80, 272, 30, "male"))).toBe(true);
    expect(bmr(80, 49.9, 30, "male")).toBeNaN();
    expect(bmr(80, 273, 30, "male")).toBeNaN();
  });

  it("weight 2–700 kg computes; outside → NaN (700 kg ≈ heaviest recorded person)", () => {
    expect(Number.isFinite(bmr(2, 180, 30, "male"))).toBe(true);
    expect(Number.isFinite(bmr(700, 180, 30, "male"))).toBe(true);
    expect(bmr(1.9, 180, 30, "male")).toBeNaN();
    expect(bmr(700.5, 180, 30, "male")).toBeNaN();
  });

  it("zero and negative weight, height or age → NaN", () => {
    expect(bmr(0, 180, 30, "male")).toBeNaN();
    expect(bmr(80, 0, 30, "male")).toBeNaN();
    expect(bmr(80, 180, 0, "male")).toBeNaN();
    expect(bmr(-80, 180, 30, "male")).toBeNaN();
    expect(bmr(80, -180, 30, "male")).toBeNaN();
    expect(bmr(80, 180, -30, "male")).toBeNaN();
  });

  it("NaN, Infinity and absurd magnitudes → NaN, never a throw", () => {
    expect(bmr(NaN, 180, 30, "male")).toBeNaN();
    expect(bmr(80, Infinity, 30, "male")).toBeNaN();
    expect(bmr(80, 180, NaN, "male")).toBeNaN();
    expect(bmr(1e21, 1e21, 1e21, "male")).toBeNaN();
    expect(() => bmr(NaN, NaN, NaN, "female")).not.toThrow();
  });

  it("unknown sex at runtime → NaN", () => {
    expect(bmr(80, 180, 30, "bogus" as Sex)).toBeNaN();
  });

  it("conversion helpers convert without validating; NaN propagates", () => {
    expect(kgFromLb(180)).toBeCloseTo(81.6466266, 6);
    expect(cmFromFtIn(5, 9)).toBeCloseTo(175.26, 9); // 69 in × 2.54
    expect(cmFromFtIn(5, 9)).toBeCloseTo(69 * CM_PER_INCH, 9);
    expect(kgFromLb(NaN)).toBeNaN();
    expect(cmFromFtIn(NaN, 9)).toBeNaN();
  });
});

describe("tdee: BMR × standard activity factors", () => {
  it("BMR 1780 × moderatelyActive (1.55) = 2759 kcal", () => {
    expect(tdee(1780, "moderatelyActive")).toBeCloseTo(2759, 9);
  });

  it("multiplies every documented factor correctly", () => {
    expect(ACTIVITY_FACTORS).toEqual({
      sedentary: 1.2,
      lightlyActive: 1.375,
      moderatelyActive: 1.55,
      veryActive: 1.725,
      extraActive: 1.9,
    });
    for (const [key, factor] of Object.entries(ACTIVITY_FACTORS)) {
      expect(tdee(2000, key as ActivityKey)).toBeCloseTo(2000 * factor, 9);
    }
  });

  it("grows monotonically from sedentary to extra active", () => {
    const order: ActivityKey[] = ["sedentary", "lightlyActive", "moderatelyActive", "veryActive", "extraActive"];
    for (let i = 1; i < order.length; i++) {
      expect(tdee(1780, order[i])).toBeGreaterThan(tdee(1780, order[i - 1]));
    }
  });

  it("zero, negative and NaN BMR → NaN", () => {
    expect(tdee(0, "sedentary")).toBeNaN();
    expect(tdee(-1780, "moderatelyActive")).toBeNaN();
    expect(tdee(NaN, "extraActive")).toBeNaN();
    expect(tdee(Infinity, "sedentary")).toBeNaN();
  });

  it("unknown activity key at runtime → NaN", () => {
    expect(tdee(1780, "bogus" as ActivityKey)).toBeNaN();
  });
});

describe("calorieGoal: ±500 kcal goal adjustments", () => {
  it("adjustments are exactly lose −500, maintain 0, gain +500", () => {
    expect(GOAL_ADJUSTMENTS).toEqual({ lose: -500, maintain: 0, gain: 500 });
  });

  it("maintain leaves TDEE 2759 unchanged", () => {
    expect(calorieGoal(2759, "maintain")).toBeCloseTo(2759, 9);
  });

  it("lose subtracts 500 (2759 → 2259) and gain adds 500 (2759 → 3259)", () => {
    expect(calorieGoal(2759, "lose")).toBeCloseTo(2259, 9);
    expect(calorieGoal(2759, "gain")).toBeCloseTo(3259, 9);
  });

  it("zero, negative and NaN TDEE → NaN", () => {
    expect(calorieGoal(0, "lose")).toBeNaN();
    expect(calorieGoal(-2759, "gain")).toBeNaN();
    expect(calorieGoal(NaN, "maintain")).toBeNaN();
  });

  it("unknown goal at runtime → NaN", () => {
    expect(calorieGoal(2759, "cut" as GoalKey)).toBeNaN();
  });
});

describe("navyBodyFat: hand-computed US Navy (Hodgdon & Beckett, 1984) vectors", () => {
  it("male 180 cm / 85 waist / 38 neck ≈ 16.11% and matches the independent implementation", () => {
    const out = navyBodyFat("male", 180, 85, 38, 0);
    expect(out).toBeCloseTo(16.107, 2); // hand-computed: log10(47) = 1.6720979, log10(180) = 2.2552725
    expect(out).toBeCloseTo(refNavy("male", 180, 85, 38, 0), 9);
  });

  it("female 165 cm / 75 waist / 35 neck / 95 hip ≈ 25.89% and matches the independent implementation", () => {
    const out = navyBodyFat("female", 165, 75, 35, 95);
    expect(out).toBeCloseTo(25.892, 2); // hand-computed: log10(135) = 2.1303338, log10(165) = 2.2174839
    expect(out).toBeCloseTo(refNavy("female", 165, 75, 35, 95), 9);
  });

  it("uses the female coefficients: the male formula with hips would give an absurd 60.98%", () => {
    const absurd = 495 / (1.0324 - 0.19077 * Math.log10(75 + 95 - 35) + 0.15456 * Math.log10(165)) - 450;
    expect(absurd).toBeGreaterThan(60);
    expect(navyBodyFat("female", 165, 75, 35, 95)).toBeLessThan(30);
  });

  it("male ignores the hip argument entirely", () => {
    expect(navyBodyFat("male", 180, 85, 38, 0)).toBe(navyBodyFat("male", 180, 85, 38, 250));
  });

  it("metric and imperial measurements of the same man agree within 0.5%", () => {
    const metric = navyBodyFat("male", 180, 85, 38, 0);
    const imperial = navyBodyFat(
      "male",
      cmFromFtIn(5, 180 / CM_PER_INCH - 60),
      (85 / CM_PER_INCH) * CM_PER_INCH,
      (38 / CM_PER_INCH) * CM_PER_INCH,
      0,
    );
    expect(relDiff(imperial, metric)).toBeLessThan(0.005);
  });

  it("same woman, imperial inputs (converted from 165/75/35/95 metric), agrees within 0.5%", () => {
    const metric = navyBodyFat("female", 165, 75, 35, 95);
    const imperial = navyBodyFat(
      "female",
      165 / CM_PER_INCH * CM_PER_INCH,
      75 / CM_PER_INCH * CM_PER_INCH,
      35 / CM_PER_INCH * CM_PER_INCH,
      95 / CM_PER_INCH * CM_PER_INCH,
    );
    expect(relDiff(imperial, metric)).toBeLessThan(0.005);
  });
});

describe("navyBodyFat: girth validation and documented extremes", () => {
  it("male waist equal to or below neck → NaN (formula's log argument must be positive)", () => {
    expect(navyBodyFat("male", 180, 38, 38, 0)).toBeNaN();
    expect(navyBodyFat("male", 180, 37, 38, 0)).toBeNaN();
  });

  it("female waist + hip below or equal to neck → NaN", () => {
    expect(navyBodyFat("female", 165, 30, 70, 40)).toBeNaN();
    expect(navyBodyFat("female", 165, 30, 70, 39.9)).toBeNaN();
  });

  it("female hip must be positive; zero, negative and NaN hip → NaN", () => {
    expect(navyBodyFat("female", 165, 75, 35, 0)).toBeNaN();
    expect(navyBodyFat("female", 165, 75, 35, -95)).toBeNaN();
    expect(navyBodyFat("female", 165, 75, 35, NaN)).toBeNaN();
  });

  it("zero or negative waist, neck or height → NaN", () => {
    expect(navyBodyFat("male", 0, 85, 38, 0)).toBeNaN();
    expect(navyBodyFat("male", 180, 0, 38, 0)).toBeNaN();
    expect(navyBodyFat("male", 180, 85, -38, 0)).toBeNaN();
    expect(navyBodyFat("female", -165, 75, 35, 95)).toBeNaN();
  });

  it("NaN and Infinity inputs → NaN, never a throw", () => {
    expect(navyBodyFat("male", NaN, 85, 38, 0)).toBeNaN();
    expect(navyBodyFat("male", 180, Infinity, 38, 0)).toBeNaN();
    expect(navyBodyFat("male", 180, 85, NaN, 0)).toBeNaN();
    expect(() => navyBodyFat("male", 1e21, 1e21, 1e21, 0)).not.toThrow();
    expect(navyBodyFat("male", 1e21, 1e21, 1e21, 0)).toBeNaN();
  });

  it("physically absurd but positive girth difference returns the raw unclamped formula (negative %)", () => {
    // waist - neck = 0.01 cm → log10 = -2 → denominator 1.7625 → raw output ≈ -169.15
    const out = navyBodyFat("male", 180, 38.01, 38, 0);
    expect(Number.isFinite(out)).toBe(true);
    expect(out).toBeLessThan(0);
    expect(out).toBeCloseTo(refNavy("male", 180, 38.01, 38, 0), 9);
  });

  it("extreme but valid measurements stay finite", () => {
    expect(Number.isFinite(navyBodyFat("male", 272, 500, 50, 0))).toBe(true);
    expect(Number.isFinite(navyBodyFat("female", 272, 400, 40, 400))).toBe(true);
  });
});

describe("idealWeightRange: Devine (1975) + WHO BMI band", () => {
  it("170 cm: Devine male 50 + 2.3 × 6.92913 = 65.937 kg, female 61.437 kg", () => {
    const r = idealWeightRange(170);
    expect(r.devineMale).toBeCloseTo(65.937, 2);
    expect(r.devineFemale).toBeCloseTo(61.437, 2);
    expect(r.devineMale).toBeCloseTo(refDevine(170, "male"), 9);
    expect(r.devineFemale).toBeCloseTo(refDevine(170, "female"), 9);
  });

  it("170 cm: healthy BMI band 18.5 × 1.7² = 53.465 kg to 24.9 × 1.7² = 71.961 kg", () => {
    const r = idealWeightRange(170);
    expect(r.bmiMin).toBeCloseTo(53.465, 6);
    expect(r.bmiMax).toBeCloseTo(71.961, 6);
  });

  it("180 cm male: 50 + 2.3 × 10.86614 = 74.992 kg", () => {
    expect(idealWeightRange(180).devineMale).toBeCloseTo(74.992, 2);
  });

  it("120 cm boundary computes (male ≈ 20.66 kg); 119.9 cm → NaN (adults only)", () => {
    const r = idealWeightRange(120);
    expect(r.devineMale).toBeCloseTo(50 + 2.3 * (120 / CM_PER_INCH - 60), 9);
    expect(r.devineMale).toBeCloseTo(20.661, 2);
    expect(idealWeightRange(119.9).devineMale).toBeNaN();
  });

  it("272 cm computes; 300 cm → NaN", () => {
    expect(Number.isFinite(idealWeightRange(272).devineMale)).toBe(true);
    expect(idealWeightRange(300).devineMale).toBeNaN();
  });

  it("zero, negative and NaN heights → all-NaN result, never a throw", () => {
    for (const h of [0, -170, NaN, Infinity]) {
      const r = idealWeightRange(h);
      expect(r.devineMale).toBeNaN();
      expect(r.devineFemale).toBeNaN();
      expect(r.bmiMin).toBeNaN();
      expect(r.bmiMax).toBeNaN();
    }
    expect(() => idealWeightRange(NaN)).not.toThrow();
  });
});

describe("waterIntake: 35 ml/kg baseline + 350 ml per 30 min of exercise", () => {
  it("70 kg / 30 min → 2450 + 350 = 2800 ml (hand-computed)", () => {
    const r = waterIntake(70, 30);
    expect(r.baselineMl).toBeCloseTo(2450, 9);
    expect(r.exerciseMl).toBeCloseTo(350, 9);
    expect(r.totalMl).toBeCloseTo(2800, 9);
  });

  it("60 kg / 45 min → 2100 + 525 = 2625 ml", () => {
    const r = waterIntake(60, 45);
    expect(r.baselineMl).toBeCloseTo(2100, 9);
    expect(r.exerciseMl).toBeCloseTo(525, 9);
    expect(r.totalMl).toBeCloseTo(2625, 9);
  });

  it("prorates linearly at 350/30 ml per minute (15 min → +175 ml)", () => {
    expect(waterIntake(70, 15).exerciseMl).toBeCloseTo(175, 9);
    expect(waterIntake(70, 1).exerciseMl).toBeCloseTo(350 / 30, 9);
  });

  it("zero exercise minutes → total equals the baseline", () => {
    const r = waterIntake(70, 0);
    expect(r.exerciseMl).toBeCloseTo(0, 9);
    expect(r.totalMl).toBeCloseTo(r.baselineMl, 9);
  });

  it("1440 minutes (a full day) is accepted: bonus 16,800 ml", () => {
    const r = waterIntake(70, 1440);
    expect(r.exerciseMl).toBeCloseTo(16800, 9);
    expect(r.totalMl).toBeCloseTo(2450 + 16800, 9);
  });

  it("imperial 154 lb matches its 69.853 kg metric equivalent", () => {
    const viaLb = waterIntake(kgFromLb(154), 30);
    const viaKg = waterIntake(154 * KG_PER_LB, 30);
    expect(viaLb.totalMl).toBeCloseTo(viaKg.totalMl, 9);
  });

  it("zero, negative and over-limit weight → NaN", () => {
    expect(waterIntake(0, 30).totalMl).toBeNaN();
    expect(waterIntake(-70, 30).totalMl).toBeNaN();
    expect(waterIntake(700.5, 30).totalMl).toBeNaN();
    expect(Number.isFinite(waterIntake(700, 30).totalMl)).toBe(true);
  });

  it("negative minutes, over 1440 minutes, NaN and Infinity → NaN, never a throw", () => {
    expect(waterIntake(70, -1).totalMl).toBeNaN();
    expect(waterIntake(70, 1441).totalMl).toBeNaN();
    expect(waterIntake(70, NaN).totalMl).toBeNaN();
    expect(waterIntake(70, Infinity).totalMl).toBeNaN();
    expect(() => waterIntake(NaN, NaN)).not.toThrow();
  });
});

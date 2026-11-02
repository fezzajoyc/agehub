/**
 * Health calculators — pure logic only; UI orchestration lives in
 * calc-engine-health. Every function returns NaN (or an object filled with
 * NaN) for invalid input and never throws.
 *
 * Formulas and sources:
 *  - BMR: Mifflin–St Jeor equation (Am J Clin Nutr, 1990).
 *    male: 10·W + 6.25·H − 5·A + 5; female: 10·W + 6.25·H − 5·A − 161
 *    (W kg, H cm, A years).
 *  - TDEE: BMR × activity factor, standard 5-level scale 1.2 → 1.9.
 *  - Goals: lose ≈ −500 kcal/day, gain ≈ +500 kcal/day (≈ 0.5 kg/week
 *    heuristic; 1 kg of body fat ≈ 7700 kcal).
 *  - Body fat: US Navy circumference method (Hodgdon & Beckett, 1984),
 *    metric form. Men: 495/(1.0324 − 0.19077·log10(waist−neck)
 *    + 0.15456·log10(height)) − 450. Women: same shape with hips added to
 *    the girth term and the female coefficients 1.29579 / 0.35004 / 0.22100
 *    (the male coefficients with hips give physiologically absurd values).
 *  - Ideal weight: Devine formula (1975): 50 kg + 2.3 kg per inch over 5 ft
 *    (men) / 45.5 kg + 2.3 kg per inch over 5 ft (women); plus the WHO
 *    healthy-BMI weight band 18.5–24.9 × height².
 *  - Water: 35 ml per kg of body weight, plus ≈350 ml per 30 min of
 *    exercise (common clinical maintenance-fluid heuristic).
 *
 * Documented limits (outside them the equations are extrapolations and the
 * functions return NaN rather than a meaningless number):
 *  - height 50–272 cm (tallest recorded person: 272 cm),
 *  - weight 2–700 kg (heaviest recorded person: ≈635 kg),
 *  - age 10–130 years (Mifflin–St Jeor was validated on adults),
 *  - ideal-weight heights 120–272 cm (below that the Devine extrapolation
 *    stops being meaningful),
 *  - exercise minutes 0–1440 (a full day).
 *
 * The Navy formula is intentionally NOT clamped: for extreme but positive
 * inputs it can produce very low or negative estimates, which the FAQ
 * presents as a sign the measurements are off, not an error.
 */

export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

export const HEALTH_LIMITS = {
  minHeightCm: 50,
  maxHeightCm: 272,
  minWeightKg: 2,
  maxWeightKg: 700,
  minAgeYears: 10,
  maxAgeYears: 130,
  minIdealWeightHeightCm: 120,
  minExerciseMin: 0,
  maxExerciseMin: 1440,
} as const;

export type Sex = "male" | "female";

/** Metric conversion helpers (no range checks — domain functions validate). */
export function cmFromFtIn(ft: number, inch: number): number {
  if (!Number.isFinite(ft) || !Number.isFinite(inch)) return NaN;
  return (ft * 12 + inch) * CM_PER_INCH;
}

export function kgFromLb(lb: number): number {
  return Number.isFinite(lb) ? lb * KG_PER_LB : NaN;
}

function ok(n: number, min: number, max: number): boolean {
  return Number.isFinite(n) && n >= min && n <= max;
}

/* ---------------- BMR (Mifflin–St Jeor, 1990) ---------------- */

export function bmr(weightKg: number, heightCm: number, ageYears: number, sex: Sex): number {
  if (!ok(weightKg, HEALTH_LIMITS.minWeightKg, HEALTH_LIMITS.maxWeightKg)) return NaN;
  if (!ok(heightCm, HEALTH_LIMITS.minHeightCm, HEALTH_LIMITS.maxHeightCm)) return NaN;
  if (!ok(ageYears, HEALTH_LIMITS.minAgeYears, HEALTH_LIMITS.maxAgeYears)) return NaN;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return NaN; // unknown sex at runtime
}

/* ---------------- TDEE + calorie goals ---------------- */

export type ActivityKey =
  | "sedentary"
  | "lightlyActive"
  | "moderatelyActive"
  | "veryActive"
  | "extraActive";

export const ACTIVITY_FACTORS: Record<ActivityKey, number> = {
  sedentary: 1.2,
  lightlyActive: 1.375,
  moderatelyActive: 1.55,
  veryActive: 1.725,
  extraActive: 1.9,
};

export function tdee(bmrValue: number, activity: ActivityKey): number {
  const factor = ACTIVITY_FACTORS[activity];
  if (factor === undefined || !Number.isFinite(bmrValue) || bmrValue <= 0) return NaN;
  return bmrValue * factor;
}

export type GoalKey = "lose" | "maintain" | "gain";

export const GOAL_ADJUSTMENTS: Record<GoalKey, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

export function calorieGoal(tdeeValue: number, goal: GoalKey): number {
  const adj = GOAL_ADJUSTMENTS[goal];
  if (adj === undefined || !Number.isFinite(tdeeValue) || tdeeValue <= 0) return NaN;
  return tdeeValue + adj;
}

/* ---------------- Body fat (US Navy / Hodgdon & Beckett, 1984) ---------------- */

/**
 * All measurements in centimeters. `hipCm` is required for female and
 * ignored for male (pass 0).
 */
export function navyBodyFat(
  sex: Sex,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm: number,
): number {
  if (!ok(heightCm, HEALTH_LIMITS.minHeightCm, HEALTH_LIMITS.maxHeightCm)) return NaN;
  if (!Number.isFinite(waistCm) || waistCm <= 0) return NaN;
  if (!Number.isFinite(neckCm) || neckCm <= 0) return NaN;
  if (sex === "female" && !(Number.isFinite(hipCm) && hipCm > 0)) return NaN;
  const girth = sex === "female" ? waistCm + hipCm - neckCm : waistCm - neckCm;
  if (!Number.isFinite(girth) || girth <= 0) return NaN; // girth term must be positive
  if (sex === "male") {
    return 495 / (1.0324 - 0.19077 * Math.log10(girth) + 0.15456 * Math.log10(heightCm)) - 450;
  }
  if (sex === "female") {
    return 495 / (1.29579 - 0.35004 * Math.log10(girth) + 0.221 * Math.log10(heightCm)) - 450;
  }
  return NaN; // unknown sex at runtime
}

/* ---------------- Ideal weight (Devine, 1975 + WHO BMI band) ---------------- */

export type IdealWeight = {
  devineMale: number;
  devineFemale: number;
  /** weight at BMI 18.5 */
  bmiMin: number;
  /** weight at BMI 24.9 */
  bmiMax: number;
};

const IDEAL_NAN: IdealWeight = {
  devineMale: NaN,
  devineFemale: NaN,
  bmiMin: NaN,
  bmiMax: NaN,
};

export function idealWeightRange(heightCm: number): IdealWeight {
  if (!ok(heightCm, HEALTH_LIMITS.minIdealWeightHeightCm, HEALTH_LIMITS.maxHeightCm)) {
    return IDEAL_NAN;
  }
  const inchesOver5ft = heightCm / CM_PER_INCH - 60;
  const hM2 = (heightCm / 100) ** 2;
  return {
    devineMale: 50 + 2.3 * inchesOver5ft,
    devineFemale: 45.5 + 2.3 * inchesOver5ft,
    bmiMin: 18.5 * hM2,
    bmiMax: 24.9 * hM2,
  };
}

/* ---------------- Water intake (35 ml/kg + 350 ml per 30 min) ---------------- */

export type WaterIntake = { baselineMl: number; exerciseMl: number; totalMl: number };

const WATER_NAN: WaterIntake = { baselineMl: NaN, exerciseMl: NaN, totalMl: NaN };

export function waterIntake(weightKg: number, exerciseMinutes: number): WaterIntake {
  if (!ok(weightKg, HEALTH_LIMITS.minWeightKg, HEALTH_LIMITS.maxWeightKg)) return WATER_NAN;
  if (
    !Number.isFinite(exerciseMinutes) ||
    exerciseMinutes < HEALTH_LIMITS.minExerciseMin ||
    exerciseMinutes > HEALTH_LIMITS.maxExerciseMin
  ) {
    return WATER_NAN;
  }
  const baselineMl = 35 * weightKg;
  const exerciseMl = (exerciseMinutes / 30) * 350;
  return { baselineMl, exerciseMl, totalMl: baselineMl + exerciseMl };
}

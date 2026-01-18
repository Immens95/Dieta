export function calculateBMR(p) {
  return p.sex === "male"
    ? 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5
    : 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161;
}

export function activityMultiplier(level) {
  return {
    sedentary: 1.2,
    light: 1.375,
    medium: 1.55
  }[level];
}

export function calculateTargetCalories(p) {
  const bmr = calculateBMR(p);
  const tdee = bmr * activityMultiplier(p.activity_level);
  const totalLossKg = p.weight_kg - p.target_weight_kg;
  const totalKcalDeficit = totalLossKg * 7700;
  const dailyDeficit = totalKcalDeficit / (p.goal_weeks * 7);
  return Math.round(tdee - dailyDeficit);
}

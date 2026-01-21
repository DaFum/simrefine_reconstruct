/**
 * Environment Processor
 * Handles carbon emissions and environmental penalty calculations
 */

import { clamp, perHourToPerDay } from "../utils/calculations.js";

/**
 * Calculate carbon emissions and environmental penalties
 */
export function calculateEnvironmentMetrics(context) {
  const {
    production,
    incidents,
    environmentLevel,
    scenario,
  } = context;

  const carbonBase =
    production.waste * 3.5 +
    production.diesel * 0.6 +
    production.gasoline * 0.5 +
    incidents * 2.8;

  const envMitigation = 1 - clamp(
    0.1 + environmentLevel * 0.55 + environmentLevel * environmentLevel * 0.32,
    0,
    0.88
  );

  const carbonPerHour = carbonBase * envMitigation;
  const carbonPerDay = perHourToPerDay(carbonPerHour);
  const productionPerDay = perHourToPerDay(production.gasoline + production.diesel + production.jet);

  const environmentTarget = clamp(
    0.5 - environmentLevel * 0.28 + (scenario.environmentPressure || 0) * 0.05,
    0.22,
    0.55
  );

  const carbonIntensity = productionPerDay > 0 ? carbonPerDay / productionPerDay : carbonPerDay;
  const envExcess = Math.max(0, carbonIntensity - environmentTarget);

  let environmentPenalty = 0;
  if (envExcess > 0) {
    environmentPenalty = envExcess * productionPerDay * 9;
    if (envExcess > 0.05) {
      environmentPenalty *= 1.15;
    }
    const penaltySuppression = clamp(1 - environmentLevel * 1.05, 0, 1);
    environmentPenalty *= penaltySuppression;
  }

  return {
    carbonPerHour,
    carbonPerDay,
    carbonIntensity,
    environmentTarget,
    envExcess,
    environmentPenalty,
  };
}

/**
 * Check if environment warning should be logged
 */
export function shouldLogEnvironmentWarning(environmentPenalty, _envExcess, cooldown) {
  return environmentPenalty > 4 && cooldown <= 0;
}

/**
 * Get environment warning severity
 */
export function getEnvironmentWarningSeverity(envExcess) {
  return envExcess > 0.08 ? "warning" : "info";
}

/**
 * Format environment warning message
 */
export function formatEnvironmentWarning(environmentPenalty, carbonIntensity) {
  return `Environmental compliance drag: $${environmentPenalty.toFixed(1)}k this hour (intensity ${(carbonIntensity * 100).toFixed(1)}%).`;
}

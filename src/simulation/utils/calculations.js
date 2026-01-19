/**
 * Simulation Calculation Utilities
 * Pure functions for common calculations
 */

import { HOURS_PER_DAY } from "../constants.js";

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const randomRange = (min, max) => min + Math.random() * (max - min);
export const perDayToPerHour = (value) => value / HOURS_PER_DAY;
export const perHourToPerDay = (value) => value * HOURS_PER_DAY;
export const round = (value) => Math.round(value * 100) / 100;

/**
 * Calculate crude distillation shares based on product focus and scenario
 */
export function calculateDistillationShares(focus, scenario) {
  const centered = focus - 0.5;

  let gasShare = clamp(0.08 + centered * 0.05, 0.035, 0.16);
  let naphthaShare = clamp(0.36 + centered * 0.25, 0.26, 0.55);
  let keroseneShare = 0.11 + scenario.jetBias * 0.05;
  let dieselShare = clamp(0.27 - centered * 0.14 + scenario.dieselBias * 0.06, 0.18, 0.36);
  let heavyShare = clamp(0.17 - centered * 0.06, 0.11, 0.26);
  let residShare = Math.max(
    0.06,
    1 - (gasShare + naphthaShare + keroseneShare + dieselShare + heavyShare)
  );

  const qualityShift = scenario.qualityShift;
  if (qualityShift !== 0) {
    const heavyAdjust = 1 + qualityShift;
    naphthaShare *= 1 - 0.35 * qualityShift;
    dieselShare *= 1 - 0.18 * qualityShift;
    heavyShare *= heavyAdjust;
    residShare *= heavyAdjust * 1.2;
  }

  const totalShares = gasShare + naphthaShare + keroseneShare + dieselShare + heavyShare + residShare;

  return {
    gas: gasShare / totalShares,
    naphtha: naphthaShare / totalShares,
    kerosene: keroseneShare / totalShares,
    diesel: dieselShare / totalShares,
    heavy: heavyShare / totalShares,
    resid: residShare / totalShares,
  };
}

/**
 * Calculate effective unit capacity considering state
 */
export function calculateEffectiveCapacity(unitState) {
  if (!unitState.unit || !unitState.online) {
    return 0;
  }
  return perDayToPerHour(unitState.unit.capacity) * clamp(unitState.throttle, 0, 1.2);
}

/**
 * Update unit metrics (throughput, utilization, mode)
 */
export function updateUnitMetrics(unit, throughputPerHour, updateMode) {
  if (!unit) return;

  unit.throughput = perHourToPerDay(throughputPerHour);
  unit.utilization = unit.capacity > 0 ? unit.throughput / unit.capacity : 0;

  if (updateMode) {
    updateMode(unit);
  }
}

/**
 * Calculate environment penalty
 */
export function calculateEnvironmentPenalty(params) {
  const {
    result,
    incidentsCount,
    crudeThroughput,
    environmentLevel,
    scenario,
  } = params;

  const carbonBase =
    result.waste * 3.5 +
    result.diesel * 0.6 +
    result.gasoline * 0.5 +
    incidentsCount * 2.8;

  const envMitigation = 1 - clamp(
    0.1 + environmentLevel * 0.55 + environmentLevel * environmentLevel * 0.32,
    0,
    0.88
  );

  const carbonPerHour = carbonBase * envMitigation;
  const carbonPerDay = perHourToPerDay(carbonPerHour);
  const productionPerDay = perHourToPerDay(result.gasoline + result.diesel + result.jet);

  const environmentTarget = clamp(
    0.5 - environmentLevel * 0.28 + (scenario.environmentPressure || 0) * 0.05,
    0.22,
    0.55
  );

  const carbonIntensity = productionPerDay > 0 ? carbonPerDay / productionPerDay : carbonPerDay;
  const envExcess = Math.max(0, carbonIntensity - environmentTarget);

  let penalty = 0;
  if (envExcess > 0) {
    penalty = envExcess * productionPerDay * 9;
    if (envExcess > 0.05) {
      penalty *= 1.15;
    }
    const penaltySuppression = clamp(1 - environmentLevel * 1.05, 0, 1);
    penalty *= penaltySuppression;
  }

  return {
    carbonPerHour,
    carbonIntensity,
    envExcess,
    penalty,
  };
}

/**
 * Calculate product prices based on scenario and demand
 */
export function calculateProductPrices(basePrices, scenario) {
  const priceModifier = scenario.priceModifier;

  return {
    gasoline: basePrices.gasoline * priceModifier * (1 + scenario.gasolineBias * 0.3),
    diesel: basePrices.diesel * priceModifier * (1 + scenario.dieselBias * 0.25),
    jet: basePrices.jet * priceModifier * (1 + scenario.jetBias * 0.35),
    lpg: basePrices.lpg * priceModifier * (1 + scenario.gasolineBias * 0.1),
  };
}

/**
 * Calculate product revenue
 */
export function calculateProductRevenue(production, prices) {
  return (
    production.gasoline * prices.gasoline +
    production.diesel * prices.diesel +
    production.jet * prices.jet +
    production.lpg * prices.lpg
  );
}

/**
 * Apply strain penalties to production
 */
export function applyStrainPenalties(result, strainPenalty, crudeThroughput) {
  if (strainPenalty <= 0.0001) return result;

  const penalty = clamp(strainPenalty, 0, 0.4);
  const diverted = crudeThroughput * penalty * 0.26;

  return {
    ...result,
    gasoline: result.gasoline * (1 - penalty * 0.6),
    diesel: result.diesel * (1 - penalty * 0.55),
    jet: result.jet * (1 - penalty * 0.5),
    lpg: result.lpg * (1 - penalty * 0.45),
    waste: result.waste + diverted,
    flareAddition: diverted * 0.35,
  };
}

/**
 * Cap liquid products to physical maximum
 */
export function capLiquidProducts(result, crudeThroughput) {
  const totalLiquidProducts = result.gasoline + result.diesel + result.jet;
  const maxLiquidProducts = crudeThroughput * 1.02;

  if (totalLiquidProducts > maxLiquidProducts && totalLiquidProducts > 0) {
    const scale = maxLiquidProducts / totalLiquidProducts;
    result.gasoline *= scale;
    result.diesel *= scale;
    result.jet *= scale;
  }

  const maxLpg = crudeThroughput * 0.12;
  if (result.lpg > maxLpg) {
    result.lpg = maxLpg;
  }

  return result;
}

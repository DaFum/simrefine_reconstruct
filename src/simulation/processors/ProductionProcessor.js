/**
 * Production Processor
 * Handles crude distillation shares and unit processing pipeline
 */

import { clamp, perDayToPerHour, perHourToPerDay } from "../utils/calculations.js";

/**
 * Calculate distillation product shares based on scenario and focus
 */
export function calculateProductShares(scenario, focus) {
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
 * Process reformer unit
 */
export function processReformer(context) {
  const { naphthaPool, reformerState, pipelineMultiplier, updateUnitMode } = context;
  const reformer = reformerState.unit;
  const reformerCapacity = reformer && reformerState.online
    ? perDayToPerHour(reformer.capacity) * clamp(reformerState.throttle, 0, 1.2)
    : 0;

  const reformFeed = Math.min(naphthaPool, reformerCapacity * pipelineMultiplier);
  const remainingNaphtha = naphthaPool - reformFeed;

  if (reformer) {
    reformer.throughput = perHourToPerDay(reformFeed);
    reformer.utilization = reformer.capacity > 0 ? reformer.throughput / reformer.capacity : 0;
    updateUnitMode(reformer);
  }

  return {
    naphthaPool: remainingNaphtha,
    reformFeed,
    gasoline: reformFeed * 0.92,
    hydrogen: reformFeed * 0.05,
    waste: reformFeed * 0.03,
  };
}

/**
 * Process FCC unit
 */
export function processFCC(context) {
  const { heavyPool, residPool, fccState, pipelineMultiplier, updateUnitMode } = context;
  const fcc = fccState.unit;
  const fccCapacity = fcc && fccState.online
    ? perDayToPerHour(fcc.capacity) * clamp(fccState.throttle, 0, 1.2)
    : 0;

  const heavyAvailableForFcc = heavyPool + residPool * 0.6;
  const fccFeed = Math.min(heavyAvailableForFcc, fccCapacity * pipelineMultiplier);
  const heavyUsedByFcc = Math.min(heavyPool, fccFeed * 0.7);
  const residUsedByFcc = Math.min(residPool, fccFeed - heavyUsedByFcc);

  if (fcc) {
    fcc.throughput = perHourToPerDay(fccFeed);
    fcc.utilization = fcc.capacity > 0 ? fcc.throughput / fcc.capacity : 0;
    updateUnitMode(fcc);
  }

  const fccLoss = fccFeed * 0.08;
  return {
    heavyPool: heavyPool - heavyUsedByFcc,
    residPool: residPool - residUsedByFcc,
    fccFeed,
    gasoline: fccFeed * 0.54,
    diesel: fccFeed * 0.12,
    lpg: fccFeed * 0.18,
    waste: fccLoss,
    flare: fccLoss * 0.5,
  };
}

/**
 * Process Hydrocracker unit
 */
export function processHydrocracker(context) {
  const { heavyPool, residPool, dieselPool, hydroState, pipelineMultiplier, updateUnitMode } = context;
  const hydrocracker = hydroState.unit;
  const hydroCapacity = hydrocracker && hydroState.online
    ? perDayToPerHour(hydrocracker.capacity) * clamp(hydroState.throttle, 0, 1.2)
    : 0;

  const hydroFeedAvailable = heavyPool + residPool + dieselPool * 0.25;
  const hydroFeed = Math.min(hydroFeedAvailable, hydroCapacity * pipelineMultiplier);

  const heavyUsedHydro = Math.min(heavyPool, hydroFeed * 0.55);
  const residUsedHydro = Math.min(residPool, hydroFeed * 0.35);
  const dieselUsedHydro = Math.min(dieselPool * 0.5, Math.max(0, hydroFeed - heavyUsedHydro - residUsedHydro));

  if (hydrocracker) {
    hydrocracker.throughput = perHourToPerDay(hydroFeed);
    hydrocracker.utilization = hydrocracker.capacity > 0 ? hydrocracker.throughput / hydrocracker.capacity : 0;
    updateUnitMode(hydrocracker);
  }

  return {
    heavyPool: heavyPool - heavyUsedHydro,
    residPool: residPool - residUsedHydro,
    dieselPool: dieselPool - dieselUsedHydro,
    hydroFeed,
    gasoline: hydroFeed * 0.42,
    diesel: hydroFeed * 0.3,
    jet: hydroFeed * 0.2,
    hydrogen: hydroFeed * 0.04,
    waste: hydroFeed * 0.08,
  };
}

/**
 * Process Alkylation unit
 */
export function processAlkylation(context) {
  const { lpgPool, alkylationState, pipelineMultiplier, updateUnitMode } = context;
  const alkylation = alkylationState.unit;
  const alkCapacity = alkylation && alkylationState.online
    ? perDayToPerHour(alkylation.capacity) * clamp(alkylationState.throttle, 0, 1.2)
    : 0;

  const alkFeed = Math.min(lpgPool, alkCapacity * pipelineMultiplier);

  if (alkylation) {
    alkylation.throughput = perHourToPerDay(alkFeed);
    alkylation.utilization = alkylation.capacity > 0 ? alkylation.throughput / alkylation.capacity : 0;
    updateUnitMode(alkylation);
  }

  return {
    lpgPool: lpgPool - alkFeed,
    alkFeed,
    gasoline: alkFeed * 0.88,
    waste: alkFeed * 0.06,
  };
}

/**
 * Process Sulfur unit
 */
export function processSulfur(context) {
  const { residPool, heavyPool, sulfurState, environmentParam, updateUnitMode } = context;
  const sulfur = sulfurState.unit;
  const sulfurCapacity = sulfur && sulfurState.online
    ? perDayToPerHour(sulfur.capacity) * clamp(sulfurState.throttle, 0, 1.2)
    : 0;

  const totalAvailable = residPool + heavyPool;
  const residRatio = totalAvailable > 0 ? residPool / totalAvailable : 0.5;

  const sulfurFeed = Math.min(totalAvailable, sulfurCapacity);
  const residConsumed = Math.min(residPool, sulfurFeed * residRatio);
  const heavyConsumed = Math.min(heavyPool, sulfurFeed * (1 - residRatio));

  const sulfurRemoved = sulfurFeed * (0.55 + environmentParam * 0.4);

  if (sulfur) {
    sulfur.throughput = perHourToPerDay(sulfurFeed);
    sulfur.utilization = sulfur.capacity > 0 ? sulfur.throughput / sulfur.capacity : 0;
    updateUnitMode(sulfur);
  }

  return {
    residPool: residPool - residConsumed,
    heavyPool: heavyPool - heavyConsumed,
    sulfur: sulfurRemoved,
    waste: Math.max(0, sulfurFeed - sulfurRemoved),
  };
}

/**
 * Apply strain penalty to production result
 */
export function applyStrainPenalty(result, strainPenalty, crudeThroughput) {
  if (strainPenalty <= 0.0001) return { ...result, flare: 0 };

  const penalty = clamp(strainPenalty, 0, 0.4);
  const diverted = crudeThroughput * penalty * 0.26;

  return {
    gasoline: result.gasoline * (1 - penalty * 0.6),
    diesel: result.diesel * (1 - penalty * 0.55),
    jet: result.jet * (1 - penalty * 0.5),
    lpg: result.lpg * (1 - penalty * 0.45),
    hydrogen: result.hydrogen,
    waste: result.waste + diverted,
    sulfur: result.sulfur,
    flare: diverted * 0.35,
  };
}

/**
 * Normalize liquid products to not exceed crude throughput
 */
export function normalizeLiquidProducts(result, crudeThroughput) {
  const totalLiquidProducts = result.gasoline + result.diesel + result.jet;
  const maxLiquidProducts = crudeThroughput * 1.02;

  let gasoline = result.gasoline;
  let diesel = result.diesel;
  let jet = result.jet;
  let lpg = result.lpg;

  if (totalLiquidProducts > maxLiquidProducts && totalLiquidProducts > 0) {
    const scale = maxLiquidProducts / totalLiquidProducts;
    gasoline *= scale;
    diesel *= scale;
    jet *= scale;
  }

  const maxLpg = crudeThroughput * 0.12;
  if (lpg > maxLpg) {
    lpg = maxLpg;
  }

  return { ...result, gasoline, diesel, jet, lpg };
}

import { clamp } from "../simulation/utils/calculations.js";

/**
 * Market Calculations
 * Pure calculation functions for market system
 */
export const HOURS_PER_DAY = 24;
export const perHourToPerDay = (value) => value * HOURS_PER_DAY;

export const WEIGHT_PROFILES = {
  gasoline: { shipping: 1.05, downtime: 0.9, maintenance: 0.82, env: 0.65 },
  diesel: { shipping: 0.92, downtime: 1.05, maintenance: 1, env: 0.88 },
  jet: { shipping: 1.2, downtime: 1.12, maintenance: 0.9, env: 1.12 },
};

export const BASE_DEMAND = { gasoline: 55, diesel: 30, jet: 14 };

const MIN_COST_FACTOR = 0.7;
const PENALTY_BASE_FACTOR = 0.24;
const PENALTY_SHARE_FACTOR = 0.32;
const DRAG_BASE_FACTOR = 0.1;
const DRAG_WEIGHT_FACTOR = 0.08;
const SHIPPING_PRESSURE_MULTIPLIER = 8;
const DOWNTIME_PRESSURE_MULTIPLIER = 10;
const DIRECTIVE_DRAG_MULTIPLIER = 4;
const ENV_PREMIUM_MULTIPLIER = 7;
const SAFETY_PREMIUM_MULTIPLIER = 4;
const MAINTENANCE_RELIEF_MULTIPLIER = 12;

/**
 * Calculate production cost target for a product
 */
export function calculateCostTarget(params) {
  const {
    feedCostPerBbl,
    operationsPerBbl,
    carryingPerBbl,
    penaltyPerBbl,
    logisticDrag,
    share,
    weights,
    shippingPressure,
    downtimePressure,
    directiveDrag,
    environmentPremium,
    safetyPremium,
    maintenanceRelief,
  } = params;

  return Math.max(
    feedCostPerBbl * MIN_COST_FACTOR,
    feedCostPerBbl +
      operationsPerBbl +
      carryingPerBbl +
      penaltyPerBbl * (PENALTY_BASE_FACTOR + share * PENALTY_SHARE_FACTOR) +
      logisticDrag * (DRAG_BASE_FACTOR + weights.shipping * DRAG_WEIGHT_FACTOR) +
      shippingPressure * weights.shipping * SHIPPING_PRESSURE_MULTIPLIER +
      downtimePressure * weights.downtime * DOWNTIME_PRESSURE_MULTIPLIER +
      directiveDrag * DIRECTIVE_DRAG_MULTIPLIER +
      environmentPremium * weights.env * ENV_PREMIUM_MULTIPLIER +
      safetyPremium * weights.maintenance * SAFETY_PREMIUM_MULTIPLIER -
      maintenanceRelief * weights.maintenance * MAINTENANCE_RELIEF_MULTIPLIER
  );
}

/**
 * Calculate futures price target for a product
 */
export function calculateFuturesTarget(params) {
  const {
    spotPrice,
    demandGap,
    storagePressure,
    shippingPressure,
    downtimePressure,
    maintenanceRelief,
    weights,
    mixBias,
    penaltyPerBbl,
    carryingPerBbl,
    logisticDrag,
    drift,
    environmentPremium,
  } = params;

  return Math.max(
    spotPrice * 0.65,
    spotPrice *
      (1 +
        demandGap * 0.72 +
        storagePressure * 0.28 +
        shippingPressure * weights.shipping * 0.2 +
        downtimePressure * weights.downtime * 0.16 -
        maintenanceRelief * weights.maintenance * 0.16 +
        mixBias * 0.2) +
      (penaltyPerBbl + carryingPerBbl) * 0.4 +
      logisticDrag * 1.0 +
      drift * 5.5 +
      environmentPremium * weights.env * 3.8
  );
}

/**
 * Calculate market stress pressures
 */
export function calculateMarketPressures(params) {
  const {
    scenario,
    storageUtil,
    reliability,
    shipmentReliability,
    directiveReliability,
    incidentCount,
    incidentPenalty,
    demandShortage,
  } = params;

  const scenarioRisk = scenario?.riskMultiplier || 1;
  const basePressure = 0.05 + (scenario?.environmentPressure || 0) * 0.14;
  const storagePressure = storageUtil > 0.8 ? (storageUtil - 0.8) * 0.85 : 0;
  const reliabilityPressure = Math.max(0, 1 - reliability) * (0.4 + scenarioRisk * 0.08);
  const shipmentPressure = Math.max(0, 1 - shipmentReliability) * 0.55;
  const directivePressure = Math.max(0, 1 - directiveReliability) * 0.32;
  const shortagePressure = demandShortage > 0 ? Math.min(0.26, demandShortage / 360) : 0;
  const incidentPressure = Math.min(0.28, incidentCount * 0.05 + incidentPenalty / 1150);

  return {
    basePressure,
    storagePressure,
    reliabilityPressure,
    shipmentPressure,
    directivePressure,
    shortagePressure,
    incidentPressure,
  };
}

/**
 * Calculate carrying cost based on storage utilization
 */
export function calculateCarryingCost(storageUtil) {
  if (storageUtil > 0.55) {
    return Math.pow(storageUtil, 1.35) * 340 + Math.max(0, storageUtil - 0.85) * 640;
  }
  return storageUtil * 120;
}

/**
 * Calculate product-specific mix bias based on focus
 */
export function calculateMixBias(product, focusShift) {
  switch (product) {
    case "gasoline":
      return focusShift * 0.35;
    case "diesel":
      return -focusShift * 0.28;
    default:
      return -Math.abs(focusShift) * 0.18;
  }
}

/**
 * Calculate demand for a product
 */
export function calculateProductDemand(params) {
  const { product, scenario, focusShift, reliability, gradeFactor } = params;
  const base = BASE_DEMAND[product];

  let modifier = 1;
  let focusModifier = 1;

  switch (product) {
    case "gasoline":
      modifier = 1 + (scenario?.gasolineBias || 0) * 0.9;
      focusModifier = 1 + focusShift * 0.55;
      break;
    case "diesel":
      modifier = 1 + (scenario?.dieselBias || 0) * 0.9;
      focusModifier = 1 - focusShift * 0.45;
      break;
    case "jet":
      modifier = 1 + (scenario?.jetBias || 0) * 1.1;
      focusModifier = 1 - Math.abs(focusShift) * 0.25;
      break;
  }

  const stability = 0.7 + reliability * 0.2;
  const perDay = base * modifier * focusModifier;
  return clamp(perDay * stability * gradeFactor, 0, perDay * 1.6);
}

/**
 * Smooth a value towards a target
 */
export function smoothValue(current, target, smoothingFactor) {
  return current + (target - current) * smoothingFactor;
}

/**
 * Metrics Processor
 * Handles updating simulation metrics from tick results
 */

import { clamp, perHourToPerDay } from "../utils/calculations.js";

const HOURS_PER_DAY = 24;

/**
 * Round a number to 2 decimal places
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Update production metrics
 */
export function updateProductionMetrics(metrics, production) {
  metrics.gasoline = round(perHourToPerDay(production.gasoline));
  metrics.diesel = round(perHourToPerDay(production.diesel));
  metrics.jet = round(perHourToPerDay(production.jet));
  metrics.lpg = round(perHourToPerDay(production.lpg));
  metrics.waste = production.waste;
}

/**
 * Update financial metrics
 */
export function updateFinancialMetrics(metrics, financial) {
  const {
    crudeCostPerBbl,
    profitPerHour,
    revenuePerHour,
    expensePerHour,
    operatingExpensePerHour,
    crudeExpensePerHour,
    penaltyPerHour,
    marginMultiplier,
    storageThrottle,
  } = financial;

  metrics.crudeCostPerBbl = crudeCostPerBbl;
  metrics.profitPerHour = profitPerHour;
  metrics.revenuePerDay = revenuePerHour * HOURS_PER_DAY;
  metrics.expensePerDay = expensePerHour * HOURS_PER_DAY;
  metrics.operatingExpensePerDay = operatingExpensePerHour * HOURS_PER_DAY;
  metrics.crudeExpensePerDay = crudeExpensePerHour * HOURS_PER_DAY;
  metrics.penaltyPerDay = penaltyPerHour * HOURS_PER_DAY;
  metrics.marginMultiplier = marginMultiplier;
  metrics.storageThrottle = storageThrottle;
}

/**
 * Update economy metrics (futures, costs, basis)
 */
export function updateEconomyMetrics(metrics, economy) {
  metrics.futuresGasoline = economy.futures.gasoline;
  metrics.futuresDiesel = economy.futures.diesel;
  metrics.futuresJet = economy.futures.jet;
  metrics.costGasoline = economy.productionCost.gasoline;
  metrics.costDiesel = economy.productionCost.diesel;
  metrics.costJet = economy.productionCost.jet;
  metrics.basisGasoline = economy.basis.gasoline;
  metrics.basisDiesel = economy.basis.diesel;
  metrics.basisJet = economy.basis.jet;
}

/**
 * Update operational metrics
 */
export function updateOperationalMetrics(metrics, operational) {
  const {
    incidents,
    reliability,
    operationalStrain,
    carbon,
    flareLevel,
    crudeThroughput,
    waste,
    flare,
  } = operational;

  metrics.incidents = incidents;
  metrics.reliability = reliability;
  metrics.operationalStrain = round(operationalStrain);
  metrics.carbon = carbon;
  metrics.flareLevel = clamp((waste + flare * 1.4) / (crudeThroughput * 0.5 || 1), 0, 1);
}

/**
 * Update flow metrics
 */
export function updateFlowMetrics(flows, flowData) {
  flows.toReformer = flowData.reformFeed;
  flows.toCracker = flowData.fccFeed;
  flows.toHydrocracker = flowData.hydroFeed;
  flows.toAlkylation = flowData.alkFeed;
  flows.toExport = flowData.gasoline + flowData.diesel + flowData.jet;
}

/**
 * Build scorecard update context
 */
export function buildScorecardContext(context) {
  const {
    profitPerHour,
    crudeThroughput,
    incidents,
    reliability,
    carbon,
    gasoline,
    diesel,
    jet,
    shipmentReliability,
    strainFactor,
  } = context;

  return {
    profitPerHour,
    crudeThroughput,
    incidents,
    reliability,
    carbon,
    gasoline,
    diesel,
    jet,
    shipmentScore: shipmentReliability,
    strain: strainFactor,
  };
}

/**
 * Build recorder update context
 */
export function buildRecorderContext(context) {
  const {
    hours,
    production,
    profitPerHour,
    penalty,
    incidents,
    reliability,
    carbon,
    logistics,
  } = context;

  return {
    hours,
    production,
    profitPerHour,
    penalty,
    incidents,
    reliability,
    carbon,
    logistics,
  };
}

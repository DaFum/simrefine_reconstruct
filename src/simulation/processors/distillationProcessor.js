/**
 * Distillation Unit Processor
 * Handles crude distillation and initial product separation
 */

import { clamp, perDayToPerHour, perHourToPerDay, calculateDistillationShares } from "../utils/calculations.js";

/**
 * Process crude distillation unit
 * @param {Object} context - Processing context
 * @returns {Object} Distillation result with product pools
 */
export function processDistillation(context) {
  const {
    resolveUnitState,
    updateUnitMode,
    scenario,
    storageThrottle,
    params,
    pipelineMultiplier,
  } = context;

  const crudeDailyTarget = params.crudeIntake * scenario.crudeMultiplier * storageThrottle;
  const crudeAvailable = perDayToPerHour(crudeDailyTarget);

  const distState = resolveUnitState("distillation");
  const distillation = distState.unit;

  const distCapacity = distillation && distState.online
    ? perDayToPerHour(distillation.capacity) * clamp(distState.throttle, 0, 1.2)
    : 0;

  const crudeThroughput = Math.min(crudeAvailable, distCapacity);
  const crudeThroughputPerDay = perHourToPerDay(crudeThroughput);

  if (distillation) {
    distillation.throughput = crudeThroughputPerDay;
    distillation.utilization = distillation.capacity
      ? distillation.throughput / Math.max(1, distillation.capacity)
      : 0;
    updateUnitMode(distillation);
  }

  const focus = clamp(params.productFocus, 0, 1);
  const shares = calculateDistillationShares(focus, scenario);

  const distGas = crudeThroughput * shares.gas;
  const naphthaPool = crudeThroughput * shares.naphtha;
  const kerosenePool = crudeThroughput * shares.kerosene;
  const dieselPool = crudeThroughput * shares.diesel;
  const heavyPool = crudeThroughput * shares.heavy;
  const residPool = crudeThroughput * shares.resid;

  return {
    crudeThroughput,
    crudeThroughputPerDay,
    pools: {
      distGas,
      naphtha: naphthaPool,
      kerosene: kerosenePool,
      diesel: dieselPool,
      heavy: heavyPool,
      resid: residPool,
    },
  };
}

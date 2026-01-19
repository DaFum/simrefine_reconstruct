/**
 * Hydrocracker Processor
 * Handles hydrocracking for jet fuel and diesel production
 */

import { clamp, perDayToPerHour, perHourToPerDay } from "../utils/calculations.js";

/**
 * Process hydrocracker unit
 * @param {Object} context - Processing context
 * @returns {Object} Hydrocracker processing result
 */
export function processHydrocracker(context) {
  const {
    resolveUnitState,
    updateUnitMode,
    pipelineMultiplier,
    heavyPool,
    residPool,
    dieselPool,
  } = context;

  const hydroState = resolveUnitState("hydrocracker");
  const hydrocracker = hydroState.unit;

  const hydroCapacity = hydrocracker && hydroState.online
    ? perDayToPerHour(hydrocracker.capacity) * clamp(hydroState.throttle, 0, 1.2)
    : 0;

  const hydroFeedAvailable = heavyPool + residPool + dieselPool * 0.25;
  const hydroFeed = Math.min(
    hydroFeedAvailable,
    hydroCapacity * pipelineMultiplier("toHydrocracker")
  );

  const heavyUsedHydro = Math.min(heavyPool, hydroFeed * 0.55);
  const residUsedHydro = Math.min(residPool, hydroFeed * 0.35);
  const dieselUsedHydro = Math.min(dieselPool * 0.5, hydroFeed - heavyUsedHydro - residUsedHydro);

  const remainingHeavy = heavyPool - heavyUsedHydro;
  const remainingResid = residPool - residUsedHydro;
  const remainingDiesel = dieselPool - dieselUsedHydro;

  if (hydrocracker) {
    hydrocracker.throughput = perHourToPerDay(hydroFeed);
    hydrocracker.utilization = hydrocracker.capacity > 0 ? hydrocracker.throughput / hydrocracker.capacity : 0;
    updateUnitMode(hydrocracker);
  }

  const hydroGasoline = hydroFeed * 0.42;
  const hydroDiesel = hydroFeed * 0.3;
  const hydroJet = hydroFeed * 0.2;
  const hydroLoss = hydroFeed * 0.08;
  const hydroHydrogen = hydroFeed * 0.04;

  return {
    feed: hydroFeed,
    remainingHeavy,
    remainingResid,
    remainingDiesel,
    output: {
      gasoline: hydroGasoline,
      diesel: hydroDiesel,
      jet: hydroJet,
      hydrogen: hydroHydrogen,
      waste: hydroLoss,
    },
  };
}

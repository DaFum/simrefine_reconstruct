/**
 * Reformer Unit Processor
 * Handles naphtha reformation into high-octane gasoline and hydrogen
 */

import { clamp, perDayToPerHour, perHourToPerDay } from "../utils/calculations.js";

/**
 * Process naphtha reformer unit
 * @param {Object} context - Processing context
 * @returns {Object} Reformer processing result
 */
export function processReformer(context) {
  const {
    resolveUnitState,
    updateUnitMode,
    pipelineMultiplier,
    naphthaPool,
  } = context;

  const reformerState = resolveUnitState("reformer");
  const reformer = reformerState.unit;

  const reformerCapacity = reformer && reformerState.online
    ? perDayToPerHour(reformer.capacity) * clamp(reformerState.throttle, 0, 1.2)
    : 0;

  const reformFeed = Math.min(
    naphthaPool,
    reformerCapacity * pipelineMultiplier("toReformer")
  );

  const remainingNaphtha = naphthaPool - reformFeed;

  if (reformer) {
    reformer.throughput = perHourToPerDay(reformFeed);
    reformer.utilization = reformer.capacity > 0 ? reformer.throughput / reformer.capacity : 0;
    updateUnitMode(reformer);
  }

  const reformate = reformFeed * 0.92;
  const reformHydrogen = reformFeed * 0.05;
  const reformLoss = reformFeed * 0.03;

  return {
    feed: reformFeed,
    remainingNaphtha,
    output: {
      gasoline: reformate,
      hydrogen: reformHydrogen,
      waste: reformLoss,
    },
  };
}

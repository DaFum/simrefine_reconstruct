/**
 * Sulfur Recovery Processor
 * Handles sulfur extraction from residual streams
 */

import { clamp, perDayToPerHour, perHourToPerDay } from "../utils/calculations.js";

/**
 * Process sulfur recovery unit
 * @param {Object} context - Processing context
 * @returns {Object} Sulfur recovery processing result
 */
export function processSulfurRecovery(context) {
  const {
    resolveUnitState,
    updateUnitMode,
    residPool,
    heavyPool,
    environmentParam,
  } = context;

  const sulfurState = resolveUnitState("sulfur");
  const sulfur = sulfurState.unit;

  const sulfurCapacity = sulfur && sulfurState.online
    ? perDayToPerHour(sulfur.capacity) * clamp(sulfurState.throttle, 0, 1.2)
    : 0;

  const sulfurFeed = Math.min(residPool + heavyPool, sulfurCapacity);
  const sulfurRemoved = sulfurFeed * (0.55 + environmentParam * 0.4);

  if (sulfur) {
    sulfur.throughput = perHourToPerDay(sulfurFeed);
    sulfur.utilization = sulfur.capacity > 0 ? sulfur.throughput / sulfur.capacity : 0;
    updateUnitMode(sulfur);
  }

  const residConsumed = sulfurFeed * 0.6;
  const heavyConsumed = sulfurFeed * 0.4;

  const remainingResid = residPool - residConsumed;
  const remainingHeavy = heavyPool - heavyConsumed;

  return {
    feed: sulfurFeed,
    remainingResid,
    remainingHeavy,
    output: {
      sulfur: sulfurRemoved,
      waste: Math.max(0, sulfurFeed - sulfurRemoved),
    },
  };
}

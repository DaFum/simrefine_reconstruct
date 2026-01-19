/**
 * Alkylation Processor
 * Handles alkylation for high-octane gasoline blending
 */

import { clamp, perDayToPerHour, perHourToPerDay } from "../utils/calculations.js";

/**
 * Process alkylation unit
 * @param {Object} context - Processing context
 * @returns {Object} Alkylation processing result
 */
export function processAlkylation(context) {
  const {
    resolveUnitState,
    updateUnitMode,
    pipelineMultiplier,
    lpgPool,
  } = context;

  const alkylationState = resolveUnitState("alkylation");
  const alkylation = alkylationState.unit;

  const alkCapacity = alkylation && alkylationState.online
    ? perDayToPerHour(alkylation.capacity) * clamp(alkylationState.throttle, 0, 1.2)
    : 0;

  const alkFeed = Math.min(
    lpgPool,
    alkCapacity * pipelineMultiplier("toAlkylation")
  );

  const remainingLpg = lpgPool - alkFeed;

  if (alkylation) {
    alkylation.throughput = perHourToPerDay(alkFeed);
    alkylation.utilization = alkylation.capacity > 0 ? alkylation.throughput / alkylation.capacity : 0;
    updateUnitMode(alkylation);
  }

  const alkGasoline = alkFeed * 0.88;
  const alkLoss = alkFeed * 0.06;

  return {
    feed: alkFeed,
    remainingLpg,
    output: {
      gasoline: alkGasoline,
      lpg: remainingLpg,
      waste: alkLoss,
    },
  };
}

/**
 * FCC (Fluid Catalytic Cracker) Processor
 * Handles cracking of heavy gas oils into lighter products
 */

import { clamp, perDayToPerHour, perHourToPerDay } from "../utils/calculations.js";

/**
 * Process FCC unit
 * @param {Object} context - Processing context
 * @returns {Object} FCC processing result
 */
export function processFCC(context) {
  const {
    resolveUnitState,
    updateUnitMode,
    pipelineMultiplier,
    heavyPool,
    residPool,
  } = context;

  const fccState = resolveUnitState("fcc");
  const fcc = fccState.unit;

  const fccCapacity = fcc && fccState.online
    ? perDayToPerHour(fcc.capacity) * clamp(fccState.throttle, 0, 1.2)
    : 0;

  const heavyAvailableForFcc = heavyPool + residPool * 0.6;
  const fccFeed = Math.min(
    heavyAvailableForFcc,
    fccCapacity * pipelineMultiplier("toCracker")
  );

  const heavyUsedByFcc = Math.min(heavyPool, fccFeed * 0.7);
  const residUsedByFcc = Math.min(residPool, fccFeed - heavyUsedByFcc);

  const remainingHeavy = heavyPool - heavyUsedByFcc;
  const remainingResid = residPool - residUsedByFcc;

  if (fcc) {
    fcc.throughput = perHourToPerDay(fccFeed);
    fcc.utilization = fcc.capacity > 0 ? fcc.throughput / fcc.capacity : 0;
    updateUnitMode(fcc);
  }

  const fccGasoline = fccFeed * 0.54;
  const fccDiesel = fccFeed * 0.12;
  const fccLpg = fccFeed * 0.18;
  const fccLoss = fccFeed * 0.08;

  return {
    feed: fccFeed,
    remainingHeavy,
    remainingResid,
    output: {
      gasoline: fccGasoline,
      diesel: fccDiesel,
      lpg: fccLpg,
      waste: fccLoss,
      flare: fccLoss * 0.5,
    },
  };
}

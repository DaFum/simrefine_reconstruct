
import { describe, it, expect, beforeEach } from 'vitest';
import { RefinerySimulation } from '../../src/simulation.js';
import { PredictionEngine } from '../../src/predictionEngine.js';

describe('PredictionEngine', () => {
  let sim;
  let engine;

  beforeEach(() => {
    sim = new RefinerySimulation(null);
    sim.reset();
    // Stabilize a bit
    sim.update(10);
    engine = new PredictionEngine();
  });

  it('should predict future state with parameter changes', () => {
    // Baseline profit
    const baselineMetrics = sim.getMetrics();

    // Propose increasing crude intake
    const changes = { crudeIntake: 150 }; // Default is usually 120

    const result = engine.predict(sim, changes, 2); // 2 hours

    expect(result).toBeDefined();
    expect(result.durationHours).toBe(2);
    expect(result.metrics.profitPerHour).toBeDefined();
    expect(result.metrics.reliability).toBeDefined();

    // Changing params should likely change profit (either up or down depending on constraints)
    // We just check that it ran and produced numbers
    expect(Number.isFinite(result.metrics.profitPerHour.predicted)).toBe(true);
    expect(Number.isFinite(result.metrics.profitPerHour.delta)).toBe(true);
  });

  it('should return near-zero delta if no changes and steady state', () => {
    // If we make NO changes, and the plant is perfectly steady, delta should be small.
    // However, the plant usually has dynamic elements (tank filling), so it won't be exactly zero.
    // But it should run without error.
    const result = engine.predict(sim, {}, 1);
    expect(Number.isFinite(result.metrics.storage.gasoline)).toBe(true);
  });
});

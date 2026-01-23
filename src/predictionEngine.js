import { RefinerySimulation } from "./simulation.js";

export class PredictionEngine {
  constructor() {
    this._tempSimulation = null;
  }

  /**
   * Run a prediction based on current simulation state and proposed changes.
   * @param {RefinerySimulation} sourceSimulation - The active simulation instance.
   * @param {Object} changes - Key-value pairs of params to change (e.g., { crudeIntake: 150 }).
   * @param {number} durationHours - How far to predict into the future (default: 2 hours).
   * @returns {Object} - Predicted deltas and absolute values.
   */
  predict(sourceSimulation, changes, durationHours = 2) {
    if (!sourceSimulation) return null;

    // Lazy initialization of temp simulation to save resources
    if (!this._tempSimulation) {
      this._tempSimulation = new RefinerySimulation(null); // No event bus to prevent side effects
    }

    // 1. Snapshot current state
    const snapshot = sourceSimulation.createSnapshot();

    // 2. Load into temp simulation
    this._tempSimulation.loadSnapshot(snapshot);

    // 3. Apply changes
    if (changes) {
      Object.entries(changes).forEach(([key, value]) => {
        this._tempSimulation.setParam(key, value);
      });
    }

    // 4. Fast-forward simulation
    // We simulate in 1-minute ticks for accuracy
    const totalMinutes = Math.floor(durationHours * 60);
    // Disable heavy features for performance if needed, but we need accuracy.
    // Ensure the temp sim is "running" logic-wise
    this._tempSimulation.running = true;

    for (let i = 0; i < totalMinutes; i++) {
        this._tempSimulation._advanceTick(1);
    }

    // 5. Calculate results
    const startMetrics = snapshot.metrics;
    const endMetrics = this._tempSimulation.getMetrics();

    // Calculate deltas
    const profitDelta = endMetrics.profitPerHour - startMetrics.profitPerHour;
    const reliabilityDelta = (endMetrics.reliability - startMetrics.reliability) * 100; // Percentage points

    // For storage, we want the *projected level* vs *current level*
    const storageDelta = {
        gasoline: endMetrics.storageGasoline - startMetrics.storageGasoline,
        diesel: endMetrics.storageDiesel - startMetrics.storageDiesel,
        jet: endMetrics.storageJet - startMetrics.storageJet
    };

    return {
      durationHours,
      metrics: {
        profitPerHour: {
          current: startMetrics.profitPerHour,
          predicted: endMetrics.profitPerHour,
          delta: profitDelta,
          percentChange: (profitDelta / Math.max(1, Math.abs(startMetrics.profitPerHour))) * 100
        },
        reliability: {
          current: startMetrics.reliability * 100,
          predicted: endMetrics.reliability * 100,
          delta: reliabilityDelta
        },
        storage: storageDelta
      }
    };
  }
}

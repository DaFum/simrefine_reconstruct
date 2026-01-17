import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RefinerySimulation } from '../../src/simulation.js';

describe('RefinerySimulation', () => {
  let simulation;
  let mockEventBus;

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    simulation = new RefinerySimulation(mockEventBus);
  });

  afterEach(() => {
      vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(simulation.timeMinutes).toBe(0);
      expect(simulation.running).toBe(true);
      expect(simulation.units.length).toBeGreaterThan(0);
      expect(simulation.logs.length).toBeGreaterThan(0);
      expect(simulation.activeScenarioKey).toBe('steady');
    });

    it('should have correct initial metrics', () => {
      expect(simulation.metrics.gasoline).toBe(0);
      expect(simulation.metrics.diesel).toBe(0);
      expect(simulation.metrics.profitPerHour).toBe(0);
    });

    it('should have initial scheduled shipments', () => {
        expect(simulation.shipments.length).toBeGreaterThan(0);
        const pending = simulation.shipments.filter(s => s.status === 'pending');
        expect(pending.length).toBeGreaterThan(0);
    });
  });

  describe('Control Methods', () => {
      it('should toggle running state', () => {
          expect(simulation.running).toBe(true);
          simulation.toggleRunning();
          expect(simulation.running).toBe(false);
          simulation.toggleRunning();
          expect(simulation.running).toBe(true);
      });

      it('should set speed multiplier', () => {
          simulation.setSpeedMultiplier(2);
          expect(simulation.speedMultiplier).toBe(2);
          expect(simulation.speed).toBe(simulation.baseSpeed * 2);
      });

      it('should clamp speed multiplier', () => {
          simulation.setSpeedMultiplier(100);
          expect(simulation.speedMultiplier).toBe(simulation.maxSpeedMultiplier);
          simulation.setSpeedMultiplier(-10);
          expect(simulation.speedMultiplier).toBe(simulation.minSpeedMultiplier);
      });

      it('should cycle speed presets', () => {
          simulation.setSpeedMultiplier(1);
          simulation.cycleSpeedPreset(1);
          expect(simulation.speedMultiplier).toBeGreaterThan(1);
      });

      it('should request single step', () => {
          simulation.running = false;
          simulation.requestStep();
          expect(simulation.stepOnce).toBe(true);
      });

      it('should set parameters', () => {
          simulation.setParam('crudeIntake', 150);
          expect(simulation.params.crudeIntake).toBe(150);
      });

      it('should apply scenario', () => {
          simulation.applyScenario('summerRush');
          expect(simulation.activeScenarioKey).toBe('summerRush');
          expect(simulation.activeScenario.name).toBe('Summer Driving Rush');
      });
  });

  describe('Simulation Loop', () => {
      it('should advance time when running', () => {
          simulation.running = true;
          simulation.update(1.0); // 1 second
          expect(simulation.timeMinutes).toBeGreaterThan(0);
      });

      it('should not advance time when paused', () => {
          simulation.running = false;
          simulation.update(1.0);
          expect(simulation.timeMinutes).toBe(0);
      });

      it('should advance one tick when stepOnce is requested', () => {
          simulation.running = false;
          simulation.requestStep();
          // Force enough update time to trigger a tick
          const secondsPerTick = simulation.tickInterval / simulation.speed;
          simulation.update(secondsPerTick + 0.1);
          expect(simulation.timeMinutes).toBeGreaterThan(0);
          expect(simulation.stepOnce).toBe(false);
          expect(simulation.running).toBe(false);
      });

      it('should update unit throughputs', () => {
          simulation.update(10); // Advance enough time
          const dist = simulation.getUnit('distillation');
          expect(dist.throughput).toBeGreaterThan(0);
      });

      it('should generate products', () => {
          // Run for a bit to accumulate products
          for(let i=0; i<60; i++) {
              simulation.update(0.1);
          }
          const metrics = simulation.getMetrics();
          // Ensure we have advanced enough simulated time for gasoline production to register in metrics.
          expect(metrics.gasoline).toBeGreaterThan(0);
      });
  });

  describe('Logistics', () => {
      it('should schedule new shipments', () => {
          const count = simulation.shipments.length;
          simulation._scheduleShipment({ product: 'gasoline', dueIn: 5, volume: 50 });
          expect(simulation.shipments.length).toBe(count + 1);
      });

      it('should handle shipment completion', () => {
         // Create a shipment due immediately
         const shipment = simulation._registerShipment({
             product: 'gasoline',
             dueIn: 0.1, // 6 minutes
             volume: 10
         });

         // Ensure storage has enough product
         simulation.storage.levels.gasoline = 20;
         // Disable production to isolate shipment logic
         simulation.params.crudeIntake = 0;

         // Advance time
         simulation._advanceTick(10); // 10 minutes

         expect(shipment.status).toBe('completed');
         expect(simulation.storage.levels.gasoline).toBeLessThanOrEqual(10);
         expect(simulation.storage.levels.gasoline).toBeGreaterThan(9);
      });

      it('should handle missed shipments', () => {
        // Create a shipment due immediately
        const shipment = simulation._registerShipment({
            product: 'gasoline',
            dueIn: 0.1,
            volume: 1000 // More than capacity
        });

        simulation.storage.levels.gasoline = 0;

        // Advance time
        simulation._advanceTick(10);

        expect(shipment.status).toBe('missed');
        expect(shipment.shortage).toBeGreaterThan(0);
     });

     it('should dispatch logistics convoy', () => {
         simulation.storage.levels.gasoline = 200; // High level
         simulation.storage.capacity.gasoline = 220;

         const result = simulation.dispatchLogisticsConvoy();
         expect(result.active).toBe(true);
         expect(simulation.activeConvoys.length).toBe(1);
     });

     it('should not dispatch convoy if levels are low', () => {
         simulation.storage.levels.gasoline = 10;
         simulation.storage.levels.diesel = 10;
         simulation.storage.levels.jet = 10;

         const result = simulation.dispatchLogisticsConvoy();
         expect(result).toBe(false);
     });
  });

  describe('Unit Management', () => {
      it('should allow setting unit offline', () => {
          const unitId = 'distillation';
          simulation.setUnitOffline(unitId, true);
          const unit = simulation.getUnit(unitId);
          expect(unit.status).toBe('standby');
          expect(simulation.unitOverrides[unitId].offline).toBe(true);
      });

      it('should allow bringing unit online', () => {
        const unitId = 'distillation';
        simulation.setUnitOffline(unitId, true);
        simulation.setUnitOffline(unitId, false);
        const unit = simulation.getUnit(unitId);
        expect(unit.status).toBe('online');
        expect(simulation.unitOverrides[unitId]).toBeUndefined();
      });

      it('should set unit throttle', () => {
          const unitId = 'distillation';
          simulation.setUnitThrottle(unitId, 0.5);
          const unit = simulation.getUnit(unitId);
          expect(unit.overrideThrottle).toBe(0.5);
          expect(simulation.unitOverrides[unitId].throttle).toBe(0.5);
      });
  });

  describe('Mission System', () => {
      it('should have an active mission on start', () => {
          expect(simulation.activeMission).not.toBeNull();
      });

      it('should track objective progress', () => {
          const mission = simulation.activeMission;

          // Tutorial mission should expose at least one structured objective
          expect(mission).toBeDefined();
          expect(Array.isArray(mission.objectives)).toBe(true);
          expect(mission.objectives.length).toBeGreaterThan(0);

          const firstObjective = mission.objectives[0];
          expect(firstObjective).toEqual(
            expect.objectContaining({
              id: expect.any(String),
              description: expect.any(String),
              completed: expect.any(Boolean)
            })
          );
      });
  });

  describe('Snapshots', () => {
      it('should create and load snapshot', () => {
          simulation.timeMinutes = 100;
          simulation.metrics.gasoline = 500;

          const snapshot = simulation.createSnapshot();

          const newSim = new RefinerySimulation(mockEventBus);
          newSim.loadSnapshot(snapshot);

          expect(newSim.timeMinutes).toBe(100);
          expect(newSim.metrics.gasoline).toBe(500);
          expect(newSim.units.length).toBe(simulation.units.length);
      });
  });

  describe('Alerts', () => {
      it('should emit alerts via eventBus', () => {
          // Force an alert
          const unit = simulation.getUnit('distillation');
          unit.integrity = 0.1;

          // Tick
          simulation._advanceTick(1);

          expect(mockEventBus.emit).toHaveBeenCalledWith('ALERT_RAISED', expect.objectContaining({
              type: 'unit',
              severity: 'danger'
          }));
      });
  });
});

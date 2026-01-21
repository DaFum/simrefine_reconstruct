import { describe, expect, it } from 'vitest';
import { OPERATION_PRESETS, SESSION_PRESETS } from '../../../src/config/presets.js';

describe('OPERATION_PRESETS', () => {
  describe('Configuration Structure', () => {
    it('should export an object of operation presets', () => {
      expect(typeof OPERATION_PRESETS).toBe('object');
      expect(OPERATION_PRESETS).not.toBeNull();
    });

    it('should have exactly 3 operation presets', () => {
      const keys = Object.keys(OPERATION_PRESETS);
      expect(keys.length).toBe(3);
    });

    it('should have auto, manual, and shutdown presets', () => {
      expect(OPERATION_PRESETS).toHaveProperty('auto');
      expect(OPERATION_PRESETS).toHaveProperty('manual');
      expect(OPERATION_PRESETS).toHaveProperty('shutdown');
    });
  });

  describe('Preset Properties', () => {
    it('should have all required properties for each preset', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(preset).toHaveProperty('label');
        expect(preset).toHaveProperty('crude');
        expect(preset).toHaveProperty('focus');
        expect(preset).toHaveProperty('maintenance');
        expect(preset).toHaveProperty('safety');
        expect(preset).toHaveProperty('environment');
        expect(preset).toHaveProperty('log');
      });
    });

    it('should have valid label strings', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.label).toBe('string');
        expect(preset.label.length).toBeGreaterThan(0);
      });
    });

    it('should have valid crude intake values', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.crude).toBe('number');
        expect(preset.crude).toBeGreaterThanOrEqual(0);
        expect(preset.crude).toBeLessThanOrEqual(300);
      });
    });

    it('should have valid focus values (0-1)', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.focus).toBe('number');
        expect(preset.focus).toBeGreaterThanOrEqual(0);
        expect(preset.focus).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid maintenance values (0-1)', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.maintenance).toBe('number');
        expect(preset.maintenance).toBeGreaterThanOrEqual(0);
        expect(preset.maintenance).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid safety values (0-1)', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.safety).toBe('number');
        expect(preset.safety).toBeGreaterThanOrEqual(0);
        expect(preset.safety).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid environment values (0-1)', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.environment).toBe('number');
        expect(preset.environment).toBeGreaterThanOrEqual(0);
        expect(preset.environment).toBeLessThanOrEqual(1);
      });
    });

    it('should have log messages', () => {
      Object.values(OPERATION_PRESETS).forEach(preset => {
        expect(typeof preset.log).toBe('string');
        expect(preset.log.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Specific Operation Presets', () => {
    it('should have auto preset with balanced values', () => {
      const auto = OPERATION_PRESETS.auto;
      expect(auto.label).toBe('AUTO');
      expect(auto.crude).toBe(120);
      expect(auto.focus).toBe(0.5);
      expect(auto.maintenance).toBeGreaterThan(0.5);
    });

    it('should have manual preset with higher throughput', () => {
      const manual = OPERATION_PRESETS.manual;
      expect(manual.label).toBe('MANUAL');
      expect(manual.crude).toBeGreaterThan(OPERATION_PRESETS.auto.crude);
      expect(manual.focus).toBeGreaterThan(0.5);
    });

    it('should have shutdown preset with zero crude', () => {
      const shutdown = OPERATION_PRESETS.shutdown;
      expect(shutdown.label).toBe('SHUTDN');
      expect(shutdown.crude).toBe(0);
      expect(shutdown.maintenance).toBeGreaterThan(0.7);
      expect(shutdown.safety).toBeGreaterThan(0.7);
    });
  });
});

describe('SESSION_PRESETS', () => {
  describe('Configuration Structure', () => {
    it('should export an object of session presets', () => {
      expect(typeof SESSION_PRESETS).toBe('object');
      expect(SESSION_PRESETS).not.toBeNull();
    });

    it('should have exactly 2 session presets', () => {
      const keys = Object.keys(SESSION_PRESETS);
      expect(keys.length).toBe(2);
    });

    it('should have legacy and modern presets', () => {
      expect(SESSION_PRESETS).toHaveProperty('legacy');
      expect(SESSION_PRESETS).toHaveProperty('modern');
    });
  });

  describe('Session Preset Properties', () => {
    it('should have all required properties for each session', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(session).toHaveProperty('scenario');
        expect(session).toHaveProperty('params');
        expect(session).toHaveProperty('storageLevels');
        expect(session).toHaveProperty('shipments');
        expect(session).toHaveProperty('shipmentStats');
        expect(session).toHaveProperty('nextShipmentIn');
        expect(session).toHaveProperty('units');
        expect(session).toHaveProperty('marketStress');
        expect(session).toHaveProperty('timeMinutes');
        expect(session).toHaveProperty('log');
      });
    });

    it('should have valid scenario strings', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(typeof session.scenario).toBe('string');
        expect(session.scenario.length).toBeGreaterThan(0);
      });
    });

    it('should have valid params objects', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(session.params).toHaveProperty('crude');
        expect(session.params).toHaveProperty('focus');
        expect(session.params).toHaveProperty('maintenance');
        expect(session.params).toHaveProperty('safety');
        expect(session.params).toHaveProperty('environment');

        expect(typeof session.params.crude).toBe('number');
        expect(session.params.crude).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid storage levels', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(session.storageLevels).toHaveProperty('gasoline');
        expect(session.storageLevels).toHaveProperty('diesel');
        expect(session.storageLevels).toHaveProperty('jet');

        Object.values(session.storageLevels).forEach(level => {
          expect(typeof level).toBe('number');
          expect(level).toBeGreaterThanOrEqual(0);
        });
      });
    });

    it('should have valid shipments arrays', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(Array.isArray(session.shipments)).toBe(true);

        session.shipments.forEach(shipment => {
          expect(shipment).toHaveProperty('product');
          expect(shipment).toHaveProperty('volume');
          expect(shipment).toHaveProperty('window');
          expect(shipment).toHaveProperty('dueIn');

          expect(typeof shipment.volume).toBe('number');
          expect(shipment.volume).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid shipment stats', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(session.shipmentStats).toHaveProperty('total');
        expect(session.shipmentStats).toHaveProperty('onTime');
        expect(session.shipmentStats).toHaveProperty('missed');

        expect(typeof session.shipmentStats.total).toBe('number');
        expect(session.shipmentStats.total).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid unit configurations', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(Array.isArray(session.units)).toBe(true);

        session.units.forEach(unit => {
          expect(unit).toHaveProperty('id');
          expect(unit).toHaveProperty('integrity');
          expect(typeof unit.id).toBe('string');
          expect(typeof unit.integrity).toBe('number');
          expect(unit.integrity).toBeGreaterThan(0);
          expect(unit.integrity).toBeLessThanOrEqual(1);
        });
      });
    });

    it('should have valid market stress values', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(typeof session.marketStress).toBe('number');
        expect(session.marketStress).toBeGreaterThanOrEqual(0);
        expect(session.marketStress).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid time values', () => {
      Object.values(SESSION_PRESETS).forEach(session => {
        expect(typeof session.timeMinutes).toBe('number');
        expect(session.timeMinutes).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Specific Session Presets', () => {
    it('should have legacy preset with maintenance issues', () => {
      const legacy = SESSION_PRESETS.legacy;
      expect(legacy.scenario).toBe('maintenanceCrunch');
      expect(legacy.units.length).toBeGreaterThan(0);
      expect(legacy.storageLevels.gasoline).toBeGreaterThan(150);
    });

    it('should have modern preset with export focus', () => {
      const modern = SESSION_PRESETS.modern;
      expect(modern.scenario).toBe('exportPush');
      expect(modern.params.crude).toBeGreaterThan(SESSION_PRESETS.legacy.params.crude);
      expect(modern).toHaveProperty('unitOverrides');
    });

    it('should have modern preset with unit overrides', () => {
      const modern = SESSION_PRESETS.modern;
      expect(modern.unitOverrides).toBeDefined();
      expect(typeof modern.unitOverrides).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle iteration over operation presets', () => {
      const keys = Object.keys(OPERATION_PRESETS);
      expect(keys.length).toBe(3);
      keys.forEach(key => {
        expect(OPERATION_PRESETS[key]).toBeDefined();
      });
    });

    it('should handle iteration over session presets', () => {
      const keys = Object.keys(SESSION_PRESETS);
      expect(keys.length).toBe(2);
      keys.forEach(key => {
        expect(SESSION_PRESETS[key]).toBeDefined();
      });
    });

    it('should allow filtering operation presets by criteria', () => {
      const highMaintenance = Object.values(OPERATION_PRESETS)
        .filter(p => p.maintenance > 0.6);
      expect(highMaintenance.length).toBeGreaterThan(0);
    });

    it('should allow mapping session scenarios', () => {
      const scenarios = Object.values(SESSION_PRESETS).map(s => s.scenario);
      expect(scenarios).toContain('maintenanceCrunch');
      expect(scenarios).toContain('exportPush');
    });
  });
});
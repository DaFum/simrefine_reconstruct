import { describe, expect, it } from 'vitest';
import {
  BASE_PRICES,
  DEFAULT_PARAMS,
  HOURS_PER_DAY,
  PRODUCT_LABELS,
  SCENARIOS,
  SHIPMENT_HORIZON_HOURS,
  SHIPMENT_PARCEL_SIZES,
  SPEED_PRESETS,
  UNIT_CATEGORIES,
  UNIT_DEFINITIONS
} from '../../../src/simulation/constants.js';

describe('Simulation Constants', () => {
  describe('PRODUCT_LABELS', () => {
    it('should have labels for all products', () => {
      expect(PRODUCT_LABELS).toHaveProperty('gasoline');
      expect(PRODUCT_LABELS).toHaveProperty('diesel');
      expect(PRODUCT_LABELS).toHaveProperty('jet');
    });

    it('should have string values', () => {
      Object.values(PRODUCT_LABELS).forEach(label => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Time Constants', () => {
    it('should have correct HOURS_PER_DAY', () => {
      expect(HOURS_PER_DAY).toBe(24);
    });

    it('should have valid SHIPMENT_HORIZON_HOURS', () => {
      expect(typeof SHIPMENT_HORIZON_HOURS).toBe('number');
      expect(SHIPMENT_HORIZON_HOURS).toBeGreaterThan(0);
      expect(SHIPMENT_HORIZON_HOURS).toBe(48);
    });
  });

  describe('SHIPMENT_PARCEL_SIZES', () => {
    it('should have sizes for all products', () => {
      expect(SHIPMENT_PARCEL_SIZES).toHaveProperty('gasoline');
      expect(SHIPMENT_PARCEL_SIZES).toHaveProperty('diesel');
      expect(SHIPMENT_PARCEL_SIZES).toHaveProperty('jet');
    });

    it('should have positive numeric values', () => {
      Object.values(SHIPMENT_PARCEL_SIZES).forEach(size => {
        expect(typeof size).toBe('number');
        expect(size).toBeGreaterThan(0);
      });
    });
  });

  describe('BASE_PRICES', () => {
    it('should have prices for all products', () => {
      expect(BASE_PRICES).toHaveProperty('gasoline');
      expect(BASE_PRICES).toHaveProperty('diesel');
      expect(BASE_PRICES).toHaveProperty('jet');
      expect(BASE_PRICES).toHaveProperty('lpg');
    });

    it('should have positive numeric values', () => {
      Object.values(BASE_PRICES).forEach(price => {
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
      });
    });

    it('should have jet fuel as most expensive', () => {
      expect(BASE_PRICES.jet).toBeGreaterThan(BASE_PRICES.gasoline);
      expect(BASE_PRICES.jet).toBeGreaterThan(BASE_PRICES.diesel);
    });
  });

  describe('UNIT_CATEGORIES', () => {
    it('should have all category types', () => {
      expect(UNIT_CATEGORIES).toHaveProperty('CORE');
      expect(UNIT_CATEGORIES).toHaveProperty('NAPHTHA');
      expect(UNIT_CATEGORIES).toHaveProperty('CONVERSION');
      expect(UNIT_CATEGORIES).toHaveProperty('FINISHING');
      expect(UNIT_CATEGORIES).toHaveProperty('SUPPORT');
    });

    it('should have string values', () => {
      Object.values(UNIT_CATEGORIES).forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });
  });

  describe('UNIT_DEFINITIONS', () => {
    it('should be an array of unit definitions', () => {
      expect(Array.isArray(UNIT_DEFINITIONS)).toBe(true);
      expect(UNIT_DEFINITIONS.length).toBe(6);
    });

    it('should have required properties for each unit', () => {
      UNIT_DEFINITIONS.forEach(unit => {
        expect(unit).toHaveProperty('id');
        expect(unit).toHaveProperty('name');
        expect(unit).toHaveProperty('capacity');
        expect(unit).toHaveProperty('category');
      });
    });

    it('should have valid capacities', () => {
      UNIT_DEFINITIONS.forEach(unit => {
        expect(typeof unit.capacity).toBe('number');
        expect(unit.capacity).toBeGreaterThan(0);
      });
    });

    it('should have unique IDs', () => {
      const ids = UNIT_DEFINITIONS.map(u => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('SPEED_PRESETS', () => {
    it('should be an array of speed presets', () => {
      expect(Array.isArray(SPEED_PRESETS)).toBe(true);
      expect(SPEED_PRESETS.length).toBe(5);
    });

    it('should have label and value for each preset', () => {
      SPEED_PRESETS.forEach(preset => {
        expect(preset).toHaveProperty('label');
        expect(preset).toHaveProperty('value');
        expect(typeof preset.label).toBe('string');
        expect(typeof preset.value).toBe('number');
      });
    });

    it('should have increasing values', () => {
      for (let i = 1; i < SPEED_PRESETS.length; i++) {
        expect(SPEED_PRESETS[i].value).toBeGreaterThan(SPEED_PRESETS[i - 1].value);
      }
    });
  });

  describe('DEFAULT_PARAMS', () => {
    it('should have all required parameters', () => {
      expect(DEFAULT_PARAMS).toHaveProperty('crudeIntake');
      expect(DEFAULT_PARAMS).toHaveProperty('productFocus');
      expect(DEFAULT_PARAMS).toHaveProperty('maintenance');
      expect(DEFAULT_PARAMS).toHaveProperty('safety');
      expect(DEFAULT_PARAMS).toHaveProperty('environment');
    });

    it('should have valid parameter ranges', () => {
      expect(DEFAULT_PARAMS.crudeIntake).toBe(120);
      expect(DEFAULT_PARAMS.productFocus).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_PARAMS.productFocus).toBeLessThanOrEqual(1);
      expect(DEFAULT_PARAMS.maintenance).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_PARAMS.maintenance).toBeLessThanOrEqual(1);
    });
  });

  describe('SCENARIOS', () => {
    it('should be an object of scenario configurations', () => {
      expect(typeof SCENARIOS).toBe('object');
      expect(SCENARIOS).not.toBeNull();
    });

    it('should have at least steady scenario', () => {
      expect(SCENARIOS).toHaveProperty('steady');
    });

    it('should have required properties for each scenario', () => {
      Object.values(SCENARIOS).forEach(scenario => {
        expect(scenario).toHaveProperty('key');
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('description');
        expect(scenario).toHaveProperty('crudeMultiplier');
        expect(scenario).toHaveProperty('qualityShift');
        expect(scenario).toHaveProperty('priceModifier');
        expect(scenario).toHaveProperty('gasolineBias');
        expect(scenario).toHaveProperty('dieselBias');
        expect(scenario).toHaveProperty('jetBias');
        expect(scenario).toHaveProperty('riskMultiplier');
        expect(scenario).toHaveProperty('maintenancePenalty');
        expect(scenario).toHaveProperty('environmentPressure');
      });
    });

    it('should have numeric multipliers', () => {
      Object.values(SCENARIOS).forEach(scenario => {
        expect(typeof scenario.crudeMultiplier).toBe('number');
        expect(typeof scenario.priceModifier).toBe('number');
        expect(typeof scenario.riskMultiplier).toBe('number');
      });
    });
  });
});
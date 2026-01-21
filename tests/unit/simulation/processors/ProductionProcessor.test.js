import { describe, expect, it } from 'vitest';
import {
  applyStrainPenalty,
  calculateProductShares,
  normalizeLiquidProducts,
  processAlkylation,
  processFCC,
  processHydrocracker,
  processReformer,
  processSulfur
} from '../../../../src/simulation/processors/ProductionProcessor.js';

describe('ProductionProcessor', () => {
  describe('calculateProductShares', () => {
    const mockScenario = {
      qualityShift: 0,
      jetBias: 0,
      dieselBias: 0
    };

    it('should return all required shares', () => {
      const shares = calculateProductShares(mockScenario, 0.5);

      expect(shares).toHaveProperty('gas');
      expect(shares).toHaveProperty('naphtha');
      expect(shares).toHaveProperty('kerosene');
      expect(shares).toHaveProperty('diesel');
      expect(shares).toHaveProperty('heavy');
      expect(shares).toHaveProperty('resid');
    });

    it('should have shares sum to 1', () => {
      const shares = calculateProductShares(mockScenario, 0.5);
      const total = Object.values(shares).reduce((sum, val) => sum + val, 0);

      expect(total).toBeCloseTo(1, 5);
    });

    it('should favor gasoline with high focus', () => {
      const lowFocus = calculateProductShares(mockScenario, 0.2);
      const highFocus = calculateProductShares(mockScenario, 0.8);

      expect(highFocus.naphtha).toBeGreaterThan(lowFocus.naphtha);
      expect(highFocus.gas).toBeGreaterThan(lowFocus.gas);
    });

    it('should favor diesel with low focus', () => {
      const lowFocus = calculateProductShares(mockScenario, 0.2);
      const highFocus = calculateProductShares(mockScenario, 0.8);

      expect(lowFocus.diesel).toBeGreaterThan(highFocus.diesel);
    });

    it('should handle quality shifts', () => {
      const heavyScenario = { ...mockScenario, qualityShift: 0.1 };
      const shares = calculateProductShares(heavyScenario, 0.5);

      expect(shares.heavy + shares.resid).toBeGreaterThan(0.2);
    });

    it('should apply jet bias', () => {
      const jetScenario = { ...mockScenario, jetBias: 0.3 };
      const normalShares = calculateProductShares(mockScenario, 0.5);
      const jetShares = calculateProductShares(jetScenario, 0.5);

      expect(jetShares.kerosene).toBeGreaterThan(normalShares.kerosene);
    });
  });

  describe('processReformer', () => {
    const mockUpdateMode = () => {};

    it('should process naphtha feed correctly', () => {
      const context = {
        naphthaPool: 2,
        reformerState: {
          unit: { capacity: 60, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processReformer(context);

      expect(result).toHaveProperty('naphthaPool');
      expect(result).toHaveProperty('reformFeed');
      expect(result).toHaveProperty('gasoline');
      expect(result).toHaveProperty('hydrogen');
      expect(result).toHaveProperty('waste');
    });

    it('should produce mostly gasoline', () => {
      const context = {
        naphthaPool: 2,
        reformerState: {
          unit: { capacity: 60, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processReformer(context);

      expect(result.gasoline).toBeGreaterThan(result.hydrogen);
      expect(result.gasoline).toBeCloseTo(result.reformFeed * 0.92, 2);
    });

    it('should return zero production when offline', () => {
      const context = {
        naphthaPool: 2,
        reformerState: {
          unit: { capacity: 60, throughput: 0, utilization: 0 },
          online: false,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processReformer(context);

      expect(result.reformFeed).toBe(0);
      expect(result.gasoline).toBe(0);
    });

    it('should respect capacity limits', () => {
      const context = {
        naphthaPool: 100,
        reformerState: {
          unit: { capacity: 24, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processReformer(context);

      expect(result.reformFeed).toBeLessThanOrEqual(1);
    });
  });

  describe('processFCC', () => {
    const mockUpdateMode = () => {};

    it('should process heavy and resid feeds', () => {
      const context = {
        heavyPool: 1.5,
        residPool: 1,
        fccState: {
          unit: { capacity: 85, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processFCC(context);

      expect(result).toHaveProperty('heavyPool');
      expect(result).toHaveProperty('residPool');
      expect(result).toHaveProperty('gasoline');
      expect(result).toHaveProperty('diesel');
      expect(result).toHaveProperty('lpg');
    });

    it('should produce multiple products', () => {
      const context = {
        heavyPool: 2,
        residPool: 2,
        fccState: {
          unit: { capacity: 85, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processFCC(context);

      expect(result.gasoline).toBeGreaterThan(0);
      expect(result.diesel).toBeGreaterThan(0);
      expect(result.lpg).toBeGreaterThan(0);
    });

    it('should generate waste and flare', () => {
      const context = {
        heavyPool: 2,
        residPool: 1,
        fccState: {
          unit: { capacity: 85, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processFCC(context);

      expect(result).toHaveProperty('waste');
      expect(result).toHaveProperty('flare');
      expect(result.waste).toBeGreaterThan(0);
    });

    it('should return zero when offline', () => {
      const context = {
        heavyPool: 2,
        residPool: 1,
        fccState: {
          unit: { capacity: 85, throughput: 0, utilization: 0 },
          online: false,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processFCC(context);

      expect(result.fccFeed).toBe(0);
    });
  });

  describe('processHydrocracker', () => {
    const mockUpdateMode = () => {};

    it('should process multiple feed streams', () => {
      const context = {
        heavyPool: 2,
        residPool: 1,
        dieselPool: 1,
        hydroState: {
          unit: { capacity: 65, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processHydrocracker(context);

      expect(result).toHaveProperty('heavyPool');
      expect(result).toHaveProperty('residPool');
      expect(result).toHaveProperty('dieselPool');
      expect(result).toHaveProperty('gasoline');
      expect(result).toHaveProperty('diesel');
      expect(result).toHaveProperty('jet');
    });

    it('should produce jet fuel', () => {
      const context = {
        heavyPool: 2,
        residPool: 1,
        dieselPool: 0.5,
        hydroState: {
          unit: { capacity: 65, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processHydrocracker(context);

      expect(result.jet).toBeGreaterThan(0);
    });

    it('should produce hydrogen', () => {
      const context = {
        heavyPool: 2,
        residPool: 1,
        dieselPool: 0.5,
        hydroState: {
          unit: { capacity: 65, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processHydrocracker(context);

      expect(result).toHaveProperty('hydrogen');
      expect(result.hydrogen).toBeGreaterThan(0);
    });
  });

  describe('processAlkylation', () => {
    const mockUpdateMode = () => {};

    it('should process LPG feed', () => {
      const context = {
        lpgPool: 1,
        alkylationState: {
          unit: { capacity: 45, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processAlkylation(context);

      expect(result).toHaveProperty('lpgPool');
      expect(result).toHaveProperty('alkFeed');
      expect(result).toHaveProperty('gasoline');
    });

    it('should convert mostly to gasoline', () => {
      const context = {
        lpgPool: 1,
        alkylationState: {
          unit: { capacity: 45, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        pipelineMultiplier: 1,
        updateUnitMode: mockUpdateMode
      };

      const result = processAlkylation(context);

      expect(result.gasoline).toBeCloseTo(result.alkFeed * 0.88, 2);
    });
  });

  describe('processSulfur', () => {
    const mockUpdateMode = () => {};

    it('should process heavy and resid streams', () => {
      const context = {
        residPool: 1,
        heavyPool: 1,
        sulfurState: {
          unit: { capacity: 35, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        environmentParam: 0.5,
        updateUnitMode: mockUpdateMode
      };

      const result = processSulfur(context);

      expect(result).toHaveProperty('residPool');
      expect(result).toHaveProperty('heavyPool');
      expect(result).toHaveProperty('sulfur');
    });

    it('should remove more sulfur with higher environment param', () => {
      const lowEnv = {
        residPool: 1,
        heavyPool: 1,
        sulfurState: {
          unit: { capacity: 35, throughput: 0, utilization: 0 },
          online: true,
          throttle: 1
        },
        environmentParam: 0.2,
        updateUnitMode: mockUpdateMode
      };

      const highEnv = { ...lowEnv, environmentParam: 0.8 };

      const lowResult = processSulfur(lowEnv);
      const highResult = processSulfur(highEnv);

      expect(highResult.sulfur).toBeGreaterThan(lowResult.sulfur);
    });
  });

  describe('applyStrainPenalty', () => {
    const baseResult = {
      gasoline: 2,
      diesel: 1.5,
      jet: 1,
      lpg: 0.5,
      hydrogen: 0.1,
      waste: 0.1,
      sulfur: 0.05
    };

    it('should not modify with zero strain', () => {
      const result = applyStrainPenalty(baseResult, 0, 5);

      expect(result.gasoline).toBe(baseResult.gasoline);
      expect(result.flare).toBe(0);
    });

    it('should reduce production with strain', () => {
      const result = applyStrainPenalty(baseResult, 0.2, 5);

      expect(result.gasoline).toBeLessThan(baseResult.gasoline);
      expect(result.diesel).toBeLessThan(baseResult.diesel);
      expect(result.jet).toBeLessThan(baseResult.jet);
    });

    it('should add flare gas', () => {
      const result = applyStrainPenalty(baseResult, 0.2, 5);

      expect(result.flare).toBeGreaterThan(0);
    });
  });

  describe('normalizeLiquidProducts', () => {
    it('should not modify under limit', () => {
      const result = { gasoline: 2, diesel: 1, jet: 1, lpg: 0.3 };
      const normalized = normalizeLiquidProducts(result, 10);

      expect(normalized.gasoline).toBe(result.gasoline);
    });

    it('should scale down over limit', () => {
      const result = { gasoline: 8, diesel: 6, jet: 4, lpg: 0.3 };
      const normalized = normalizeLiquidProducts(result, 10);

      const total = normalized.gasoline + normalized.diesel + normalized.jet;
      expect(total).toBeLessThanOrEqual(10.2);
    });

    it('should cap LPG separately', () => {
      const result = { gasoline: 2, diesel: 1, jet: 1, lpg: 10 };
      const normalized = normalizeLiquidProducts(result, 10);

      expect(normalized.lpg).toBeLessThan(result.lpg);
    });
  });
});
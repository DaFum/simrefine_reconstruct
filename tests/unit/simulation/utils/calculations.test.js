import { describe, expect, it } from 'vitest';
import {
  applyStrainPenalties,
  calculateDistillationShares,
  calculateEffectiveCapacity,
  calculateEnvironmentPenalty,
  calculateProductPrices,
  calculateProductRevenue,
  capLiquidProducts,
  clamp,
  perDayToPerHour,
  perHourToPerDay,
  randomRange,
  round,
  updateUnitMetrics
} from '../../../../src/simulation/utils/calculations.js';

describe('Basic Utilities', () => {
  describe('clamp', () => {
    it('should clamp values to min', () => {
      expect(clamp(5, 10, 20)).toBe(10);
      expect(clamp(-5, 0, 100)).toBe(0);
    });

    it('should clamp values to max', () => {
      expect(clamp(25, 10, 20)).toBe(20);
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('should return value when in range', () => {
      expect(clamp(15, 10, 20)).toBe(15);
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
      expect(clamp(15, 10, 10)).toBe(10);
    });
  });

  describe('randomRange', () => {
    it('should return values within range', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomRange(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThanOrEqual(20);
      }
    });

    it('should handle zero-width ranges', () => {
      const value = randomRange(5, 5);
      expect(value).toBe(5);
    });

    it('should handle negative ranges', () => {
      for (let i = 0; i < 100; i++) {
        const value = randomRange(-20, -10);
        expect(value).toBeGreaterThanOrEqual(-20);
        expect(value).toBeLessThanOrEqual(-10);
      }
    });
  });

  describe('Time Conversions', () => {
    it('should convert per-day to per-hour correctly', () => {
      expect(perDayToPerHour(24)).toBe(1);
      expect(perDayToPerHour(120)).toBeCloseTo(5, 2);
      expect(perDayToPerHour(0)).toBe(0);
    });

    it('should convert per-hour to per-day correctly', () => {
      expect(perHourToPerDay(1)).toBe(24);
      expect(perHourToPerDay(5)).toBeCloseTo(120, 2);
      expect(perHourToPerDay(0)).toBe(0);
    });

    it('should be inverse operations', () => {
      const original = 100;
      const converted = perHourToPerDay(perDayToPerHour(original));
      expect(converted).toBeCloseTo(original, 5);
    });
  });

  describe('round', () => {
    it('should round to 2 decimal places', () => {
      expect(round(1.234567)).toBe(1.23);
      expect(round(1.235)).toBe(1.24);
      expect(round(1.999)).toBe(2);
    });

    it('should handle whole numbers', () => {
      expect(round(5)).toBe(5);
      expect(round(0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(round(-1.234567)).toBe(-1.23);
      expect(round(-1.235)).toBe(-1.24);
    });
  });
});

describe('calculateDistillationShares', () => {
  const mockScenario = {
    jetBias: 0,
    dieselBias: 0,
    qualityShift: 0
  };

  it('should return valid share object', () => {
    const shares = calculateDistillationShares(0.5, mockScenario);

    expect(shares).toHaveProperty('gas');
    expect(shares).toHaveProperty('naphtha');
    expect(shares).toHaveProperty('kerosene');
    expect(shares).toHaveProperty('diesel');
    expect(shares).toHaveProperty('heavy');
    expect(shares).toHaveProperty('resid');
  });

  it('should have shares sum to approximately 1', () => {
    const shares = calculateDistillationShares(0.5, mockScenario);
    const total = shares.gas + shares.naphtha + shares.kerosene +
                  shares.diesel + shares.heavy + shares.resid;

    expect(total).toBeCloseTo(1, 5);
  });

  it('should shift to gasoline with high focus', () => {
    const lowFocus = calculateDistillationShares(0.1, mockScenario);
    const highFocus = calculateDistillationShares(0.9, mockScenario);

    expect(highFocus.naphtha).toBeGreaterThan(lowFocus.naphtha);
  });

  it('should shift to diesel with low focus', () => {
    const lowFocus = calculateDistillationShares(0.1, mockScenario);
    const highFocus = calculateDistillationShares(0.9, mockScenario);

    expect(lowFocus.diesel).toBeGreaterThan(highFocus.diesel);
  });

  it('should handle quality shifts', () => {
    const heavyScenario = { ...mockScenario, qualityShift: 0.1 };
    const shares = calculateDistillationShares(0.5, heavyScenario);

    expect(shares.heavy).toBeGreaterThan(0.15);
    expect(shares.resid).toBeGreaterThan(0.05);
  });

  it('should apply scenario biases', () => {
    const jetScenario = { ...mockScenario, jetBias: 0.3 };
    const shares = calculateDistillationShares(0.5, jetScenario);

    expect(shares.kerosene).toBeGreaterThan(0.11);
  });
});

describe('calculateEffectiveCapacity', () => {
  it('should return zero for offline unit', () => {
    const unitState = {
      unit: { capacity: 100 },
      online: false,
      throttle: 1
    };

    expect(calculateEffectiveCapacity(unitState)).toBe(0);
  });

  it('should return zero for null unit', () => {
    const unitState = {
      unit: null,
      online: true,
      throttle: 1
    };

    expect(calculateEffectiveCapacity(unitState)).toBe(0);
  });

  it('should calculate capacity for online unit', () => {
    const unitState = {
      unit: { capacity: 24 },
      online: true,
      throttle: 1
    };

    expect(calculateEffectiveCapacity(unitState)).toBeCloseTo(1, 2);
  });

  it('should apply throttle multiplier', () => {
    const unitState = {
      unit: { capacity: 24 },
      online: true,
      throttle: 1.2
    };

    expect(calculateEffectiveCapacity(unitState)).toBeCloseTo(1.2, 2);
  });

  it('should clamp throttle to maximum', () => {
    const unitState = {
      unit: { capacity: 24 },
      online: true,
      throttle: 5
    };

    expect(calculateEffectiveCapacity(unitState)).toBeCloseTo(1.2, 2);
  });
});

describe('updateUnitMetrics', () => {
  it('should update throughput and utilization', () => {
    const unit = { capacity: 100, throughput: 0, utilization: 0 };
    updateUnitMetrics(unit, 2);

    expect(unit.throughput).toBeCloseTo(48, 1);
    expect(unit.utilization).toBeCloseTo(0.48, 2);
  });

  it('should handle zero capacity', () => {
    const unit = { capacity: 0, throughput: 0, utilization: 0 };
    updateUnitMetrics(unit, 1);

    expect(unit.utilization).toBe(0);
  });

  it('should call update mode function if provided', () => {
    const unit = { capacity: 100, throughput: 0, utilization: 0 };
    let modeCalled = false;
    const updateMode = () => { modeCalled = true; };

    updateUnitMetrics(unit, 2, updateMode);
    expect(modeCalled).toBe(true);
  });

  it('should handle null unit gracefully', () => {
    expect(() => updateUnitMetrics(null, 2)).not.toThrow();
  });
});

describe('calculateEnvironmentPenalty', () => {
  const baseParams = {
    result: { gasoline: 2, diesel: 1, jet: 1, waste: 0.5 },
    incidentsCount: 0,
    crudeThroughput: 5,
    environmentLevel: 0.5,
    scenario: { environmentPressure: 0.2 }
  };

  it('should return penalty object', () => {
    const result = calculateEnvironmentPenalty(baseParams);

    expect(result).toHaveProperty('carbonPerHour');
    expect(result).toHaveProperty('carbonIntensity');
    expect(result).toHaveProperty('envExcess');
    expect(result).toHaveProperty('penalty');
  });

  it('should calculate carbon emissions', () => {
    const result = calculateEnvironmentPenalty(baseParams);

    expect(result.carbonPerHour).toBeGreaterThan(0);
    expect(typeof result.carbonIntensity).toBe('number');
  });

  it('should increase penalty with more waste', () => {
    const highWaste = {
      ...baseParams,
      result: { ...baseParams.result, waste: 2 }
    };

    const normalResult = calculateEnvironmentPenalty(baseParams);
    const highWasteResult = calculateEnvironmentPenalty(highWaste);

    expect(highWasteResult.carbonPerHour).toBeGreaterThan(normalResult.carbonPerHour);
  });

  it('should reduce penalty with higher environment level', () => {
    const lowEnv = { ...baseParams, environmentLevel: 0.2 };
    const highEnv = { ...baseParams, environmentLevel: 0.8 };

    const lowResult = calculateEnvironmentPenalty(lowEnv);
    const highResult = calculateEnvironmentPenalty(highEnv);

    expect(lowResult.carbonPerHour).toBeGreaterThan(highResult.carbonPerHour);
  });

  it('should handle zero production', () => {
    const zeroProduction = {
      ...baseParams,
      result: { gasoline: 0, diesel: 0, jet: 0, waste: 0 }
    };

    const result = calculateEnvironmentPenalty(zeroProduction);
    expect(result.penalty).toBe(0);
  });
});

describe('calculateProductPrices', () => {
  const basePrices = { gasoline: 100, diesel: 90, jet: 120, lpg: 50 };
  const mockScenario = {
    priceModifier: 1,
    gasolineBias: 0,
    dieselBias: 0,
    jetBias: 0
  };

  it('should return prices for all products', () => {
    const prices = calculateProductPrices(basePrices, mockScenario);

    expect(prices).toHaveProperty('gasoline');
    expect(prices).toHaveProperty('diesel');
    expect(prices).toHaveProperty('jet');
    expect(prices).toHaveProperty('lpg');
  });

  it('should apply price modifier', () => {
    const scenario = { ...mockScenario, priceModifier: 1.1 };
    const prices = calculateProductPrices(basePrices, scenario);

    expect(prices.gasoline).toBeCloseTo(110, 1);
  });

  it('should apply gasoline bias', () => {
    const scenario = { ...mockScenario, gasolineBias: 0.2 };
    const prices = calculateProductPrices(basePrices, scenario);

    expect(prices.gasoline).toBeGreaterThan(basePrices.gasoline);
  });

  it('should apply diesel bias', () => {
    const scenario = { ...mockScenario, dieselBias: 0.15 };
    const prices = calculateProductPrices(basePrices, scenario);

    expect(prices.diesel).toBeGreaterThan(basePrices.diesel);
  });

  it('should apply jet bias', () => {
    const scenario = { ...mockScenario, jetBias: 0.25 };
    const prices = calculateProductPrices(basePrices, scenario);

    expect(prices.jet).toBeGreaterThan(basePrices.jet);
  });
});

describe('calculateProductRevenue', () => {
  const production = { gasoline: 2, diesel: 1.5, jet: 1, lpg: 0.5 };
  const prices = { gasoline: 100, diesel: 90, jet: 120, lpg: 50 };

  it('should calculate total revenue', () => {
    const revenue = calculateProductRevenue(production, prices);

    expect(revenue).toBeCloseTo(200 + 135 + 120 + 25, 1);
  });

  it('should return zero for zero production', () => {
    const zeroProduction = { gasoline: 0, diesel: 0, jet: 0, lpg: 0 };
    const revenue = calculateProductRevenue(zeroProduction, prices);

    expect(revenue).toBe(0);
  });

  it('should scale with production', () => {
    const doubleProduction = {
      gasoline: 4,
      diesel: 3,
      jet: 2,
      lpg: 1
    };

    const normalRevenue = calculateProductRevenue(production, prices);
    const doubleRevenue = calculateProductRevenue(doubleProduction, prices);

    expect(doubleRevenue).toBeCloseTo(normalRevenue * 2, 1);
  });
});

describe('applyStrainPenalties', () => {
  const baseResult = {
    gasoline: 2,
    diesel: 1.5,
    jet: 1,
    lpg: 0.5,
    waste: 0.1
  };

  it('should not modify result with zero strain', () => {
    const result = applyStrainPenalties(baseResult, 0, 5);

    expect(result.gasoline).toBe(baseResult.gasoline);
    expect(result.diesel).toBe(baseResult.diesel);
  });

  it('should reduce production with strain', () => {
    const result = applyStrainPenalties(baseResult, 0.2, 5);

    expect(result.gasoline).toBeLessThan(baseResult.gasoline);
    expect(result.diesel).toBeLessThan(baseResult.diesel);
    expect(result.jet).toBeLessThan(baseResult.jet);
  });

  it('should increase waste with strain', () => {
    const result = applyStrainPenalties(baseResult, 0.2, 5);

    expect(result.waste).toBeGreaterThan(baseResult.waste);
  });

  it('should add flare component', () => {
    const result = applyStrainPenalties(baseResult, 0.2, 5);

    expect(result).toHaveProperty('flareAddition');
    expect(result.flareAddition).toBeGreaterThan(0);
  });

  it('should clamp strain penalty', () => {
    const extremeResult = applyStrainPenalties(baseResult, 1.0, 5);
    const cappedResult = applyStrainPenalties(baseResult, 0.4, 5);

    expect(extremeResult.gasoline).toBe(cappedResult.gasoline);
  });
});

describe('capLiquidProducts', () => {
  it('should not modify products under limit', () => {
    const result = { gasoline: 2, diesel: 1.5, jet: 1, lpg: 0.3 };
    const capped = capLiquidProducts(result, 10);

    expect(capped.gasoline).toBe(result.gasoline);
    expect(capped.diesel).toBe(result.diesel);
    expect(capped.jet).toBe(result.jet);
  });

  it('should scale down products over limit', () => {
    const result = { gasoline: 8, diesel: 6, jet: 4, lpg: 0.3 };
    const capped = capLiquidProducts(result, 10);

    const totalCapped = capped.gasoline + capped.diesel + capped.jet;
    expect(totalCapped).toBeLessThanOrEqual(10.2);
  });

  it('should maintain product ratios when scaling', () => {
    const result = { gasoline: 8, diesel: 4, jet: 4, lpg: 0.3 };
    const capped = capLiquidProducts(result, 10);

    const originalRatio = result.gasoline / result.diesel;
    const cappedRatio = capped.gasoline / capped.diesel;

    expect(cappedRatio).toBeCloseTo(originalRatio, 2);
  });

  it('should cap LPG independently', () => {
    const result = { gasoline: 2, diesel: 1, jet: 1, lpg: 5 };
    const capped = capLiquidProducts(result, 10);

    expect(capped.lpg).toBeLessThan(result.lpg);
    // 10 * 0.12 = 1.2 is the max LPG
    expect(capped.lpg).toBeLessThanOrEqual(1.2000001);
  });
});
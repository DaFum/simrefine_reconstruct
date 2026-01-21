import { describe, expect, it } from 'vitest';
import {
  calculateEnvironmentMetrics,
  formatEnvironmentWarning,
  getEnvironmentWarningSeverity,
  shouldLogEnvironmentWarning
} from '../../../../src/simulation/processors/EnvironmentProcessor.js';

describe('EnvironmentProcessor', () => {
  describe('calculateEnvironmentMetrics', () => {
    const baseContext = {
      production: { gasoline: 2, diesel: 1.5, jet: 1, waste: 0.5 },
      incidents: 0,
      environmentLevel: 0.5,
      scenario: { environmentPressure: 0.2 },
      crudeThroughput: 5
    };

    it('should return all required metrics', () => {
      const result = calculateEnvironmentMetrics(baseContext);

      expect(result).toHaveProperty('carbonPerHour');
      expect(result).toHaveProperty('carbonPerDay');
      expect(result).toHaveProperty('carbonIntensity');
      expect(result).toHaveProperty('environmentTarget');
      expect(result).toHaveProperty('envExcess');
      expect(result).toHaveProperty('environmentPenalty');
    });

    it('should calculate carbon emissions', () => {
      const result = calculateEnvironmentMetrics(baseContext);

      expect(typeof result.carbonPerHour).toBe('number');
      expect(result.carbonPerHour).toBeGreaterThan(0);
      expect(result.carbonPerDay).toBe(result.carbonPerHour * 24);
    });

    it('should calculate carbon intensity', () => {
      const result = calculateEnvironmentMetrics(baseContext);

      expect(typeof result.carbonIntensity).toBe('number');
      expect(result.carbonIntensity).toBeGreaterThanOrEqual(0);
    });

    it('should reduce emissions with higher environment level', () => {
      const lowEnv = { ...baseContext, environmentLevel: 0.2 };
      const highEnv = { ...baseContext, environmentLevel: 0.8 };

      const lowResult = calculateEnvironmentMetrics(lowEnv);
      const highResult = calculateEnvironmentMetrics(highEnv);

      expect(lowResult.carbonPerHour).toBeGreaterThan(highResult.carbonPerHour);
    });

    it('should increase emissions with more waste', () => {
      const lowWaste = {
        ...baseContext,
        production: { ...baseContext.production, waste: 0.1 }
      };
      const highWaste = {
        ...baseContext,
        production: { ...baseContext.production, waste: 2.0 }
      };

      const lowResult = calculateEnvironmentMetrics(lowWaste);
      const highResult = calculateEnvironmentMetrics(highWaste);

      expect(highResult.carbonPerHour).toBeGreaterThan(lowResult.carbonPerHour);
    });

    it('should increase emissions with incidents', () => {
      const noIncidents = { ...baseContext, incidents: 0 };
      const withIncidents = { ...baseContext, incidents: 3 };

      const noIncidentsResult = calculateEnvironmentMetrics(noIncidents);
      const withIncidentsResult = calculateEnvironmentMetrics(withIncidents);

      expect(withIncidentsResult.carbonPerHour).toBeGreaterThan(noIncidentsResult.carbonPerHour);
    });

    it('should calculate environment target', () => {
      const result = calculateEnvironmentMetrics(baseContext);

      expect(result.environmentTarget).toBeGreaterThan(0);
      expect(result.environmentTarget).toBeLessThan(1);
    });

    it('should calculate excess emissions', () => {
      const result = calculateEnvironmentMetrics(baseContext);

      expect(typeof result.envExcess).toBe('number');
      expect(result.envExcess).toBeGreaterThanOrEqual(0);
    });

    it('should apply penalty when over target', () => {
      const highEmissions = {
        ...baseContext,
        production: { gasoline: 4, diesel: 3, jet: 2, waste: 2 },
        environmentLevel: 0.1
      };

      const result = calculateEnvironmentMetrics(highEmissions);

      if (result.envExcess > 0) {
        expect(result.environmentPenalty).toBeGreaterThan(0);
      }
    });

    it('should have no penalty when under target', () => {
      const lowEmissions = {
        ...baseContext,
        production: { gasoline: 0.5, diesel: 0.5, jet: 0.5, waste: 0.05 },
        environmentLevel: 0.9
      };

      const result = calculateEnvironmentMetrics(lowEmissions);

      expect(result.environmentPenalty).toBe(0);
    });

    it('should increase penalty with higher excess', () => {
      const moderateExcess = {
        ...baseContext,
        production: { gasoline: 3, diesel: 2, jet: 1.5, waste: 1 },
        environmentLevel: 0.2
      };

      const highExcess = {
        ...baseContext,
        production: { gasoline: 5, diesel: 4, jet: 3, waste: 2.5 },
        environmentLevel: 0.1
      };

      const moderateResult = calculateEnvironmentMetrics(moderateExcess);
      const highResult = calculateEnvironmentMetrics(highExcess);

      if (moderateResult.envExcess > 0 && highResult.envExcess > 0) {
        expect(highResult.environmentPenalty).toBeGreaterThan(moderateResult.environmentPenalty);
      }
    });

    it('should handle zero production', () => {
      const zeroProduction = {
        ...baseContext,
        production: { gasoline: 0, diesel: 0, jet: 0, waste: 0 }
      };

      const result = calculateEnvironmentMetrics(zeroProduction);

      expect(result.carbonPerHour).toBeGreaterThanOrEqual(0);
      expect(result.environmentPenalty).toBe(0);
    });

    it('should apply scenario environment pressure', () => {
      const lowPressure = {
        ...baseContext,
        scenario: { environmentPressure: 0.1 }
      };
      const highPressure = {
        ...baseContext,
        scenario: { environmentPressure: 0.5 }
      };

      const lowResult = calculateEnvironmentMetrics(lowPressure);
      const highResult = calculateEnvironmentMetrics(highPressure);

      expect(highResult.environmentTarget).toBeGreaterThan(lowResult.environmentTarget);
    });
  });

  describe('shouldLogEnvironmentWarning', () => {
    it('should return true when penalty is high and cooldown expired', () => {
      const result = shouldLogEnvironmentWarning(5, 0.1, 0);
      expect(result).toBe(true);
    });

    it('should return false when penalty is low', () => {
      const result = shouldLogEnvironmentWarning(2, 0.1, 0);
      expect(result).toBe(false);
    });

    it('should return false when cooldown active', () => {
      const result = shouldLogEnvironmentWarning(5, 0.1, 10);
      expect(result).toBe(false);
    });

    it('should return true at threshold', () => {
      // Threshold is penalty > 4
      const result = shouldLogEnvironmentWarning(5, 0.05, 0);
      expect(result).toBe(true);
    });

    it('should handle zero values', () => {
      const result = shouldLogEnvironmentWarning(0, 0, 0);
      expect(result).toBe(false);
    });
  });

  describe('getEnvironmentWarningSeverity', () => {
    it('should return warning for high excess', () => {
      const severity = getEnvironmentWarningSeverity(0.1);
      expect(severity).toBe('warning');
    });

    it('should return info for moderate excess', () => {
      const severity = getEnvironmentWarningSeverity(0.05);
      expect(severity).toBe('info');
    });

    it('should return info for low excess', () => {
      const severity = getEnvironmentWarningSeverity(0.01);
      expect(severity).toBe('info');
    });

    it('should handle zero excess', () => {
      const severity = getEnvironmentWarningSeverity(0);
      expect(severity).toBe('info');
    });

    it('should handle negative values', () => {
      const severity = getEnvironmentWarningSeverity(-0.05);
      expect(severity).toBe('info');
    });
  });

  describe('formatEnvironmentWarning', () => {
    it('should format warning message correctly', () => {
      const message = formatEnvironmentWarning(5.5, 0.35);

      expect(typeof message).toBe('string');
      expect(message).toContain('5.5');
      expect(message).toContain('35.0');
      expect(message.toLowerCase()).toContain('environmental');
    });

    it('should handle small penalty values', () => {
      const message = formatEnvironmentWarning(0.5, 0.15);

      expect(message).toContain('0.5');
      expect(message).toContain('15.0');
    });

    it('should handle large penalty values', () => {
      const message = formatEnvironmentWarning(50.8, 0.85);

      expect(message).toContain('50.8');
      expect(message).toContain('85.0');
    });

    it('should handle zero penalty', () => {
      const message = formatEnvironmentWarning(0, 0);

      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });

    it('should include intensity percentage', () => {
      const message = formatEnvironmentWarning(10, 0.42);

      expect(message).toContain('%');
      expect(message).toContain('42.0');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme environment levels', () => {
      const extreme = {
        production: { gasoline: 2, diesel: 1, jet: 1, waste: 0.5 },
        incidents: 0,
        environmentLevel: 1.5,
        scenario: { environmentPressure: 0.2 },
        crudeThroughput: 5
      };

      const result = calculateEnvironmentMetrics(extreme);
      expect(result.carbonPerHour).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative incidents gracefully', () => {
      const negative = {
        production: { gasoline: 2, diesel: 1, jet: 1, waste: 0.5 },
        incidents: -1,
        environmentLevel: 0.5,
        scenario: { environmentPressure: 0.2 },
        crudeThroughput: 5
      };

      expect(() => calculateEnvironmentMetrics(negative)).not.toThrow();
    });

    it('should handle very high waste levels', () => {
      const highWaste = {
        production: { gasoline: 1, diesel: 1, jet: 1, waste: 100 },
        incidents: 0,
        environmentLevel: 0.5,
        scenario: { environmentPressure: 0.2 },
        crudeThroughput: 5
      };

      const result = calculateEnvironmentMetrics(highWaste);
      expect(result.carbonPerHour).toBeGreaterThan(0);
      expect(Number.isFinite(result.carbonPerHour)).toBe(true);
    });
  });
});
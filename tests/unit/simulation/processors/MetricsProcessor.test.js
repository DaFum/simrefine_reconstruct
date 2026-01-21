import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildRecorderContext,
  buildScorecardContext,
  updateEconomyMetrics,
  updateFinancialMetrics,
  updateFlowMetrics,
  updateOperationalMetrics,
  updateProductionMetrics
} from '../../../../src/simulation/processors/MetricsProcessor.js';

describe('MetricsProcessor', () => {
  describe('updateProductionMetrics', () => {
    let metrics;

    beforeEach(() => {
      metrics = {
        gasoline: 0,
        diesel: 0,
        jet: 0,
        lpg: 0,
        waste: 0
      };
    });

    it('should update production metrics', () => {
      const production = {
        gasoline: 2.5,
        diesel: 1.8,
        jet: 1.2,
        lpg: 0.6,
        waste: 0.3
      };

      updateProductionMetrics(metrics, production);

      expect(metrics.gasoline).toBeCloseTo(60, 1);
      expect(metrics.diesel).toBeCloseTo(43.2, 1);
      expect(metrics.jet).toBeCloseTo(28.8, 1);
      expect(metrics.lpg).toBeCloseTo(14.4, 1);
    });

    it('should convert per-hour to per-day rates', () => {
      const production = {
        gasoline: 1,
        diesel: 1,
        jet: 1,
        lpg: 1,
        waste: 1
      };

      updateProductionMetrics(metrics, production);

      expect(metrics.gasoline).toBe(24);
      expect(metrics.diesel).toBe(24);
      expect(metrics.jet).toBe(24);
    });

    it('should handle zero production', () => {
      const production = {
        gasoline: 0,
        diesel: 0,
        jet: 0,
        lpg: 0,
        waste: 0
      };

      updateProductionMetrics(metrics, production);

      expect(metrics.gasoline).toBe(0);
      expect(metrics.diesel).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const production = {
        gasoline: 0.123456,
        diesel: 0.987654,
        jet: 1.111111,
        lpg: 0.555555,
        waste: 0.1
      };

      updateProductionMetrics(metrics, production);

      expect(metrics.gasoline).toBe(2.96);
      expect(metrics.diesel).toBe(23.70);
    });
  });

  describe('updateFinancialMetrics', () => {
    let metrics;

    beforeEach(() => {
      metrics = {
        crudeCostPerBbl: 0,
        profitPerHour: 0,
        revenuePerDay: 0,
        expensePerDay: 0,
        operatingExpensePerDay: 0,
        crudeExpensePerDay: 0,
        penaltyPerDay: 0,
        marginMultiplier: 0,
        storageThrottle: 0
      };
    });

    it('should update financial metrics', () => {
      const financial = {
        crudeCostPerBbl: 75,
        profitPerHour: 100,
        revenuePerHour: 500,
        expensePerHour: 400,
        operatingExpensePerHour: 300,
        crudeExpensePerHour: 200,
        penaltyPerHour: 50,
        marginMultiplier: 1.2,
        storageThrottle: 0.9
      };

      updateFinancialMetrics(metrics, financial);

      expect(metrics.crudeCostPerBbl).toBe(75);
      expect(metrics.profitPerHour).toBe(100);
      expect(metrics.revenuePerDay).toBe(12000);
      expect(metrics.expensePerDay).toBe(9600);
    });

    it('should convert hourly rates to daily', () => {
      const financial = {
        crudeCostPerBbl: 70,
        profitPerHour: 50,
        revenuePerHour: 200,
        expensePerHour: 150,
        operatingExpensePerHour: 100,
        crudeExpensePerHour: 80,
        penaltyPerHour: 20,
        marginMultiplier: 1.0,
        storageThrottle: 1.0
      };

      updateFinancialMetrics(metrics, financial);

      expect(metrics.revenuePerDay).toBe(4800);
      expect(metrics.operatingExpensePerDay).toBe(2400);
      expect(metrics.penaltyPerDay).toBe(480);
    });

    it('should handle negative profit', () => {
      const financial = {
        crudeCostPerBbl: 80,
        profitPerHour: -25,
        revenuePerHour: 100,
        expensePerHour: 125,
        operatingExpensePerHour: 100,
        crudeExpensePerHour: 90,
        penaltyPerHour: 10,
        marginMultiplier: 0.8,
        storageThrottle: 0.7
      };

      updateFinancialMetrics(metrics, financial);

      expect(metrics.profitPerHour).toBe(-25);
      expect(metrics.marginMultiplier).toBe(0.8);
    });
  });

  describe('updateEconomyMetrics', () => {
    let metrics;

    beforeEach(() => {
      metrics = {
        futuresGasoline: 0,
        futuresDiesel: 0,
        futuresJet: 0,
        costGasoline: 0,
        costDiesel: 0,
        costJet: 0,
        basisGasoline: 0,
        basisDiesel: 0,
        basisJet: 0
      };
    });

    it('should update economy metrics', () => {
      const economy = {
        futures: { gasoline: 100, diesel: 90, jet: 120 },
        productionCost: { gasoline: 75, diesel: 70, jet: 95 },
        basis: { gasoline: 0.25, diesel: 0.22, jet: 0.26 }
      };

      updateEconomyMetrics(metrics, economy);

      expect(metrics.futuresGasoline).toBe(100);
      expect(metrics.costGasoline).toBe(75);
      expect(metrics.basisGasoline).toBe(0.25);
    });

    it('should handle all product types', () => {
      const economy = {
        futures: { gasoline: 110, diesel: 95, jet: 130 },
        productionCost: { gasoline: 80, diesel: 75, jet: 100 },
        basis: { gasoline: 0.3, diesel: 0.25, jet: 0.3 }
      };

      updateEconomyMetrics(metrics, economy);

      expect(metrics.futuresDiesel).toBe(95);
      expect(metrics.costDiesel).toBe(75);
      expect(metrics.futuresJet).toBe(130);
    });
  });

  describe('updateOperationalMetrics', () => {
    let metrics;

    beforeEach(() => {
      metrics = {
        incidents: 0,
        reliability: 0,
        operationalStrain: 0,
        carbon: 0,
        flareLevel: 0
      };
    });

    it('should update operational metrics', () => {
      const operational = {
        incidents: 2,
        reliability: 0.95,
        operationalStrain: 0.35,
        carbon: 150,
        flareLevel: 0.15,
        crudeThroughput: 120,
        waste: 5,
        flare: 2
      };

      updateOperationalMetrics(metrics, operational);

      expect(metrics.incidents).toBe(2);
      expect(metrics.reliability).toBe(0.95);
      expect(metrics.operationalStrain).toBe(0.35);
      expect(metrics.carbon).toBe(150);
    });

    it('should round operational strain', () => {
      const operational = {
        incidents: 0,
        reliability: 1.0,
        operationalStrain: 0.456789,
        carbon: 100,
        flareLevel: 0.1,
        crudeThroughput: 100,
        waste: 3,
        flare: 1
      };

      updateOperationalMetrics(metrics, operational);

      expect(metrics.operationalStrain).toBe(0.46);
    });

    it('should calculate flare level', () => {
      const operational = {
        incidents: 0,
        reliability: 1.0,
        operationalStrain: 0.2,
        carbon: 100,
        flareLevel: 0,
        crudeThroughput: 100,
        waste: 10,
        flare: 5
      };

      updateOperationalMetrics(metrics, operational);

      expect(metrics.flareLevel).toBeGreaterThan(0);
      expect(metrics.flareLevel).toBeLessThanOrEqual(1);
    });

    it('should clamp flare level to 0-1', () => {
      const operational = {
        incidents: 0,
        reliability: 1.0,
        operationalStrain: 0.5,
        carbon: 200,
        flareLevel: 0,
        crudeThroughput: 10,
        waste: 50,
        flare: 30
      };

      updateOperationalMetrics(metrics, operational);

      expect(metrics.flareLevel).toBeGreaterThanOrEqual(0);
      expect(metrics.flareLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('updateFlowMetrics', () => {
    let flows;

    beforeEach(() => {
      flows = {
        toReformer: 0,
        toCracker: 0,
        toHydrocracker: 0,
        toAlkylation: 0,
        toExport: 0
      };
    });

    it('should update flow metrics', () => {
      const flowData = {
        reformFeed: 2.5,
        fccFeed: 3.2,
        hydroFeed: 1.8,
        alkFeed: 0.9,
        gasoline: 4.0,
        diesel: 3.0,
        jet: 2.0
      };

      updateFlowMetrics(flows, flowData);

      expect(flows.toReformer).toBe(2.5);
      expect(flows.toCracker).toBe(3.2);
      expect(flows.toHydrocracker).toBe(1.8);
      expect(flows.toAlkylation).toBe(0.9);
      expect(flows.toExport).toBe(9.0);
    });

    it('should calculate export as sum of products', () => {
      const flowData = {
        reformFeed: 1,
        fccFeed: 1,
        hydroFeed: 1,
        alkFeed: 1,
        gasoline: 5,
        diesel: 3,
        jet: 2
      };

      updateFlowMetrics(flows, flowData);

      expect(flows.toExport).toBe(10);
    });

    it('should handle zero flows', () => {
      const flowData = {
        reformFeed: 0,
        fccFeed: 0,
        hydroFeed: 0,
        alkFeed: 0,
        gasoline: 0,
        diesel: 0,
        jet: 0
      };

      updateFlowMetrics(flows, flowData);

      expect(flows.toExport).toBe(0);
    });
  });

  describe('buildScorecardContext', () => {
    it('should build complete scorecard context', () => {
      const input = {
        profitPerHour: 150,
        crudeThroughput: 120,
        incidents: 1,
        reliability: 0.98,
        carbon: 180,
        gasoline: 60,
        diesel: 40,
        jet: 25,
        shipmentReliability: 0.95,
        strainFactor: 0.25
      };

      const context = buildScorecardContext(input);

      expect(context).toHaveProperty('profitPerHour', 150);
      expect(context).toHaveProperty('crudeThroughput', 120);
      expect(context).toHaveProperty('incidents', 1);
      expect(context).toHaveProperty('reliability', 0.98);
      expect(context).toHaveProperty('carbon', 180);
      expect(context).toHaveProperty('shipmentScore', 0.95);
      expect(context).toHaveProperty('strain', 0.25);
    });

    it('should include production values', () => {
      const input = {
        profitPerHour: 100,
        crudeThroughput: 100,
        incidents: 0,
        reliability: 1.0,
        carbon: 150,
        gasoline: 50,
        diesel: 35,
        jet: 20,
        shipmentReliability: 1.0,
        strainFactor: 0.1
      };

      const context = buildScorecardContext(input);

      expect(context.gasoline).toBe(50);
      expect(context.diesel).toBe(35);
      expect(context.jet).toBe(20);
    });
  });

  describe('buildRecorderContext', () => {
    it('should build complete recorder context', () => {
      const input = {
        hours: 24,
        production: { gasoline: 60, diesel: 45, jet: 30 },
        profitPerHour: 120,
        penalty: 15,
        incidents: 1,
        reliability: 0.97,
        carbon: 170,
        logistics: { shipments: [], storage: {} }
      };

      const context = buildRecorderContext(input);

      expect(context).toHaveProperty('hours', 24);
      expect(context).toHaveProperty('production');
      expect(context).toHaveProperty('profitPerHour', 120);
      expect(context).toHaveProperty('penalty', 15);
      expect(context).toHaveProperty('incidents', 1);
      expect(context).toHaveProperty('reliability', 0.97);
      expect(context).toHaveProperty('carbon', 170);
      expect(context).toHaveProperty('logistics');
    });

    it('should include all fields', () => {
      const input = {
        hours: 48,
        production: { gasoline: 120, diesel: 90, jet: 60 },
        profitPerHour: 200,
        penalty: 25,
        incidents: 2,
        reliability: 0.94,
        carbon: 200,
        logistics: { shipments: [1, 2], storage: { gasoline: 100 } }
      };

      const context = buildRecorderContext(input);

      expect(context.hours).toBe(48);
      expect(context.production.gasoline).toBe(120);
      expect(context.logistics.shipments.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined metrics object', () => {
      const production = { gasoline: 1, diesel: 1, jet: 1, lpg: 1, waste: 0 };
      const metrics = {};

      expect(() => updateProductionMetrics(metrics, production)).not.toThrow();
      expect(metrics.gasoline).toBeDefined();
    });

    it('should handle very large numbers', () => {
      const metrics = {};
      const production = {
        gasoline: 1000,
        diesel: 1000,
        jet: 1000,
        lpg: 1000,
        waste: 1000
      };

      updateProductionMetrics(metrics, production);

      expect(metrics.gasoline).toBe(24000);
      expect(Number.isFinite(metrics.gasoline)).toBe(true);
    });

    it('should handle very small numbers', () => {
      const metrics = {};
      const production = {
        gasoline: 0.0001,
        diesel: 0.0002,
        jet: 0.0003,
        lpg: 0.0001,
        waste: 0.0001
      };

      updateProductionMetrics(metrics, production);

      expect(metrics.gasoline).toBeCloseTo(0, 2);
      expect(Number.isFinite(metrics.gasoline)).toBe(true);
    });
  });
});
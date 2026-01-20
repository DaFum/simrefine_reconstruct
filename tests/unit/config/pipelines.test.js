import { describe, it, expect } from 'vitest';
import { PIPELINE_CONFIGS } from '../../../src/config/pipelines.js';

describe('PIPELINE_CONFIGS', () => {
  describe('Configuration Structure', () => {
    it('should export an array of pipeline configurations', () => {
      expect(Array.isArray(PIPELINE_CONFIGS)).toBe(true);
      expect(PIPELINE_CONFIGS.length).toBeGreaterThan(0);
    });

    it('should have exactly 5 pipeline configurations', () => {
      expect(PIPELINE_CONFIGS.length).toBe(5);
    });

    it('should have unique IDs for all pipelines', () => {
      const ids = PIPELINE_CONFIGS.map(config => config.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique metrics for all pipelines', () => {
      const metrics = PIPELINE_CONFIGS.map(config => config.metric);
      const uniqueMetrics = new Set(metrics);
      expect(uniqueMetrics.size).toBe(metrics.length);
    });
  });

  describe('Pipeline Configuration Properties', () => {
    it('should have all required properties for each pipeline', () => {
      PIPELINE_CONFIGS.forEach(config => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('metric');
        expect(config).toHaveProperty('capacity');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('phase');
        expect(config).toHaveProperty('path');
      });
    });

    it('should have valid capacity values (positive numbers)', () => {
      PIPELINE_CONFIGS.forEach(config => {
        expect(typeof config.capacity).toBe('number');
        expect(config.capacity).toBeGreaterThan(0);
        expect(config.capacity).toBeLessThan(10); // Should be per-hour rate
      });
    });

    it('should have valid color hex values', () => {
      PIPELINE_CONFIGS.forEach(config => {
        expect(typeof config.color).toBe('number');
        expect(config.color).toBeGreaterThanOrEqual(0);
        expect(config.color).toBeLessThanOrEqual(0xffffff);
      });
    });

    it('should have valid phase values', () => {
      PIPELINE_CONFIGS.forEach(config => {
        expect(typeof config.phase).toBe('number');
        expect(config.phase).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have non-empty path arrays', () => {
      PIPELINE_CONFIGS.forEach(config => {
        expect(Array.isArray(config.path)).toBe(true);
        expect(config.path.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Path Configuration', () => {
    it('should have valid path point structures', () => {
      PIPELINE_CONFIGS.forEach(config => {
        config.path.forEach(point => {
          const hasUnit = 'unit' in point;
          const hasCoords = 'x' in point && 'y' in point;

          expect(hasUnit || hasCoords).toBe(true);

          if (hasUnit) {
            expect(typeof point.unit).toBe('string');
            expect(point.unit.length).toBeGreaterThan(0);
          }

          if (hasCoords) {
            expect(typeof point.x).toBe('number');
            expect(typeof point.y).toBe('number');
          }
        });
      });
    });

    it('should have valid anchor points when specified', () => {
      const validAnchors = ['north', 'south', 'east', 'west'];

      PIPELINE_CONFIGS.forEach(config => {
        config.path.forEach(point => {
          if ('anchor' in point) {
            expect(validAnchors).toContain(point.anchor);
          }
        });
      });
    });

    it('should have valid offsets when specified', () => {
      PIPELINE_CONFIGS.forEach(config => {
        config.path.forEach(point => {
          if ('dx' in point) {
            expect(typeof point.dx).toBe('number');
            expect(Math.abs(point.dx)).toBeLessThan(10);
          }
          if ('dy' in point) {
            expect(typeof point.dy).toBe('number');
            expect(Math.abs(point.dy)).toBeLessThan(10);
          }
        });
      });
    });
  });

  describe('Specific Pipeline Configurations', () => {
    it('should have toReformer pipeline with correct properties', () => {
      const toReformer = PIPELINE_CONFIGS.find(p => p.id === 'toReformer');
      expect(toReformer).toBeDefined();
      expect(toReformer.metric).toBe('toReformer');
      expect(toReformer.capacity).toBeCloseTo(70 / 24, 2);
      expect(toReformer.path.length).toBeGreaterThan(2);
    });

    it('should have toCracker pipeline with correct properties', () => {
      const toCracker = PIPELINE_CONFIGS.find(p => p.id === 'toCracker');
      expect(toCracker).toBeDefined();
      expect(toCracker.metric).toBe('toCracker');
      expect(toCracker.capacity).toBeCloseTo(90 / 24, 2);
    });

    it('should have toHydrocracker pipeline with correct properties', () => {
      const toHydrocracker = PIPELINE_CONFIGS.find(p => p.id === 'toHydrocracker');
      expect(toHydrocracker).toBeDefined();
      expect(toHydrocracker.metric).toBe('toHydrocracker');
      expect(toHydrocracker.capacity).toBeCloseTo(70 / 24, 2);
    });

    it('should have toAlkylation pipeline with correct properties', () => {
      const toAlkylation = PIPELINE_CONFIGS.find(p => p.id === 'toAlkylation');
      expect(toAlkylation).toBeDefined();
      expect(toAlkylation.metric).toBe('toAlkylation');
      expect(toAlkylation.capacity).toBeCloseTo(45 / 24, 2);
    });

    it('should have toExport pipeline with correct properties', () => {
      const toExport = PIPELINE_CONFIGS.find(p => p.id === 'toExport');
      expect(toExport).toBeDefined();
      expect(toExport.metric).toBe('toExport');
      expect(toExport.capacity).toBeCloseTo(160 / 24, 2);
    });
  });

  describe('Capacity Conversion', () => {
    it('should convert daily capacities to hourly rates correctly', () => {
      const expectedRates = [
        { id: 'toReformer', daily: 70, hourly: 70 / 24 },
        { id: 'toCracker', daily: 90, hourly: 90 / 24 },
        { id: 'toHydrocracker', daily: 70, hourly: 70 / 24 },
        { id: 'toAlkylation', daily: 45, hourly: 45 / 24 },
        { id: 'toExport', daily: 160, hourly: 160 / 24 },
      ];

      expectedRates.forEach(expected => {
        const pipeline = PIPELINE_CONFIGS.find(p => p.id === expected.id);
        expect(pipeline.capacity).toBeCloseTo(expected.hourly, 4);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle iteration over all pipelines', () => {
      let count = 0;
      PIPELINE_CONFIGS.forEach(() => count++);
      expect(count).toBe(5);
    });

    it('should allow filtering pipelines by properties', () => {
      const highCapacity = PIPELINE_CONFIGS.filter(p => p.capacity > 3);
      expect(highCapacity.length).toBeGreaterThan(0);
    });

    it('should allow mapping pipeline IDs', () => {
      const ids = PIPELINE_CONFIGS.map(p => p.id);
      expect(ids).toContain('toReformer');
      expect(ids).toContain('toCracker');
      expect(ids).toContain('toExport');
    });
  });
});
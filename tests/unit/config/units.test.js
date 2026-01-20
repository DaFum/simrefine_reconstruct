import { describe, it, expect } from 'vitest';
import { UNIT_CONFIGS } from '../../../src/config/units.js';

describe('UNIT_CONFIGS', () => {
  describe('Configuration Structure', () => {
    it('should export an array of unit configurations', () => {
      expect(Array.isArray(UNIT_CONFIGS)).toBe(true);
      expect(UNIT_CONFIGS.length).toBeGreaterThan(0);
    });

    it('should have exactly 6 unit configurations', () => {
      expect(UNIT_CONFIGS.length).toBe(6);
    });

    it('should have unique IDs for all units', () => {
      const ids = UNIT_CONFIGS.map(config => config.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique names for all units', () => {
      const names = UNIT_CONFIGS.map(config => config.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Unit Configuration Properties', () => {
    it('should have all required properties for each unit', () => {
      UNIT_CONFIGS.forEach(config => {
        expect(config).toHaveProperty('id');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('tileX');
        expect(config).toHaveProperty('tileY');
        expect(config).toHaveProperty('width');
        expect(config).toHaveProperty('height');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('accent');
        expect(config).toHaveProperty('accentAlt');
        expect(config).toHaveProperty('style');
      });
    });

    it('should have valid tile positions', () => {
      UNIT_CONFIGS.forEach(config => {
        expect(typeof config.tileX).toBe('number');
        expect(typeof config.tileY).toBe('number');
        expect(config.tileX).toBeGreaterThanOrEqual(0);
        expect(config.tileY).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid dimensions', () => {
      UNIT_CONFIGS.forEach(config => {
        expect(typeof config.width).toBe('number');
        expect(typeof config.height).toBe('number');
        expect(config.width).toBeGreaterThan(0);
        expect(config.height).toBeGreaterThan(0);
        expect(config.width).toBeLessThanOrEqual(10);
        expect(config.height).toBeLessThanOrEqual(10);
      });
    });

    it('should have valid color hex values', () => {
      UNIT_CONFIGS.forEach(config => {
        expect(typeof config.color).toBe('number');
        expect(config.color).toBeGreaterThanOrEqual(0);
        expect(config.color).toBeLessThanOrEqual(0xffffff);

        expect(typeof config.accent).toBe('number');
        expect(config.accent).toBeGreaterThanOrEqual(0);
        expect(config.accent).toBeLessThanOrEqual(0xffffff);

        expect(typeof config.accentAlt).toBe('number');
        expect(config.accentAlt).toBeGreaterThanOrEqual(0);
        expect(config.accentAlt).toBeLessThanOrEqual(0xffffff);
      });
    });

    it('should have valid style types', () => {
      const validStyles = ['towers', 'rect', 'reactor', 'support', 'default'];

      UNIT_CONFIGS.forEach(config => {
        expect(typeof config.style).toBe('string');
        expect(validStyles).toContain(config.style);
      });
    });
  });

  describe('Specific Unit Configurations', () => {
    it('should have distillation unit with towers style', () => {
      const distillation = UNIT_CONFIGS.find(u => u.id === 'distillation');
      expect(distillation).toBeDefined();
      expect(distillation.name).toBe('Crude Distillation');
      expect(distillation.style).toBe('towers');
      expect(distillation.width).toBe(3);
      expect(distillation.height).toBe(4);
    });

    it('should have reformer unit with rect style', () => {
      const reformer = UNIT_CONFIGS.find(u => u.id === 'reformer');
      expect(reformer).toBeDefined();
      expect(reformer.name).toBe('Naphtha Reformer');
      expect(reformer.style).toBe('rect');
    });

    it('should have fcc unit with reactor style', () => {
      const fcc = UNIT_CONFIGS.find(u => u.id === 'fcc');
      expect(fcc).toBeDefined();
      expect(fcc.name).toBe('Catalytic Cracker');
      expect(fcc.style).toBe('reactor');
    });

    it('should have hydrocracker unit with towers style', () => {
      const hydrocracker = UNIT_CONFIGS.find(u => u.id === 'hydrocracker');
      expect(hydrocracker).toBeDefined();
      expect(hydrocracker.name).toBe('Hydrocracker');
      expect(hydrocracker.style).toBe('towers');
    });

    it('should have alkylation unit with rect style', () => {
      const alkylation = UNIT_CONFIGS.find(u => u.id === 'alkylation');
      expect(alkylation).toBeDefined();
      expect(alkylation.name).toBe('Alkylation');
      expect(alkylation.style).toBe('rect');
    });

    it('should have sulfur unit with support style', () => {
      const sulfur = UNIT_CONFIGS.find(u => u.id === 'sulfur');
      expect(sulfur).toBeDefined();
      expect(sulfur.name).toBe('Sulfur Recovery');
      expect(sulfur.style).toBe('support');
    });
  });

  describe('Layout and Positioning', () => {
    it('should not have overlapping units', () => {
      for (let i = 0; i < UNIT_CONFIGS.length; i++) {
        for (let j = i + 1; j < UNIT_CONFIGS.length; j++) {
          const unit1 = UNIT_CONFIGS[i];
          const unit2 = UNIT_CONFIGS[j];

          const noOverlapX =
            unit1.tileX + unit1.width <= unit2.tileX ||
            unit2.tileX + unit2.width <= unit1.tileX;
          const noOverlapY =
            unit1.tileY + unit1.height <= unit2.tileY ||
            unit2.tileY + unit2.height <= unit1.tileY;

          expect(noOverlapX || noOverlapY).toBe(true);
        }
      }
    });

    it('should have reasonable grid positions', () => {
      UNIT_CONFIGS.forEach(config => {
        expect(config.tileX).toBeLessThan(20);
        expect(config.tileY).toBeLessThan(20);
      });
    });
  });

  describe('Style Distribution', () => {
    it('should have multiple units with towers style', () => {
      const towers = UNIT_CONFIGS.filter(u => u.style === 'towers');
      expect(towers.length).toBeGreaterThanOrEqual(2);
    });

    it('should have multiple units with rect style', () => {
      const rect = UNIT_CONFIGS.filter(u => u.style === 'rect');
      expect(rect.length).toBeGreaterThanOrEqual(2);
    });

    it('should have at least one reactor style unit', () => {
      const reactor = UNIT_CONFIGS.filter(u => u.style === 'reactor');
      expect(reactor.length).toBeGreaterThanOrEqual(1);
    });

    it('should have at least one support style unit', () => {
      const support = UNIT_CONFIGS.filter(u => u.style === 'support');
      expect(support.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle iteration over all units', () => {
      let count = 0;
      UNIT_CONFIGS.forEach(() => count++);
      expect(count).toBe(6);
    });

    it('should allow filtering units by style', () => {
      const towers = UNIT_CONFIGS.filter(u => u.style === 'towers');
      expect(towers.every(u => u.style === 'towers')).toBe(true);
    });

    it('should allow mapping unit IDs', () => {
      const ids = UNIT_CONFIGS.map(u => u.id);
      expect(ids).toContain('distillation');
      expect(ids).toContain('reformer');
      expect(ids).toContain('fcc');
    });

    it('should allow finding units by property', () => {
      const largeUnits = UNIT_CONFIGS.filter(u => u.width >= 3 || u.height >= 4);
      expect(largeUnits.length).toBeGreaterThan(0);
    });
  });
});
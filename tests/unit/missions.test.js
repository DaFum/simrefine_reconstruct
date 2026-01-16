import { describe, it, expect, beforeEach } from 'vitest';
import { MISSIONS } from '../../src/content/missions.js';

describe('MISSIONS data structure', () => {
  describe('data integrity', () => {
    it('should export an array', () => {
      expect(Array.isArray(MISSIONS)).toBe(true);
    });

    it('should contain at least one mission', () => {
      expect(MISSIONS.length).toBeGreaterThan(0);
    });

    it('should have 3 missions defined', () => {
      expect(MISSIONS.length).toBe(3);
    });
  });

  describe('mission structure validation', () => {
    it('should have required fields for all missions', () => {
      MISSIONS.forEach((mission, index) => {
        expect(mission, `Mission ${index} missing id`).toHaveProperty('id');
        expect(mission, `Mission ${index} missing title`).toHaveProperty('title');
        expect(mission, `Mission ${index} missing description`).toHaveProperty('description');
        expect(mission, `Mission ${index} missing objectives`).toHaveProperty('objectives');
        expect(mission, `Mission ${index} missing next`).toHaveProperty('next');
        expect(mission, `Mission ${index} missing reward`).toHaveProperty('reward');
      });
    });

    it('should have unique mission ids', () => {
      const ids = MISSIONS.map(m => m.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have non-empty strings for id, title, and description', () => {
      MISSIONS.forEach(mission => {
        expect(typeof mission.id).toBe('string');
        expect(mission.id.length).toBeGreaterThan(0);
        
        expect(typeof mission.title).toBe('string');
        expect(mission.title.length).toBeGreaterThan(0);
        
        expect(typeof mission.description).toBe('string');
        expect(mission.description.length).toBeGreaterThan(0);
      });
    });

    it('should have objectives as an array', () => {
      MISSIONS.forEach(mission => {
        expect(Array.isArray(mission.objectives)).toBe(true);
        expect(mission.objectives.length).toBeGreaterThan(0);
      });
    });

    it('should have valid next field (string or null)', () => {
      MISSIONS.forEach(mission => {
        const isValid = mission.next === null || typeof mission.next === 'string';
        expect(isValid).toBe(true);
      });
    });

    it('should have reward as string', () => {
      MISSIONS.forEach(mission => {
        expect(typeof mission.reward).toBe('string');
        expect(mission.reward.length).toBeGreaterThan(0);
      });
    });
  });

  describe('objective structure validation', () => {
    it('should have valid objective types', () => {
      const validTypes = ['production', 'reliability', 'delivery'];
      
      MISSIONS.forEach(mission => {
        mission.objectives.forEach(objective => {
          expect(validTypes).toContain(objective.type);
        });
      });
    });

    it('should have required fields for all objectives', () => {
      MISSIONS.forEach(mission => {
        mission.objectives.forEach((objective, objIndex) => {
          expect(objective, `Mission ${mission.id} objective ${objIndex} missing type`).toHaveProperty('type');
          expect(objective, `Mission ${mission.id} objective ${objIndex} missing label`).toHaveProperty('label');
        });
      });
    });

    it('should have target field for production objectives', () => {
      MISSIONS.forEach(mission => {
        mission.objectives
          .filter(obj => obj.type === 'production')
          .forEach(objective => {
            expect(objective).toHaveProperty('target');
            expect(objective).toHaveProperty('product');
            expect(objective).toHaveProperty('progress');
            expect(typeof objective.target).toBe('number');
            expect(objective.target).toBeGreaterThan(0);
          });
      });
    });

    it('should have threshold and duration for reliability objectives', () => {
      MISSIONS.forEach(mission => {
        mission.objectives
          .filter(obj => obj.type === 'reliability')
          .forEach(objective => {
            expect(objective).toHaveProperty('threshold');
            expect(objective).toHaveProperty('duration');
            expect(objective).toHaveProperty('timeRemaining');
            expect(typeof objective.threshold).toBe('number');
            expect(objective.threshold).toBeGreaterThan(0);
            expect(objective.threshold).toBeLessThanOrEqual(1);
          });
      });
    });

    it('should have product and target for delivery objectives', () => {
      MISSIONS.forEach(mission => {
        mission.objectives
          .filter(obj => obj.type === 'delivery')
          .forEach(objective => {
            expect(objective).toHaveProperty('product');
            expect(objective).toHaveProperty('target');
            expect(objective).toHaveProperty('progress');
            expect(typeof objective.target).toBe('number');
          });
      });
    });

    it('should initialize progress to 0', () => {
      MISSIONS.forEach(mission => {
        mission.objectives
          .filter(obj => obj.type === 'production' || obj.type === 'delivery')
          .forEach(objective => {
            expect(objective.progress).toBe(0);
          });
      });
    });
  });

  describe('mission chain validation', () => {
    it('should have first mission with tutorial_stabilize id', () => {
      expect(MISSIONS[0].id).toBe('tutorial_stabilize');
    });

    it('should form a valid chain', () => {
      const missionMap = new Map(MISSIONS.map(m => [m.id, m]));
      
      let current = MISSIONS[0];
      let visited = new Set();
      
      while (current && current.next) {
        expect(visited.has(current.id)).toBe(false); // No cycles
        visited.add(current.id);
        
        expect(missionMap.has(current.next)).toBe(true); // Valid reference
        current = missionMap.get(current.next);
      }
    });

    it('should have exactly one mission with next=null (final mission)', () => {
      const finalMissions = MISSIONS.filter(m => m.next === null);
      expect(finalMissions.length).toBe(1);
    });

    it('should have final mission be winter_diesel', () => {
      const finalMission = MISSIONS.find(m => m.next === null);
      expect(finalMission.id).toBe('winter_diesel');
    });
  });

  describe('specific mission validation', () => {
    describe('tutorial_stabilize', () => {
      let mission;

      beforeEach(() => {
        mission = MISSIONS.find(m => m.id === 'tutorial_stabilize');
      });

      it('should exist', () => {
        expect(mission).toBeDefined();
      });

      it('should have correct structure', () => {
        expect(mission.title).toBe('Stabilization Protocol');
        expect(mission.objectives.length).toBe(2);
      });

      it('should have production and reliability objectives', () => {
        const types = mission.objectives.map(o => o.type);
        expect(types).toContain('production');
        expect(types).toContain('reliability');
      });

      it('should produce diesel', () => {
        const prodObjective = mission.objectives.find(o => o.type === 'production');
        expect(prodObjective.product).toBe('diesel');
        expect(prodObjective.target).toBe(100);
      });

      it('should point to summer_rush as next mission', () => {
        expect(mission.next).toBe('summer_rush');
      });
    });

    describe('summer_rush', () => {
      let mission;

      beforeEach(() => {
        mission = MISSIONS.find(m => m.id === 'summer_rush');
      });

      it('should exist', () => {
        expect(mission).toBeDefined();
      });

      it('should focus on gasoline production', () => {
        const prodObjective = mission.objectives.find(o => o.type === 'production');
        expect(prodObjective.product).toBe('gasoline');
        expect(prodObjective.target).toBe(350);
      });

      it('should have delivery objective', () => {
        const deliveryObjective = mission.objectives.find(o => o.type === 'delivery');
        expect(deliveryObjective).toBeDefined();
        expect(deliveryObjective.product).toBe('gasoline');
        expect(deliveryObjective.target).toBe(200);
      });

      it('should point to winter_diesel as next mission', () => {
        expect(mission.next).toBe('winter_diesel');
      });
    });

    describe('winter_diesel', () => {
      let mission;

      beforeEach(() => {
        mission = MISSIONS.find(m => m.id === 'winter_diesel');
      });

      it('should exist', () => {
        expect(mission).toBeDefined();
      });

      it('should focus on diesel production', () => {
        const prodObjective = mission.objectives.find(o => o.type === 'production');
        expect(prodObjective.product).toBe('diesel');
        expect(prodObjective.target).toBe(400);
      });

      it('should have reliability objective with 4h duration', () => {
        const reliabilityObjective = mission.objectives.find(o => o.type === 'reliability');
        expect(reliabilityObjective).toBeDefined();
        expect(reliabilityObjective.duration).toBe(4);
        expect(reliabilityObjective.threshold).toBe(0.90);
      });

      it('should be the final mission', () => {
        expect(mission.next).toBeNull();
      });

      it('should indicate season complete', () => {
        expect(mission.reward).toBe('Season Complete');
      });
    });
  });

  describe('data consistency', () => {
    it('should have increasing production targets through the chain', () => {
      const prodTargets = MISSIONS
        .map(m => m.objectives.find(o => o.type === 'production' && o.product === 'diesel'))
        .filter(Boolean)
        .map(o => o.target);
      
      // tutorial: 100, winter: 400
      expect(prodTargets[0]).toBeLessThan(prodTargets[1]);
    });

    it('should have consistent product names', () => {
      const validProducts = ['diesel', 'gasoline'];
      
      MISSIONS.forEach(mission => {
        mission.objectives
          .filter(o => o.product)
          .forEach(objective => {
            expect(validProducts).toContain(objective.product);
          });
      });
    });

    it('should have realistic reliability thresholds', () => {
      MISSIONS.forEach(mission => {
        mission.objectives
          .filter(o => o.type === 'reliability')
          .forEach(objective => {
            expect(objective.threshold).toBeGreaterThanOrEqual(0.8);
            expect(objective.threshold).toBeLessThanOrEqual(1.0);
          });
      });
    });
  });

  describe('immutability concerns', () => {
    it('should not modify original data when accessed', () => {
      const originalLength = MISSIONS.length;
      const originalFirstId = MISSIONS[0].id;
      
      // Access missions
      const _ = MISSIONS.map(m => m.id);
      
      expect(MISSIONS.length).toBe(originalLength);
      expect(MISSIONS[0].id).toBe(originalFirstId);
    });
  });
});
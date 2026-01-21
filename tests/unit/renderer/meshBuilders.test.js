import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildUnitMesh } from '../../../src/renderer/meshBuilders/index.js';

// Mock THREE.js
vi.mock('../../../vendor/three.module.js', () => {
  const Mesh = vi.fn().mockImplementation(function() {
    return {
      position: { set: vi.fn(), y: 0, x: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      geometry: { parameters: { height: 1, width: 1, depth: 1 } }
    };
  });
  return {
    Mesh,
    BoxGeometry: vi.fn().mockImplementation(function() { return {}; }),
    CylinderGeometry: vi.fn().mockImplementation(function() { return {}; }),
    SphereGeometry: vi.fn().mockImplementation(function() { return {}; }),
    TorusGeometry: vi.fn().mockImplementation(function() { return {}; }),
    ConeGeometry: vi.fn().mockImplementation(function() { return {}; }),
  };
});

describe('Mesh Builders', () => {
  let mockGroup;
  let mockBodyMaterial;
  let mockAccentMaterial;
  let baseContext;

  beforeEach(() => {
    mockGroup = {
      add: vi.fn()
    };

    mockBodyMaterial = { clone: vi.fn().mockReturnThis() };
    mockAccentMaterial = { clone: vi.fn().mockReturnThis() };

    baseContext = {
      group: mockGroup,
      baseWidth: 2.0,
      baseDepth: 2.0,
      baseHeight: 4.0,
      bodyMaterial: mockBodyMaterial,
      accentMaterial: mockAccentMaterial
    };
  });

  describe('buildUnitMesh', () => {
    it('should build towers style mesh', () => {
      const result = buildUnitMesh('towers', baseContext);

      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('cap');
      expect(result).toHaveProperty('accentMeshes');
      expect(result).toHaveProperty('indicatorAnchor');
    });

    it('should build reactor style mesh', () => {
      const result = buildUnitMesh('reactor', baseContext);

      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('cap');
      expect(result).toHaveProperty('accentMeshes');
      expect(result).toHaveProperty('indicatorAnchor');
    });

    it('should build support style mesh', () => {
      const result = buildUnitMesh('support', baseContext);

      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('cap');
      expect(result).toHaveProperty('accentMeshes');
      expect(result).toHaveProperty('indicatorAnchor');
    });

    it('should build rect style mesh', () => {
      const result = buildUnitMesh('rect', baseContext);

      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('cap');
      expect(result).toHaveProperty('accentMeshes');
      expect(result).toHaveProperty('indicatorAnchor');
    });

    it('should build default style mesh', () => {
      const result = buildUnitMesh('default', baseContext);

      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('cap');
      expect(result).toHaveProperty('accentMeshes');
      expect(result).toHaveProperty('indicatorAnchor');
    });

    it('should fall back to default for unknown style', () => {
      const result = buildUnitMesh('unknown-style', baseContext);

      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('cap');
    });

    it('should return accent meshes array', () => {
      const result = buildUnitMesh('towers', baseContext);

      expect(Array.isArray(result.accentMeshes)).toBe(true);
      expect(result.accentMeshes.length).toBeGreaterThan(0);
    });

    it('should return valid indicator anchor', () => {
      const result = buildUnitMesh('default', baseContext);

      expect(typeof result.indicatorAnchor).toBe('number');
      expect(result.indicatorAnchor).toBeGreaterThan(0);
    });

    it('should add meshes to group', () => {
      buildUnitMesh('towers', baseContext);

      expect(mockGroup.add).toHaveBeenCalled();
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(0);
    });

    it('should clone materials for accent meshes', () => {
      buildUnitMesh('reactor', baseContext);

      expect(mockAccentMaterial.clone).toHaveBeenCalled();
    });

    it('should handle different dimensions', () => {
      const smallContext = {
        ...baseContext,
        baseWidth: 1.0,
        baseHeight: 2.0,
        baseDepth: 1.0
      };

      const result = buildUnitMesh('default', smallContext);
      expect(result).toBeDefined();
      expect(result.body).toBeDefined();
    });

    it('should handle large dimensions', () => {
      const largeContext = {
        ...baseContext,
        baseWidth: 5.0,
        baseHeight: 8.0,
        baseDepth: 5.0
      };

      const result = buildUnitMesh('towers', largeContext);
      expect(result).toBeDefined();
      expect(result.body).toBeDefined();
    });
  });

  describe('Mesh Builder Return Values', () => {
    it('should always return body mesh', () => {
      const styles = ['towers', 'reactor', 'support', 'rect', 'default'];

      styles.forEach(style => {
        const result = buildUnitMesh(style, baseContext);
        expect(result.body).toBeDefined();
      });
    });

    it('should always return cap mesh', () => {
      const styles = ['towers', 'reactor', 'support', 'rect', 'default'];

      styles.forEach(style => {
        const result = buildUnitMesh(style, baseContext);
        expect(result.cap).toBeDefined();
      });
    });

    it('should always return accentMeshes array', () => {
      const styles = ['towers', 'reactor', 'support', 'rect', 'default'];

      styles.forEach(style => {
        const result = buildUnitMesh(style, baseContext);
        expect(Array.isArray(result.accentMeshes)).toBe(true);
      });
    });

    it('should always return numeric indicator anchor', () => {
      const styles = ['towers', 'reactor', 'support', 'rect', 'default'];

      styles.forEach(style => {
        const result = buildUnitMesh(style, baseContext);
        expect(typeof result.indicatorAnchor).toBe('number');
        expect(Number.isFinite(result.indicatorAnchor)).toBe(true);
      });
    });
  });

  describe('Style-Specific Behaviors', () => {
    it('should create multiple towers for towers style', () => {
      const _result = buildUnitMesh('towers', baseContext);

      // Towers style should add multiple meshes (main tower + secondary towers + accessories)
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(3);
    });

    it('should create spherical vessel for reactor style', () => {
      const _result = buildUnitMesh('reactor', baseContext);

      // Reactor should have multiple components (pedestal, vessel, band, riser, cyclone)
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(4);
    });

    it('should create horizontal drum for support style', () => {
      const _result = buildUnitMesh('support', baseContext);

      // Support should have cradle, drum, and scrubber
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(2);
    });

    it('should create rectangular blocks for rect style', () => {
      const _result = buildUnitMesh('rect', baseContext);

      // Rect should have pedestal, block, roof, and stack
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(3);
    });

    it('should create simple box for default style', () => {
      const _result = buildUnitMesh('default', baseContext);

      // Default should have block and topper
      expect(mockGroup.add.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dimensions gracefully', () => {
      const zeroContext = {
        ...baseContext,
        baseWidth: 0,
        baseHeight: 0,
        baseDepth: 0
      };

      expect(() => buildUnitMesh('default', zeroContext)).not.toThrow();
    });

    it('should handle missing materials', () => {
      const noMaterialContext = {
        ...baseContext,
        bodyMaterial: null,
        accentMaterial: null
      };

      expect(() => buildUnitMesh('default', noMaterialContext)).not.toThrow();
    });

    it('should handle case sensitivity in style names', () => {
      const result1 = buildUnitMesh('TOWERS', baseContext);
      const result2 = buildUnitMesh('Towers', baseContext);

      // Should fall back to default for wrong case
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
PR Code Suggestions ✨
Explore these optional code suggestions:

Category	Suggestion                                                                                                                                   	Impact
Possible issue	
Prevent negative resource pool values
Fix a bug in sulfur processing that could lead to negative resource pools by
ensuring consumption does not exceed available amounts.

src/simulation/processors/sulfurProcessor.js [38-42]

-const residConsumed = sulfurFeed * 0.6;
-const heavyConsumed = sulfurFeed * 0.4;
+const totalAvailable = residPool + heavyPool;
+const residRatio = totalAvailable > 0 ? residPool / totalAvailable : 0.5;
+
+const residConsumed = Math.min(residPool, sulfurFeed * residRatio);
+const heavyConsumed = Math.min(heavyPool, sulfurFeed * (1 - residRatio));
 
 const remainingResid = residPool - residConsumed;
 const remainingHeavy = heavyPool - heavyConsumed;
 Apply / Chat
Suggestion importance[1-10]: 8
Medium
Prevent negative resource consumption calculation
Prevent a potential negative resource consumption calculation for
dieselUsedHydro by ensuring the value is never less than zero.

src/simulation/processors/hydrocrackerProcessor.js [38]

-const dieselUsedHydro = Math.min(dieselPool * 0.5, hydroFeed - heavyUsedHydro - residUsedHydro);
+const dieselUsedHydro = Math.min(dieselPool * 0.5, Math.max(0, hydroFeed - heavyUsedHydro - residUsedHydro));
[Suggestion processed]

Suggestion importance[1-10]: 8
Medium
Avoid side effects in state restoration
Low
High-level	
Consider performance impact of module proliferation
The extensive refactoring into numerous ES6 modules improves code structure but
may degrade initial load performance due to chained network requests. It is
recommended to verify if this performance trade-off is acceptable.

Examples:
src/index.js [17-21]
src/simulation/index.js [7-13]
Solution Walkthrough:
Before:
// Conceptually, before the refactor (e.g., in a single large file)

// All configurations
const UNIT_CONFIGS = [...];
const PIPELINE_CONFIGS = [...];

// All simulation logic
function processDistillation(...) { /* ... */ }
function processReformer(...) { /* ... */ }
// ... and so on for all processors and utilities

// All rendering logic
function buildTowersMesh(...) { /* ... */ }
function buildReactorMesh(...) { /* ... */ }
// ... and so on for all mesh builders

class RefinerySimulation {
  // ... contains logic that is now spread across modules
}
After:
// After: Chained module loading
// 1. Browser loads main.js, which imports src/index.js

// 2. Browser loads src/index.js
export * from "./simulation/index.js"; // -> requests simulation/index.js
export * from "./renderer/index.js";   // -> requests renderer/index.js
export * from "./config/index.js";     // -> requests config/index.js
// ...

// 3. Browser loads src/simulation/index.js
export * from "./processors/index.js"; // -> requests processors/index.js
// ...

// 4. Browser loads src/simulation/processors/index.js
export { processDistillation } from "./distillationProcessor.js"; // -> requests distillationProcessor.js
export { processReformer } from "./reformerProcessor.js";     // -> requests reformerProcessor.js
// ... this chain continues for every module.
Suggestion importance[1-10]: 7
Medium
 Update

gemini-code-assist bot reviewed 4 hours ago
gemini-code-assist bot
left a comment
Code Review
This is a significant and well-executed refactoring that greatly improves the project's structure and modularity. By extracting simulation processors, mesh builders, and UI renderers into their own modules with factory patterns and barrel exports, the codebase is now much cleaner and more maintainable.

My review focuses on a few areas to further enhance consistency and readability:

Consistent Exports: Some of the new configuration modules use both named and default exports for the same constants. Sticking to named exports consistently will prevent confusion.
Magic Numbers: In several of the new calculation and mesh-building functions, there are 'magic numbers' used for simulation logic and geometry. Extracting these into named constants would improve readability and make the system easier to tune.
Defensive Copying: Ensuring deep copies are made when handling snapshot data will improve robustness.
Overall, this is an excellent pull request that sets a strong foundation for future development.

src/config/pipelines.js
  },
];

export default PIPELINE_CONFIGS;

gemini-code-assist bot
4 hours ago


This file exports PIPELINE_CONFIGS as both a named and a default export. This is redundant and can lead to inconsistent import styles. It's a good practice to stick to one export type per module for consistency. I recommend removing the default export and only using named exports.

	Reply...
src/config/presets.js
  },
};

export default { OPERATION_PRESETS, SESSION_PRESETS };

gemini-code-assist bot
4 hours ago


This module already exports OPERATION_PRESETS and SESSION_PRESETS as named exports. The default export is redundant and can lead to confusion. It's best to stick with named exports for consistency across the new modular structure.

	Reply...
src/config/units.js
  },
];

export default UNIT_CONFIGS;

gemini-code-assist bot
4 hours ago


Similar to other configuration files in this refactoring, this file has both a named and a default export for UNIT_CONFIGS. To maintain consistency and avoid confusion, it's better to remove the default export and rely on the named export.

	Reply...
src/renderer/meshBuilders/index.js
Comment on lines +6 to +16
import { buildTowersMesh } from "./towersMeshBuilder.js";
import { buildReactorMesh } from "./reactorMeshBuilder.js";
import { buildSupportMesh } from "./supportMeshBuilder.js";
import { buildRectMesh } from "./rectMeshBuilder.js";
import { buildDefaultMesh } from "./defaultMeshBuilder.js";

export { buildTowersMesh } from "./towersMeshBuilder.js";
export { buildReactorMesh } from "./reactorMeshBuilder.js";
export { buildSupportMesh } from "./supportMeshBuilder.js";
export { buildRectMesh } from "./rectMeshBuilder.js";
export { buildDefaultMesh } from "./defaultMeshBuilder.js";

gemini-code-assist bot
4 hours ago


The way builders are imported and then re-exported is a bit verbose. You can simplify this by importing them once and then exporting the imported bindings in a single export block. This improves readability.

import { buildTowersMesh } from "./towersMeshBuilder.js";
import { buildReactorMesh } from "./reactorMeshBuilder.js";
import { buildSupportMesh } from "./supportMeshBuilder.js";
import { buildRectMesh } from "./rectMeshBuilder.js";
import { buildDefaultMesh } from "./defaultMeshBuilder.js";

export {
  buildTowersMesh,
  buildReactorMesh,
  buildSupportMesh,
  buildRectMesh,
  buildDefaultMesh,
};
	Reply...
src/renderer/meshBuilders/reactorMeshBuilder.js
Comment on lines +27 to +73
  const pedestalHeight = Math.max(1.6, baseHeight * 0.32);
  const pedestalRadius = Math.min(baseWidth, baseDepth) * 0.32;
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(pedestalRadius * 0.95, pedestalRadius * 1.02, pedestalHeight, 32),
    accentMaterial.clone()
  );
  pedestal.position.y = pedestalHeight / 2;
  group.add(pedestal);
  accentMeshes.push(pedestal);

  const sphereRadius = Math.min(baseWidth, baseDepth) * 0.55;
  const vessel = new THREE.Mesh(
    new THREE.SphereGeometry(sphereRadius, 40, 32),
    bodyMaterial
  );
  vessel.position.y = pedestalHeight + sphereRadius;
  group.add(vessel);
  body = vessel;

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(sphereRadius * 0.82, sphereRadius * 0.08, 16, 48),
    accentMaterial.clone()
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = vessel.position.y;
  group.add(band);
  cap = band;
  accentMeshes.push(band);

  const riserHeight = sphereRadius * 1.2;
  const riser = new THREE.Mesh(
    new THREE.CylinderGeometry(sphereRadius * 0.2, sphereRadius * 0.16, riserHeight, 24),
    accentMaterial.clone()
  );
  riser.position.set(sphereRadius * 0.48, pedestalHeight + sphereRadius * 1.1, 0);
  group.add(riser);
  accentMeshes.push(riser);

  const cyclone = new THREE.Mesh(
    new THREE.ConeGeometry(sphereRadius * 0.24, sphereRadius * 0.5, 24),
    accentMaterial.clone()
  );
  cyclone.position.set(-sphereRadius * 0.6, pedestalHeight + sphereRadius * 1.4, 0);
  group.add(cyclone);
  accentMeshes.push(cyclone);

  const indicatorAnchor = pedestalHeight + sphereRadius * 1.35;

gemini-code-assist bot
4 hours ago


This function uses many 'magic numbers' for geometry calculations (e.g., 1.6, 0.32, 0.95, 0.55). This makes the code hard to read and maintain. Extracting these values into named constants at the top of the file would improve clarity and make it easier to adjust the visual appearance of the reactor mesh in the future. This applies to other mesh builder files as well.

For example:

const PEDESTAL_MIN_HEIGHT = 1.6;
const PEDESTAL_HEIGHT_RATIO = 0.32;
const PEDESTAL_RADIUS_RATIO = 0.32;
// ...
const pedestalHeight = Math.max(PEDESTAL_MIN_HEIGHT, baseHeight * PEDESTAL_HEIGHT_RATIO);
const pedestalRadius = Math.min(baseWidth, baseDepth) * PEDESTAL_RADIUS_RATIO;
	Reply...
src/simulation/utils/snapshot.js
Outdated
src/simulation/utils/snapshot.js
Outdated
src/systems/marketCalculations.js
Comment on lines +22 to +53
export function calculateCostTarget(params) {
  const {
    feedCostPerBbl,
    operationsPerBbl,
    carryingPerBbl,
    penaltyPerBbl,
    logisticDrag,
    share,
    weights,
    shippingPressure,
    downtimePressure,
    directiveDrag,
    environmentPremium,
    safetyPremium,
    maintenanceRelief,
  } = params;

  return Math.max(
    feedCostPerBbl * 0.7,
    feedCostPerBbl +
      operationsPerBbl +
      carryingPerBbl +
      penaltyPerBbl * (0.24 + share * 0.32) +
      logisticDrag * (0.1 + weights.shipping * 0.08) +
      shippingPressure * weights.shipping * 8 +
      downtimePressure * weights.downtime * 10 +
      directiveDrag * 4 +
      environmentPremium * weights.env * 7 +
      safetyPremium * weights.maintenance * 4 -
      maintenanceRelief * weights.maintenance * 12
  );
}

gemini-code-assist bot
4 hours ago


The calculateCostTarget function's formula is complex and contains many magic numbers (e.g., 0.7, 0.24, 8, 12). This makes the economic model difficult to understand, debug, and tune. These numbers should be extracted into well-named constants to document their purpose and centralize configuration. This principle also applies to other calculation functions in this file.

For example:

const MIN_COST_FACTOR = 0.7;
const PENALTY_BASE_FACTOR = 0.24;
const PENALTY_SHARE_FACTOR = 0.32;
// ...
return Math.max(
  feedCostPerBbl * MIN_COST_FACTOR,
  // ...
  penaltyPerBbl * (PENALTY_BASE_FACTOR + share * PENALTY_SHARE_FACTOR) +
  // ...
);
	Reply...
Copilot AI reviewed 4 hours ago
Copilot AI
left a comment
Pull request overview
This pull request refactors the codebase structure by extracting code from monolithic files into a modular architecture with barrel export patterns. The refactoring improves code organization and maintainability by separating concerns into logical modules.

Changes:

Extracted UI rendering logic into separate renderer modules (scorecard, metrics, logistics, economy)
Separated simulation calculation functions and processors into dedicated modules
Created mesh builder modules for 3D rendering components
Organized configuration data (units, presets, pipelines) into config modules
Added barrel export (index.js) files throughout the module hierarchy
Updated package-lock.json (removed "peer": true flags from dev dependencies)
Reviewed changes
Copilot reviewed 33 out of 34 changed files in this pull request and generated 8 comments.

Show a summary per file
src/systems/marketCalculations.js
Outdated
src/systems/marketCalculations.js
Outdated
src/ui/renderers/logisticsRenderer.js
Outdated
src/config/pipelines.js
Outdated
src/simulation/processors/distillationProcessor.js
Outdated
src/simulation/utils/calculations.js
Outdated
src/ui/renderers/scorecardRenderer.js
 * @returns {boolean} Whether the trend needs redrawing
 */
export function renderScorecard(context) {
  const { elements, metrics, lastSignature, setSignature } = context;
Copilot AI
4 hours ago
Unused variable lastSignature.

Copilot uses AI. Check for mistakes.
	Reply...
src/ui/renderers/scorecardRenderer.js
 * @returns {boolean} Whether the trend needs redrawing
 */
export function renderScorecard(context) {
  const { elements, metrics, lastSignature, setSignature } = context;
Copilot AI
4 hours ago
Unused variable setSignature.

Copilot uses AI. Check for mistakes.
	Reply...
claude added 3 commits 4 hours ago

Integrate extracted modules into main.js and renderer3d.js 
e2ebeb6

Integrate extracted modules into simulation.js and ui.js 
bf30db9

Clean up unused modules and integrate processors into simulation 
e21bb30

coderabbitai bot
commented
2 hours ago
Note

Unit test generation is an Early Access feature. Expect some limitations and changes as we gather feedback and continue to improve it.

Generating unit tests... This may take up to 20 minutes.


coderabbitai bot
commented
2 hours ago
• 
Integrate this Jules -->
Here are the copyable unit test edits:

Copyable Edits
biome.json
This is a new file.

{
  "$schema": "https://biomejs.dev/schemas/2.1.2/schema.json",
  "formatter": {
    "enabled": false
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "a11y": {
        "recommended": false
      },
      "correctness": {
        "useExhaustiveDependencies": "off",
        "noInnerDeclarations": "off"
      },
      "style": {
        "recommended": false,
        "noUselessElse": "warn",
        "useAsConstAssertion": "off",
        "useBlockStatements": "off",
        "useConsistentArrayType": "off",
        "useDefaultParameterLast": "warn",
        "useEnumInitializers": "off",
        "useExponentiationOperator": "warn",
        "useExportType": "off",
        "useFragmentSyntax": "off",
        "useImportType": "off",
        "useLiteralEnumMembers": "warn",
        "noUnusedTemplateLiteral": "off",
        "useConst": "warn",
        "useShorthandAssign": "warn",
        "useTemplate": "warn"
      },
      "complexity": {
        "noForEach": "off",
        "noExcessiveCognitiveComplexity": {
          "level": "off",
          "options": {
            "maxAllowedComplexity": 25
          }
        },
        "useLiteralKeys": "off",
        "useArrowFunction": "off",
        "useFlatMap": "off"
      },
      "suspicious": {
        "noArrayIndexKey": "off",
        "noExplicitAny": "off",
        "noImplicitAnyLet": "off",
        "noDoubleEquals": "off",
        "noGlobalIsNan": "off",
        "noAssignInExpressions": "off"
      },
      "nursery": {
        "recommended": false
      }
    }
  },
  "css": {
    "linter": {
      "enabled": true
    },
    "parser": {
      "cssModules": true
    }
  },
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    }
  }
}
tests/unit/config/pipelines.test.js
This is a new file.

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
tests/unit/config/presets.test.js
This is a new file.

import { describe, it, expect } from 'vitest';
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
tests/unit/config/units.test.js
This is a new file.

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
tests/unit/renderer/meshBuilders.test.js
This is a new file.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildUnitMesh } from '../../../src/renderer/meshBuilders/index.js';

// Mock THREE.js
vi.mock('../../../vendor/three.module.js', () => ({
  Mesh: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn(), y: 0, x: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    geometry: { parameters: { height: 1, width: 1, depth: 1 } }
  })),
  BoxGeometry: vi.fn().mockReturnValue({}),
  CylinderGeometry: vi.fn().mockReturnValue({}),
  SphereGeometry: vi.fn().mockReturnValue({}),
  TorusGeometry: vi.fn().mockReturnValue({}),
  ConeGeometry: vi.fn().mockReturnValue({}),
}));

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
        expect(isFinite(result.indicatorAnchor)).toBe(true);
      });
    });
  });

  describe('Style-Specific Behaviors', () => {
    it('should create multiple towers for towers style', () => {
      const result = buildUnitMesh('towers', baseContext);
      
      // Towers style should add multiple meshes (main tower + secondary towers + accessories)
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(3);
    });

    it('should create spherical vessel for reactor style', () => {
      const result = buildUnitMesh('reactor', baseContext);
      
      // Reactor should have multiple components (pedestal, vessel, band, riser, cyclone)
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(4);
    });

    it('should create horizontal drum for support style', () => {
      const result = buildUnitMesh('support', baseContext);
      
      // Support should have cradle, drum, and scrubber
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(2);
    });

    it('should create rectangular blocks for rect style', () => {
      const result = buildUnitMesh('rect', baseContext);
      
      // Rect should have pedestal, block, roof, and stack
      expect(mockGroup.add.mock.calls.length).toBeGreaterThan(3);
    });

    it('should create simple box for default style', () => {
      const result = buildUnitMesh('default', baseContext);
      
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
tests/unit/simulation/constants.test.js
This is a new file.

import { describe, it, expect } from 'vitest';
import {
  PRODUCT_LABELS,
  HOURS_PER_DAY,
  SHIPMENT_PARCEL_SIZES,
  SHIPMENT_HORIZON_HOURS,
  BASE_CRUDE_THROUGHPUT,
  BASE_PRICES,
  UNIT_CATEGORIES,
  UNIT_DEFINITIONS,
  SPEED_PRESETS,
  DEFAULT_PARAMS,
  SCENARIOS
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
tests/unit/simulation/processors/EnvironmentProcessor.test.js
This is a new file.

import { describe, it, expect } from 'vitest';
import {
  calculateEnvironmentMetrics,
  shouldLogEnvironmentWarning,
  getEnvironmentWarningSeverity,
  formatEnvironmentWarning
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
      const result = shouldLogEnvironmentWarning(4, 0.05, 0);
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
      expect(isFinite(result.carbonPerHour)).toBe(true);
    });
  });
});
tests/unit/simulation/processors/MetricsProcessor.test.js
This is a new file.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  updateProductionMetrics,
  updateFinancialMetrics,
  updateEconomyMetrics,
  updateOperationalMetrics,
  updateFlowMetrics,
  buildScorecardContext,
  buildRecorderContext
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
      expect(isFinite(metrics.gasoline)).toBe(true);
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
      expect(isFinite(metrics.gasoline)).toBe(true);
    });
  });
});
tests/unit/simulation/processors/ProductionProcessor.test.js
This is a new file.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateProductShares,
  processReformer,
  processFCC,
  processHydrocracker,
  processAlkylation,
  processSulfur,
  applyStrainPenalty,
  normalizeLiquidProducts
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
tests/unit/simulation/utils/calculations.test.js
This is a new file.

import { describe, it, expect } from 'vitest';
import {
  clamp,
  randomRange,
  perDayToPerHour,
  perHourToPerDay,
  round,
  calculateDistillationShares,
  calculateEffectiveCapacity,
  updateUnitMetrics,
  calculateEnvironmentPenalty,
  calculateProductPrices,
  calculateProductRevenue,
  applyStrainPenalties,
  capLiquidProducts
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
    expect(capped.lpg).toBeLessThanOrEqual(1.2);
  });
});
tests/unit/systems/marketCalculations.test.js
This is a new file.

import { describe, it, expect } from 'vitest';
import {
  HOURS_PER_DAY,
  perHourToPerDay,
  WEIGHT_PROFILES,
  BASE_DEMAND,
  calculateCostTarget,
  calculateFuturesTarget,
  calculateMarketPressures,
  calculateCarryingCost,
  calculateMixBias,
  calculateProductDemand,
  smoothValue
} from '../../../src/systems/marketCalculations.js';

describe('marketCalculations', () => {
  describe('Constants', () => {
    it('should have correct HOURS_PER_DAY', () => {
      expect(HOURS_PER_DAY).toBe(24);
    });

    it('should have weight profiles for all products', () => {
      expect(WEIGHT_PROFILES).toHaveProperty('gasoline');
      expect(WEIGHT_PROFILES).toHaveProperty('diesel');
      expect(WEIGHT_PROFILES).toHaveProperty('jet');
    });

    it('should have base demand for all products', () => {
      expect(BASE_DEMAND).toHaveProperty('gasoline');
      expect(BASE_DEMAND).toHaveProperty('diesel');
      expect(BASE_DEMAND).toHaveProperty('jet');
    });

    it('should convert per hour to per day correctly', () => {
      expect(perHourToPerDay(1)).toBe(24);
      expect(perHourToPerDay(5)).toBe(120);
    });
  });

  describe('calculateCostTarget', () => {
    const baseParams = {
      feedCostPerBbl: 70,
      operationsPerBbl: 10,
      carryingPerBbl: 5,
      penaltyPerBbl: 2,
      logisticDrag: 3,
      share: 0.4,
      weights: WEIGHT_PROFILES.gasoline,
      shippingPressure: 0.1,
      downtimePressure: 0.05,
      directiveDrag: 1,
      environmentPremium: 0.2,
      safetyPremium: 0.15,
      maintenanceRelief: 0.1
    };

    it('should calculate cost target', () => {
      const cost = calculateCostTarget(baseParams);
      
      expect(typeof cost).toBe('number');
      expect(cost).toBeGreaterThan(0);
    });

    it('should include feed cost', () => {
      const cost = calculateCostTarget(baseParams);
      expect(cost).toBeGreaterThan(baseParams.feedCostPerBbl);
    });

    it('should increase with penalties', () => {
      const lowPenalty = { ...baseParams, penaltyPerBbl: 1 };
      const highPenalty = { ...baseParams, penaltyPerBbl: 10 };
      
      const lowCost = calculateCostTarget(lowPenalty);
      const highCost = calculateCostTarget(highPenalty);
      
      expect(highCost).toBeGreaterThan(lowCost);
    });

    it('should increase with shipping pressure', () => {
      const lowPressure = { ...baseParams, shippingPressure: 0 };
      const highPressure = { ...baseParams, shippingPressure: 0.5 };
      
      const lowCost = calculateCostTarget(lowPressure);
      const highCost = calculateCostTarget(highPressure);
      
      expect(highCost).toBeGreaterThan(lowCost);
    });

    it('should have minimum floor', () => {
      const minimal = {
        ...baseParams,
        operationsPerBbl: 0,
        carryingPerBbl: 0,
        penaltyPerBbl: 0,
        logisticDrag: 0,
        shippingPressure: 0,
        downtimePressure: 0,
        directiveDrag: 0,
        environmentPremium: 0,
        safetyPremium: 0,
        maintenanceRelief: 0
      };
      
      const cost = calculateCostTarget(minimal);
      expect(cost).toBeGreaterThanOrEqual(baseParams.feedCostPerBbl * 0.7);
    });
  });

  describe('calculateFuturesTarget', () => {
    const baseParams = {
      spotPrice: 100,
      demandGap: 0.1,
      storagePressure: 0.15,
      shippingPressure: 0.1,
      downtimePressure: 0.05,
      maintenanceRelief: 0.08,
      weights: WEIGHT_PROFILES.gasoline,
      mixBias: 0.05,
      penaltyPerBbl: 2,
      carryingPerBbl: 3,
      logisticDrag: 1,
      drift: 0.02,
      environmentPremium: 0.1
    };

    it('should calculate futures target', () => {
      const target = calculateFuturesTarget(baseParams);
      
      expect(typeof target).toBe('number');
      expect(target).toBeGreaterThan(0);
    });

    it('should be based on spot price', () => {
      const target = calculateFuturesTarget(baseParams);
      expect(target).toBeGreaterThan(baseParams.spotPrice * 0.6);
    });

    it('should increase with demand gap', () => {
      const lowDemand = { ...baseParams, demandGap: 0 };
      const highDemand = { ...baseParams, demandGap: 0.5 };
      
      const lowTarget = calculateFuturesTarget(lowDemand);
      const highTarget = calculateFuturesTarget(highDemand);
      
      expect(highTarget).toBeGreaterThan(lowTarget);
    });

    it('should increase with storage pressure', () => {
      const lowPressure = { ...baseParams, storagePressure: 0 };
      const highPressure = { ...baseParams, storagePressure: 0.5 };
      
      const lowTarget = calculateFuturesTarget(lowPressure);
      const highTarget = calculateFuturesTarget(highPressure);
      
      expect(highTarget).toBeGreaterThan(lowTarget);
    });

    it('should have minimum floor', () => {
      const target = calculateFuturesTarget(baseParams);
      expect(target).toBeGreaterThanOrEqual(baseParams.spotPrice * 0.65);
    });
  });

  describe('calculateMarketPressures', () => {
    const baseParams = {
      scenario: { riskMultiplier: 1, environmentPressure: 0.2 },
      storageUtil: 0.7,
      reliability: 0.95,
      shipmentReliability: 0.9,
      directiveReliability: 0.85,
      incidentCount: 1,
      incidentPenalty: 50,
      demandShortage: 100
    };

    it('should calculate all pressure types', () => {
      const pressures = calculateMarketPressures(baseParams);
      
      expect(pressures).toHaveProperty('basePressure');
      expect(pressures).toHaveProperty('storagePressure');
      expect(pressures).toHaveProperty('reliabilityPressure');
      expect(pressures).toHaveProperty('shipmentPressure');
      expect(pressures).toHaveProperty('directivePressure');
      expect(pressures).toHaveProperty('shortagePressure');
      expect(pressures).toHaveProperty('incidentPressure');
    });

    it('should have storage pressure above threshold', () => {
      const highStorage = { ...baseParams, storageUtil: 0.9 };
      const pressures = calculateMarketPressures(highStorage);
      
      expect(pressures.storagePressure).toBeGreaterThan(0);
    });

    it('should have no storage pressure below threshold', () => {
      const lowStorage = { ...baseParams, storageUtil: 0.5 };
      const pressures = calculateMarketPressures(lowStorage);
      
      expect(pressures.storagePressure).toBe(0);
    });

    it('should increase with incidents', () => {
      const noIncidents = { ...baseParams, incidentCount: 0, incidentPenalty: 0 };
      const withIncidents = { ...baseParams, incidentCount: 5, incidentPenalty: 200 };
      
      const noPressures = calculateMarketPressures(noIncidents);
      const withPressures = calculateMarketPressures(withIncidents);
      
      expect(withPressures.incidentPressure).toBeGreaterThan(noPressures.incidentPressure);
    });

    it('should cap incident pressure', () => {
      const extreme = { ...baseParams, incidentCount: 100, incidentPenalty: 10000 };
      const pressures = calculateMarketPressures(extreme);
      
      expect(pressures.incidentPressure).toBeLessThanOrEqual(0.28);
    });
  });

  describe('calculateCarryingCost', () => {
    it('should calculate low cost for low utilization', () => {
      const cost = calculateCarryingCost(0.3);
      expect(cost).toBeLessThan(100);
    });

    it('should increase cost with utilization', () => {
      const lowCost = calculateCarryingCost(0.3);
      const highCost = calculateCarryingCost(0.7);
      
      expect(highCost).toBeGreaterThan(lowCost);
    });

    it('should have exponential growth above threshold', () => {
      const beforeThreshold = calculateCarryingCost(0.54);
      const afterThreshold = calculateCarryingCost(0.56);
      
      expect(afterThreshold).toBeGreaterThan(beforeThreshold);
    });

    it('should be very high at maximum utilization', () => {
      const cost = calculateCarryingCost(0.95);
      expect(cost).toBeGreaterThan(500);
    });

    it('should handle zero utilization', () => {
      const cost = calculateCarryingCost(0);
      expect(cost).toBe(0);
    });

    it('should handle full utilization', () => {
      const cost = calculateCarryingCost(1.0);
      expect(cost).toBeGreaterThan(0);
      expect(isFinite(cost)).toBe(true);
    });
  });

  describe('calculateMixBias', () => {
    it('should favor gasoline with positive focus', () => {
      const bias = calculateMixBias('gasoline', 0.3);
      expect(bias).toBeGreaterThan(0);
    });

    it('should penalize diesel with positive focus', () => {
      const bias = calculateMixBias('diesel', 0.3);
      expect(bias).toBeLessThan(0);
    });

    it('should penalize jet with focus shift', () => {
      const positiveBias = calculateMixBias('jet', 0.3);
      const negativeBias = calculateMixBias('jet', -0.3);
      
      expect(positiveBias).toBeLessThan(0);
      expect(negativeBias).toBeLessThan(0);
    });

    it('should have no bias at neutral focus', () => {
      const gasBias = calculateMixBias('gasoline', 0);
      const dieselBias = calculateMixBias('diesel', 0);
      const jetBias = calculateMixBias('jet', 0);
      
      expect(gasBias).toBe(0);
      expect(dieselBias).toBe(0);
      expect(jetBias).toBe(0);
    });
  });

  describe('calculateProductDemand', () => {
    const baseParams = {
      product: 'gasoline',
      scenario: { gasolineBias: 0, dieselBias: 0, jetBias: 0 },
      focusShift: 0,
      reliability: 0.95,
      gradeFactor: 1.0
    };

    it('should calculate demand based on base values', () => {
      const demand = calculateProductDemand(baseParams);
      
      expect(demand).toBeGreaterThan(0);
      expect(demand).toBeLessThanOrEqual(BASE_DEMAND.gasoline * 1.6);
    });

    it('should increase with positive scenario bias', () => {
      const noBias = { ...baseParams, scenario: { gasolineBias: 0 } };
      const withBias = { ...baseParams, scenario: { gasolineBias: 0.5 } };
      
      const noBiasDemand = calculateProductDemand(noBias);
      const withBiasDemand = calculateProductDemand(withBias);
      
      expect(withBiasDemand).toBeGreaterThan(noBiasDemand);
    });

    it('should vary with focus shift for gasoline', () => {
      const lowFocus = { ...baseParams, focusShift: -0.3 };
      const highFocus = { ...baseParams, focusShift: 0.3 };
      
      const lowDemand = calculateProductDemand(lowFocus);
      const highDemand = calculateProductDemand(highFocus);
      
      expect(highDemand).toBeGreaterThan(lowDemand);
    });

    it('should decrease with low reliability', () => {
      const highRel = { ...baseParams, reliability: 0.98 };
      const lowRel = { ...baseParams, reliability: 0.75 };
      
      const highDemand = calculateProductDemand(highRel);
      const lowDemand = calculateProductDemand(lowRel);
      
      expect(highDemand).toBeGreaterThan(lowDemand);
    });

    it('should clamp demand to reasonable range', () => {
      const extreme = {
        ...baseParams,
        scenario: { gasolineBias: 2.0 },
        focusShift: 1.0,
        reliability: 1.0,
        gradeFactor: 2.0
      };
      
      const demand = calculateProductDemand(extreme);
      expect(demand).toBeGreaterThan(0);
      expect(demand).toBeLessThanOrEqual(BASE_DEMAND.gasoline * 1.6);
    });

    it('should handle all product types', () => {
      const gasDemand = calculateProductDemand({ ...baseParams, product: 'gasoline' });
      const dieselDemand = calculateProductDemand({ ...baseParams, product: 'diesel' });
      const jetDemand = calculateProductDemand({ ...baseParams, product: 'jet' });
      
      expect(gasDemand).toBeGreaterThan(0);
      expect(dieselDemand).toBeGreaterThan(0);
      expect(jetDemand).toBeGreaterThan(0);
    });
  });

  describe('smoothValue', () => {
    it('should smooth towards target', () => {
      const smoothed = smoothValue(10, 20, 0.5);
      expect(smoothed).toBe(15);
    });

    it('should reach target with full smoothing', () => {
      const smoothed = smoothValue(10, 20, 1.0);
      expect(smoothed).toBe(20);
    });

    it('should stay at current with no smoothing', () => {
      const smoothed = smoothValue(10, 20, 0);
      expect(smoothed).toBe(10);
    });

    it('should work with decreasing values', () => {
      const smoothed = smoothValue(20, 10, 0.5);
      expect(smoothed).toBe(15);
    });

    it('should handle negative values', () => {
      const smoothed = smoothValue(-10, -5, 0.5);
      expect(smoothed).toBe(-7.5);
    });

    it('should handle small smoothing factors', () => {
      const smoothed = smoothValue(100, 200, 0.1);
      expect(smoothed).toBeCloseTo(110, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme storage utilization', () => {
      const cost = calculateCarryingCost(1.5);
      expect(isFinite(cost)).toBe(true);
    });

    it('should handle negative demand shortage', () => {
      const params = {
        scenario: { riskMultiplier: 1, environmentPressure: 0.2 },
        storageUtil: 0.5,
        reliability: 0.95,
        shipmentReliability: 0.9,
        directiveReliability: 0.85,
        incidentCount: 0,
        incidentPenalty: 0,
        demandShortage: -100
      };
      
      const pressures = calculateMarketPressures(params);
      expect(pressures.shortagePressure).toBe(0);
    });

    it('should handle zero reliability', () => {
      const params = {
        product: 'gasoline',
        scenario: { gasolineBias: 0 },
        focusShift: 0,
        reliability: 0,
        gradeFactor: 1.0
      };
      
      const demand = calculateProductDemand(params);
      expect(demand).toBeGreaterThanOrEqual(0);
    });
  });
});
tests/unit/ui/renderers/scorecardRenderer.test.js
This is a new file.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderScorecard, drawScoreTrend } from '../../../../src/ui/renderers/scorecardRenderer.js';

describe('scorecardRenderer', () => {
  describe('renderScorecard', () => {
    let mockElements;
    let mockMetrics;
    let context;

    beforeEach(() => {
      mockElements = {
        scoreGrade: {
          textContent: '',
          setAttribute: vi.fn(),
          removeAttribute: vi.fn()
        },
        scoreDelta: {
          textContent: '',
          classList: {
            remove: vi.fn(),
            add: vi.fn()
          },
          setAttribute: vi.fn(),
          removeAttribute: vi.fn()
        },
        scoreNote: {
          textContent: ''
        }
      };

      mockMetrics = {
        grade: 'B+',
        score: 75,
        scoreDelta: 2.5,
        scoreNote: 'Performance improving'
      };

      context = {
        elements: mockElements,
        metrics: mockMetrics,
        lastSignature: '',
        setSignature: vi.fn()
      };
    });

    it('should render grade correctly', () => {
      renderScorecard(context);
      
      expect(mockElements.scoreGrade.textContent).toBe('B+');
    });

    it('should set title attribute with score', () => {
      renderScorecard(context);
      
      expect(mockElements.scoreGrade.setAttribute).toHaveBeenCalledWith(
        'title',
        expect.stringContaining('75')
      );
    });

    it('should handle missing grade', () => {
      context.metrics.grade = undefined;
      renderScorecard(context);
      
      expect(mockElements.scoreGrade.textContent).toBe('—');
    });

    it('should render positive delta', () => {
      context.metrics.scoreDelta = 3.2;
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.classList.add).toHaveBeenCalledWith('positive');
      expect(mockElements.scoreDelta.textContent).toContain('▲');
      expect(mockElements.scoreDelta.textContent).toContain('3.2');
    });

    it('should render negative delta', () => {
      context.metrics.scoreDelta = -2.8;
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.classList.add).toHaveBeenCalledWith('negative');
      expect(mockElements.scoreDelta.textContent).toContain('▼');
      expect(mockElements.scoreDelta.textContent).toContain('2.8');
    });

    it('should show dash for negligible delta', () => {
      context.metrics.scoreDelta = 0.02;
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.textContent).toBe('—');
    });

    it('should remove previous delta classes', () => {
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.classList.remove).toHaveBeenCalledWith('positive', 'negative');
    });

    it('should render score note', () => {
      renderScorecard(context);
      
      expect(mockElements.scoreNote.textContent).toBe('Performance improving');
    });

    it('should use default note when missing', () => {
      context.metrics.scoreNote = undefined;
      renderScorecard(context);
      
      expect(mockElements.scoreNote.textContent).toContain('stabilizing');
    });

    it('should return true when rendering succeeds', () => {
      const result = renderScorecard(context);
      expect(result).toBe(true);
    });

    it('should return false when scoreGrade element missing', () => {
      context.elements.scoreGrade = null;
      const result = renderScorecard(context);
      
      expect(result).toBe(false);
    });

    it('should handle undefined score', () => {
      context.metrics.score = undefined;
      renderScorecard(context);
      
      expect(mockElements.scoreGrade.removeAttribute).toHaveBeenCalledWith('title');
    });

    it('should handle zero delta', () => {
      context.metrics.scoreDelta = 0;
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.textContent).toBe('—');
      expect(mockElements.scoreDelta.removeAttribute).toHaveBeenCalledWith('title');
    });

    it('should set title for positive delta', () => {
      context.metrics.scoreDelta = 5;
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.setAttribute).toHaveBeenCalledWith(
        'title',
        expect.stringContaining('upward')
      );
    });

    it('should set title for negative delta', () => {
      context.metrics.scoreDelta = -5;
      renderScorecard(context);
      
      expect(mockElements.scoreDelta.setAttribute).toHaveBeenCalledWith(
        'title',
        expect.stringContaining('downward')
      );
    });

    it('should handle missing scoreDelta element', () => {
      context.elements.scoreDelta = null;
      
      expect(() => renderScorecard(context)).not.toThrow();
    });

    it('should handle missing scoreNote element', () => {
      context.elements.scoreNote = null;
      
      expect(() => renderScorecard(context)).not.toThrow();
    });
  });

  describe('drawScoreTrend', () => {
    let mockCtx;
    let mockCanvas;

    beforeEach(() => {
      mockCanvas = {
        width: 200,
        height: 100
      };

      mockCtx = {
        canvas: mockCanvas,
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0,
        setLineDash: vi.fn()
      };
    });

    it('should clear canvas before drawing', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);
      
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    });

    it('should draw background', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);
      
      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
    });

    it('should handle empty history', () => {
      drawScoreTrend(mockCtx, []);
      
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).not.toHaveBeenCalled();
    });

    it('should handle null context gracefully', () => {
      expect(() => drawScoreTrend(null, [70, 75, 80])).not.toThrow();
    });

    it('should draw target line', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);
      
      expect(mockCtx.setLineDash).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should draw filled area', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);
      
      expect(mockCtx.fill).toHaveBeenCalled();
    });

    it('should draw line chart', () => {
      const history = [70, 72, 75];
      drawScoreTrend(mockCtx, history);
      
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });

    it('should handle single data point', () => {
      const history = [75];
      
      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });

    it('should handle large history', () => {
      const history = Array.from({ length: 100 }, (_, i) => 70 + i * 0.1);
      
      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
      expect(mockCtx.lineTo.mock.calls.length).toBeGreaterThan(50);
    });

    it('should scale values correctly', () => {
      const history = [50, 75, 100];
      drawScoreTrend(mockCtx, history);
      
      // Should have called moveTo and lineTo for each point
      expect(mockCtx.moveTo).toHaveBeenCalled();
      expect(mockCtx.lineTo.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle all same values', () => {
      const history = [75, 75, 75, 75];
      
      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });

    it('should handle extreme value ranges', () => {
      const history = [0, 100];
      
      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });

    it('should apply gutters to prevent clipping', () => {
      const history = [70, 75, 80];
      drawScoreTrend(mockCtx, history);
      
      // Check that drawing calls are within canvas bounds
      const calls = mockCtx.lineTo.mock.calls;
      calls.forEach(call => {
        const [x, y] = call;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(200);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle grade with special characters', () => {
      const context = {
        elements: {
          scoreGrade: { textContent: '', setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreDelta: { textContent: '', classList: { remove: vi.fn(), add: vi.fn() }, setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreNote: { textContent: '' }
        },
        metrics: { grade: 'A++', score: 95, scoreDelta: 0, scoreNote: 'Excellent' },
        lastSignature: '',
        setSignature: vi.fn()
      };
      
      renderScorecard(context);
      expect(context.elements.scoreGrade.textContent).toBe('A++');
    });

    it('should handle very small delta values', () => {
      const context = {
        elements: {
          scoreGrade: { textContent: '', setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreDelta: { textContent: '', classList: { remove: vi.fn(), add: vi.fn() }, setAttribute: vi.fn(), removeAttribute: vi.fn() },
          scoreNote: { textContent: '' }
        },
        metrics: { grade: 'B', score: 70, scoreDelta: 0.001, scoreNote: 'Stable' },
        lastSignature: '',
        setSignature: vi.fn()
      };
      
      renderScorecard(context);
      expect(context.elements.scoreDelta.textContent).toBe('—');
    });

    it('should handle negative score values', () => {
      const mockCtx = {
        canvas: { width: 200, height: 100 },
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        setLineDash: vi.fn(),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 0
      };
      
      const history = [-10, 0, 10];
      expect(() => drawScoreTrend(mockCtx, history)).not.toThrow();
    });
  });
});
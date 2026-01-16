---
applyTo: "src/**/*"
---

# Source Code Instructions - JavaScript Modules

**Always consult the root `AGENTS.md` file for context-specific commands and architecture details.**

## Overview

This directory contains the core JavaScript modules for the SimRefinery simulation:
- `main.js` - Application initialization and game loop
- `simulation.js` - Simulation engine and game logic
- `renderer3d.js` - Three.js 3D rendering
- `ui.js` - UI controller and DOM manipulation

## Module System

All files use **ES6 module syntax**:
```javascript
// Import with .js extension (required)
import { ClassName } from "./module.js";
import * as THREE from "../vendor/three.module.js";

// Export classes and functions
export class MyClass { }
export const myFunction = () => { };
```

## Code Style Guidelines

### General JavaScript
- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Double quotes for strings
- **Semicolons:** Use them consistently
- **Arrow functions:** Prefer for callbacks and short functions
- **Const/Let:** Use `const` by default, `let` when reassignment needed
- **No var:** Never use `var`

### Naming Conventions
- **Classes:** PascalCase (e.g., `RefinerySimulation`, `TileRenderer`)
- **Functions/Methods:** camelCase (e.g., `updateMetrics`, `renderScene`)
- **Constants:** UPPER_SNAKE_CASE for true constants (e.g., `HOURS_PER_DAY`)
- **Private-ish:** Prefix with underscore for internal methods (e.g., `_createUnits`)

### Utility Functions
Common utilities are defined at the top of modules:
```javascript
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, t) => start + (end - start) * t;
const randomRange = (min, max) => min + Math.random() * (max - min);
```

## File-Specific Guidelines

### main.js
- **Purpose:** Orchestrate initialization and game loop
- **Pattern:** Create instances, wire them together, start animation loop
- **Key Responsibilities:**
  - Initialize simulation, renderer, and UI
  - Set up the requestAnimationFrame loop
  - Handle menu interactions
  - Manage unit configurations

### simulation.js
- **Purpose:** Core game logic and state management
- **Pattern:** Large class with many methods for different aspects
- **Key Responsibilities:**
  - Maintain simulation state (`timeMinutes`, `metrics`, `units`, etc.)
  - Update simulation on each tick
  - Calculate metrics (profit, reliability, emissions, etc.)
  - Manage scenarios and parameters
  - Handle save/load state

**Important Constants:**
```javascript
const HOURS_PER_DAY = 24;
const perDayToPerHour = (value) => value / HOURS_PER_DAY;
const perHourToPerDay = (value) => value * HOURS_PER_DAY;
```

### renderer3d.js
- **Purpose:** 3D visualization with Three.js
- **Pattern:** Class managing Three.js scene, camera, renderer
- **Key Responsibilities:**
  - Set up Three.js scene and camera
  - Render refinery units as 3D tiles
  - Handle camera controls (pan, rotate, zoom)
  - Animate product flows and visual effects
  - Manage lighting and color palettes

**Three.js Best Practices:**
- Always dispose of geometries and materials when removing objects
- Use object pools for frequently created/destroyed objects
- Update matrices only when necessary
- Use `requestAnimationFrame` for smooth animation

### ui.js
- **Purpose:** Bridge between DOM and simulation
- **Pattern:** Controller class with event handlers
- **Key Responsibilities:**
  - Cache DOM element references in `this.elements`
  - Bind event listeners to controls
  - Update displays with simulation metrics
  - Handle user input (sliders, buttons, menus)
  - Format numbers for display

**Number Formatting:**
```javascript
// Use toFixed for decimal places
value.toFixed(2)  // 2 decimal places

// Use toLocaleString for thousands separators
value.toLocaleString()  // e.g., "1,234"
```

## Common Modification Patterns

### Adding a New Parameter
1. **simulation.js:** Add to `this.params` object
2. **ui.js:** Add DOM element references to `this.elements`
3. **ui.js:** Create event handler for the control
4. **index.html:** Add the UI control (slider, button, etc.)

### Adding a New Metric
1. **simulation.js:** Add to `this.metrics` object
2. **simulation.js:** Update metric in `update()` or helper method
3. **ui.js:** Add display element to `this.elements`
4. **ui.js:** Update display in `updateMetrics()` method
5. **index.html:** Add display element to UI

### Adding a New Refinery Unit
1. **main.js:** Add configuration to `unitConfigs` array
2. **simulation.js:** Update `_createUnits()` if needed
3. **renderer3d.js:** Add visual representation if custom rendering needed
4. **simulation.js:** Update process topology if affects flows

### Modifying 3D Visuals
1. **renderer3d.js:** Locate relevant rendering code
2. Use existing patterns for creating meshes:
   ```javascript
   const geometry = new THREE.BoxGeometry(width, height, depth);
   const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
   const mesh = new THREE.Mesh(geometry, material);
   this.scene.add(mesh);
   ```
3. Clean up when removing:
   ```javascript
   geometry.dispose();
   material.dispose();
   this.scene.remove(mesh);
   ```

## Testing Changes

Since there are no automated tests:

1. **Run local server:**
   ```bash
   python -m http.server 8000
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:8000`
   - Open DevTools (F12)
   - Check Console for errors

3. **Manual verification:**
   - Test the specific feature you modified
   - Verify metrics update correctly
   - Check 3D rendering if visual changes
   - Test edge cases (extreme parameter values)

4. **Browser console debugging:**
   ```javascript
   // Log simulation state
   console.log(simulation.metrics);
   
   // Log specific values
   console.log("Profit:", simulation.metrics.profitPerHour);
   ```

## Performance Considerations

### Simulation (simulation.js)
- Keep calculations efficient in `update()` - it runs every frame
- Use early returns to skip unnecessary work
- Cache calculated values when possible
- Avoid creating new objects in hot paths

### Rendering (renderer3d.js)
- Minimize draw calls by batching geometry
- Use instanced rendering for repeated objects
- Update only what changed, not entire scene
- Dispose of Three.js resources properly
- Use `renderer.setAnimationLoop()` or `requestAnimationFrame`

### UI (ui.js)
- Throttle expensive DOM updates
- Cache DOM queries in `this.elements`
- Use `requestAnimationFrame` for smooth animations
- Avoid layout thrashing (read then write DOM)

## Debugging Tips

### Common Issues
- **Module not found:** Check import paths include `.js` extension
- **ReferenceError:** Check for typos in variable names
- **Three.js errors:** Verify scene setup and object disposal
- **UI not updating:** Check event listener attachment

### Debug Helpers
```javascript
// Add temporary logging
console.log("[DEBUG]", variableName, value);

// Inspect simulation state in console
// (when running in browser, access via DevTools)
window.debugSim = simulation;  // Then access in console

// Check Three.js scene
console.log(renderer.info);  // Render stats
```

## Best Practices

1. **Keep it simple:** This is vanilla JS, not a framework
2. **Follow existing patterns:** Match the style of surrounding code
3. **Comment sparingly:** Only explain "why", not "what"
4. **Test incrementally:** Run in browser after small changes
5. **Check console:** Always verify no errors after changes
6. **Preserve state:** Don't break save/load functionality
7. **Maintain compatibility:** Test in multiple browsers

## Quick Reference

**Import Three.js:**
```javascript
import * as THREE from "../vendor/three.module.js";
```

**Access simulation from UI:**
```javascript
this.simulation.params.crudeIntake = newValue;
this.simulation.metrics.profitPerHour  // readonly
```

**Create Three.js mesh:**
```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
this.scene.add(mesh);
```

**Format numbers for display:**
```javascript
const formatted = value.toFixed(2);  // "123.45"
const withCommas = value.toLocaleString();  // "1,234"
```

---

*For general architecture and setup instructions, see `/AGENTS.md`*

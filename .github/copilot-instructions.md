# GitHub Copilot Instructions - SimRefinery Reconstruct

**Always consult the nearest `AGENTS.md` file for context-specific commands and architecture details.**

---

## BuildInstructions

This is a **static web application** with **no build process required**.

### Development Server

To run the application locally, you MUST use a web server (ES6 modules require HTTP protocol):

**Python (Recommended):**
```bash
python -m http.server 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in a web browser.

### Important Constraints
- ❌ **No npm/package.json** - Dependencies are vendored
- ❌ **No build tools** - No webpack, vite, or bundlers
- ❌ **No TypeScript** - Pure JavaScript ES6 modules
- ❌ **No preprocessors** - Direct HTML/CSS/JS
- ✅ **ES6 Modules** - Native browser module support
- ✅ **Vendored Dependencies** - Three.js in `/vendor` directory

### Testing
- **No automated tests** - All testing is manual
- Run the application in a browser and verify functionality
- Check browser console (F12) for errors
- Test in multiple browsers (Chrome, Firefox, Safari)

### Linting
- **No linters configured** - Follow existing code style
- Use 2-space indentation
- Modern ES6+ JavaScript conventions

---

## ProjectLayout

### Repository Structure
```
simrefine_reconstruct/
├── index.html              # Main entry point
├── styles.css              # Global styles
├── info.md                 # Historical documentation
├── src/                    # Application source code
│   ├── main.js            # App initialization & game loop
│   ├── simulation.js      # Simulation logic (~4000 lines)
│   ├── renderer3d.js      # Three.js 3D rendering (~1800 lines)
│   └── ui.js              # UI controls & updates (~1500 lines)
├── vendor/                 # Third-party libraries
│   ├── three.module.js    # Three.js r149+
│   └── THREE_LICENSE
└── .github/               # GitHub configuration
    ├── copilot-instructions.md  # This file
    └── instructions/      # Path-specific instructions
```

### Module Architecture

**Entry Flow:**
```
index.html
  ↓ (loads as ES6 module)
src/main.js
  ├─→ simulation.js (RefinerySimulation class)
  ├─→ ui.js (UIController class)
  └─→ renderer3d.js (TileRenderer class)
       └─→ vendor/three.module.js
```

**Core Classes:**
- `RefinerySimulation` - Game state, logic, metrics
- `TileRenderer` - 3D visualization with Three.js
- `UIController` - DOM manipulation and event handling

### Key Files

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `src/simulation.js` | Simulation engine | ~4000 | High |
| `src/renderer3d.js` | 3D graphics | ~1800 | Medium |
| `src/ui.js` | UI controller | ~1500 | Medium |
| `src/main.js` | Integration | ~1700 | Medium |
| `index.html` | UI structure | ~430 | Low |
| `styles.css` | Styling | ~2400 | Low |

---

## Coding Guidelines

### JavaScript Style
- Use ES6+ features (arrow functions, destructuring, template literals)
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names (e.g., `crudeIntake`, not `ci`)
- Keep functions focused and single-purpose
- Add comments only for complex logic or non-obvious behavior

### Module Patterns
```javascript
// Correct ES6 module syntax
import { ClassName } from "./module.js";
export class MyClass { }
export const myFunction = () => { };
```

### HTML/CSS
- Semantic HTML5 elements
- CSS custom properties (variables) for theming
- BEM-like naming for CSS classes where appropriate
- Responsive design considerations

### Three.js Conventions
- Use existing color palettes defined in `PALETTES`
- Follow the established scene hierarchy
- Clean up Three.js objects properly (dispose geometries/materials)
- Use Vector2/Vector3 for spatial calculations

---

## Common Modification Patterns

### Adding a Simulation Feature
1. Update `RefinerySimulation` class in `simulation.js`
2. Add UI controls in `index.html` 
3. Wire controls in `UIController` in `ui.js`
4. Update display/rendering in `TileRenderer` if visual changes needed
5. Test manually in browser

### Modifying the 3D Scene
1. Locate relevant code in `TileRenderer` class
2. Use Three.js API (imported from `vendor/three.module.js`)
3. Follow existing patterns for geometries, materials, meshes
4. Test with different lighting modes and camera angles

### Updating the UI
1. Modify HTML structure in `index.html`
2. Add/modify styles in `styles.css`
3. Update event handlers in `UIController`
4. Test responsiveness and browser compatibility

---

## Important Notes for AI Assistants

### What This Project Is
- A browser-based simulation game prototype
- Educational/historical reconstruction of SimRefinery (1993)
- Single-page application with no backend
- Pure client-side JavaScript application

### What This Project Is NOT
- Not a Node.js application (no package.json)
- Not using modern build tools (no webpack/vite/parcel)
- Not using frameworks (no React/Vue/Angular)
- Not using TypeScript or JSX
- Not deployed with server-side rendering

### Critical Constraints
- **Must use ES6 modules** - All imports need `.js` extension
- **Must run on web server** - CORS prevents file:// protocol
- **No build step** - Code runs directly as written
- **Vendored dependencies** - Don't suggest npm packages
- **Manual testing only** - No test framework available

### When Making Changes
1. Preserve the vanilla JavaScript approach
2. Don't introduce build tools or package managers
3. Keep dependencies vendored (don't add npm)
4. Test changes by running a local web server
5. Check browser console for errors
6. Verify in multiple browsers when possible

---

## Quick Reference

**Start dev server:**
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

**Check for errors:**
- Open browser DevTools (F12)
- Check Console tab
- Check Network tab for 404s

**Main entry points:**
- HTML: `index.html`
- JavaScript: `src/main.js`
- Styles: `styles.css`

**Documentation:**
- Architecture: `AGENTS.md` (root)
- History: `info.md`
- This file: `.github/copilot-instructions.md`

---

*Last Updated: 2026-01-16*

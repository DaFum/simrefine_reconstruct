# AGENTS.md - SimRefinery Reconstruct

## Project Overview

**SimRefinery Reconstruct** is a browser-based simulation game that recreates the experience of managing an oil refinery. This is a web-based prototype built with vanilla JavaScript ES6 modules and Three.js for 3D visualization.

**Tech Stack:**
- Vanilla JavaScript (ES6 Modules)
- Three.js (r149 or later) for 3D rendering
- HTML5 + CSS3
- No build tools or bundlers required

**Project Type:** Static web application - runs directly in the browser without compilation or build steps.

---

## Architecture

### File Structure
```
/
├── index.html              # Main HTML file - application entry point
├── styles.css              # Global styles and UI theming
├── info.md                 # Background information about SimRefinery history
├── src/                    # JavaScript source modules
│   ├── main.js            # Application entry point and initialization
│   ├── simulation.js      # Core simulation logic and state management
│   ├── renderer3d.js      # Three.js 3D rendering and visualization
│   └── ui.js              # UI controller and event handlers
├── vendor/                 # Third-party libraries
│   ├── three.module.js    # Three.js library
│   └── THREE_LICENSE      # Three.js license
└── .github/               # GitHub configuration
```

### Core Components

1. **RefinerySimulation** (`src/simulation.js`)
   - Manages simulation state and game logic
   - Handles time progression, metrics, and scoring
   - Controls refinery units, products, and scenarios
   - ~4000 lines of simulation logic

2. **TileRenderer** (`src/renderer3d.js`)
   - Three.js-based 3D visualization
   - Renders refinery units, pipelines, and storage tanks
   - Handles camera controls and scene interactions
   - ~1800 lines of rendering code

3. **UIController** (`src/ui.js`)
   - Manages DOM interactions and UI updates
   - Handles user input and control panels
   - Updates displays with simulation metrics
   - ~1500 lines of UI management

4. **Main Application** (`src/main.js`)
   - Initializes all components
   - Sets up the game loop
   - Coordinates between simulation, renderer, and UI
   - ~1700 lines of integration code

---

## Development Environment Setup

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local web server (required for ES6 modules to work correctly)

### Running the Application

**Option 1: Using Python (Recommended)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open `http://localhost:8000` in your browser.

**Option 2: Using Node.js**
```bash
# Install http-server globally if not already installed
npm install -g http-server

# Run from project root
http-server -p 8000
```
Then open `http://localhost:8000` in your browser.

**Option 3: Using PHP**
```bash
php -S localhost:8000
```
Then open `http://localhost:8000` in your browser.

**Option 4: Using VS Code**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

### Important Notes
- **Do NOT** open `index.html` directly in the browser (file:// protocol)
- ES6 modules require a web server due to CORS restrictions
- The application uses query string versioning (`?v=N`) for cache busting

---

## Key Concepts

### Simulation State
- The simulation runs on a tick-based system
- Time is measured in simulated minutes
- Speed can be adjusted (0.25x to 4x real-time)
- State includes:
  - Refinery units and their operational status
  - Product outputs (gasoline, diesel, jet fuel, LPG)
  - Economic metrics (revenue, expenses, profit)
  - Environmental and safety metrics

### Game Mechanics
- **Parameters:** Players control crude intake, product focus, maintenance, safety, and environmental spending
- **Scenarios:** Pre-configured market conditions (steady, volatile, shortage, etc.)
- **Units:** Simulated refinery components (distillation, cracking, reforming, etc.)
- **Scoring:** Based on profitability, reliability, and regulatory compliance

### 3D Visualization
- Isometric-style tile-based rendering
- Color-coded product flows
- Interactive camera controls
- Grid overlay for spatial reference
- Dynamic lighting effects (twilight/daybreak palettes)

---

## Making Code Changes

### Code Style
- Use ES6+ modern JavaScript features
- Follow existing formatting conventions (2-space indentation)
- Use descriptive variable names
- Keep functions focused and modular
- Add comments for complex logic only when necessary

### Module System
- All JavaScript files use ES6 module syntax (`import`/`export`)
- Import paths are relative and include `.js` extension
- Query strings (`?v=N`) may be appended for cache control

### Common Tasks

**Adding a new simulation parameter:**
1. Add the parameter to `RefinerySimulation.params` in `simulation.js`
2. Create UI controls in `index.html`
3. Wire up the controls in `UIController` in `ui.js`
4. Update simulation logic to use the new parameter

**Adding a new refinery unit:**
1. Add unit definition to `unitConfigs` array in `main.js`
2. Update `_createUnits()` method in `simulation.js` if needed
3. Add visual representation in `TileRenderer` if custom rendering needed
4. Update unit connection topology if it affects product flows

**Modifying 3D visualization:**
1. Edit `TileRenderer` class in `renderer3d.js`
2. Three.js objects are managed within the renderer
3. Use existing color palettes from `PALETTES` constant
4. Test with different camera angles and lighting modes

**Updating UI:**
1. Modify HTML structure in `index.html`
2. Update corresponding styles in `styles.css`
3. Add event handlers in `UIController` in `ui.js`
4. Ensure responsive behavior is maintained

---

## Testing

### Manual Testing
This project currently has no automated test suite. All testing is manual.

**Testing Checklist:**
1. Open the application in a web browser via local server
2. Verify the 3D scene renders correctly
3. Test simulation controls (play/pause, speed adjustment)
4. Adjust parameters and verify simulation responds
5. Test scenario switching
6. Verify metrics update correctly
7. Check browser console for JavaScript errors
8. Test in multiple browsers (Chrome, Firefox, Safari)

**Browser Console:**
- Press F12 to open developer tools
- Check Console tab for errors or warnings
- Use Network tab to verify all resources load correctly

### Debugging
- Use `console.log()` statements for debugging
- Browser DevTools debugger with breakpoints
- Three.js can be inspected via `window.THREE` if exposed
- Simulation state can be logged from browser console

---

## Known Constraints

- No build system means no TypeScript, JSX, or modern bundlers
- ES6 modules require a web server (can't use file:// protocol)
- Three.js is vendored (not from npm/CDN)
- No package.json or dependency management
- No automated tests or CI/CD pipeline
- Single-page application with no routing

---

## Deployment

### Static Hosting
This application can be deployed to any static web host:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any web server that can serve static files

### Deployment Steps
1. Copy all files to the web server's public directory
2. Ensure the web server serves `.js` files with correct MIME type (`text/javascript`)
3. No build step required - files are served as-is
4. Access via the web server's URL

---

## Troubleshooting

### "Failed to load module" errors
- Ensure you're running a web server, not opening file:// directly
- Check that all import paths include `.js` extension
- Verify the server is running from the project root

### Three.js not rendering
- Check browser console for WebGL errors
- Verify browser supports WebGL (most modern browsers do)
- Check that `vendor/three.module.js` is loaded correctly

### Simulation not updating
- Check browser console for JavaScript errors
- Verify the game loop is running (not paused)
- Ensure simulation state is initialized correctly

### UI not responding
- Check that event handlers are attached correctly
- Verify DOM elements exist with expected IDs
- Check for JavaScript errors in console

---

## Additional Resources

- **Three.js Documentation:** https://threejs.org/docs/
- **ES6 Modules Guide:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **info.md:** Historical context about the original SimRefinery game

---

## Project History

This is a reconstruction/prototype of SimRefinery, originally developed by Maxis Business Simulations in 1993 for Chevron. The original game was never publicly released. This project recreates the refinery management simulation concept as a modern web application.

For detailed historical context, see `info.md`.

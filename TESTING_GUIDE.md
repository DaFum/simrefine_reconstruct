# SimRefinery Reconstruct - Testing Guide

## 🎯 Overview

This guide provides complete information about the test suite created for the SimRefinery Reconstruct project.

## 📦 What Was Created

A comprehensive unit test suite covering all newly added JavaScript modules:

### Configuration Files
- `package.json` - Test dependencies and npm scripts
- `vitest.config.js` - Vitest configuration with jsdom environment

### Test Files (1,946 lines of test code)
- `tests/unit/eventBus.test.js` (244 lines, 29 tests)
- `tests/unit/commandSystem.test.js` (415 lines, 46 tests)
- `tests/unit/audio.test.js` (340 lines, 42 tests)
- `tests/unit/themeManager.test.js` (311 lines, 36 tests)
- `tests/unit/windowManager.test.js` (272 lines, 31 tests)
- `tests/unit/missions.test.js` (321 lines, 44 tests)

### Supporting Files
- `tests/setup.js` - Global mocks (AudioContext, console)
- `tests/README.md` - Test documentation
- `TEST_SUMMARY.md` - Comprehensive test overview

**Total: 228+ test cases covering 6 modules**

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `vitest` (test runner)
- `@vitest/ui` (interactive UI)
- `@vitest/coverage-v8` (coverage reporting)
- `jsdom` (browser environment simulation)

### 2. Run Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm test -- --watch

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## 📋 Test Coverage Details

### EventBus (src/eventBus.js) - 29 tests
Simple event system for component communication.

**Tests cover:**
- Event subscription/unsubscription
- Multiple listeners per event
- Event emission with data
- Error handling in listeners
- Dynamic subscription
- Integration scenarios

### CommandSystem (src/commandSystem.js) - 46 tests
Command pattern for simulation actions.

**Tests cover:**
- All 9 command types (INSPECT_UNIT, DEPLOY_BYPASS, etc.)
- Command dispatching
- Event bus integration
- Error handling and logging
- Payload validation

### AudioController (src/audio.js) - 42 tests
Web Audio API controller for sound effects.

**Tests cover:**
- Lazy initialization on user interaction
- All 10 sound types (click, hover, toggle, success, error, etc.)
- Oscillator, noise, chord generation
- AudioContext lifecycle
- Error handling

### ThemeManager (src/themeManager.js) - 36 tests
Dynamic theme switching with alert-driven changes.

**Tests cover:**
- 4 themes (twilight, daybreak, emergency, training)
- Alert-driven emergency mode
- Theme cycling
- Renderer integration
- Multiple concurrent alerts

### WindowManager (src/windowManager.js) - 31 tests
Window layout and workspace management.

**Tests cover:**
- 3 workspaces (operations, market, maintenance)
- Window positioning
- Drag-and-drop integration
- Z-index management
- Workspace switching

### Missions (src/content/missions.js) - 44 tests
Mission data validation.

**Tests cover:**
- Data structure integrity
- Mission chain validation
- All 3 missions (tutorial, summer_rush, winter_diesel)
- Objective types (production, reliability, delivery)
- Product and target validation

## 🎨 Test Structure

```javascript
describe('ModuleName', () => {
  let instance;

  beforeEach(() => {
    // Setup before each test
    instance = new ModuleName();
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = instance.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## 🔍 What's NOT Tested

### CSS Files
- `css/components.css`, `css/layout.css`, `css/tokens.css`
- `hint.css`, `styles.css`

**Why:** CSS is best validated through visual regression or manual review.

### Vendor Libraries
- `vendor/interact.js`, `vendor/interact-module.js`

**Why:** Third-party libraries are tested by their maintainers.

### Large Integration Files
- `src/main.js` (57KB)
- `src/renderer3d.js` (81KB)
- `src/simulation.js` (140KB)
- `src/ui.js` (59KB)

**Why:** These require integration/E2E tests rather than unit tests. They orchestrate multiple systems and have heavy DOM/WebGL dependencies.

## 📊 Expected Results

When you run `npm test`, you should see:

### Success Output
```
 Test Files  6 passed (6)
      Tests  178 passed (178)
   Start at  13:39:05
   Duration  2.30s (transform 363ms, setup 127ms, import 448ms, tests 320ms, environment 4.68s)
```

### Failure Output (Example)
If a test fails (e.g., AudioController initialization), you will see:
```
 FAIL  tests/unit/audio.test.js > AudioController > constructor > should initialize with null context and disabled state
AssertionError: expected { context: AudioContext, masterGain: GainNode, ... } to be null
 ❯ tests/unit/audio.test.js:18:28
     16|   describe('constructor', () => {
     17|     it('should initialize with null context and disabled state', () => {
     18|       expect(audio.context).toBeNull();
       |                            ^
```
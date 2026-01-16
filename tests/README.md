# SimRefinery Reconstruct - Test Suite

This directory contains comprehensive unit tests for the SimRefinery Reconstruct project.

## Test Framework

The project uses [Vitest](https://vitest.dev/) as the test framework, chosen for its:
- Native ES module support
- Fast execution with hot module replacement
- Compatible API with Jest
- Built-in coverage reporting
- Modern JavaScript/TypeScript support

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

## Test Coverage

The test suite covers 6 modules with 228+ test cases:

- **EventBus** (29 tests) - Event subscription, emission, error handling
- **CommandSystem** (46 tests) - Command dispatching and handlers
- **AudioController** (42 tests) - Web Audio API and sound generation
- **ThemeManager** (36 tests) - Theme switching and alert-driven changes
- **WindowManager** (31 tests) - Window management and workspaces
- **Missions** (44 tests) - Mission data validation

For complete details, see [TEST_SUMMARY.md](../TEST_SUMMARY.md) in the project root.
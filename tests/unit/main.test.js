import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../src/simulation.js?v=3', () => {
  return {
    RefinerySimulation: vi.fn(function() {
      return {
        getProcessTopology: vi.fn(() => ({})),
        getUnits: vi.fn(() => []),
        getLogisticsState: vi.fn(() => ({})),
        getFlows: vi.fn(() => ({})),
        toggleRunning: vi.fn(() => true),
        reset: vi.fn(),
        applyScenario: vi.fn(),
        setParam: vi.fn(),
        pushLog: vi.fn(),
        getScenarioList: vi.fn(() => []),
        getUnitModeDefinitions: vi.fn(() => []),
        getRecorderState: vi.fn(() => ({ active: false })),
        togglePerformanceRecording: vi.fn(() => ({ active: true })),
        setSpeedFromPreset: vi.fn(() => 1),
        setSpeedMultiplier: vi.fn(() => 1),
        cycleSpeedPreset: vi.fn(() => 1),
        update: vi.fn(),
        getSpeedMultiplier: vi.fn(() => 1),
        getMissionState: vi.fn(() => ({})),
        getMetrics: vi.fn(() => ({
            gasoline: 0, diesel: 0, jet: 0, lpg: 0, profitPerHour: 0, reliability: 1, carbon: 0,
            score: 0, grade: 'B', scoreNote: ''
        })),
        getLogs: vi.fn(() => []),
        getTime: vi.fn(() => 0),
        getActiveAlerts: vi.fn(() => []),
        performInspection: vi.fn(),
        createSnapshot: vi.fn(() => ({})),
        loadSnapshot: vi.fn(),
        setUnitThrottle: vi.fn(),
        setUnitOffline: vi.fn(),
        triggerEmergencyShutdown: vi.fn(),
        releaseEmergencyShutdown: vi.fn()
      };
    })
  };
});

vi.mock('../../src/ui.js?v=3', () => {
  return {
    UIController: vi.fn(function() {
      return {
        setModeBadge: vi.fn(),
        selectUnit: vi.fn(),
        refreshControls: vi.fn(),
        setScenario: vi.fn(),
        setRunning: vi.fn(),
        update: vi.fn(),
        clearInspectionReports: vi.fn(),
        showHint: vi.fn()
      };
    })
  };
});

vi.mock('../../src/renderer3d.js?v=3', () => {
  return {
    TileRenderer: vi.fn(function() {
      return {
        getSurface: vi.fn(() => document.createElement('div')),
        resizeToContainer: vi.fn(),
        render: vi.fn(),
        setGridVisible: vi.fn(),
        setFlowVisible: vi.fn(),
        resetView: vi.fn(),
        cyclePalette: vi.fn(),
        setSelectedUnit: vi.fn(),
        setHighlightedPipelines: vi.fn(),
        focusOnLogistics: vi.fn(),
        setPointer: vi.fn(),
        setHoverUnit: vi.fn(),
        screenToIso: vi.fn(() => ({ x: 0, y: 0 })),
        getUnitAt: vi.fn(),
        isPanning: vi.fn(() => false),
        beginPan: vi.fn(),
        panTo: vi.fn(),
        endPan: vi.fn(),
        nudgeCamera: vi.fn(),
        zoomAt: vi.fn(),
        interactionEnabled: true,
        triggerPipelineBoost: vi.fn(),
        focusOnUnit: vi.fn()
      };
    })
  };
});

vi.mock('../../src/audio.js', () => {
  return {
    AudioController: vi.fn(function() {
      return {
        play: vi.fn()
      };
    })
  };
});

vi.mock('../../src/eventBus.js', () => {
  return {
    EventBus: vi.fn(function() {
      return {
        on: vi.fn(),
        emit: vi.fn()
      };
    })
  };
});

vi.mock('../../src/commandSystem.js', () => {
  return {
    CommandSystem: vi.fn(function() {
      return {
        dispatch: vi.fn()
      };
    })
  };
});

vi.mock('../../src/themeManager.js', () => ({ ThemeManager: vi.fn() }));
vi.mock('../../src/windowManager.js', () => ({ WindowManager: vi.fn() }));

import { RefinerySimulation } from '../../src/simulation.js?v=3';
import { UIController } from '../../src/ui.js?v=3';
import { TileRenderer } from '../../src/renderer3d.js?v=3';

describe('Main Entry Point', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    document.body.innerHTML = `
      <div id="map-viewport"></div>
      <div id="menu-bar">
        <button id="menu-toggle"></button>
        <div class="menu" id="scenario-menu"></div>
        <div class="menu" id="unit-menu"></div>
        <button data-action="view-toggle-grid"></button>
        <button data-action="view-toggle-flow"></button>
      </div>
      <input type="file" id="session-import-input" />
      <div id="unit-pulse"></div>
      <div class="map-toolbar">
        <button data-command="record-demo"></button>
        <button data-command="inspection"></button>
        <button data-command="build-road"></button>
        <button data-command="build-pipe"></button>
        <button data-command="bulldoze"></button>
      </div>
      <div id="prototype-notes"></div>
      <div id="speed-controls"></div>
      <div id="alert-callouts"></div>
      <div class="map-status"></div>
      <button data-preset="auto"></button>
      <button data-unit-target="distillation"></button>
      <button data-scenario="steady"></button>
      <div id="hud">
        <input type="range" />
      </div>
    `;
  });

  it('should initialize application components', async () => {
    await import('../../src/main.js');

    expect(RefinerySimulation).toHaveBeenCalled();
    expect(UIController).toHaveBeenCalled();
    expect(TileRenderer).toHaveBeenCalled();
  });

  it('should attach event listeners to UI elements', async () => {
      await import('../../src/main.js');
      const app = window.simRefinery;

      const menuToggle = document.getElementById('menu-toggle');
      menuToggle.click();
      expect(app.simulation.toggleRunning).toHaveBeenCalled();
      expect(app.ui.setRunning).toHaveBeenCalled();
  });

  it('should handle toolbar commands', async () => {
      await import('../../src/main.js');
      const app = window.simRefinery;

      const recordBtn = document.querySelector('button[data-command="record-demo"]');
      recordBtn.click();
      expect(app.simulation.togglePerformanceRecording).toHaveBeenCalled();
  });
});

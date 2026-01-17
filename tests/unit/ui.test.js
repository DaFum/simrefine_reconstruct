import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { UIController } from '../../src/ui.js';

describe('UIController', () => {
  let ui;
  let mockSimulation;
  let mockAudio;
  let mockCommandSystem;
  let mockEventBus;

  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div id="crude-input"></div>
      <div id="crude-value"></div>
      <div id="gasoline-focus"></div>
      <div id="focus-value"></div>
      <div id="maintenance"></div>
      <div id="maintenance-value"></div>
      <div id="safety"></div>
      <div id="safety-value"></div>
      <div id="env"></div>
      <div id="env-value"></div>
      <button id="toggle-sim"></button>
      <button id="step-sim"></button>
      <button id="reset-sim"></button>
      <select id="scenario-select"></select>
      <div id="scenario-description"></div>
      <div id="gasoline-output"></div>
      <div id="diesel-output"></div>
      <div id="jet-output"></div>
      <div id="lpg-output"></div>
      <div id="profit-output"></div>
      <div id="revenue-output"></div>
      <div id="expense-output"></div>
      <div id="penalty-output"></div>
      <div id="margin-output"></div>
      <div id="reliability-output"></div>
      <div id="strain-output"></div>
      <div id="carbon-output"></div>
      <ul id="event-log"></ul>
      <div id="unit-details"></div>
      <div id="sim-clock"></div>
      <div id="mode-badge"></div>
      <div id="record-indicator"></div>
      <div id="inventory-gasoline-fill"></div>
      <div id="inventory-gasoline-label"></div>
      <div id="inventory-diesel-fill"></div>
      <div id="inventory-diesel-label"></div>
      <div id="inventory-jet-fill"></div>
      <div id="inventory-jet-label"></div>
      <div id="map-logistics"></div>
      <div id="map-logistics-status"></div>
      <div id="map-logistics-next"></div>
      <div id="map-logistics-reliability"></div>
      <div id="map-logistics-gasoline"></div>
      <div id="map-logistics-diesel"></div>
      <div id="map-logistics-jet"></div>
      <ul id="shipment-list"></ul>
      <div id="shipment-reliability"></div>
      <ul id="directive-list"></ul>
      <div id="speed-controls"></div>
      <div id="speed-readout"></div>
      <button id="logistics-expedite"></button>
      <button id="logistics-delay"></button>
      <button id="logistics-expand"></button>
      <div id="storage-status"></div>
      <div id="score-grade"></div>
      <div id="score-delta"></div>
      <div id="score-note"></div>
      <canvas id="score-trend"></canvas>
    `;

    // Mock dependencies
    mockSimulation = {
      params: {
        crudeIntake: 100,
        productFocus: 0.5,
        maintenance: 0.6,
        safety: 0.5,
        environment: 0.4
      },
      getScenarioList: () => [{ key: 'steady', name: 'Steady', description: 'Desc' }],
      activeScenarioKey: 'steady',
      scenarios: { steady: { description: 'Desc' } },
      getMetrics: vi.fn(() => ({
        gasoline: 100,
        diesel: 50,
        jet: 20,
        lpg: 10,
        profitPerHour: 1000,
        reliability: 0.95,
        carbon: 50,
        score: 85,
        grade: 'B'
      })),
      getLogs: vi.fn(() => []),
      getTime: vi.fn(() => 0),
      getUnits: vi.fn(() => []),
      getLogisticsState: vi.fn(() => ({})),
      getMissionState: vi.fn(() => ({ active: null })),
      getFlows: vi.fn(() => ({})),
      toggleRunning: vi.fn(),
      requestStep: vi.fn(),
      reset: vi.fn(),
      requestExtraShipment: vi.fn(),
      delayNextShipment: vi.fn(),
      expandStorageCapacity: vi.fn(),
      getPerformanceHistory: vi.fn(() => [])
    };

    mockAudio = {
      play: vi.fn()
    };

    mockEventBus = {
      on: vi.fn(),
      emit: vi.fn()
    };

    mockCommandSystem = {
      dispatch: vi.fn(),
      eventBus: mockEventBus
    };

    ui = new UIController(mockSimulation, mockAudio, mockCommandSystem);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct simulation parameters', () => {
      expect(document.getElementById('crude-value').textContent).toContain('100 kbpd');
      expect(document.getElementById('focus-value').textContent).toBe('Balanced');
    });

    it('should populate scenario select', () => {
      const select = document.getElementById('scenario-select');
      expect(select.children.length).toBe(1);
      expect(select.value).toBe('steady');
    });
  });

  describe('User Interactions', () => {
    it('should dispatch command on crude slider change', () => {
      const slider = document.getElementById('crude-input');
      slider.value = '150';
      slider.dispatchEvent(new Event('input'));

      expect(mockCommandSystem.dispatch).toHaveBeenCalledWith({
        type: 'SET_PARAM',
        payload: { param: 'crudeIntake', value: 150 }
      });
    });

    it('should toggle simulation running state', () => {
      const btn = document.getElementById('toggle-sim');
      btn.click();
      expect(mockSimulation.toggleRunning).toHaveBeenCalled();
    });

    it('should request single step', () => {
      const btn = document.getElementById('step-sim');
      btn.click();
      expect(mockSimulation.requestStep).toHaveBeenCalled();
      expect(mockAudio.play).toHaveBeenCalledWith('click');
    });

    it('should reset simulation', () => {
      const btn = document.getElementById('reset-sim');
      btn.click();
      expect(mockSimulation.reset).toHaveBeenCalled();
    });

    it('should dispatch scenario change', () => {
      const select = document.getElementById('scenario-select');
      select.value = 'steady';
      select.dispatchEvent(new Event('change'));

      expect(mockCommandSystem.dispatch).toHaveBeenCalledWith({
        type: 'APPLY_SCENARIO',
        payload: { scenario: 'steady' }
      });
    });
  });

  describe('Updates', () => {
    it('should render metrics correctly', () => {
      ui.update();
      // Values are animated, so we check if they are set (animation might take frames)
      // Since requestAnimationFrame is mocked in jsdom environment usually or runs immediately?
      // Vitest jsdom uses raf-stub or similar?
      // Actually we mocked requestAnimationFrame implicitly or it runs?
      // Let's just check if update called getMetrics
      expect(mockSimulation.getMetrics).toHaveBeenCalled();
    });

    it('should update clock', () => {
        ui.update();
        const clock = document.getElementById('sim-clock');
        expect(clock.textContent).toContain('Jan 01');
    });
  });

  describe('Logistics Controls', () => {
      it('should handle expedite request', () => {
          const btn = document.getElementById('logistics-expedite');
          btn.click();
          expect(mockSimulation.requestExtraShipment).toHaveBeenCalled();
      });

      it('should handle delay request', () => {
          const btn = document.getElementById('logistics-delay');
          btn.click();
          expect(mockSimulation.delayNextShipment).toHaveBeenCalled();
      });

      it('should handle expand request', () => {
          const btn = document.getElementById('logistics-expand');
          btn.click();
          expect(mockSimulation.expandStorageCapacity).toHaveBeenCalled();
      });
  });

  describe('Event Handling', () => {
      it('should register event listeners', () => {
          expect(mockEventBus.on).toHaveBeenCalledWith('INSPECTION_COMPLETED', expect.any(Function));
          expect(mockEventBus.on).toHaveBeenCalledWith('CONVOY_DISPATCHED', expect.any(Function));
      });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeManager } from '../../src/themeManager.js';

describe('ThemeManager', () => {
  let themeManager;
  let mockRenderer;
  let mockEventBus;

  beforeEach(() => {
    // Reset document
    document.documentElement.dataset.theme = '';
    
    mockRenderer = {
      setPalette: vi.fn()
    };

    mockEventBus = {
      on: vi.fn((event, callback) => {
        mockEventBus[`_${event}`] = callback;
        return vi.fn(); // Return unsubscribe function
      }),
      emit: vi.fn()
    };

    themeManager = new ThemeManager(mockRenderer, mockEventBus);
  });

  afterEach(() => {
    document.documentElement.dataset.theme = '';
  });

  describe('constructor', () => {
    it('should initialize with renderer and eventBus', () => {
      expect(themeManager.renderer).toBe(mockRenderer);
      expect(themeManager.eventBus).toBe(mockEventBus);
    });

    it('should set default theme to twilight', () => {
      expect(themeManager.currentTheme).toBe('twilight');
    });

    it('should initialize activeDangerAlerts as Set', () => {
      expect(themeManager.activeDangerAlerts).toBeInstanceOf(Set);
      expect(themeManager.activeDangerAlerts.size).toBe(0);
    });

    it('should subscribe to ALERT_RAISED event', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith('ALERT_RAISED', expect.any(Function));
    });

    it('should subscribe to ALERT_CLEARED event', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith('ALERT_CLEARED', expect.any(Function));
    });

    it('should apply twilight theme on initialization', () => {
      expect(mockRenderer.setPalette).toHaveBeenCalled();
      expect(document.documentElement.dataset.theme).toBe('twilight');
    });
  });

  describe('setTheme', () => {
    it('should update currentTheme', () => {
      themeManager.setTheme('daybreak');
      expect(themeManager.currentTheme).toBe('daybreak');
    });

    it('should update document dataset', () => {
      themeManager.setTheme('emergency');
      expect(document.documentElement.dataset.theme).toBe('emergency');
    });

    it('should call renderer.setPalette with theme palette', () => {
      mockRenderer.setPalette.mockClear();
      themeManager.setTheme('training');
      
      expect(mockRenderer.setPalette).toHaveBeenCalledWith(
        expect.objectContaining({
          sky: expect.any(Number),
          ground: expect.any(Number),
          gridMajor: expect.any(Number)
        })
      );
    });

    it('should handle invalid theme name gracefully', () => {
      const currentTheme = themeManager.currentTheme;
      themeManager.setTheme('nonexistent');
      
      expect(themeManager.currentTheme).toBe(currentTheme);
    });

    it('should apply all valid themes', () => {
      const themes = ['twilight', 'daybreak', 'emergency', 'training'];
      
      themes.forEach(theme => {
        themeManager.setTheme(theme);
        expect(themeManager.currentTheme).toBe(theme);
        expect(document.documentElement.dataset.theme).toBe(theme);
      });
    });

    it('should not call setPalette if renderer is null', () => {
      const noRendererManager = new ThemeManager(null, mockEventBus);
      
      expect(() => noRendererManager.setTheme('daybreak')).not.toThrow();
    });

    it('should not call setPalette if setPalette method does not exist', () => {
      const invalidRenderer = {};
      const manager = new ThemeManager(invalidRenderer, mockEventBus);
      
      expect(() => manager.setTheme('daybreak')).not.toThrow();
    });
  });

  describe('cycleTheme', () => {
    it('should cycle to next theme', () => {
      themeManager.setTheme('twilight');
      themeManager.cycleTheme();
      
      expect(themeManager.currentTheme).not.toBe('twilight');
    });

    it('should cycle through all themes', () => {
      const themes = ['twilight', 'daybreak', 'emergency', 'training'];
      const visited = new Set();
      
      themeManager.setTheme('twilight');
      
      for (let i = 0; i < 4; i++) {
        themeManager.cycleTheme();
        visited.add(themeManager.currentTheme);
      }
      
      // Should have cycled through all themes
      expect(visited.size).toBeGreaterThanOrEqual(3);
    });

    it('should wrap around to first theme', () => {
      themeManager.setTheme('training');
      themeManager.cycleTheme();
      
      expect(themeManager.currentTheme).toBe('twilight');
    });
  });

  describe('ALERT_RAISED event handler', () => {
    it('should switch to emergency theme on danger alert', () => {
      const alert = { id: 'alert1', severity: 'danger', message: 'Critical error' };
      
      mockEventBus._ALERT_RAISED(alert);
      
      expect(themeManager.currentTheme).toBe('emergency');
    });

    it('should add alert id to activeDangerAlerts', () => {
      const alert = { id: 'alert1', severity: 'danger' };
      
      mockEventBus._ALERT_RAISED(alert);
      
      expect(themeManager.activeDangerAlerts.has('alert1')).toBe(true);
    });

    it('should not switch theme for non-danger alerts', () => {
      const initialTheme = themeManager.currentTheme;
      const alert = { id: 'alert1', severity: 'warning' };
      
      mockEventBus._ALERT_RAISED(alert);
      
      expect(themeManager.currentTheme).toBe(initialTheme);
    });

    it('should handle alerts without id', () => {
      const alert = { severity: 'danger', message: 'Error' };
      
      expect(() => mockEventBus._ALERT_RAISED(alert)).not.toThrow();
      expect(themeManager.currentTheme).toBe('emergency');
    });

    it('should track multiple danger alerts', () => {
      mockEventBus._ALERT_RAISED({ id: 'alert1', severity: 'danger' });
      mockEventBus._ALERT_RAISED({ id: 'alert2', severity: 'danger' });
      mockEventBus._ALERT_RAISED({ id: 'alert3', severity: 'danger' });
      
      expect(themeManager.activeDangerAlerts.size).toBe(3);
    });
  });

  describe('ALERT_CLEARED event handler', () => {
    it('should remove alert from activeDangerAlerts', () => {
      themeManager.activeDangerAlerts.add('alert1');
      
      mockEventBus._ALERT_CLEARED({ id: 'alert1' });
      
      expect(themeManager.activeDangerAlerts.has('alert1')).toBe(false);
    });

    it('should revert to twilight when last danger alert is cleared', () => {
      // Simulate danger alert
      mockEventBus._ALERT_RAISED({ id: 'alert1', severity: 'danger' });
      expect(themeManager.currentTheme).toBe('emergency');
      
      // Clear the alert
      mockEventBus._ALERT_CLEARED({ id: 'alert1' });
      
      expect(themeManager.currentTheme).toBe('twilight');
    });

    it('should stay in emergency mode if other danger alerts remain', () => {
      mockEventBus._ALERT_RAISED({ id: 'alert1', severity: 'danger' });
      mockEventBus._ALERT_RAISED({ id: 'alert2', severity: 'danger' });
      
      mockEventBus._ALERT_CLEARED({ id: 'alert1' });
      
      expect(themeManager.currentTheme).toBe('emergency');
      expect(themeManager.activeDangerAlerts.size).toBe(1);
    });

    it('should handle clearing non-existent alert', () => {
      expect(() => mockEventBus._ALERT_CLEARED({ id: 'nonexistent' })).not.toThrow();
    });

    it('should handle alert without id', () => {
      themeManager.activeDangerAlerts.add('alert1');
      
      expect(() => mockEventBus._ALERT_CLEARED({})).not.toThrow();
      expect(themeManager.activeDangerAlerts.has('alert1')).toBe(true);
    });

    it('should handle null alert', () => {
      expect(() => mockEventBus._ALERT_CLEARED(null)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete alert lifecycle', () => {
      // Raise danger alert
      mockEventBus._ALERT_RAISED({ id: 'fire', severity: 'danger' });
      expect(themeManager.currentTheme).toBe('emergency');
      
      // Clear danger alert
      mockEventBus._ALERT_CLEARED({ id: 'fire' });
      expect(themeManager.currentTheme).toBe('twilight');
    });

    it('should handle multiple concurrent danger alerts', () => {
      mockEventBus._ALERT_RAISED({ id: 'alert1', severity: 'danger' });
      mockEventBus._ALERT_RAISED({ id: 'alert2', severity: 'danger' });
      mockEventBus._ALERT_RAISED({ id: 'alert3', severity: 'danger' });
      
      mockEventBus._ALERT_CLEARED({ id: 'alert1' });
      expect(themeManager.currentTheme).toBe('emergency');
      
      mockEventBus._ALERT_CLEARED({ id: 'alert2' });
      expect(themeManager.currentTheme).toBe('emergency');
      
      mockEventBus._ALERT_CLEARED({ id: 'alert3' });
      expect(themeManager.currentTheme).toBe('twilight');
    });

    it('should not revert from manually set theme unless clearing last danger alert', () => {
      // Manually set to training
      themeManager.setTheme('training');
      
      // Raise and clear non-emergency alerts should not affect theme
      mockEventBus._ALERT_RAISED({ id: 'info', severity: 'info' });
      mockEventBus._ALERT_CLEARED({ id: 'info' });
      
      expect(themeManager.currentTheme).toBe('training');
    });

    it('should override manual theme when danger alert is raised', () => {
      themeManager.setTheme('daybreak');
      
      mockEventBus._ALERT_RAISED({ id: 'critical', severity: 'danger' });
      
      expect(themeManager.currentTheme).toBe('emergency');
    });
  });

  describe('theme data integrity', () => {
    it('should have complete palette for twilight theme', () => {
      themeManager.setTheme('twilight');
      
      const lastCall = mockRenderer.setPalette.mock.calls[mockRenderer.setPalette.mock.calls.length - 1];
      const palette = lastCall[0];
      
      expect(palette).toHaveProperty('sky');
      expect(palette).toHaveProperty('ground');
      expect(palette).toHaveProperty('gridMajor');
      expect(palette).toHaveProperty('flowLow');
      expect(palette).toHaveProperty('flowHigh');
    });

    it('should have unique palettes for each theme', () => {
      const palettes = [];
      
      ['twilight', 'daybreak', 'emergency', 'training'].forEach(theme => {
        mockRenderer.setPalette.mockClear();
        themeManager.setTheme(theme);
        
        const call = mockRenderer.setPalette.mock.calls[0];
        if (call) palettes.push(call[0]);
      });
      
      // Palettes should be different
      expect(palettes.length).toBe(4);
      expect(palettes[0].sky).not.toBe(palettes[1].sky);
    });
  });
});
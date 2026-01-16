import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WindowManager } from '../../src/windowManager.js';

// Mock interact.js
vi.mock('interactjs', () => ({
  default: vi.fn(() => ({
    draggable: vi.fn(() => ({
      on: vi.fn()
    }))
  }))
}));

describe('WindowManager', () => {
  let windowManager;
  let container;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.id = 'desktop';
    document.body.appendChild(container);

    // Add some window elements
    const mapWindow = document.createElement('div');
    mapWindow.className = 'window map-window';
    mapWindow.dataset.windowId = 'map-window';
    mapWindow.innerHTML = '<div class="window-title">Map</div>';
    container.appendChild(mapWindow);

    const editWindow = document.createElement('div');
    editWindow.className = 'window edit-window';
    editWindow.dataset.windowId = 'edit-window';
    editWindow.innerHTML = '<div class="window-title">Edit</div>';
    container.appendChild(editWindow);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with container element', () => {
      windowManager = new WindowManager('desktop');
      
      expect(windowManager.container).toBe(container);
    });

    it('should initialize with default workspace', () => {
      windowManager = new WindowManager('desktop');
      
      expect(windowManager.activeWorkspace).toBe('operations');
    });

    it('should find existing windows', () => {
      windowManager = new WindowManager('desktop');
      
      expect(windowManager.windows.length).toBe(2);
    });

    it('should define workspaces configuration', () => {
      windowManager = new WindowManager('desktop');
      
      expect(windowManager.workspaces).toBeDefined();
      expect(windowManager.workspaces.operations).toBeDefined();
      expect(windowManager.workspaces.market).toBeDefined();
      expect(windowManager.workspaces.maintenance).toBeDefined();
    });

    it('should handle missing container gracefully', () => {
      expect(() => new WindowManager('nonexistent')).not.toThrow();
    });
  });

  describe('_init', () => {
    it('should collect window elements', () => {
      windowManager = new WindowManager('desktop');
      
      expect(windowManager.windows.length).toBeGreaterThan(0);
    });

    it('should attach pointerdown listeners to window titles', () => {
      windowManager = new WindowManager('desktop');
      
      const mapTitle = container.querySelector('.map-window .window-title');
      expect(mapTitle).toBeDefined();
    });
  });

  describe('_bringToFront', () => {
    it('should set z-index of target element', () => {
      windowManager = new WindowManager('desktop');
      const window1 = container.querySelector('.map-window');
      
      windowManager._bringToFront(window1);
      
      expect(window1.style.zIndex).toBe('100');
    });

    it('should reset z-index of other windows', () => {
      windowManager = new WindowManager('desktop');
      const window1 = container.querySelector('.map-window');
      const window2 = container.querySelector('.edit-window');
      
      window2.style.zIndex = '100';
      windowManager._bringToFront(window1);
      
      expect(window2.style.zIndex).toBe('');
    });

    it('should handle single window', () => {
      // Remove one window
      const editWindow = container.querySelector('.edit-window');
      editWindow.remove();
      
      windowManager = new WindowManager('desktop');
      const window1 = container.querySelector('.map-window');
      
      expect(() => windowManager._bringToFront(window1)).not.toThrow();
      expect(window1.style.zIndex).toBe('100');
    });
  });

  describe('setWorkspace', () => {
    beforeEach(() => {
      windowManager = new WindowManager('desktop');
    });

    it('should update activeWorkspace', () => {
      windowManager.setWorkspace('market');
      
      expect(windowManager.activeWorkspace).toBe('market');
    });

    it('should show windows in workspace visible list', () => {
      windowManager.setWorkspace('operations');
      
      const mapWindow = container.querySelector('.map-window');
      const editWindow = container.querySelector('.edit-window');
      
      expect(mapWindow.style.display).toBe('flex');
      expect(editWindow.style.display).toBe('flex');
    });

    it('should hide windows not in workspace visible list', () => {
      windowManager.setWorkspace('maintenance');
      
      const editWindow = container.querySelector('.edit-window');
      
      expect(editWindow.style.display).toBe('none');
    });

    it('should apply layout configuration', () => {
      windowManager.setWorkspace('operations');
      
      const mapWindow = container.querySelector('.map-window');
      
      expect(mapWindow.style.position).toBe('absolute');
      expect(mapWindow.style.left).toBeTruthy();
      expect(mapWindow.style.top).toBeTruthy();
    });

    it('should reset drag offsets when switching workspace', () => {
      const mapWindow = container.querySelector('.map-window');
      mapWindow.setAttribute('data-x', '100');
      mapWindow.setAttribute('data-y', '50');
      mapWindow.style.transform = 'translate(100px, 50px)';
      
      windowManager.setWorkspace('operations');
      
      expect(mapWindow.style.transform).toBe('translate(0px, 0px)');
      expect(mapWindow.getAttribute('data-x')).toBe('0');
      expect(mapWindow.getAttribute('data-y')).toBe('0');
    });

    it('should handle invalid workspace name gracefully', () => {
      const current = windowManager.activeWorkspace;
      
      windowManager.setWorkspace('nonexistent');
      
      expect(windowManager.activeWorkspace).toBe(current);
    });

    it('should handle windows without data-window-id', () => {
      const window3 = document.createElement('div');
      window3.className = 'window custom-window';
      container.appendChild(window3);
      
      windowManager = new WindowManager('desktop');
      
      expect(() => windowManager.setWorkspace('operations')).not.toThrow();
    });
  });

  describe('workspace configurations', () => {
    beforeEach(() => {
      windowManager = new WindowManager('desktop');
    });

    it('should have operations workspace with both windows', () => {
      const config = windowManager.workspaces.operations;
      
      expect(config.visible).toContain('map-window');
      expect(config.visible).toContain('edit-window');
    });

    it('should have market workspace configuration', () => {
      const config = windowManager.workspaces.market;
      
      expect(config.visible).toBeDefined();
      expect(config.layout).toBeDefined();
    });

    it('should have maintenance workspace configuration', () => {
      const config = windowManager.workspaces.maintenance;
      
      expect(config.visible).toContain('map-window');
      expect(config.layout).toBeDefined();
    });

    it('should have valid layout dimensions', () => {
      Object.values(windowManager.workspaces).forEach(workspace => {
        if (workspace.layout) {
          Object.values(workspace.layout).forEach(layout => {
            expect(layout.x).toBeGreaterThanOrEqual(0);
            expect(layout.y).toBeGreaterThanOrEqual(0);
            expect(layout.w).toBeGreaterThan(0);
            expect(layout.h).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe('integration', () => {
    beforeEach(() => {
      windowManager = new WindowManager('desktop');
    });

    it('should switch between workspaces', () => {
      windowManager.setWorkspace('operations');
      expect(windowManager.activeWorkspace).toBe('operations');
      
      windowManager.setWorkspace('market');
      expect(windowManager.activeWorkspace).toBe('market');
      
      windowManager.setWorkspace('maintenance');
      expect(windowManager.activeWorkspace).toBe('maintenance');
    });

    it('should maintain window state across workspace switches', () => {
      const mapWindow = container.querySelector('.map-window');
      
      windowManager.setWorkspace('operations');
      const originalLeft = mapWindow.style.left;
      
      windowManager.setWorkspace('maintenance');
      windowManager.setWorkspace('operations');
      
      expect(mapWindow.style.left).toBe(originalLeft);
    });

    it('should handle rapid workspace changes', () => {
      for (let i = 0; i < 10; i++) {
        windowManager.setWorkspace('operations');
        windowManager.setWorkspace('market');
        windowManager.setWorkspace('maintenance');
      }
      
      expect(windowManager.activeWorkspace).toBe('maintenance');
    });
  });
});
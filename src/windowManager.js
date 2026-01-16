export class WindowManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.windows = [];
    this.activeWorkspace = "operations";

    // Workspaces definition
    this.workspaces = {
      operations: {
        visible: ["map-window", "edit-window"],
        layout: {
          "map-window": { x: 0, y: 0, w: 800, h: 600 },
          "edit-window": { x: 820, y: 0, w: 350, h: 600 }
        }
      },
      market: {
        visible: ["edit-window"], // Just as example, ideally would have separate market window
        layout: {
          "edit-window": { x: 100, y: 50, w: 800, h: 500 }
        }
      },
      maintenance: {
        visible: ["map-window"],
        layout: {
          "map-window": { x: 50, y: 50, w: 1000, h: 700 }
        }
      }
    };

    this._init();
  }

  _init() {
    if (!this.container) return;

    // Find existing windows
    const windowEls = this.container.querySelectorAll('.window');
    windowEls.forEach(el => {
      this.makeDraggable(el);
      // TODO: Implement window resizing (currently windows are draggable only and cannot be resized).
      // this.makeResizable(el);
      this.windows.push(el);
    });

    // Create workspace switcher (simple UI for now)
    this._createWorkspaceSwitcher();
  }

  makeDraggable(element) {
    const header = element.querySelector('.window-title');
    if (!header) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = element.getBoundingClientRect();
      // If position is static (flex), we need to switch to absolute
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === 'static' || computedStyle.position === 'relative') {
          // Snap to current position but absolute
          const parentRect = this.container.getBoundingClientRect();
          element.style.position = 'absolute';
          element.style.left = (rect.left - parentRect.left) + 'px';
          element.style.top = (rect.top - parentRect.top) + 'px';
          element.style.width = rect.width + 'px';
          element.style.height = rect.height + 'px';
          element.style.flex = 'none';
      }

      initialLeft = parseFloat(element.style.left || 0);
      initialTop = parseFloat(element.style.top || 0);

      header.setPointerCapture(e.pointerId);
      element.style.zIndex = 100; // Bring to front
    });

    header.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.left = `${initialLeft + dx}px`;
      element.style.top = `${initialTop + dy}px`;
    });

    header.addEventListener('pointerup', (e) => {
      isDragging = false;
      header.releasePointerCapture(e.pointerId);
      element.style.zIndex = '';
    });
  }

  setWorkspace(name) {
      if (!this.workspaces[name]) return;
      this.activeWorkspace = name;
      const config = this.workspaces[name];

      this.windows.forEach(win => {
          // Check if window should be visible
          // Use data-window-id if available, fallback to finding class ending in -window
          const winClass = win.dataset.windowId || Array.from(win.classList).find(c => c.endsWith('-window'));

          if (config.visible.includes(winClass)) {
              win.style.display = 'flex';
              // Apply layout if defined
              if (config.layout && config.layout[winClass]) {
                  const layout = config.layout[winClass];
                  win.style.position = 'absolute';
                  win.style.left = layout.x + 'px';
                  win.style.top = layout.y + 'px';
                  win.style.width = layout.w + 'px';
                  win.style.height = layout.h + 'px';
              }
          } else {
              win.style.display = 'none';
          }
      });
  }

  _createWorkspaceSwitcher() {
      // Inject a simple switcher into the menu bar?
      // Or just assume the existing UI will call setWorkspace.
      // For now, let's expose it on window for debugging or Main usage.
  }
}

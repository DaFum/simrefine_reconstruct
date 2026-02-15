import interact from 'interactjs';

export class WindowManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.windows = [];
    this.activeWorkspace = "operations";
    this.workspaceMenuEntries = new Map();

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
      this.windows.push(el);
    });

    // Initialize interact.js for draggable windows
    interact('.window').draggable({
      allowFrom: '.window-title',
      inertia: true,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: true
        })
      ],
      listeners: {
        start: (event) => {
          // Bring to front on start drag
          this._bringToFront(event.target);
        },
        move: (event) => {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          // translate the element
          target.style.transform = `translate(${x}px, ${y}px)`;

          // update the position attributes
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        }
      }
    });

    // Add pointerdown listener to bring to front even when not dragging (just clicking)
    this.windows.forEach(win => {
        const header = win.querySelector('.window-title');
        if (header) {
            header.addEventListener('pointerdown', () => {
                this._bringToFront(win);
            });
        }
    });

    // Create workspace switcher (simple UI for now)
    this._createWorkspaceSwitcher();
    this.setWorkspace(this.activeWorkspace);
  }

  _bringToFront(element) {
    // Reset z-index of other windows
    this.windows.forEach(win => {
      if (win !== element) {
        win.style.zIndex = '';
      }
    });
    element.style.zIndex = 100;
  }

  setWorkspace(name) {
      if (!this.workspaces[name]) return;
      this.activeWorkspace = name;
      const config = this.workspaces[name];

      // Update menu active state
      this.workspaceMenuEntries.forEach((entry, wsName) => {
          entry.classList.toggle('active', wsName === name);
      });

      this.windows.forEach(win => {
          // Check if window should be visible
          // Use data-window-id if available, fallback to finding class ending in -window
          const winClass = win.dataset.windowId || Array.from(win.classList).find(c => c.endsWith('-window'));

          if (config.visible.includes(winClass)) {
              win.style.display = 'flex';
              // Apply layout if defined
              if (config.layout?.[winClass]) {
                  const layout = config.layout[winClass];
                  win.style.position = 'absolute';
                  win.style.left = `${layout.x}px`;
                  win.style.top = `${layout.y}px`;
                  win.style.width = `${layout.w}px`;
                  win.style.height = `${layout.h}px`;

                  // Reset drag offsets when switching workspace
                  win.style.transform = 'translate(0px, 0px)';
                  win.setAttribute('data-x', 0);
                  win.setAttribute('data-y', 0);
              }
          } else {
              win.style.display = 'none';
          }
      });
  }

  _createWorkspaceSwitcher() {
      const menuBar = document.getElementById('menu-bar');
      if (!menuBar) return;

      const spacer = menuBar.querySelector('.menu-spacer');

      const menuContainer = document.createElement('div');
      menuContainer.className = 'menu';
      menuContainer.dataset.menu = 'workspaces';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'menu-item';
      button.setAttribute('role', 'menuitem');
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'Workspaces';

      const dropdown = document.createElement('div');
      dropdown.className = 'menu-dropdown';
      dropdown.setAttribute('role', 'menu');

      Object.keys(this.workspaces).forEach(wsName => {
          const entry = document.createElement('button');
          entry.type = 'button';
          entry.className = 'menu-entry';
          entry.dataset.workspace = wsName;
          entry.textContent = wsName.charAt(0).toUpperCase() + wsName.slice(1);

          entry.addEventListener('click', () => {
              this.setWorkspace(wsName);
          });

          dropdown.appendChild(entry);
          this.workspaceMenuEntries.set(wsName, entry);
      });

      menuContainer.appendChild(button);
      menuContainer.appendChild(dropdown);

      if (spacer) {
          menuBar.insertBefore(menuContainer, spacer);
      } else {
          menuBar.appendChild(menuContainer);
      }
  }
}

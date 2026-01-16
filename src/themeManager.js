const THEMES = {
  twilight: {
    palette: {
      sky: 0x0f1726,
      ground: 0x1b2736,
      gridMajor: 0x2e3f55,
      gridMinor: 0x233244,
      sun: 0xffe7b0,
      ambientTop: 0x8ea9ff,
      ambientBottom: 0x101829,
      flowLow: 0x2469a4,
      flowHigh: 0x66f5ff,
      pointer: 0xffffff,
      storageShell: 0x2b3442,
      storageLabels: 0xeaf2ff,
      highlight: 0xffffff,
    },
    uiTheme: "twilight"
  },
  daybreak: {
    palette: {
      sky: 0x1c2736,
      ground: 0x263445,
      gridMajor: 0x3b516b,
      gridMinor: 0x2b3c4f,
      sun: 0xfff2cc,
      ambientTop: 0xb0c6ff,
      ambientBottom: 0x1a2434,
      flowLow: 0x2c7a45,
      flowHigh: 0x98ff9f,
      pointer: 0xf6ffdc,
      storageShell: 0x304050,
      storageLabels: 0xf7fbe9,
      highlight: 0xf0ffd5,
    },
    uiTheme: "daybreak"
  },
  emergency: {
    palette: {
      sky: 0x2a0a0a,
      ground: 0x3d1414,
      gridMajor: 0x5e2a2a,
      gridMinor: 0x421515,
      sun: 0xff8866,
      ambientTop: 0xff9988,
      ambientBottom: 0x1a0505,
      flowLow: 0x8a2be2, // Weird purple warning flow
      flowHigh: 0xff4500, // Orange-Red
      pointer: 0xffaaaa,
      storageShell: 0x4d1f1f,
      storageLabels: 0xffcccc,
      highlight: 0xffaaaa,
    },
    uiTheme: "emergency"
  },
  training: {
    palette: {
      sky: 0x102610,
      ground: 0x1a331a,
      gridMajor: 0x2e552e,
      gridMinor: 0x224422,
      sun: 0xf0ffcc,
      ambientTop: 0x88ffaa,
      ambientBottom: 0x051a05,
      flowLow: 0x00aa00,
      flowHigh: 0xccffcc,
      pointer: 0xaaffaa,
      storageShell: 0x1f4d1f,
      storageLabels: 0xccffcc,
      highlight: 0xaaffaa,
    },
    uiTheme: "training"
  }
};

export class ThemeManager {
  constructor(renderer, eventBus) {
    this.renderer = renderer;
    this.eventBus = eventBus;
    this.currentTheme = "twilight";
    this.activeDangerAlerts = new Set();

    this.eventBus.on("ALERT_RAISED", (alert) => {
        if (alert.severity === "danger") {
            if (alert.id) {
                this.activeDangerAlerts.add(alert.id);
            }
            this.setTheme("emergency");
        }
    });

    this.eventBus.on("ALERT_CLEARED", (alert) => {
        if (alert && alert.id) {
            this.activeDangerAlerts.delete(alert.id);
        }

        // Revert to default if no danger alerts remain
        if (this.currentTheme === "emergency" && this.activeDangerAlerts.size === 0) {
            this.setTheme("twilight");
        }
    });

    // Initial set
    this.setTheme("twilight");
  }

  setTheme(themeName) {
    const theme = THEMES[themeName];
    if (!theme) return;

    this.currentTheme = themeName;

    // Update CSS
    document.documentElement.dataset.theme = theme.uiTheme;

    // Update Renderer
    if (this.renderer && typeof this.renderer.setPalette === "function") {
        this.renderer.setPalette(theme.palette);
    }
  }

  cycleTheme() {
      const keys = Object.keys(THEMES);
      const idx = keys.indexOf(this.currentTheme);
      const next = keys[(idx + 1) % keys.length];
      this.setTheme(next);
  }
}

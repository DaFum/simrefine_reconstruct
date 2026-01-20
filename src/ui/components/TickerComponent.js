/**
 * Ticker Component
 * Scrolling marquee showing current crude oil prices and global demand for products
 * From game-features-list.md: "A scrolling marquee at the bottom showing current
 * Crude Oil prices and Global Demand for products"
 */

export class TickerComponent {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.simulation = options.simulation;
    this.updateInterval = options.updateInterval || 5000; // ms
    this.scrollSpeed = options.scrollSpeed || 50; // pixels per second

    this.element = null;
    this.contentElement = null;
    this.items = [];
    this.lastUpdate = 0;
    this.animationFrame = null;
    this.scrollPosition = 0;

    this._init();
  }

  _init() {
    // Create ticker container
    this.element = document.createElement('div');
    this.element.className = 'ticker-container';
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-label', 'Market ticker');

    // Create inner track
    const track = document.createElement('div');
    track.className = 'ticker-track';

    // Create scrolling content
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'ticker-content';

    track.appendChild(this.contentElement);
    this.element.appendChild(track);

    // Inject into container
    this.container.appendChild(this.element);

    // Inject styles
    this._injectStyles();

    // Initial update
    this._updateContent();

    // Start animation
    this._startAnimation();
  }

  _injectStyles() {
    if (document.getElementById('ticker-styles')) return;

    const style = document.createElement('style');
    style.id = 'ticker-styles';
    style.textContent = `
      .ticker-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 28px;
        background: linear-gradient(to bottom, #1a1a1a 0%, #0d0d0d 100%);
        border-top: 1px solid #333;
        overflow: hidden;
        z-index: 1000;
        font-family: var(--font-mono, 'IBM Plex Mono', monospace);
        font-size: 0.75rem;
      }

      .ticker-track {
        height: 100%;
        display: flex;
        align-items: center;
        overflow: hidden;
      }

      .ticker-content {
        display: flex;
        white-space: nowrap;
        will-change: transform;
      }

      .ticker-item {
        display: inline-flex;
        align-items: center;
        padding: 0 24px;
        color: #888;
        border-right: 1px solid #333;
      }

      .ticker-item:last-child {
        border-right: none;
      }

      .ticker-label {
        color: #666;
        margin-right: 8px;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: 0.05em;
      }

      .ticker-value {
        font-weight: 600;
        color: #fff;
      }

      .ticker-value.positive {
        color: #4ade80;
      }

      .ticker-value.negative {
        color: #f87171;
      }

      .ticker-change {
        margin-left: 6px;
        font-size: 0.7rem;
      }

      .ticker-change.up {
        color: #4ade80;
      }

      .ticker-change.up::before {
        content: '▲ ';
      }

      .ticker-change.down {
        color: #f87171;
      }

      .ticker-change.down::before {
        content: '▼ ';
      }

      .ticker-divider {
        width: 1px;
        height: 12px;
        background: #444;
        margin: 0 16px;
      }

      .ticker-demand {
        background: rgba(255, 158, 66, 0.1);
        padding: 2px 8px;
        border-radius: 2px;
      }

      .ticker-demand .ticker-label {
        color: var(--accent-orange, #ff9e42);
      }

      .ticker-alert {
        background: rgba(248, 113, 113, 0.15);
        animation: ticker-pulse 1s ease-in-out infinite;
      }

      @keyframes ticker-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      /* Hidden when in collapsed mode */
      body.ticker-hidden .ticker-container {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  _updateContent() {
    const items = this._gatherTickerData();
    this.items = items;

    // Build HTML
    let html = '';

    items.forEach((item, index) => {
      if (item.type === 'divider') {
        html += '<span class="ticker-divider"></span>';
        return;
      }

      const changeClass = item.change > 0 ? 'up' : item.change < 0 ? 'down' : '';
      const valueClass = item.positive ? 'positive' : item.negative ? 'negative' : '';
      const itemClass = item.alert ? 'ticker-item ticker-alert' :
                       item.demand ? 'ticker-item ticker-demand' : 'ticker-item';

      html += `<span class="${itemClass}">`;
      html += `<span class="ticker-label">${item.label}</span>`;
      html += `<span class="ticker-value ${valueClass}">${item.value}</span>`;

      if (item.change !== undefined && item.change !== 0) {
        html += `<span class="ticker-change ${changeClass}">${Math.abs(item.change).toFixed(2)}</span>`;
      }

      html += '</span>';
    });

    // Duplicate content for seamless loop
    this.contentElement.innerHTML = html + html;
    this.scrollPosition = 0;
  }

  _gatherTickerData() {
    const data = [];
    const sim = this.simulation;

    if (!sim) {
      return this._getDefaultData();
    }

    const metrics = sim.getMetrics?.() || {};
    const marketState = sim.getMarketState?.() || {};
    const scenario = sim.activeScenario || {};

    // Crude oil price
    const crudePrice = metrics.crudeCostPerBbl || 51;
    data.push({
      label: 'WTI Crude',
      value: `$${crudePrice.toFixed(2)}/bbl`,
      change: (scenario.qualityShift || 0) * 5
    });

    // Add divider
    data.push({ type: 'divider' });

    // Product futures
    const futures = marketState.futures || {};

    data.push({
      label: 'Gasoline',
      value: `$${(futures.gasoline || 112).toFixed(2)}`,
      change: (scenario.gasolineBias || 0) * 10,
      positive: (scenario.gasolineBias || 0) > 0.1
    });

    data.push({
      label: 'Diesel',
      value: `$${(futures.diesel || 96).toFixed(2)}`,
      change: (scenario.dieselBias || 0) * 10,
      positive: (scenario.dieselBias || 0) > 0.1
    });

    data.push({
      label: 'Jet Fuel',
      value: `$${(futures.jet || 108).toFixed(2)}`,
      change: (scenario.jetBias || 0) * 10,
      positive: (scenario.jetBias || 0) > 0.1
    });

    // Add divider
    data.push({ type: 'divider' });

    // Global demand indicators
    const totalDemand = Math.round((metrics.gasoline || 0) + (metrics.diesel || 0) + (metrics.jet || 0));

    data.push({
      label: 'Output',
      value: `${totalDemand.toFixed(0)} kbpd`,
      demand: true
    });

    // Market stress indicator
    const marketStress = sim.marketStress || 0.16;
    const stressLabel = marketStress > 0.4 ? 'High' :
                       marketStress > 0.25 ? 'Elevated' : 'Normal';
    data.push({
      label: 'Mkt Stress',
      value: stressLabel,
      alert: marketStress > 0.35,
      negative: marketStress > 0.25
    });

    // Add divider
    data.push({ type: 'divider' });

    // Reliability
    const reliability = Math.round((metrics.reliability || 1) * 100);
    data.push({
      label: 'Reliability',
      value: `${reliability}%`,
      positive: reliability > 90,
      negative: reliability < 70
    });

    // Profit
    const profit = metrics.profitPerHour || 0;
    data.push({
      label: 'Profit/hr',
      value: `$${(profit * 1000).toFixed(0)}`,
      positive: profit > 50,
      negative: profit < 0
    });

    // Scenario
    data.push({
      label: 'Scenario',
      value: scenario.name || 'Steady Operations'
    });

    return data;
  }

  _getDefaultData() {
    return [
      { label: 'WTI Crude', value: '$51.00/bbl', change: 0.5 },
      { type: 'divider' },
      { label: 'Gasoline', value: '$112.00', change: 1.2, positive: true },
      { label: 'Diesel', value: '$96.00', change: -0.5 },
      { label: 'Jet Fuel', value: '$108.00', change: 0.8 },
      { type: 'divider' },
      { label: 'Output', value: '120 kbpd', demand: true },
      { label: 'Mkt Stress', value: 'Normal' },
      { type: 'divider' },
      { label: 'Reliability', value: '95%', positive: true },
      { label: 'Profit/hr', value: '$45,000', positive: true },
      { label: 'Scenario', value: 'Steady Operations' }
    ];
  }

  _startAnimation() {
    let lastTime = performance.now();

    const animate = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Update scroll position
      this.scrollPosition += this.scrollSpeed * delta;

      // Get content width (half because content is duplicated)
      const contentWidth = this.contentElement.scrollWidth / 2;

      // Reset when first copy fully scrolled
      if (this.scrollPosition >= contentWidth) {
        this.scrollPosition -= contentWidth;
      }

      // Apply transform
      this.contentElement.style.transform = `translateX(-${this.scrollPosition}px)`;

      // Periodic data update
      if (now - this.lastUpdate > this.updateInterval) {
        this._updateContent();
        this.lastUpdate = now;
      }

      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Update with new simulation data
   */
  update(simulation) {
    this.simulation = simulation;
  }

  /**
   * Show/hide ticker
   */
  setVisible(visible) {
    if (visible) {
      document.body.classList.remove('ticker-hidden');
    } else {
      document.body.classList.add('ticker-hidden');
    }
  }

  /**
   * Set scroll speed
   */
  setScrollSpeed(pixelsPerSecond) {
    this.scrollSpeed = Math.max(10, Math.min(200, pixelsPerSecond));
  }

  /**
   * Pause/resume scrolling
   */
  togglePause() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      return true; // Now paused
    } else {
      this._startAnimation();
      return false; // Now playing
    }
  }

  /**
   * Force refresh content
   */
  refresh() {
    this._updateContent();
  }

  /**
   * Destroy component
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

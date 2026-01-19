
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const randomRange = (min, max) => min + Math.random() * (max - min);

const PRODUCT_LABELS = {
  gasoline: "gasoline",
  diesel: "diesel",
  jet: "jet fuel",
};

const SHIPMENT_PARCEL_SIZES = {
  gasoline: 44,
  diesel: 36,
  jet: 30,
};

const SHIPMENT_HORIZON_HOURS = 48;
const HOURS_PER_DAY = 24;

export class LogisticsSystem {
  constructor(simulation) {
    this.sim = simulation;
    this.storage = this._initStorage();
    this.storageBaseCapacity = { ...this.storage.capacity };
    this.storageAlertCache = this._createStorageAlertCache();
    this.shipments = [];
    this.shipmentStats = { total: 0, onTime: 0, missed: 0 };
    this.nextShipmentIn = 0;
    this.storagePressure = { active: false, throttle: 1, timer: 0, lastRatio: 0 };
    this.extraShipmentCooldown = 0;
    this.storageUpgrades = { level: 0 };
    this.logisticsRushCooldown = 0;
    this.activeConvoys = [];
    this._lastShipmentScheduled = { gasoline: -Infinity, diesel: -Infinity, jet: -Infinity };
    this.shipmentHorizonHours = SHIPMENT_HORIZON_HOURS;
  }

  reset() {
    this.storage = this._initStorage();
    this.storageBaseCapacity = { ...this.storage.capacity };
    this.storageAlertCache = this._createStorageAlertCache();
    this.shipments = [];
    this.shipmentStats = { total: 0, onTime: 0, missed: 0 };
    this.nextShipmentIn = 0;
    this.storagePressure = { active: false, throttle: 1, timer: 0, lastRatio: 0 };
    this.extraShipmentCooldown = 0;
    this.storageUpgrades = { level: 0 };
    this.logisticsRushCooldown = 0;
    this.activeConvoys = [];
    this._lastShipmentScheduled = { gasoline: -Infinity, diesel: -Infinity, jet: -Infinity };
    this._ensureScheduledShipments();
    this._updateNextShipmentCountdown();
  }

  restoreState(snapshot) {
     if (snapshot.logisticsRushCooldown !== undefined) this.logisticsRushCooldown = snapshot.logisticsRushCooldown;
     if (snapshot.nextShipmentIn !== undefined) this.nextShipmentIn = snapshot.nextShipmentIn;
     if (snapshot.extraShipmentCooldown !== undefined) this.extraShipmentCooldown = snapshot.extraShipmentCooldown;

     if (snapshot.storage) {
         this.storage = snapshot.storage;
         if (!this.storage.levels) this.storage = this._initStorage(); // Fallback
     }
     if (snapshot.storageBaseCapacity) this.storageBaseCapacity = snapshot.storageBaseCapacity;
     if (snapshot.storageAlerts) this.storageAlertCache = snapshot.storageAlerts;
     if (snapshot.shipments) this.shipments = snapshot.shipments;
     if (snapshot.shipmentStats) this.shipmentStats = snapshot.shipmentStats;
     if (snapshot.storagePressure) this.storagePressure = snapshot.storagePressure;
     if (snapshot.storageUpgrades) this.storageUpgrades = snapshot.storageUpgrades;

     // Convoys are in action toys in snapshot? No, checking snapshot structure.
     // In `createSnapshot`: `activeConvoys` is not explicitly top level?
     // `snapshot.units`... `recorder`...
     // Ah, `createSnapshot` didn't save `activeConvoys` explicitly in the monolithic version?
     // Wait, `getActionToysState` returns them.
     // Let's check `createSnapshot` in `src/simulation.js`.
     // It DOES NOT seem to save `activeConvoys` or `activeInspections`. That might be a bug in the original code or they are transient.
     // But `loadSnapshot` doesn't restore them either.
     // I will assume they are transient or I should add them.
     // For now, I will stick to what `RefinerySimulation` did (or didn't do).

     this._ensureScheduledShipments();
     this._updateNextShipmentCountdown();
  }

  update(deltaMinutes, context) {
      const { hours, production, prices, scenario } = context;

      this.logisticsRushCooldown = Math.max(0, this.logisticsRushCooldown - hours);
      this.extraShipmentCooldown = Math.max(0, (this.extraShipmentCooldown || 0) - hours);

      const report = this._updateLogistics({
          hours,
          production,
          prices,
          scenario
      });

      this._updateConvoys(deltaMinutes);

      return report;
  }

  _updateConvoys(deltaMinutes) {
    for (let i = this.activeConvoys.length - 1; i >= 0; i--) {
      const convoy = this.activeConvoys[i];
      convoy.elapsed += deltaMinutes;

      const ratePerMinute = convoy.totalVolume / convoy.duration;
      const drain = Math.min(convoy.remainingVolume, ratePerMinute * deltaMinutes);

      const available = this.storage.levels[convoy.product] || 0;
      const amountToDrain = Math.min(available, drain);
      this.storage.levels[convoy.product] = Math.max(0, available - amountToDrain);
      convoy.remainingVolume -= drain;

      if (convoy.elapsed >= convoy.duration || convoy.remainingVolume <= 0.01) {
         this.sim.pushLog("info", `Convoy returned. ${convoy.totalVolume.toFixed(0)} kb of ${this._formatProductLabel(convoy.product)} cleared.`);
         this.activeConvoys.splice(i, 1);
      }
    }
  }

  _initStorage() {
    const capacity = { gasoline: 220, diesel: 180, jet: 140 };
    return {
      capacity,
      levels: {
        gasoline: capacity.gasoline * 0.52,
        diesel: capacity.diesel * 0.48,
        jet: capacity.jet * 0.45,
      },
    };
  }

  _createStorageAlertCache() {
    const products = ["gasoline", "diesel", "jet"];
    const cache = {};
    products.forEach((product) => {
      cache[product] = {
        highActive: false,
        lowActive: false,
        highSeverity: "warning",
        lowSeverity: "warning",
        highTime: "",
        lowTime: "",
        latestRatio: 0,
      };
    });
    return cache;
  }

  _scheduleShipment(options = {}) {
    const {
      product,
      dueIn,
      volume,
      window,
      rush = false,
      autoplan = false,
      context = null,
    } = options || {};

    const planning = context || this._prepareShipmentPlanningContext();
    const chosenProduct = product || this._pickShipmentProduct(planning.weights);
    if (!chosenProduct) {
      return null;
    }

    const overallRatio = planning.overallRatio ?? this._computeStorageUtilization();
    const capacity = this.storage?.capacity?.[chosenProduct] || 0;
    const level = this.storage?.levels?.[chosenProduct] || 0;
    const productRatio = capacity ? clamp(level / capacity, 0, 1.3) : 0;
    const minProductThreshold =
      chosenProduct === "gasoline" ? 0.42 : chosenProduct === "diesel" ? 0.32 : 0.28;
    const lastScheduledMinutes = this._lastShipmentScheduled?.[chosenProduct] ?? -Infinity;
    const hoursSinceLast = lastScheduledMinutes === -Infinity ? Infinity : (this.sim.timeMinutes - lastScheduledMinutes) / 60;

    if (autoplan) {
      const allowByStaleness = hoursSinceLast >= 10;
      if ((productRatio < minProductThreshold || overallRatio < 0.42) && !allowByStaleness) {
        return null;
      }
      if (productRatio < minProductThreshold + 0.12 && overallRatio < 0.58 && !allowByStaleness) {
        return null;
      }
    }

    const resolvedDueIn = Math.max(
      autoplan ? 6.5 : 0.5,
      typeof dueIn === "number" && Number.isFinite(dueIn)
        ? dueIn
        : randomRange(autoplan ? planning.baseSpacing * 0.85 : 4, autoplan ? planning.baseSpacing * 1.2 : 9)
    );

    const resolvedVolume = Math.max(
      18,
      Math.round(
        typeof volume === "number" && Number.isFinite(volume)
          ? volume
          : this._estimateShipmentVolume(chosenProduct, planning.demandPerDay, rush)
      )
    );

    const cappedVolume = autoplan
      ? Math.min(
          resolvedVolume,
          capacity
            ? Math.max(20, Math.min(capacity * 0.55, level * 0.85 + capacity * 0.1))
            : resolvedVolume
        )
      : resolvedVolume;

    const resolvedWindow = Math.max(
      3,
      typeof window === "number" && Number.isFinite(window)
        ? window
        : this._estimateShipmentWindow(chosenProduct, resolvedDueIn, { rush, autoplan })
    );

    return this._registerShipment({
      product: chosenProduct,
      dueIn: autoplan ? Math.max(6, resolvedDueIn) : resolvedDueIn,
      volume: cappedVolume,
      deliveryWindow: resolvedWindow,
      rush,
      autoplan,
    });
  }

  _prepareShipmentPlanningContext() {
    const scenario = this.sim.activeScenario || {};
    // Coupling: Accessing MarketSystem from Simulation
    const demandPerDay = this.sim.marketSystem.calculateMarketDemand({
        hours: HOURS_PER_DAY,
        scenario,
        metrics: this.sim.metrics,
        params: this.sim.params
    });

    const weights = this._calculateShipmentWeights(demandPerDay, scenario);
    let baseSpacing = this._computeShipmentSpacing(demandPerDay);
    const overallRatio = this._computeStorageUtilization();
    if (overallRatio < 0.8) {
      const slackFactor = 1.1 + Math.max(0, 0.8 - overallRatio) * 0.8;
      baseSpacing *= slackFactor;
    }
    return { demandPerDay, weights, baseSpacing, scenario, overallRatio };
  }

  _calculateShipmentWeights(demandPerDay, scenario = {}) {
    const focus = clamp(this.sim.params.productFocus ?? 0.5, 0, 1);
    const focusShift = focus - 0.5;
    const weights = {
      gasoline: (demandPerDay.gasoline || 0) * (1 + focusShift * 0.55 + (scenario.gasolineBias || 0) * 0.6),
      diesel: (demandPerDay.diesel || 0) * (1 - focusShift * 0.45 + (scenario.dieselBias || 0) * 0.7),
      jet: (demandPerDay.jet || 0) * (1 - Math.abs(focusShift) * 0.25 + (scenario.jetBias || 0) * 0.9),
    };
    let total = 0;
    Object.keys(weights).forEach((key) => {
      weights[key] = Math.max(0.1, weights[key] || 0);
      total += weights[key];
    });
    if (total <= 0) {
      return { gasoline: 1, diesel: 1, jet: 1 };
    }
    return weights;
  }

  _computeShipmentSpacing(demandPerDay) {
    const shipmentsPerDay = Object.entries(SHIPMENT_PARCEL_SIZES).reduce((acc, [product, parcel]) => {
      const volume = Math.max(0, demandPerDay?.[product] || 0);
      if (!parcel) {
        return acc;
      }
      return acc + volume / parcel;
    }, 0);
    if (!Number.isFinite(shipmentsPerDay) || shipmentsPerDay <= 0) {
      return 10;
    }
    return clamp(24 / shipmentsPerDay, 4.5, 14);
  }

  _pickShipmentProduct(weights) {
    const entries = Object.entries(weights || {}).filter(([, weight]) => weight > 0);
    if (!entries.length) {
      return null;
    }
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    if (total <= 0) {
      return entries[0][0];
    }
    let roll = Math.random() * total;
    for (const [product, weight] of entries) {
      roll -= weight;
      if (roll <= 0) {
        return product;
      }
    }
    return entries[entries.length - 1][0];
  }

  _estimateShipmentVolume(product, demandPerDay, rush = false) {
    const parcel = SHIPMENT_PARCEL_SIZES[product] || 40;
    const demand = Math.max(0, demandPerDay?.[product] || parcel);
    const capacity = this.storage?.capacity?.[product] || parcel * 3;
    const focus = clamp(this.sim.params.productFocus ?? 0.5, 0, 1);
    const focusShift = focus - 0.5;
    let mixAdjust = 1;
    if (product === "gasoline") {
      mixAdjust += focusShift * 0.55;
    } else if (product === "diesel") {
      mixAdjust -= focusShift * 0.45;
    } else if (product === "jet") {
      mixAdjust -= Math.abs(focusShift) * 0.25;
    }
    const demandFactor = clamp(demand / Math.max(parcel, 1), 0.6, 1.75);
    const rushFactor = rush ? 1.15 : 1;
    const estimated = parcel * mixAdjust * demandFactor * rushFactor * randomRange(0.88, 1.12);
    const maxVolume = capacity * 0.72;
    return clamp(estimated, parcel * 0.5, maxVolume);
  }

  _estimateShipmentWindow(product, dueIn, { rush = false, autoplan = false } = {}) {
    const base = product === "jet" ? 8 : product === "diesel" ? 7.2 : 6.8;
    const slack = autoplan ? clamp(dueIn * 0.3, 1.5, 4.5) : 0;
    const rushFactor = rush ? 0.6 : 1;
    return clamp((base + slack) * rushFactor, 3.2, 12.5);
  }

  _registerShipment({ product, dueIn, volume, deliveryWindow, rush = false, autoplan = false }) {
    if (!product || !Number.isFinite(dueIn) || dueIn <= 0) {
      return null;
    }

    const effectiveWindow = typeof deliveryWindow === "number" && Number.isFinite(deliveryWindow) ? deliveryWindow : dueIn;

    const shipment = {
      id: `ship-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      product,
      volume: Math.round(Math.max(10, volume || 0)),
      window: effectiveWindow,
      dueIn,
      status: "pending",
      createdAt: this.sim.timeMinutes,
      scheduledAt: this.sim.timeMinutes + dueIn * 60,
      cooldown: 0,
      rush: Boolean(rush),
    };

    this.shipments.push(shipment);

    if (!autoplan || dueIn <= 18 || rush) {
      const label = PRODUCT_LABELS[product] || product;
      this.sim.pushLog(
        "info",
        `${shipment.volume.toFixed(0)} kb of ${label} slated for the dock within ${effectiveWindow.toFixed(1)} h.`,
        { product }
      );
    }

    this._updateNextShipmentCountdown();
    if (!this._lastShipmentScheduled) {
      this._lastShipmentScheduled = {};
    }
    this._lastShipmentScheduled[product] = this.sim.timeMinutes;
    return shipment;
  }

  _ensureScheduledShipments(horizonHours = this.shipmentHorizonHours || SHIPMENT_HORIZON_HOURS) {
    if (!Array.isArray(this.shipments)) {
      this.shipments = [];
    }

    const nowHours = this.sim.timeMinutes / 60;
    const target = nowHours + Math.max(12, horizonHours || SHIPMENT_HORIZON_HOURS);
    const pending = this.shipments.filter((shipment) => shipment && shipment.status === "pending");
    const farthestDue = pending.reduce((max, shipment) => {
      if (!shipment || !Number.isFinite(shipment.dueIn)) {
        return max;
      }
      return Math.max(max, shipment.dueIn);
    }, 0);
    let scheduledThrough = nowHours + farthestDue;
    const planning = this._prepareShipmentPlanningContext();

    let guard = 0;
    while (scheduledThrough < target && guard < 32) {
      const spacing = randomRange(planning.baseSpacing * 0.7, planning.baseSpacing * 1.35);
      scheduledThrough += Math.max(0.5, spacing);
      const dueIn = Math.max(0.75, scheduledThrough - nowHours);
      const created = this._scheduleShipment({ dueIn, autoplan: true, context: planning });
      guard += 1;
      if (!created) {
        break;
      }
    }

    this._updateNextShipmentCountdown();
  }

  _updateNextShipmentCountdown() {
    if (!Array.isArray(this.shipments) || !this.shipments.length) {
      this.nextShipmentIn = 0;
      return;
    }
    const pending = this.shipments.filter((shipment) => shipment && shipment.status === "pending");
    if (!pending.length) {
      this.nextShipmentIn = 0;
      return;
    }
    const next = pending.reduce((min, shipment) => {
      if (!shipment || !Number.isFinite(shipment.dueIn)) {
        return min;
      }
      const value = Math.max(0, shipment.dueIn);
      if (min === null || value < min) {
        return value;
      }
      return min;
    }, null);
    this.nextShipmentIn = next ?? 0;
  }

  _computeStorageUtilization() {
    if (!this.storage?.capacity || !this.storage?.levels) {
      return 0;
    }
    const totalCapacity =
      (this.storage.capacity.gasoline || 0) +
      (this.storage.capacity.diesel || 0) +
      (this.storage.capacity.jet || 0);
    if (totalCapacity <= 0) {
      return 0;
    }
    const totalLevel =
      (this.storage.levels.gasoline || 0) +
      (this.storage.levels.diesel || 0) +
      (this.storage.levels.jet || 0);
    return clamp(totalLevel / totalCapacity, 0, 1.4);
  }

  _resolveShipment(shipment, prices, report) {
    shipment.dueIn = 0;
    const product = shipment.product;
    const available = this.storage.levels[product];
    const price = prices[product] || 1.6;

    if (available >= shipment.volume) {
      this.storage.levels[product] = available - shipment.volume;
      shipment.status = "completed";
      shipment.completedAt = this.sim.timeMinutes;
      shipment.cooldown = 6;
      this.shipmentStats.total += 1;
      this.shipmentStats.onTime += 1;
      report.delivered[product] += shipment.volume;
      this._relieveStoragePressure(0.14);
      this.sim.pushLog(
        "info",
        `Loaded ${shipment.volume.toFixed(0)} kb of ${PRODUCT_LABELS[product]} for departure.`
      );
    } else {
      const shortage = Math.max(0, shipment.volume - available);
      this.storage.levels[product] = 0;
      shipment.status = "missed";
      shipment.completedAt = this.sim.timeMinutes;
      shipment.shortage = shortage;
      shipment.cooldown = 6;
      this.shipmentStats.total += 1;
      this.shipmentStats.missed = (this.shipmentStats.missed || 0) + 1;
      report.failed += 1;
      const severity = shipment.volume ? shortage / shipment.volume : 1;
      const penalty = shortage * price * 0.6;
      report.penalty += penalty;
      const level = severity > 0.35 ? "danger" : "warning";
      this.sim.pushLog(
        level,
        `Dock missed ${PRODUCT_LABELS[product]} charter by ${shortage.toFixed(0)} kb. Penalty assessed.`,
        { product }
      );
    }
  }

  _updateLogistics(context) {
    const { production, hours, prices, scenario } = context;
    const produced = {
      gasoline: Math.max(0, production.gasoline * hours),
      diesel: Math.max(0, production.diesel * hours),
      jet: Math.max(0, production.jet * hours),
    };

    Object.entries(produced).forEach(([product, volume]) => {
      const capacity = this.storage.capacity[product];
      this.storage.levels[product] = clamp(this.storage.levels[product] + volume, 0, capacity);
    });

    const demandDraw = this.sim.marketSystem.calculateMarketDemand({
        hours,
        scenario,
        metrics: this.sim.metrics,
        params: this.sim.params
    });

    const demandShortages = [];
    Object.entries(demandDraw).forEach(([product, draw]) => {
      const capacity = this.storage.capacity[product];
      const available = this.storage.levels[product];
      if (draw <= 0) {
        return;
      }
      const consumed = Math.min(draw, available);
      this.storage.levels[product] = clamp(available - consumed, 0, capacity);
      if (draw > consumed) {
        const shortage = draw - consumed;
        demandShortages.push({ product, shortage });
      }
    });

    let maxRatio = 0;
    Object.keys(this.storage.levels).forEach((product) => {
      const capacity = this.storage.capacity[product] || 0;
      const level = this.storage.levels[product] || 0;
      const ratio = capacity ? clamp(level / capacity, 0, 1.2) : 0;
      maxRatio = Math.max(maxRatio, ratio);
      this._updateStorageAlert(product, ratio);
    });

    this._applyStoragePressure(maxRatio, hours);

    const report = {
      delivered: { gasoline: 0, diesel: 0, jet: 0 },
      failed: 0,
      penalty: 0,
      demandShortage: 0,
      inventory: {
        levels: { ...this.storage.levels },
        capacity: { ...this.storage.capacity },
      },
      storageUtil: this.sim.metrics.storageUtilization,
    };

    if (demandShortages.length) {
      demandShortages.forEach(({ product, shortage }) => {
        const price = prices?.[product] || 82;
        report.demandShortage += shortage;
        report.penalty += shortage * price * 0.35;
      });
    }

    const activeShipments = [];
    let nextShipmentIn = Infinity;
    let pendingCount = 0;

    for (const shipment of this.shipments) {
      if (shipment.status === "pending") {
        shipment.dueIn -= hours;
        if (shipment.dueIn <= 0) {
          this._resolveShipment(shipment, prices, report);
        }
      } else {
        shipment.cooldown = Math.max(0, shipment.cooldown - hours);
      }

      if (shipment.status === "pending" || shipment.cooldown > 0) {
        activeShipments.push(shipment);
        if (shipment.status === "pending") {
          pendingCount++;
          if (shipment.dueIn < nextShipmentIn) {
            nextShipmentIn = shipment.dueIn;
          }
        }
      }
    }

    this.shipments = activeShipments;
    this.nextShipmentIn = nextShipmentIn === Infinity ? null : Math.max(0, nextShipmentIn);

    if (pendingCount < 8) {
      this._ensureScheduledShipments();
    }

    // Update simulation metrics
    const capacityTotal =
      this.storage.capacity.gasoline +
      this.storage.capacity.diesel +
      this.storage.capacity.jet;
    const levelTotal =
      this.storage.levels.gasoline +
      this.storage.levels.diesel +
      this.storage.levels.jet;

    this.sim.metrics.storageGasoline = this.sim._round(this.storage.levels.gasoline);
    this.sim.metrics.storageDiesel = this.sim._round(this.storage.levels.diesel);
    this.sim.metrics.storageJet = this.sim._round(this.storage.levels.jet);
    this.sim.metrics.storageUtilization = capacityTotal
      ? clamp(levelTotal / capacityTotal, 0, 1)
      : 0;

    const shipmentTotal = Math.max(0, this.shipmentStats.total);
    const onTime = this.shipmentStats.onTime;
    this.sim.metrics.shipmentReliability = shipmentTotal ? clamp(onTime / shipmentTotal, 0, 1) : 1;

    return report;
  }

  _applyStoragePressure(maxRatio, hours) {
    if (!this.storagePressure) {
      this.storagePressure = { active: false, throttle: 1, timer: 0, lastRatio: 0 };
    }
    const pressure = this.storagePressure;
    pressure.lastRatio = maxRatio;

    const threshold = 0.95;
    const reliefRate = Math.max(0.08, hours * 0.16);

    if (maxRatio >= threshold) {
      const severity = clamp((maxRatio - threshold) / 0.07, 0, 1);
      const newThrottle = clamp(1 - severity * 0.55, 0.45, 1);
      const wasActive = pressure.active;
      pressure.active = true;
      pressure.throttle = Math.min(pressure.throttle, newThrottle);
      pressure.timer = Math.max(pressure.timer, 2 + severity * 6);
      if (!wasActive) {
        this.sim.pushLog(
          "warning",
          `Storage congestion forcing crude intake to ${Math.round(pressure.throttle * 100)}%.`,
          { storage: true }
        );
      }
    } else if (pressure.active) {
      pressure.timer = Math.max(pressure.timer - hours, 0);
      pressure.throttle = clamp(pressure.throttle + reliefRate, 0.45, 1);
      if (pressure.timer <= 0 || pressure.throttle >= 0.995) {
        pressure.active = false;
        pressure.throttle = 1;
        pressure.timer = 0;
        this.sim.pushLog("info", "Tank pressure relieved; crude feed restored to 100%.", { storage: true });
      }
    } else {
      pressure.throttle = clamp(pressure.throttle + reliefRate, 0.45, 1);
      pressure.timer = Math.max(pressure.timer - hours, 0);
      if (pressure.throttle >= 0.995) {
        pressure.throttle = 1;
      }
    }
  }

  _relieveStoragePressure(boost = 0.12) {
    if (!this.storagePressure) {
      return;
    }
    const pressure = this.storagePressure;
    if (!pressure.active) {
      return;
    }
    pressure.throttle = clamp(pressure.throttle + boost, 0.45, 1);
    pressure.timer = Math.max(0, pressure.timer - boost * 8);
    if (pressure.throttle >= 0.995 || pressure.timer <= 0) {
      pressure.active = false;
      pressure.throttle = 1;
      pressure.timer = 0;
      this.sim.pushLog("info", "Logistics relief eased tank pressure; crude feed back to 100%.", {
        storage: true,
      });
    }
  }

  _updateStorageAlert(product, ratio) {
    if (!this.storageAlertCache || !this.storageAlertCache[product]) {
      return;
    }
    const cache = this.storageAlertCache[product];
    cache.latestRatio = ratio * 100;
    const label = this._formatProductLabel(product);

    if (ratio >= 0.92) {
      const severity = ratio > 0.98 ? "danger" : "warning";
      if (!cache.highActive || cache.highSeverity !== severity) {
        cache.highActive = true;
        cache.highSeverity = severity;
        cache.highTime = this.sim._formatTime();
        const message =
          severity === "danger"
            ? `${label} tank farm is overflowing at ${Math.round(ratio * 100)}% capacity.`
            : `${label} tanks at ${Math.round(ratio * 100)}% capacity.`;
        this.sim.pushLog(
          severity === "danger" ? "danger" : "warning",
          `${message} Expedite shipments or cut crude charge.`,
          { product }
        );
      }
    } else if (cache.highActive && ratio <= 0.86) {
      cache.highActive = false;
      cache.highSeverity = "warning";
      cache.highTime = "";
      this.sim.pushLog("info", `${label} storage relieved below 86%.`, { product });
    }

    if (ratio <= 0.14) {
      const severity = ratio < 0.07 ? "danger" : "warning";
      if (!cache.lowActive || cache.lowSeverity !== severity) {
        cache.lowActive = true;
        cache.lowSeverity = severity;
        cache.lowTime = this.sim._formatTime();
        const message =
          severity === "danger"
            ? `${label} tanks nearly drained (${Math.round(ratio * 100)}%).`
            : `${label} storage running thin at ${Math.round(ratio * 100)}%.`;
        this.sim.pushLog(
          severity === "danger" ? "danger" : "warning",
          `${message} Increase production or redirect supply.`,
          { product }
        );
      }
    } else if (cache.lowActive && ratio >= 0.2) {
      cache.lowActive = false;
      cache.lowSeverity = "warning";
      cache.lowTime = "";
      this.sim.pushLog("info", `${label} storage recovered above 20%.`, { product });
    }
  }

  _formatProductLabel(product) {
    const label = PRODUCT_LABELS[product] || product;
    return label
      .split(" ")
      .map((segment) =>
        segment.length ? segment.charAt(0).toUpperCase() + segment.slice(1) : segment
      )
      .join(" ");
  }

  // Public API methods

  dispatchLogisticsConvoy() {
    if (this.logisticsRushCooldown > 0.1) {
      const waitHours = Math.max(1, Math.round(this.logisticsRushCooldown));
      this.sim.pushLog(
        "warning",
        `Convoy already mobilized — wait ~${waitHours} h for crews to reset.`
      );
      return false;
    }

    const storage = this.storage;
    if (!storage?.levels) {
      this.sim.pushLog("info", "Storage data unavailable; convoy dispatch skipped.");
      return false;
    }

    let targetProduct = null;
    let highestRatio = 0;
    Object.entries(storage.levels).forEach(([product, level]) => {
      const capacity = storage.capacity?.[product] || 0;
      if (!capacity) {
        return;
      }
      const ratio = clamp(level / capacity, 0, 1.2);
      if (ratio > highestRatio) {
        highestRatio = ratio;
        targetProduct = product;
      }
    });

    if (!targetProduct || highestRatio < 0.35) {
      this.logisticsRushCooldown = Math.max(this.logisticsRushCooldown, 2);
      this.sim.pushLog("info", "Tanks are already comfortable — no need for a convoy right now.");
      return false;
    }

    const capacity = storage.capacity[targetProduct] || 0;
    const level = storage.levels[targetProduct] || 0;
    const reliefFraction = Math.min(0.28, 0.14 + highestRatio * 0.24);
    const relief = Math.min(level, capacity * reliefFraction);
    if (relief <= 0) {
      this.sim.pushLog("info", "Convoy stood down — nothing available to move.");
      return false;
    }

    const duration = 90; // minutes
    const convoy = {
       id: `convoy-${Date.now()}`,
       product: targetProduct,
       totalVolume: relief,
       remainingVolume: relief,
       duration: duration,
       elapsed: 0
    };
    this.activeConvoys.push(convoy);

    const label = this._formatProductLabel(targetProduct);
    this.sim.pendingOperationalCost += 260 + relief * 1.6;
    this.nextShipmentIn = Math.min(this.nextShipmentIn, 1.05);
    this.logisticsRushCooldown = 6;
    this._relieveStoragePressure(0.18);

    const rushDueIn = Math.min(Math.max(2.5, this.nextShipmentIn || 6), 6.5);
    this._scheduleShipment({
      product: targetProduct,
      dueIn: rushDueIn,
      rush: true,
    });

    this.sim.pushLog(
      "info",
      `Convoy dispatched to clear ${relief.toFixed(0)} kb of ${label} over ${Math.round(duration/60*10)/10}h.`,
      { product: targetProduct }
    );
    return { product: targetProduct, volume: relief, active: true };
  }

  delayNextShipment({ product } = {}) {
    const candidates = this.shipments
      .filter(
        (shipment) =>
          shipment &&
          shipment.status === "pending" &&
          !shipment.rush &&
          (typeof product === "string" ? shipment.product === product : true)
      )
      .sort((a, b) => (a.dueIn ?? Infinity) - (b.dueIn ?? Infinity));

    const target = candidates[0];
    if (!target) {
      this.sim.pushLog("info", "No standard shipments available to delay.");
      return false;
    }

    const nowDue = Number.isFinite(target.dueIn) ? Math.max(0.1, target.dueIn) : 2.5;
    const baseWindow = Math.max(1.5, target.window || 6);
    const delayHours = clamp(Math.max(4, baseWindow * 0.4), 4, 10);
    const maxSlack = Math.max(6, baseWindow * 1.2);
    const newDue = Math.min(nowDue + delayHours, nowDue + maxSlack);

    if (newDue <= nowDue + 0.2) {
      this.sim.pushLog("info", "Dock already allotted maximum slack for that charter.");
      return false;
    }

    target.dueIn = newDue;
    target.window = Math.max(target.window || newDue, newDue + Math.max(1.5, delayHours * 0.35));
    target.rescheduledAt = this.sim.timeMinutes;

    this.sim.pendingOperationalCost += delayHours * 18;
    this._updateNextShipmentCountdown();
    this._ensureScheduledShipments(this.shipmentHorizonHours);

    const label = this._formatProductLabel(target.product);
    this.sim.pushLog(
      "info",
      `Delayed ${label} charter by ${delayHours.toFixed(1)} h to rebalance inventories.`,
      { product: target.product }
    );

    return { product: target.product, delay: delayHours, dueIn: target.dueIn };
  }

  requestExtraShipment() {
    if (this.extraShipmentCooldown > 0.1) {
      const waitHours = Math.max(1, Math.round(this.extraShipmentCooldown));
      this.sim.pushLog(
        "info",
        `Expedite crews already en route — try again in ~${waitHours} h.`
      );
      return false;
    }

    if (!this.storage?.levels) {
      this.sim.pushLog("info", "Storage data unavailable; request skipped.");
      return false;
    }

    let targetProduct = null;
    let highestRatio = 0;
    Object.entries(this.storage.levels).forEach(([product, level]) => {
      const capacity = this.storage.capacity?.[product] || 0;
      if (!capacity) {
        return;
      }
      const ratio = capacity ? clamp(level / capacity, 0, 1.2) : 0;
      if (ratio > highestRatio) {
        highestRatio = ratio;
        targetProduct = product;
      }
    });

    if (!targetProduct) {
      this.sim.pushLog("info", "No product selected for emergency shipment.");
      return false;
    }

    if (highestRatio < 0.55) {
      this.sim.pushLog("info", "Tanks are manageable — emergency charter not approved.");
      return false;
    }

    const capacity = this.storage.capacity[targetProduct] || 0;
    const level = this.storage.levels[targetProduct] || 0;
    if (level <= 0) {
      this.sim.pushLog("info", "No inventory available to stage an emergency shipment.");
      return false;
    }

    const urgency = clamp((highestRatio - 0.55) / 0.45, 0, 1);
    const deliveryWindow = Math.max(0.8, randomRange(1.0, 1.6) * (1 - urgency * 0.35));
    const dueIn = Math.max(0.25, randomRange(0.35, 0.9) * (1 - urgency * 0.3));
    const volume = Math.min(level, capacity * clamp(0.12 + urgency * 0.24, 0.12, 0.34));

    const shipment = this._registerShipment({
      product: targetProduct,
      volume,
      deliveryWindow,
      dueIn,
      rush: true,
      autoplan: false,
    });
    if (!shipment) {
      this.sim.pushLog("warning", "Unable to stage emergency charter; scheduling failed.");
      return false;
    }

    const cost = 420 + volume * 2.4;
    this.sim.pendingOperationalCost += cost;
    this.extraShipmentCooldown = 4;
    this._relieveStoragePressure(0.1);

    const label = this._formatProductLabel(targetProduct);
    this.sim.pushLog(
      "info",
      `Emergency charter staged: ${volume.toFixed(0)} kb of ${label} loading in ~${shipment.dueIn.toFixed(
        1
      )} h (cost $${cost.toFixed(0)}k).`
    );

    return { product: targetProduct, volume, dueIn: shipment.dueIn, cost };
  }

  expandStorageCapacity() {
    const level = this.storageUpgrades?.level || 0;
    if (level >= 6) {
      this.sim.pushLog("info", "Tank farm already at maximum planned expansion.");
      return false;
    }

    const growth = clamp(0.08 + level * 0.02, 0.08, 0.18);
    const cost = 680 + level * 340;

    Object.entries(this.storage.capacity).forEach(([product, capacity]) => {
      const newCapacity = capacity * (1 + growth);
      this.storage.capacity[product] = newCapacity;
      if (this.storage.levels[product] > newCapacity) {
        this.storage.levels[product] = newCapacity;
      }
    });

    this.sim.pendingOperationalCost += cost;
    this.storageUpgrades.level = level + 1;
    this._relieveStoragePressure(0.22);

    this.sim.pushLog(
      "info",
      `Construction staged — tank farm capacity up ${(growth * 100).toFixed(0)}% (cost $${cost.toFixed(
        0
      )}k).`
    );

    return { level: this.storageUpgrades.level, growth, cost };
  }

  getLogisticsState() {
    return {
      storage: {
        capacity: { ...this.storage.capacity },
        levels: { ...this.storage.levels },
        baseCapacity: { ...(this.storageBaseCapacity || this.storage.capacity) },
      },
      shipments: this.shipments.map((shipment) => ({ ...shipment })),
      stats: { ...this.shipmentStats },
      convoyCooldown: this.logisticsRushCooldown,
      nextShipmentIn: Math.max(0, this.nextShipmentIn),
      pressure: this.storagePressure ? { ...this.storagePressure } : { active: false, throttle: 1, timer: 0 },
      extraShipmentCooldown: this.extraShipmentCooldown || 0,
      upgrades: { ...this.storageUpgrades },
      alerts: this.getStorageAlerts(),
      inventory: {
        levels: { ...this.storage.levels },
        capacity: { ...this.storage.capacity },
      },
    };
  }

  getStorageAlerts() {
    const alerts = [];
    if (!this.storageAlertCache) {
      return alerts;
    }
    Object.entries(this.storageAlertCache).forEach(([product, cache]) => {
      const capacity = this.storage.capacity[product] || 0;
      const level = this.storage.levels[product] || 0;
      const ratio = capacity ? clamp(level / capacity, 0, 1.2) : 0;
      const label = this._formatProductLabel(product);
      if (cache.highActive) {
        alerts.push({
          type: "storage",
          product,
          label,
          severity: cache.highSeverity || "warning",
          summary: cache.highSeverity === "danger" ? "Tanks critical" : "Tanks near capacity",
          detail: `${label} storage at ${Math.round(ratio * 100)}% (${level.toFixed(0)} / ${capacity.toFixed(0)} kb).`,
          guidance: "Schedule exports or trim crude rates to relieve pressure.",
          recordedAt: cache.highTime,
          percent: ratio * 100,
        });
      }
      if (cache.lowActive) {
        alerts.push({
          type: "storage",
          product,
          label,
          severity: cache.lowSeverity || "warning",
          summary: cache.lowSeverity === "danger" ? "Tanks nearly empty" : "Tanks running low",
          detail: `${label} tanks at ${Math.round(ratio * 100)}% (${level.toFixed(0)} / ${capacity.toFixed(0)} kb).`,
          guidance: "Boost production, delay the next charter, or call an emergency shipment until inventory recovers.",
          recordedAt: cache.lowTime,
          percent: ratio * 100,
        });
      }
    });
    return alerts;
  }
}


const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const HOURS_PER_DAY = 24;
const perHourToPerDay = (value) => value * HOURS_PER_DAY;

export class MarketSystem {
  constructor() {
    this.marketStress = 0.16;
    this.state = this._initMarketState();
  }

  reset() {
    this.marketStress = 0.16;
    this.state = this._initMarketState();
  }

  _initMarketState() {
    const baseFutures = {
      gasoline: 112,
      diesel: 96,
      jet: 108,
    };
    const productionCost = {
      gasoline: 78,
      diesel: 74,
      jet: 81,
    };
    return {
      futures: { ...baseFutures },
      productionCost: { ...productionCost },
      basis: {
        gasoline: baseFutures.gasoline - productionCost.gasoline,
        diesel: baseFutures.diesel - productionCost.diesel,
        jet: baseFutures.jet - productionCost.jet,
      },
      drift: {
        gasoline: 0,
        diesel: 0,
        jet: 0,
      },
      updatedAt: 0,
    };
  }

  getState() {
    return {
      futures: { ...this.state.futures },
      productionCost: { ...this.state.productionCost },
      basis: { ...this.state.basis },
    };
  }

  restoreState(snapshot, timeMinutes) {
    if (typeof snapshot.marketStress === "number" && Number.isFinite(snapshot.marketStress)) {
      this.marketStress = clamp(snapshot.marketStress, 0, 1);
    }

    if (snapshot.market && typeof snapshot.market === "object") {
      const restored = this._initMarketState();
      restored.updatedAt = timeMinutes || 0;

      if (snapshot.market.futures && typeof snapshot.market.futures === "object") {
        Object.entries(snapshot.market.futures).forEach(([product, value]) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            restored.futures[product] = value;
          }
        });
      }
      if (snapshot.market.productionCost && typeof snapshot.market.productionCost === "object") {
        Object.entries(snapshot.market.productionCost).forEach(([product, value]) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            restored.productionCost[product] = value;
          }
        });
      }
      if (snapshot.market.basis && typeof snapshot.market.basis === "object") {
        Object.entries(snapshot.market.basis).forEach(([product, value]) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            restored.basis[product] = value;
          }
        });
      }
      this.state = restored;
    } else {
      this.state = this._initMarketState();
    }
  }

  update(context) {
    const {
      scenario,
      spotPrices,
      production,
      crudeCostPerBbl,
      baseOperatingExpense,
      penalty,
      logistics,
      incidents,
      metrics,
      params,
      crudeThroughput,
      timeMinutes,
    } = context;

    const marketConditions = this._updateMarketConditions({
      scenario,
      incidents,
      logistics,
      metrics,
    });

    const carryingCost = marketConditions.carryingCost || 0;
    const totalOperatingExpense = (baseOperatingExpense || 0) + carryingCost;

    const economy = this._updateEconomy({
      scenario,
      spotPrices,
      production,
      crudeCostPerBbl,
      totalOperatingExpense,
      penalty,
      logistics,
      incidents,
      marketConditions,
      crudeThroughput,
      metrics,
      params,
      timeMinutes,
    });

    return {
      marketConditions,
      economy,
    };
  }

  _updateEconomy({
    scenario,
    spotPrices,
    production,
    crudeCostPerBbl,
    totalOperatingExpense,
    penalty,
    logistics,
    metrics,
    params,
    marketConditions,
    crudeThroughput,
    timeMinutes,
  }) {
    if (!this.state) {
      this.state = this._initMarketState();
    }
    const state = this.state;
    const spot = spotPrices || {};
    const prod = production || {};
    const totalOutput = Math.max((prod.gasoline || 0) + (prod.diesel || 0) + (prod.jet || 0), 0);
    const totalBarrels = totalOutput > 0 ? totalOutput * 1000 : 0;
    const throughput = Math.max(crudeThroughput || 0, 0.001);
    const feedConversion = totalOutput > 0 ? clamp(throughput / totalOutput, 0.55, 1.4) : 1;
    const feedCostPerBbl = crudeCostPerBbl * feedConversion;
    const operationsPerBbl = totalBarrels > 0 ? totalOperatingExpense / totalBarrels : 0;
    const penaltyPerBbl = totalBarrels > 0 ? penalty / totalBarrels : 0;
    const carryingPerBbl =
      totalBarrels > 0 && marketConditions
        ? (marketConditions.carryingCost || 0) / totalBarrels
        : 0;

    const shippingReliability = clamp(metrics.shipmentReliability ?? 1, 0, 1);
    const downtimeReliability = clamp(metrics.reliability ?? 1, 0, 1);
    const directiveReliability = clamp(metrics.directiveReliability ?? 1, 0, 1);
    const shippingPressure = Math.max(0, 1 - shippingReliability);
    const downtimePressure = Math.max(0, 1 - downtimeReliability);
    const directiveDrag = Math.max(0, 1 - directiveReliability);

    const maintenanceLevel = clamp(params.maintenance ?? 0.62, 0, 1);
    const safetyLevel = clamp(params.safety ?? 0.45, 0, 1);
    const environmentLevel = clamp(params.environment ?? 0.35, 0, 1);
    const maintenanceRelief = clamp(maintenanceLevel - 0.62, -0.35, 0.35);
    const safetyPremium = clamp(0.48 - safetyLevel, -0.25, 0.45);
    const environmentPremium = clamp(environmentLevel - 0.35, -0.25, 0.5);

    const focus = clamp(params.productFocus ?? 0.5, 0, 1);
    const focusShift = focus - 0.5;

    const inventoryLevels = logistics?.inventory?.levels || {};
    const inventoryCapacity = logistics?.inventory?.capacity || {};

    const demandDaily = this.calculateMarketDemand({
      hours: HOURS_PER_DAY,
      scenario,
      metrics,
      params,
    });
    const smoothingFutures = 0.25;
    const smoothingCost = 0.35;

    const weightProfile = {
      gasoline: { shipping: 1.05, downtime: 0.9, maintenance: 0.82, env: 0.65 },
      diesel: { shipping: 0.92, downtime: 1.05, maintenance: 1, env: 0.88 },
      jet: { shipping: 1.2, downtime: 1.12, maintenance: 0.9, env: 1.12 },
    };

    Object.keys(weightProfile).forEach((product) => {
      const weights = weightProfile[product];
      const output = Math.max(prod[product] || 0, 0);
      const share = totalOutput > 0 ? output / totalOutput : 0;
      const demand = Math.max(demandDaily[product] || 0, 0.0001);
      const supplyPerDay = perHourToPerDay(output);
      const demandGap = clamp(demand > 0 ? (demand - supplyPerDay) / demand : 0, -0.55, 0.65);
      const inventoryLevel = inventoryLevels[product] ?? demand * 0.4;
      const inventoryCap = Math.max(inventoryCapacity[product] ?? demand * 1.6, demand * 0.6);
      const inventoryRatio = clamp(inventoryLevel / inventoryCap, 0, 1.4);
      const storagePressure = clamp(inventoryRatio - 0.55, -0.45, 0.65);
      const logisticPenalty = logistics?.penalty || 0;
      const logisticDrag = totalBarrels > 0 ? logisticPenalty / totalBarrels : 0;
      const mixBias =
        product === "gasoline"
          ? focusShift * 0.35
          : product === "diesel"
          ? -focusShift * 0.28
          : -Math.abs(focusShift) * 0.18;

      state.drift[product] = clamp(
        (state.drift[product] || 0) * 0.78 + demandGap * 0.28 - shippingPressure * 0.16 - storagePressure * 0.18 + mixBias * 0.22,
        -0.6,
        0.6
      );

      const costTarget = Math.max(
        feedCostPerBbl * 0.7,
        feedCostPerBbl +
          operationsPerBbl +
          carryingPerBbl +
          penaltyPerBbl * (0.24 + share * 0.32) +
          logisticDrag * (0.1 + weights.shipping * 0.08) +
          shippingPressure * weights.shipping * 8 +
          downtimePressure * weights.downtime * 10 +
          directiveDrag * 4 +
          environmentPremium * weights.env * 7 +
          safetyPremium * weights.maintenance * 4 -
          maintenanceRelief * weights.maintenance * 12
      );

      const prevCost = Number.isFinite(state.productionCost[product])
        ? state.productionCost[product]
        : costTarget;
      const newCost = prevCost + (costTarget - prevCost) * smoothingCost;
      state.productionCost[product] = Math.max(newCost, feedCostPerBbl * 0.65);

      const spotPrice = Math.max(spot[product] || state.futures[product] || newCost, 0);
      const futuresTarget = Math.max(
        spotPrice * 0.65,
        spotPrice *
          (1 + demandGap * 0.72 + storagePressure * 0.28 + shippingPressure * weights.shipping * 0.2 + downtimePressure * weights.downtime * 0.16 - maintenanceRelief * weights.maintenance * 0.16 + mixBias * 0.2) +
          (penaltyPerBbl + carryingPerBbl) * 0.4 +
          logisticDrag * 1.0 +
          state.drift[product] * 5.5 +
          environmentPremium * weights.env * 3.8
      );

      const prevFuture = Number.isFinite(state.futures[product])
        ? state.futures[product]
        : futuresTarget;
      const newFuture = prevFuture + (futuresTarget - prevFuture) * smoothingFutures;
      state.futures[product] = Math.max(newFuture, 12);
      state.basis[product] = state.futures[product] - state.productionCost[product];
    });

    state.updatedAt = timeMinutes;
    return state;
  }

  _updateMarketConditions({ scenario, incidents, logistics, metrics }) {
    if (!Number.isFinite(this.marketStress)) {
      this.marketStress = 0.16;
    }

    const storageUtil = metrics.storageUtilization || 0;
    const shipmentReliability = metrics.shipmentReliability ?? 1;
    const directiveReliability = metrics.directiveReliability ?? 1;
    const reliability = metrics.reliability ?? 1;
    const incidentCount = incidents?.incidents || 0;
    const incidentPenalty = incidents?.incidentPenalty || 0;
    const demandShortage = logistics?.demandShortage || 0;
    const scenarioRisk = scenario?.riskMultiplier || 1;

    const basePressure = 0.05 + (scenario?.environmentPressure || 0) * 0.14;
    const storagePressure = storageUtil > 0.8 ? (storageUtil - 0.8) * 0.85 : 0;
    const reliabilityPressure = Math.max(0, 1 - reliability) * (0.4 + scenarioRisk * 0.08);
    const shipmentPressure = Math.max(0, 1 - shipmentReliability) * 0.55;
    const directivePressure = Math.max(0, 1 - directiveReliability) * 0.32;
    const shortagePressure = demandShortage > 0 ? Math.min(0.26, demandShortage / 360) : 0;
    const incidentPressure = Math.min(0.28, incidentCount * 0.05 + incidentPenalty / 1150);

    const targetStress = clamp(
      basePressure +
        storagePressure +
        reliabilityPressure +
        shipmentPressure +
        directivePressure +
        shortagePressure +
        incidentPressure,
      0.04,
      0.65
    );

    this.marketStress += (targetStress - this.marketStress) * 0.16;

    const multiplier = clamp(1 - this.marketStress * 0.7, 0.55, 1.05);
    const carryingCost =
      storageUtil > 0.55
        ? Math.pow(storageUtil, 1.35) * 340 + Math.max(0, storageUtil - 0.85) * 640
        : storageUtil * 120;

    return { multiplier, carryingCost };
  }

  calculateMarketDemand({ hours, scenario, metrics, params }) {
    const baseDemand = { gasoline: 55, diesel: 30, jet: 14 };
    const focus = clamp(params.productFocus, 0, 1);
    const focusShift = focus - 0.5;
    const reliability = clamp(metrics.reliability ?? 1, 0.4, 1.2);
    const score = typeof metrics.score === "number" ? metrics.score : 0;
    const gradeFactor = clamp(1 + score / 260, 0.75, 1.25);
    const demand = {
      gasoline:
        baseDemand.gasoline *
        (1 + (scenario?.gasolineBias || 0) * 0.9) *
        (1 + focusShift * 0.55),
      diesel:
        baseDemand.diesel *
        (1 + (scenario?.dieselBias || 0) * 0.9) *
        (1 - focusShift * 0.45),
      jet:
        baseDemand.jet *
        (1 + (scenario?.jetBias || 0) * 1.1) *
        (1 - Math.abs(focusShift) * 0.25),
    };

    const stability = 0.7 + reliability * 0.2;
    const adjusted = {};
    Object.entries(demand).forEach(([product, perDay]) => {
      const scaled = clamp(perDay * stability * gradeFactor, 0, perDay * 1.6);
      adjusted[product] = (scaled / HOURS_PER_DAY) * hours;
    });
    return adjusted;
  }

  resolveCrudeCostPerBarrel(scenario) {
    const base = scenario?.crudeBasePrice ?? 51;
    const qualityShift = scenario?.qualityShift ?? 0;
    return base * (1 + qualityShift * 0.8);
  }

  calculateFixedOverhead({ crudeThroughput, scenario, params }) {
    const maintenancePenalty = scenario?.maintenancePenalty || 0;
    const base = 480 + maintenancePenalty * 260;
    const throughputDaily = Math.max(crudeThroughput || 0, 0);
    const throughputLoad = throughputDaily * (3.2 + maintenancePenalty * 1.8);
    const maintenanceFactor = 0.55 + (params.maintenance || 0) * 0.8;
    const safetyFactor = 0.4 + (params.safety || 0) * 0.6;
    const overheadPerDay =
      (base + throughputLoad) * (0.48 + maintenanceFactor * 0.32 + safetyFactor * 0.18);
    return overheadPerDay / HOURS_PER_DAY;
  }
}

import { MISSIONS } from "./content/missions.js";
import { BASE_PRICES, DEFAULT_PARAMS, SCENARIOS, SPEED_PRESETS, UNIT_DEFINITIONS } from "./simulation/constants.js";
import {
  calculateEnvironmentMetrics,
  calculateProductShares,
  formatEnvironmentWarning,
  getEnvironmentWarningSeverity,
  shouldLogEnvironmentWarning,
} from "./simulation/processors/index.js";
import { clamp, perDayToPerHour, perHourToPerDay } from "./simulation/utils/calculations.js";
import { BlendingSystem } from "./systems/BlendingSystem.js";
import { DisasterSystem } from "./systems/DisasterSystem.js";
import { LogisticsSystem } from "./systems/LogisticsSystem.js";
import { MaintenanceSystem } from "./systems/MaintenanceSystem.js";
import { MarketSystem } from "./systems/MarketSystem.js";
import { StaffingSystem } from "./systems/StaffingSystem.js";
import { SupplyChainSystem } from "./systems/SupplyChainSystem.js";
import { TimeMachineSystem } from "./systems/TimeMachineSystem.js";

const PRODUCT_LABELS = { gasoline: "gasoline", diesel: "diesel", jet: "jet fuel" };
const HOURS_PER_DAY = 24;
const SHIPMENT_HORIZON_HOURS = 48;
const BASE_CRUDE_THROUGHPUT = 120;

export class RefinerySimulation {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.previousAlerts = new Map();
    this.timeMinutes = 0;
    this.tickInterval = 1; // simulated minute per tick
    this.baseSpeed = 35; // simulated minutes per real second at 1×
    this.speedMultiplier = 1;
    this.minSpeedMultiplier = 0.25;
    this.maxSpeedMultiplier = 4;
    this.speed = this.baseSpeed * this.speedMultiplier;
    this.speedPresets = SPEED_PRESETS;
    this._accumulator = 0;
    this.running = true;
    this.stepOnce = false;

    this.logs = [];

    this.params = { ...DEFAULT_PARAMS };

    this.scenarios = this._createScenarios();
    this.activeScenarioKey = "steady";
    this.activeScenario = this.scenarios[this.activeScenarioKey];

    this.units = this._createUnits();
    this.unitMap = Object.create(null);
    this.units.forEach((unit) => {
      this.unitMap[unit.id] = unit;
    });

    this.unitCount = this.units.length;

    this.metrics = {
      gasoline: 0,
      diesel: 0,
      jet: 0,
      lpg: 0,
      profitPerHour: 0,
      revenuePerDay: 0,
      expensePerDay: 0,
      operatingExpensePerDay: 0,
      crudeExpensePerDay: 0,
      penaltyPerDay: 0,
      marginMultiplier: 1,
      futuresGasoline: 0,
      futuresDiesel: 0,
      futuresJet: 0,
      costGasoline: 0,
      costDiesel: 0,
      costJet: 0,
      basisGasoline: 0,
      basisDiesel: 0,
      basisJet: 0,
      reliability: 1,
      carbon: 0,
      waste: 0,
      crudeThroughput: 0,
      cduCapacity: 0,
      flareLevel: 0,
      operationalStrain: 0,
      incidents: 0,
      score: 0,
      grade: "B",
      scoreNote: "Plant stabilizing…",
      scoreDelta: 0,
      storageGasoline: 0,
      storageDiesel: 0,
      storageJet: 0,
      storageUtilization: 0,
      shipmentReliability: 1,
      missionCompleted: false,
    };

    this.pendingOperationalCost = 0;
    this.pipelineBoosts = {};

    this.flows = {
      toReformer: 0,
      toCracker: 0,
      toHydrocracker: 0,
      toAlkylation: 0,
      toExport: 0,
    };

    this.performanceHistory = [];

    // Initialize Systems
    this.marketSystem = new MarketSystem();
    this.market = this.marketSystem.state; // Legacy reference

    this.logisticsSystem = new LogisticsSystem(this);
    this.storage = this.logisticsSystem.storage; // Legacy reference

    // New game feature systems (from game-features-list.md)
    this.supplyChainSystem = new SupplyChainSystem(this);
    this.staffingSystem = new StaffingSystem(this);
    this.blendingSystem = new BlendingSystem(this);
    this.disasterSystem = new DisasterSystem(this);
    this.maintenanceSystem = new MaintenanceSystem(this);
    this.timeMachineSystem = new TimeMachineSystem(this);

    // Alias logistics state for legacy access
    this.shipments = this.logisticsSystem.shipments;
    this.shipmentStats = this.logisticsSystem.shipmentStats;
    this.storagePressure = this.logisticsSystem.storagePressure;
    this.storageUpgrades = this.logisticsSystem.storageUpgrades;
    this.activeConvoys = this.logisticsSystem.activeConvoys;
    this.nextShipmentIn = this.logisticsSystem.nextShipmentIn;
    this.logisticsRushCooldown = this.logisticsSystem.logisticsRushCooldown;
    this.extraShipmentCooldown = this.logisticsSystem.extraShipmentCooldown;

    // Unit-based inspections remain here
    this.activeInspections = [];
    this.completedInspections = [];

    // Mission System
    this.activeMission = null;
    this.missionHistory = [];
    this.directives = [];
    this.directiveStats = { total: 0, completed: 0, failed: 0 };
    this.startMission("tutorial_stabilize");

    this.shipmentHorizonHours = SHIPMENT_HORIZON_HOURS;
    this.operationalStrain = 0;

    this.unitOverrides = Object.create(null);
    this.emergencyShutdown = false;
    this.processTopology = this._createTopology();

    this.pushLog(
      "info",
      "Simulation initialized. Adjust the sliders to explore the refinery."
    );

    this._environmentPenaltyCooldown = 0;

    // Trigger initial schedule in logistics system
    this.logisticsSystem._ensureScheduledShipments();
    this.logisticsSystem._updateNextShipmentCountdown();

    this.recorder = this._createRecorderState();
    this.lastRecordingSummary = null;
  }

  // Getters to proxy system state to legacy properties
  get marketStress() { return this.marketSystem.marketStress; }
  set marketStress(val) { this.marketSystem.marketStress = val; }

  get shipments() { return this.logisticsSystem.shipments; }
  set shipments(val) { this.logisticsSystem.shipments = val; }

  get storage() { return this.logisticsSystem.storage; }
  set storage(val) { this.logisticsSystem.storage = val; }

  get nextShipmentIn() { return this.logisticsSystem.nextShipmentIn; }
  set nextShipmentIn(val) { this.logisticsSystem.nextShipmentIn = val; }

  get logisticsRushCooldown() { return this.logisticsSystem.logisticsRushCooldown; }
  set logisticsRushCooldown(val) { this.logisticsSystem.logisticsRushCooldown = val; }

  get extraShipmentCooldown() { return this.logisticsSystem.extraShipmentCooldown; }
  set extraShipmentCooldown(val) { this.logisticsSystem.extraShipmentCooldown = val; }

  get activeConvoys() { return this.logisticsSystem.activeConvoys; }
  set activeConvoys(val) { this.logisticsSystem.activeConvoys = val; }

  get shipmentStats() { return this.logisticsSystem.shipmentStats; }
  set shipmentStats(val) { this.logisticsSystem.shipmentStats = val; }

  get storagePressure() { return this.logisticsSystem.storagePressure; }
  set storagePressure(val) { this.logisticsSystem.storagePressure = val; }

  get storageUpgrades() { return this.logisticsSystem.storageUpgrades; }
  set storageUpgrades(val) { this.logisticsSystem.storageUpgrades = val; }

  _createScenarios() {
    return SCENARIOS;
  }

  _createUnits() {
    return UNIT_DEFINITIONS.map((def) =>
      this._unit(def.id, def.name, def.capacity, def.category)
    );
  }

  _createTopology() {
    return {
      distillation: {
        name: "Crude Distillation Unit",
        summary: "Primary separation of crude into gas, naphtha, kerosene, diesel, and resid pools.",
        feeds: [{ label: "Crude feed", kind: "feed" }],
        outputs: [
          { label: "Naphtha to Reformer", unit: "reformer", pipeline: "toReformer" },
          { label: "Heavy gas oil to FCC", unit: "fcc", pipeline: "toCracker" },
          { label: "VGO / resid to Hydrocracker", unit: "hydrocracker", pipeline: "toHydrocracker" },
          { label: "LPG cut to Alkylation", unit: "alkylation", pipeline: "toAlkylation" },
        ],
      },
      reformer: {
        name: "Naphtha Reformer",
        summary: "Upgrades naphtha into high-octane reformate and generates hydrogen for other units.",
        feeds: [{ label: "Naphtha from CDU", unit: "distillation", pipeline: "toReformer" }],
        outputs: [
          { label: "Reformate to gasoline pool", kind: "product", pipeline: "toExport" },
          { label: "Hydrogen to Hydrocracker", unit: "hydrocracker" },
        ],
      },
      fcc: {
        name: "Catalytic Cracker",
        summary: "Cracks heavy gas oils into lighter products with high gasoline yield.",
        feeds: [{ label: "Heavy gas oil / resid", unit: "distillation", pipeline: "toCracker" }],
        outputs: [
          { label: "Blendstock to gasoline", kind: "product", pipeline: "toExport" },
          { label: "Cycle oil to diesel pool", kind: "product", pipeline: "toExport" },
          { label: "LPG to Alkylation", unit: "alkylation" },
        ],
      },
      hydrocracker: {
        name: "Hydrocracker",
        summary: "Adds hydrogen to heavier fractions for jet and diesel production.",
        feeds: [
          { label: "VGO / resid", unit: "distillation", pipeline: "toHydrocracker" },
          { label: "Hydrogen from Reformer", unit: "reformer" },
        ],
        outputs: [
          { label: "Jet fuel blend", kind: "product", pipeline: "toExport" },
          { label: "Premium diesel", kind: "product", pipeline: "toExport" },
          { label: "Gasoline upgrade", kind: "product", pipeline: "toExport" },
        ],
      },
      alkylation: {
        name: "Alkylation",
        summary: "Combines light olefins and isobutane into high-octane alkylate.",
        feeds: [
          { label: "LPG from CDU / FCC", unit: "distillation", pipeline: "toAlkylation" },
          { label: "LPG from FCC", unit: "fcc" },
        ],
        outputs: [
          { label: "Alkylate to gasoline", kind: "product" },
          { label: "Excess LPG to export", pipeline: "toExport" },
        ],
      },
      sulfur: {
        name: "Sulfur Recovery",
        summary: "Pulls sulfur out of resid streams to keep emissions under control.",
        feeds: [{ label: "Sour resid / offgas", unit: "distillation" }],
        outputs: [{ label: "Recovered sulfur", kind: "byproduct" }],
      },
    };
  }

  _unit(id, name, capacity, category) {
    return {
      id,
      name,
      capacity,
      category,
      throughput: 0,
      utilization: 0,
      integrity: 1,
      downtime: 0,
      status: "online",
      incidents: 0,
      alert: null,
      alertTimer: 0,
      manualOffline: false,
      emergencyOffline: false,
      overrideThrottle: 1,
      alertDetail: null,
      lastIncident: null,
    };
  }

  setParam(key, value) {
    if (key in this.params) {
      this.params[key] = value;
    }
  }
  getSpeedMultiplier() {
    return this.speedMultiplier;
  }

  getSpeedState() {
    // Only map presets once or if they change (which they don't here)
    if (!this._cachedSpeedPresets) {
      this._cachedSpeedPresets = this.speedPresets.map((entry) => ({ ...entry }));
    }

    // We can reuse a single object if we want, but let's just optimize the presets part first
    // as per instructions, avoiding the map every time.
    return {
      multiplier: this.speedMultiplier,
      min: this.minSpeedMultiplier,
      max: this.maxSpeedMultiplier,
      baseMinutesPerSecond: this.baseSpeed,
      minutesPerSecond: this.speed,
      presets: this._cachedSpeedPresets,
    };
  }

  cycleSpeedPreset(direction = 1) {
    if (!Array.isArray(this.speedPresets) || this.speedPresets.length === 0) {
      return this.speedMultiplier;
    }
    const sorted = [...this.speedPresets].sort((a, b) => a.value - b.value);
    const currentValue = this.speedMultiplier;
    let index = sorted.findIndex((entry) => Math.abs(entry.value - currentValue) < 1e-3);
    if (index === -1) {
      index = sorted.findIndex((entry) => entry.value > currentValue);
      if (index === -1) {
        index = sorted.length - 1;
      }
    }
    const nextIndex = clamp(index + Math.sign(direction || 1), 0, sorted.length - 1);
    return this.setSpeedMultiplier(sorted[nextIndex].value);
  }

  setSpeedFromPreset(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return this.speedMultiplier;
    }
    return this.setSpeedMultiplier(value);
  }

  setSpeedMultiplier(multiplier) {
    const value = typeof multiplier === "number" && Number.isFinite(multiplier) ? multiplier : 1;
    const clamped = clamp(value, this.minSpeedMultiplier, this.maxSpeedMultiplier);
    this.speedMultiplier = clamped;
    this.speed = this.baseSpeed * this.speedMultiplier;
    return this.speedMultiplier;
  }

  adjustSpeedMultiplier(delta) {
    const change = typeof delta === "number" && Number.isFinite(delta) ? delta : 0;
    return this.setSpeedMultiplier(this.speedMultiplier + change);
  }

  applyScenario(key) {
    if (this.scenarios[key]) {
      this.activeScenarioKey = key;
      this.activeScenario = this.scenarios[key];
      this.pushLog(
        "info",
        `${this.activeScenario.name} scenario engaged. ${this.activeScenario.description}`
      );
    }
  }

  toggleRunning() {
    this.running = !this.running;
    if (!this.running && this._nextMissionTimer) {
        clearTimeout(this._nextMissionTimer);
        this._nextMissionTimer = null;
    }
    return this.running;
  }

  requestStep() {
    if (!this.running) {
      this.stepOnce = true;
    }
  }

  reset() {
    if (this._nextMissionTimer) {
        clearTimeout(this._nextMissionTimer);
        this._nextMissionTimer = null;
    }
    this.timeMinutes = 0;
    this._accumulator = 0;
    this.running = true;
    this.stepOnce = false;
    this.speedMultiplier = 1;
    this.speed = this.baseSpeed;
    this.metrics = {
      gasoline: 0,
      diesel: 0,
      jet: 0,
      lpg: 0,
      profitPerHour: 0,
      revenuePerDay: 0,
      expensePerDay: 0,
      operatingExpensePerDay: 0,
      crudeExpensePerDay: 0,
      penaltyPerDay: 0,
      marginMultiplier: 1,
      futuresGasoline: 0,
      futuresDiesel: 0,
      futuresJet: 0,
      costGasoline: 0,
      costDiesel: 0,
      costJet: 0,
      basisGasoline: 0,
      basisDiesel: 0,
      basisJet: 0,
      reliability: 1,
      carbon: 0,
      waste: 0,
      crudeThroughput: 0,
      cduCapacity: 0,
      flareLevel: 0,
      operationalStrain: 0,
      incidents: 0,
      score: 0,
      grade: "B",
      scoreNote: "Plant stabilizing…",
      scoreDelta: 0,
      storageGasoline: 0,
      storageDiesel: 0,
      storageJet: 0,
      storageUtilization: 0,
      shipmentReliability: 1,
      directivesCompleted: 0,
      directiveReliability: 1,
    };
    this.flows = {
      toReformer: 0,
      toCracker: 0,
      toHydrocracker: 0,
      toAlkylation: 0,
      toExport: 0,
    };

    this.pendingOperationalCost = 0;
    this.pipelineBoosts = {};

    // Reset systems
    this.marketSystem.reset();
    this.market = this.marketSystem.state;
    this.logisticsSystem.reset();

    // Reset new game feature systems
    this.supplyChainSystem?.reset();
    this.staffingSystem?.reset();
    this.blendingSystem?.reset();
    this.disasterSystem?.reset();
    this.maintenanceSystem?.reset();
    this.timeMachineSystem?.reset();

    this.activeInspections = [];
    this.completedInspections = [];
    this.activeMission = null;
    this.missionHistory = [];
    this.startMission("tutorial_stabilize");
    this.shipmentHorizonHours = SHIPMENT_HORIZON_HOURS;
    this.operationalStrain = 0;
    this.unitOverrides = Object.create(null);
    this.emergencyShutdown = false;
    this.units.forEach((unit) => {
      unit.throughput = 0;
      unit.utilization = 0;
      unit.integrity = 1;
      unit.downtime = 0;
      unit.status = "online";
      unit.incidents = 0;
      unit.alert = null;
      unit.alertTimer = 0;
      unit.manualOffline = false;
      unit.emergencyOffline = false;
      unit.overrideThrottle = 1;
      unit.alertDetail = null;
      unit.lastIncident = null;
    });
    this.performanceHistory = [];
    this.logs = [];
    this._environmentPenaltyCooldown = 0;
    this.recorder = this._createRecorderState();
    this.lastRecordingSummary = null;
    this.pushLog(
      "info",
      "Simulation reset. Systems stabilized at baseline steady-state."
    );
  }

  pushLog(level, message, meta = {}) {
    const timestamp = this._formatTime();
    this.logs.push({ level, message, timestamp, ...meta });
    if (this.logs.length > 80) {
      this.logs.splice(0, this.logs.length - 80);
    }
  }

  getLogs() {
    return [...this.logs].reverse();
  }

  getScenarioList() {
    if (!this._cachedScenarioList) {
      this._cachedScenarioList = Object.values(this.scenarios);
    }
    return this._cachedScenarioList;
  }

  getMarketState() {
    // Legacy support
    return this.marketSystem.getState();
  }

  update(deltaSeconds) {
    if (!this.running && !this.stepOnce) {
      return;
    }

    this._accumulator += deltaSeconds * this.speed;

    while (this._accumulator >= this.tickInterval) {
      this._accumulator -= this.tickInterval;
      this._advanceTick(this.tickInterval);

      if (this.stepOnce) {
        this.stepOnce = false;
        this.running = false;
        break;
      }

      if (!this.running) {
        break;
      }
    }
  }

  _advanceTick(deltaMinutes) {
    this.timeMinutes += deltaMinutes;
    const hours = deltaMinutes / 60;

    this._prunePipelineBoosts();
    const extraOperationalCost = this._consumeOperationalCost();

    const scenario = this.activeScenario;
    const storageThrottle = this.storagePressure?.throttle ?? 1;
    const crudeDailyTarget =
      this.params.crudeIntake * scenario.crudeMultiplier * storageThrottle;
    const crudeAvailable = perDayToPerHour(crudeDailyTarget);

    const distState = this._resolveUnitState("distillation");
    const distillation = distState.unit;
    const distCapacity =
      distillation && distState.online
        ? perDayToPerHour(distillation.capacity) * clamp(distState.throttle, 0, 1.2)
        : 0;
    const crudeThroughput = Math.min(crudeAvailable, distCapacity);
    const crudeThroughputPerDay = perHourToPerDay(crudeThroughput);

    // Store actual throughput and CDU capacity in metrics for utilization calculation
    this.metrics.crudeThroughput = crudeThroughputPerDay;
    this.metrics.cduCapacity = distillation ? distillation.capacity : 180;

    if (distillation) {
      distillation.throughput = crudeThroughputPerDay;
      distillation.utilization = distillation.capacity
        ? distillation.throughput / Math.max(1, distillation.capacity)
        : 0;
      this._updateUnitMode(distillation);
    }

    // Calculate product shares using processor
    const focus = clamp(this.params.productFocus, 0, 1);
    const shares = calculateProductShares(scenario, focus);

    const distGas = crudeThroughput * shares.gas;
    let naphthaPool = crudeThroughput * shares.naphtha;
    let kerosenePool = crudeThroughput * shares.kerosene;
    let dieselPool = crudeThroughput * shares.diesel;
    let heavyPool = crudeThroughput * shares.heavy;
    let residPool = crudeThroughput * shares.resid;

    const result = {
      gasoline: 0,
      diesel: 0,
      jet: 0,
      lpg: 0,
      hydrogen: 0,
      waste: crudeThroughput * 0.01,
      sulfur: 0,
    };

    let flare = 0;
    const demandGasolineBias = scenario.gasolineBias;
    const demandJetBias = scenario.jetBias;

    const strainState = this._updateOperationalStrain({
      hours,
      crudeThroughputPerDay,
      scenario,
    });

    if (strainState.factor > 0.2) {
      this.pendingOperationalCost += strainState.factor * hours * 35;
    }

    const reformerState = this._resolveUnitState("reformer");
    const reformer = reformerState.unit;
    const reformerCapacity =
      reformer && reformerState.online
        ? perDayToPerHour(reformer.capacity) * clamp(reformerState.throttle, 0, 1.2)
        : 0;
    const reformFeed = Math.min(
      naphthaPool,
      reformerCapacity * this._pipelineMultiplier("toReformer")
    );
    naphthaPool -= reformFeed;
    if (reformer) {
      reformer.throughput = perHourToPerDay(reformFeed);
      reformer.utilization = reformer.capacity > 0 ? reformer.throughput / reformer.capacity : 0;
      this._updateUnitMode(reformer);
    }

    const reformate = reformFeed * 0.92;
    const reformHydrogen = reformFeed * 0.05;
    const reformLoss = reformFeed * 0.03;
    result.gasoline += reformate;
    result.hydrogen += reformHydrogen;
    result.waste += reformLoss;

    const fccState = this._resolveUnitState("fcc");
    const fcc = fccState.unit;
    const fccCapacity =
      fcc && fccState.online
        ? perDayToPerHour(fcc.capacity) * clamp(fccState.throttle, 0, 1.2)
        : 0;
    const heavyAvailableForFcc = heavyPool + residPool * 0.6;
    const fccFeed = Math.min(
      heavyAvailableForFcc,
      fccCapacity * this._pipelineMultiplier("toCracker")
    );
    const heavyUsedByFcc = Math.min(heavyPool, fccFeed * 0.7);
    heavyPool -= heavyUsedByFcc;
    const residUsedByFcc = Math.min(residPool, fccFeed - heavyUsedByFcc);
    residPool -= residUsedByFcc;

    if (fcc) {
      fcc.throughput = perHourToPerDay(fccFeed);
      fcc.utilization = fcc.capacity > 0 ? fcc.throughput / fcc.capacity : 0;
      this._updateUnitMode(fcc);
    }

    const fccGasoline = fccFeed * 0.54;
    const fccDiesel = fccFeed * 0.12;
    const fccLpg = fccFeed * 0.18;
    const fccLoss = fccFeed * 0.08;
    result.gasoline += fccGasoline;
    dieselPool += fccDiesel;
    let lpgPool = distGas + fccLpg;
    result.waste += fccLoss;
    flare += fccLoss * 0.5;

    const hydroState = this._resolveUnitState("hydrocracker");
    const hydrocracker = hydroState.unit;
    const hydroCapacity =
      hydrocracker && hydroState.online
        ? perDayToPerHour(hydrocracker.capacity) * clamp(hydroState.throttle, 0, 1.2)
        : 0;
    const hydroFeedAvailable = heavyPool + residPool + dieselPool * 0.25;
    const hydroFeed = Math.min(
      hydroFeedAvailable,
      hydroCapacity * this._pipelineMultiplier("toHydrocracker")
    );

    const heavyUsedHydro = Math.min(heavyPool, hydroFeed * 0.55);
    heavyPool -= heavyUsedHydro;
    const residUsedHydro = Math.min(residPool, hydroFeed * 0.35);
    residPool -= residUsedHydro;
    const dieselUsedHydro = Math.min(dieselPool * 0.5, hydroFeed - heavyUsedHydro - residUsedHydro);
    dieselPool -= dieselUsedHydro;

    if (hydrocracker) {
      hydrocracker.throughput = perHourToPerDay(hydroFeed);
      hydrocracker.utilization = hydrocracker.capacity > 0 ? hydrocracker.throughput / hydrocracker.capacity : 0;
      this._updateUnitMode(hydrocracker);
    }

    const hydroGasoline = hydroFeed * 0.42;
    const hydroDiesel = hydroFeed * 0.3;
    const hydroJet = hydroFeed * 0.2;
    const hydroLoss = hydroFeed * 0.08;
    result.gasoline += hydroGasoline;
    dieselPool += hydroDiesel;
    kerosenePool += hydroJet;
    result.hydrogen += hydroFeed * 0.04;
    result.waste += hydroLoss;

    const alkylationState = this._resolveUnitState("alkylation");
    const alkylation = alkylationState.unit;
    const alkCapacity =
      alkylation && alkylationState.online
        ? perDayToPerHour(alkylation.capacity) * clamp(alkylationState.throttle, 0, 1.2)
        : 0;
    const alkFeed = Math.min(
      lpgPool,
      alkCapacity * this._pipelineMultiplier("toAlkylation")
    );
    lpgPool -= alkFeed;

    if (alkylation) {
      alkylation.throughput = perHourToPerDay(alkFeed);
      alkylation.utilization = alkylation.capacity > 0 ? alkylation.throughput / alkylation.capacity : 0;
      this._updateUnitMode(alkylation);
    }

    const alkGasoline = alkFeed * 0.88;
    const alkLoss = alkFeed * 0.06;
    result.gasoline += alkGasoline;
    result.lpg += lpgPool;
    result.waste += alkLoss;

    const sulfurState = this._resolveUnitState("sulfur");
    const sulfur = sulfurState.unit;
    const sulfurCapacity =
      sulfur && sulfurState.online
        ? perDayToPerHour(sulfur.capacity) * clamp(sulfurState.throttle, 0, 1.2)
        : 0;
    const sulfurFeed = Math.min(residPool + heavyPool, sulfurCapacity);
    const sulfurRemoved = sulfurFeed * (0.55 + this.params.environment * 0.4);
    if (sulfur) {
      sulfur.throughput = perHourToPerDay(sulfurFeed);
      sulfur.utilization = sulfur.capacity > 0 ? sulfur.throughput / sulfur.capacity : 0;
      this._updateUnitMode(sulfur);
    }
    residPool -= sulfurFeed * 0.6;
    heavyPool -= sulfurFeed * 0.4;
    result.sulfur += sulfurRemoved;
    result.waste += Math.max(0, sulfurFeed - sulfurRemoved);

    result.gasoline += naphthaPool * 0.82;
    result.diesel += dieselPool;
    result.jet += kerosenePool * (1 + demandJetBias * 0.2);
    result.waste += residPool + heavyPool;
    result.lpg += Math.max(0, lpgPool);

    const totalLiquidProducts = result.gasoline + result.diesel + result.jet;
    const maxLiquidProducts = crudeThroughput * 1.02;
    if (totalLiquidProducts > maxLiquidProducts && totalLiquidProducts > 0) {
      const scale = maxLiquidProducts / totalLiquidProducts;
      result.gasoline *= scale;
      result.diesel *= scale;
      result.jet *= scale;
    }
    const maxLpg = crudeThroughput * 0.12;
    if (result.lpg > maxLpg) {
      result.lpg = maxLpg;
    }

    if (strainState.penalty > 0.0001) {
      const penalty = clamp(strainState.penalty, 0, 0.4);
      const diverted = crudeThroughput * penalty * 0.26;
      result.gasoline *= 1 - penalty * 0.6;
      result.diesel *= 1 - penalty * 0.55;
      result.jet *= 1 - penalty * 0.5;
      result.lpg *= 1 - penalty * 0.45;
      result.waste += diverted;
      flare += diverted * 0.35;
    }

    const priceModifier = scenario.priceModifier;
    const gasolinePrice = BASE_PRICES.gasoline * priceModifier * (1 + demandGasolineBias * 0.3);
    const dieselPrice = BASE_PRICES.diesel * priceModifier * (1 + scenario.dieselBias * 0.25);
    const jetPrice = BASE_PRICES.jet * priceModifier * (1 + demandJetBias * 0.35);
    const lpgPrice = BASE_PRICES.lpg * priceModifier * (1 + demandGasolineBias * 0.1);

    const crudeCostPerBbl = this.marketSystem.resolveCrudeCostPerBarrel(scenario);
    const maintenanceBudget =
      2.2 * this.units.length * (0.5 + this.params.maintenance * 1.4 + scenario.maintenancePenalty);
    const safetyBudget = 1.1 * this.params.safety * this.units.length;
    const envBudget = 1.6 * this.params.environment * (1 + scenario.environmentPressure);

    const productRevenue =
      result.gasoline * gasolinePrice +
      result.diesel * dieselPrice +
      result.jet * jetPrice +
      result.lpg * lpgPrice;
    const crudeExpense = crudeThroughput * crudeCostPerBbl;
    const operatingExpense = maintenanceBudget + safetyBudget + envBudget;

    const incidentsRisk = this._updateReliability({
      hours,
      scenario,
      flare,
      maintenance: this.params.maintenance,
      safety: this.params.safety,
      environment: this.params.environment,
      strain: strainState,
    });

    // Update Logistics System
    const logisticsReport = this.logisticsSystem.update(deltaMinutes, {
        hours,
        production: result,
        prices: { gasoline: gasolinePrice, diesel: dieselPrice, jet: jetPrice },
        scenario
    });

    // Update new game feature systems
    const supplyChainReport = this.supplyChainSystem?.update(deltaMinutes, {
        demandRate: crudeThroughputPerDay
    });

    const staffingEffects = this.staffingSystem?.update(deltaMinutes) || {
        efficiency: 1,
        operatorErrorRate: 0.02,
        maintenanceBonus: 0,
        safetyBonus: 0
    };

    this.blendingSystem?.update(deltaMinutes, {
        autoBlend: true,
        demand: {
            regular: result.gasoline * 0.55,
            midgrade: result.gasoline * 0.15,
            premium: result.gasoline * 0.30
        }
    });

    const disasterReport = this.disasterSystem?.update(deltaMinutes, {
        units: this.units,
        scenario
    }) || { penalties: 0 };

    const _maintenanceReport = this.maintenanceSystem?.update(deltaMinutes, {
        scenario,
        staffingEffects
    }) || {};

    this.timeMachineSystem?.update(deltaMinutes);

    // Apply staffing effects to reliability calculations
    const _staffingReliabilityBonus = staffingEffects.safetyBonus || 0;
    const operatorErrorPenalty = staffingEffects.operatorErrorRate > 0.03 ?
        (staffingEffects.operatorErrorRate - 0.02) * 500 : 0;

    // Calculate environment metrics using processor
    const environmentLevel = clamp(this.params.environment ?? 0.35, 0, 1);
    const envMetrics = calculateEnvironmentMetrics({
      production: result,
      incidents: incidentsRisk.incidents,
      environmentLevel,
      scenario,
      crudeThroughput,
    });

    if (this._environmentPenaltyCooldown > 0) {
      this._environmentPenaltyCooldown = Math.max(0, this._environmentPenaltyCooldown - hours);
    }
    if (shouldLogEnvironmentWarning(envMetrics.environmentPenalty, envMetrics.envExcess, this._environmentPenaltyCooldown)) {
      this.pushLog(
        getEnvironmentWarningSeverity(envMetrics.envExcess),
        formatEnvironmentWarning(envMetrics.environmentPenalty, envMetrics.carbonIntensity)
      );
      this._environmentPenaltyCooldown = 1.6;
    }
    const environmentPenalty = envMetrics.environmentPenalty;
    const carbonPerHour = envMetrics.carbonPerHour;

    // Add disaster penalties and operator error costs to total penalties
    const disasterPenalty = disasterReport.penalties || 0;
    const penalty = incidentsRisk.incidentPenalty + logisticsReport.penalty + environmentPenalty + disasterPenalty + operatorErrorPenalty;

    // Add staffing labor costs and maintenance costs to fixed overhead
    const laborCost = staffingEffects.laborCost || 0;
    const maintenanceCost = this.maintenanceSystem?.getMaintenanceCostRate() || 0;
    const demurrageCost = supplyChainReport?.demurrageCost || 0;

    const fixedOverhead = this.marketSystem.calculateFixedOverhead({
      crudeThroughput: crudeThroughputPerDay,
      scenario,
      params: this.params,
    }) + laborCost + maintenanceCost + demurrageCost;

    // Update Market System
    const marketResult = this.marketSystem.update({
        scenario,
        spotPrices: { gasoline: gasolinePrice, diesel: dieselPrice, jet: jetPrice },
        production: result,
        crudeCostPerBbl,
        baseOperatingExpense: operatingExpense + fixedOverhead + extraOperationalCost,
        penalty,
        logistics: logisticsReport,
        incidents: incidentsRisk,
        metrics: this.metrics,
        params: this.params,
        crudeThroughput,
        timeMinutes: this.timeMinutes
    });

    // Extract market results
    const marketConditions = marketResult.marketConditions;
    const economy = marketResult.economy;
    const adjustedRevenue = productRevenue * marketConditions.multiplier;
    const carryingCost = marketConditions.carryingCost;
    const totalOperatingExpense = operatingExpense + fixedOverhead + carryingCost + extraOperationalCost;

    const revenuePerHour = adjustedRevenue;
    const operatingExpensePerHour = totalOperatingExpense;
    const crudeExpensePerHour = crudeExpense;
    const expensePerHour = operatingExpensePerHour + crudeExpensePerHour;
    const penaltyPerHour = penalty;
    const profitPerHour = revenuePerHour - expensePerHour - penaltyPerHour;

    this.metrics.gasoline = this._round(perHourToPerDay(result.gasoline));
    this.metrics.diesel = this._round(perHourToPerDay(result.diesel));
    this.metrics.jet = this._round(perHourToPerDay(result.jet));
    this.metrics.lpg = this._round(perHourToPerDay(result.lpg));
    this.metrics.crudeCostPerBbl = crudeCostPerBbl;
    this.metrics.profitPerHour = profitPerHour;
    this.metrics.revenuePerDay = revenuePerHour * HOURS_PER_DAY;
    this.metrics.expensePerDay = expensePerHour * HOURS_PER_DAY;
    this.metrics.operatingExpensePerDay = operatingExpensePerHour * HOURS_PER_DAY;
    this.metrics.crudeExpensePerDay = crudeExpensePerHour * HOURS_PER_DAY;
    this.metrics.penaltyPerDay = penaltyPerHour * HOURS_PER_DAY;
    this.metrics.marginMultiplier = marketConditions.multiplier;
    this.metrics.storageThrottle = storageThrottle;
    this.metrics.futuresGasoline = economy.futures.gasoline;
    this.metrics.futuresDiesel = economy.futures.diesel;
    this.metrics.futuresJet = economy.futures.jet;
    this.metrics.costGasoline = economy.productionCost.gasoline;
    this.metrics.costDiesel = economy.productionCost.diesel;
    this.metrics.costJet = economy.productionCost.jet;
    this.metrics.basisGasoline = economy.basis.gasoline;
    this.metrics.basisDiesel = economy.basis.diesel;
    this.metrics.basisJet = economy.basis.jet;
    this.metrics.waste = this._round(perHourToPerDay(result.waste));
    this.metrics.flareLevel = clamp((result.waste + flare * 1.4) / (crudeThroughput * 0.5 || 1), 0, 1);
    this.metrics.incidents = incidentsRisk.incidents;
    this.metrics.reliability = incidentsRisk.reliability;
    this.metrics.operationalStrain = this._round(strainState.strain);

    this.metrics.carbon = carbonPerHour;

    this.flows.toReformer = reformFeed;
    this.flows.toCracker = fccFeed;
    this.flows.toHydrocracker = hydroFeed;
    this.flows.toAlkylation = alkFeed;
    this.flows.toExport = result.gasoline + result.diesel + result.jet;

    this._updateMission(hours, {
      shipments: logisticsReport,
      metrics: this.metrics,
      production: result
    });

    this._updateScorecard({
      profitPerHour,
      crudeThroughput: crudeThroughputPerDay,
      incidents: incidentsRisk.incidents,
      reliability: this.metrics.reliability,
      carbon: this.metrics.carbon,
      gasoline: this.metrics.gasoline,
      diesel: this.metrics.diesel,
      jet: this.metrics.jet,
      shipmentScore: this.metrics.shipmentReliability,
      strain: strainState.factor,
    });

    this._updateRecorder({
      hours,
      production: result,
      profitPerHour,
      penalty,
      incidents: incidentsRisk.incidents,
      reliability: this.metrics.reliability,
      carbon: this.metrics.carbon,
      logistics: logisticsReport,
    });

    this._updateActionToys(deltaMinutes); // Now only inspections
    this._updateAlerts(deltaMinutes);

    if (this.eventBus) {
      this.completedInspections.forEach((report) => {
        this.eventBus.emit("INSPECTION_COMPLETED", { unitId: report.unitId, report });
      });
      this.completedInspections = [];
      this._emitAlerts();
    }
  }

  _emitAlerts() {
    const activeAlerts = this.getActiveAlerts();
    const activeAlertsById = new Map();

    activeAlerts.forEach((alert) => {
      let id;
      if (alert.type === "unit") {
        // Exclude severity to stable ID so severity changes update the same alert
        id = `unit-${alert.unitId}`;
      } else if (alert.type === "storage") {
        const productPart = alert.product || "unknown";
        id = `storage-${productPart}`;
      } else {
        const typePart = alert.type || "alert";
        id = `${typePart}`;
      }

      activeAlertsById.set(id, alert);

      if (!this.previousAlerts.has(id)) {
        this.eventBus.emit("ALERT_RAISED", { ...alert, id });
      }
    });

    this.previousAlerts.forEach((alert, id) => {
      if (!activeAlertsById.has(id)) {
        this.eventBus.emit("ALERT_CLEARED", { ...alert, id });
      }
    });

    this.previousAlerts = activeAlertsById;
  }

  _updateActionToys(deltaMinutes) {
    // Process Inspections
    for (let i = this.activeInspections.length - 1; i >= 0; i--) {
       const inspection = this.activeInspections[i];
       inspection.elapsed += deltaMinutes;

       if (inspection.elapsed >= inspection.duration) {
          const unit = this.unitMap[inspection.unitId];
          if (unit) {
             const report = this._buildInspectionReport(unit);
             this.completedInspections.push(report);
             this.pushLog("info", `Drone returned with inspection data for ${unit.name}.`, { unitId: unit.id, inspection: report });
          }
          this.activeInspections.splice(i, 1);
       }
    }
  }

  _unitIsAvailable(unit) {
    if (!unit) return false;
    if (unit.downtime > 0) {
      unit.downtime = Math.max(0, unit.downtime - this.tickInterval);
      if (unit.downtime === 0) {
        unit.status = "online";
        unit.integrity = 0.65 + Math.random() * 0.25;
        unit.alert = null;
        unit.alertTimer = 6;
        if (unit.alertDetail && unit.alertDetail.kind !== "incident") {
          unit.alertDetail = null;
        }
        this.pushLog("info", `${unit.name} cleared maintenance and is back online.`, {
          unitId: unit.id,
        });
      }
      return false;
    }
    return true;
  }

  _resolveUnitState(unitId) {
    const unit = this.unitMap[unitId];
    if (!unit) {
      return { unit: null, online: false, throttle: 0 };
    }

    const override = this.unitOverrides[unitId] || {};
    const throttle =
      typeof override.throttle === "number" ? clamp(override.throttle, 0, 1.2) : 1;

    const available = this._unitIsAvailable(unit);
    unit.overrideThrottle = override.offline ? 0 : throttle;

    if (override.offline) {
      if (unit.downtime <= 0 && unit.status !== "offline") {
        unit.status = "standby";
      }
      unit.manualOffline = !unit.emergencyOffline;
      unit.throughput = 0;
      unit.utilization = 0;
      return { unit, online: false, throttle: 0 };
    }

    unit.manualOffline = false;

    if (!available) {
      return { unit, online: false, throttle: 0 };
    }

    if (unit.status === "standby") {
      unit.status = "online";
    }

    return { unit, online: true, throttle };
  }

  _updateUnitMode(unit) {
    if (!unit) {
      return;
    }
    if (unit.status === "offline") {
      unit.mode = "offline";
      return;
    }
    if (unit.status === "standby" || unit.manualOffline || unit.emergencyOffline) {
      unit.mode = "standby";
      return;
    }
    const utilization = unit.utilization || 0;
    if (utilization > 1.15) {
      unit.mode = "overdrive";
    } else if (utilization > 0.95) {
      unit.mode = "push";
    } else if (utilization < 0.45) {
      unit.mode = "idle";
    } else {
      unit.mode = "balanced";
    }
  }

  _updateReliability(context) {
    const maintenance = clamp(context.maintenance ?? this.params.maintenance ?? 0.6, 0, 1);
    const safety = clamp(context.safety ?? this.params.safety ?? 0.45, 0, 1);
    const environment = clamp(context.environment ?? this.params.environment ?? 0.35, 0, 1);
    const strainFactor = clamp(
      (context.strain?.strain ?? this.operationalStrain ?? 0) / 12,
      0,
      1
    );
    const scenario = context.scenario;

    let incidents = 0;
    let penalty = 0;
    let integritySum = 0;

    this.units.forEach((unit) => {
      if (!unit) return;
      if (unit.status === "standby") {
        integritySum += unit.integrity;
        return;
      }
      const utilization = unit.utilization || 0;
      const baseWear = 0.004 * context.hours;
      const stressWear = Math.max(0, utilization - 1) * 0.04 * context.hours;
      const maintenanceFactor = 1.3 - maintenance * 0.9 - safety * 0.4;
      const scenarioFactor = scenario.riskMultiplier;
      const strainWear = 1 + strainFactor * 1.4 + clamp((context.flare || 0) / 160, 0, 0.45);
      const envRelief = clamp(1 - environment * 0.25, 0.6, 1);
      const wear = (baseWear + stressWear) * maintenanceFactor * scenarioFactor * strainWear * envRelief;
      unit.integrity = clamp(unit.integrity - wear, 0, 1);
      integritySum += unit.integrity;

      if (unit.integrity < 0.35 && unit.status === "online") {
        const failurePressure = clamp(0.35 - unit.integrity, 0, 0.35);
        const overload = Math.max(0, utilization - 0.95);
        const strainRisk = 1 + strainFactor * 1.6;
        const flareRisk = 1 + clamp((context.flare || 0) / 140, 0, 0.5);
        const envShield = clamp(1 - environment * 0.3, 0.55, 1);
        const riskIndex = clamp(
          failurePressure *
            (0.9 + overload * 1.8) *
            (1.1 - maintenance) *
            scenario.riskMultiplier *
            strainRisk *
            flareRisk *
            envShield,
          0,
          0.85
        );
        if (Math.random() < riskIndex) {
          const severity = overload > 0.2 && safety < 0.45 ? "danger" : "warning";
          const downtime = 30 + Math.random() * 90 + overload * 120;
          unit.status = "offline";
          unit.downtime = downtime;
          unit.incidents += 1;
          incidents += severity === "danger" ? 2 : 1;
          penalty += severity === "danger" ? 320 : 140;
          const cause = this._describeIncidentCause({
            overload,
            maintenance,
            safety,
            scenario,
            integrity: unit.integrity,
          });
          const message = `${unit.name} tripped offline after a ${
            severity === "danger" ? "critical" : "process"
          } upset (${cause.detail}).`;
          const guidanceNote = cause.guidance ? ` ${cause.guidance}` : "";
          this.pushLog(severity, `${message}${guidanceNote}`, { unitId: unit.id });
          if (severity === "danger") {
            this.pushLog(
              "danger",
              `Emergency crews respond to pressure surge at ${unit.name}. Throughput curtailed.`,
              { unitId: unit.id }
            );
          }
          unit.alert = severity;
          unit.alertTimer = Math.max(unit.alertTimer, severity === "danger" ? 180 : 90);
          unit.alertDetail = {
            kind: "incident",
            severity,
            summary: cause.summary,
            cause: cause.detail,
            guidance: cause.guidance,
            recordedAt: this._formatTime(),
            integrity: unit.integrity,
            overload,
            maintenance,
            safety,
          };
          unit.lastIncident = { ...unit.alertDetail };
        }
      }
    });

    const reliability = clamp(
      integritySum / Math.max(1, this.unitCount),
      0,
      1
    );
    return {
      reliability,
      incidents,
      incidentPenalty: penalty,
    };
  }

  _describeIncidentCause(details) {
    const reasons = [];
    const summaryHints = [];
    if (details.overload > 0.25) {
      reasons.push("overpressure from aggressive throughput");
      summaryHints.push("Overpressure event");
    } else if (details.overload > 0.12) {
      reasons.push("running above nameplate capacity");
      summaryHints.push("Running hot");
    }
    if (details.integrity < 0.18) {
      reasons.push("equipment fatigue from deferred maintenance");
      summaryHints.push("Severe equipment fatigue");
    } else if (details.integrity < 0.3) {
      reasons.push("aging hardware under stress");
      summaryHints.push("Integrity stress");
    }
    if (details.maintenance < 0.45) {
      reasons.push("maintenance backlog");
    }
    if (details.safety < 0.4) {
      reasons.push("thin safety coverage");
    }
    if (details.scenario?.riskMultiplier > 1.4) {
      reasons.push("scenario hazards amplified the upset");
    }
    if (!reasons.length) {
      reasons.push("process variability");
      summaryHints.push("Process instability");
    }

    let detail;
    if (reasons.length === 1) {
      detail = reasons[0];
    } else if (reasons.length === 2) {
      detail = `${reasons[0]} and ${reasons[1]}`;
    } else {
      const last = reasons.pop();
      detail = `${reasons.join(", ")}, and ${last}`;
    }

    const summary = summaryHints.length ? summaryHints[0] : "Process instability";

    const guidanceParts = [];
    if (details.overload > 0.12) {
      guidanceParts.push("Trim throughput to relieve unit pressure.");
    }
    if (details.integrity < 0.3) {
      guidanceParts.push("Plan downtime to restore fatigued hardware.");
    }
    if (details.maintenance < 0.5) {
      guidanceParts.push("Increase maintenance coverage to rebuild integrity.");
    }
    if (details.safety < 0.4) {
      guidanceParts.push("Raise safety staffing for faster response.");
    }
    if (!guidanceParts.length) {
      guidanceParts.push("Hold rates steady while monitoring recovery.");
    }

    return {
      detail,
      summary,
      guidance: guidanceParts.join(" "),
    };
  }

  _updateOperationalStrain({ hours, crudeThroughputPerDay, scenario }) {
    const maintenance = clamp(this.params.maintenance ?? 0.65, 0, 1);
    const safety = clamp(this.params.safety ?? 0.45, 0, 1);
    const environment = clamp(this.params.environment ?? 0.35, 0, 1);
    const scenarioPenalty = scenario?.maintenancePenalty || 0;

    const load = clamp(crudeThroughputPerDay / Math.max(20, BASE_CRUDE_THROUGHPUT), 0, 2.5);
    const stress = load * (1 + scenarioPenalty * 0.9 + (this.marketStress || 0) * 0.45);
    const mitigation = 0.5 + maintenance * 0.65 + safety * 0.4 + environment * 0.5;
    const target = clamp((stress - mitigation + 0.08) * 5.2, 0, 12);
    const response = clamp(0.22 + maintenance * 0.28 + safety * 0.18, 0.22, 0.8);

    this.operationalStrain += (target - this.operationalStrain) * Math.min(1, hours * response);
    const relief = (environment * 0.55 + maintenance * 0.22 + safety * 0.12) * hours;
    this.operationalStrain = clamp(this.operationalStrain - relief, 0, 12);

    const factor = clamp(this.operationalStrain / 12, 0, 1);
    const penalty = factor * 0.16;

    return { strain: this.operationalStrain, factor, penalty };
  }

  _updateRecorder(context) {
    if (!this.recorder?.active) {
      return;
    }

    const hours = Math.max(0, context?.hours || 0);
    if (hours <= 0) {
      return;
    }

    this.recorder.elapsedHours += hours;
    this.recorder.lastUpdatedAt = this.timeMinutes;

    const production = context?.production || {};
    this.recorder.production.gasoline += Math.max(0, (production.gasoline || 0) * hours);
    this.recorder.production.diesel += Math.max(0, (production.diesel || 0) * hours);
    this.recorder.production.jet += Math.max(0, (production.jet || 0) * hours);

    const profitPerHour = Number.isFinite(context?.profitPerHour) ? context.profitPerHour : 0;
    this.recorder.profit += profitPerHour * hours;

    if (Number.isFinite(context?.penalty)) {
      this.recorder.penalty += Math.max(0, context.penalty);
    }

    if (Number.isFinite(context?.incidents)) {
      this.recorder.incidents += Math.max(0, context.incidents);
    }

    const reliability = Number.isFinite(context?.reliability)
      ? context.reliability
      : Number.isFinite(this.metrics.reliability)
      ? this.metrics.reliability
      : 0;
    this.recorder.reliabilityHours += Math.max(0, reliability) * hours;

    if (Number.isFinite(context?.carbon)) {
      this.recorder.carbon += Math.max(0, context.carbon) * hours;
    }

    const logistics = context?.logistics || {};
    const delivered = logistics.delivered || {};
    this.recorder.shipments.delivered +=
      (delivered.gasoline || 0) + (delivered.diesel || 0) + (delivered.jet || 0);
    if (Number.isFinite(logistics.failed)) {
      this.recorder.shipments.missed += Math.max(0, logistics.failed);
    }
  }

  _consumeOperationalCost() {
    const cost = this.pendingOperationalCost || 0;
    this.pendingOperationalCost = 0;
    return cost;
  }

  _pipelineMultiplier(stream) {
    const boost = this.pipelineBoosts?.[stream];
    if (!boost) {
      return 1;
    }
    if (boost.expiresAt <= this.timeMinutes) {
      delete this.pipelineBoosts[stream];
      return 1;
    }
    return typeof boost.multiplier === "number" ? boost.multiplier : 1;
  }

  _prunePipelineBoosts() {
    if (!this.pipelineBoosts) {
      return;
    }
    const now = this.timeMinutes;
    for (const stream in this.pipelineBoosts) {
      const boost = this.pipelineBoosts[stream];
      if (!boost) {
        continue;
      }
      if (boost.expiresAt <= now) {
        const label = boost.label || stream;
        this.pushLog("info", `${label} bypass crews stand down; capacity back to normal.`);
        delete this.pipelineBoosts[stream];
      }
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // Legacy getter for backward compatibility
  get performanceHistory() {
    return this.getPerformanceHistory();
  }

  // Setter to allow clearing/overwriting (e.g. during reset or load)
  set performanceHistory(val) {
    // If setting to empty array or null, we just clear our internal buffer state if desired,
    // but for now we'll just ignore it or handle simple resets if needed.
    // Ideally we shouldn't be setting this property directly anymore.
    // However, the code does `this.performanceHistory = []` in places.
    // If it's an array, we could try to hydrate the buffer, but usually it's just cleared.
    if (Array.isArray(val) && val.length === 0) {
        if (this._perfBuffer) {
            this._perfHead = 0;
            this._perfCount = 0;
        }
    }
  }

  getPerformanceHistory() {
    if (this._perfBuffer) {
        // Return a cached Float32Array to avoid allocation per frame
        if (!this._cachedPerformanceHistory || this._cachedPerformanceHistory.length !== this._perfCount) {
             this._cachedPerformanceHistory = new Float32Array(this._perfCount);
        }

        const bufferLen = this._perfBuffer.length;
        let ptr = (this._perfHead - this._perfCount + bufferLen) % bufferLen;

        // Unroll simple copy if contiguous, but ring buffer wrap-around makes it tricky.
        // Simple loop into the TypedArray is still much faster/efficient than new Array() + push.
        for (let i = 0; i < this._perfCount; i++) {
            this._cachedPerformanceHistory[i] = this._perfBuffer[ptr];
            ptr = (ptr + 1) % bufferLen;
        }
        return this._cachedPerformanceHistory;
    }
    // Fallback if buffer not initialized yet (though it should be)
    return [];
  }

  getTime() {
    return this.timeMinutes;
  }

  getUnits() {
    // Return the live array to avoid allocation overhead in render loop.
    // Callers must be trusted not to mutate, or we accept the trade-off for performance.
    return this.units;
  }

  getUnit(id) {
    return this.unitMap[id];
  }

  getFlows() {
    return { ...this.flows };
  }

  _formatTime() {
    const totalMinutes = Math.floor(this.timeMinutes);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    return `Day ${days + 1}, ${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  _round(value) {
    return Math.round(value * 10) / 10;
  }

  _updateScorecard(context) {
    const throughputTotal = context.gasoline + context.diesel + context.jet;
    const throughputScore = clamp(throughputTotal / Math.max(1, context.crudeThroughput * 0.92), 0, 1);
    const profitScore = clamp((context.profitPerHour + 100) / 240, 0, 1);
    const reliabilityScore = clamp(context.reliability, 0, 1);
    const carbonScore = clamp(1 - context.carbon / 140, 0, 1);
    const incidentScore = clamp(1 - context.incidents * 0.18, 0, 1);
    const strainScore = clamp(1 - (context.strain ?? clamp(this.operationalStrain / 12, 0, 1)), 0, 1);
    const shipmentScore = clamp(
      typeof context.shipmentScore === "number"
        ? context.shipmentScore
        : this.metrics.shipmentReliability ?? 1,
      0,
      1
    );
    const directiveScore = clamp(
      typeof context.directiveScore === "number"
        ? context.directiveScore
        : this.metrics.directiveReliability ?? 1,
      0,
      1
    );

    const composite = clamp(
      throughputScore * 0.18 +
        profitScore * 0.16 +
        reliabilityScore * 0.18 +
        carbonScore * 0.12 +
        incidentScore * 0.1 +
        shipmentScore * 0.1 +
        strainScore * 0.16,
      0,
      1
    );

    const score = composite * 100;
    let previous = score;

    // Retrieve previous score from buffer if available
    if (this._perfBuffer && this._perfCount > 0) {
      const bufferLen = this._perfBuffer.length;
      const prevIndex = (this._perfHead - 1 + bufferLen) % bufferLen;
      previous = this._perfBuffer[prevIndex];
    } else if (this.performanceHistory?.length) {
      previous = this.performanceHistory[this.performanceHistory.length - 1];
    }

    const delta = score - previous;

    this.metrics.score = score;
    this.metrics.grade = this._scoreToGrade(score);
    this.metrics.scoreNote = this._scoreNarrative({
      throughputScore,
      profitScore,
      reliabilityScore,
      carbonScore,
      incidentScore,
      shipmentScore,
      directiveScore,
      strainScore,
    });
    this.metrics.scoreDelta = delta;

    this._recordPerformance(score);
  }

  _recordPerformance(score) {
    if (!this._perfBuffer) {
      this._perfBuffer = new Float32Array(240);
      this._perfHead = 0;
      this._perfCount = 0;
      // Hydrate from existing history if any (during migration/hot reload)
      if (this.performanceHistory && this.performanceHistory.length > 0) {
        this.performanceHistory.forEach(val => {
          this._perfBuffer[this._perfHead] = val;
          this._perfHead = (this._perfHead + 1) % 240;
          if (this._perfCount < 240) this._perfCount++;
        });
        // Clear legacy array to free memory, we only need the buffer now
        this.performanceHistory = [];
      }
    }

    this._perfBuffer[this._perfHead] = score;
    this._perfHead = (this._perfHead + 1) % 240;
    if (this._perfCount < 240) this._perfCount++;
  }

  _scoreToGrade(score) {
    if (score >= 92) return "A";
    if (score >= 88) return "A-";
    if (score >= 82) return "B+";
    if (score >= 76) return "B";
    if (score >= 70) return "B-";
    if (score >= 64) return "C+";
    if (score >= 58) return "C";
    if (score >= 50) return "C-";
    if (score >= 40) return "D";
    return "F";
  }

  _scoreNarrative(scores) {
    const issues = [];
    const highlights = [];

    if (scores.profitScore < 0.45) {
      issues.push("Margins are tightening – rebalance crude or product slate.");
    } else if (scores.profitScore > 0.75) {
      highlights.push("Commercial returns are strong this shift.");
    }

    if (scores.reliabilityScore < 0.6) {
      issues.push("Unit integrity is slipping; schedule maintenance time.");
    } else if (scores.reliabilityScore > 0.85) {
      highlights.push("Equipment health remains excellent.");
    }

    if (typeof scores.strainScore === "number") {
      if (scores.strainScore < 0.6) {
        issues.push("Operations are running hot — ease crude or invest in maintenance.");
      } else if (scores.strainScore > 0.85) {
        highlights.push("Crews kept process strain comfortably in check.");
      }
    }

    if (scores.carbonScore < 0.55) {
      issues.push("Environmental controls are lagging – increase mitigation spend.");
    } else if (scores.carbonScore > 0.8) {
      highlights.push("Environmental intensity is well managed.");
    }

    if (scores.incidentScore < 0.75) {
      issues.push("Recent upsets rattled crews; stabilize operations.");
    }

    if (scores.throughputScore < 0.55) {
      issues.push("Throughput is under target; inspect front-end feed handling.");
    } else if (scores.throughputScore > 0.8) {
      highlights.push("Product output is beating plan.");
    }

    if (typeof scores.shipmentScore === "number") {
      if (scores.shipmentScore < 0.6) {
        issues.push("Marine dispatch is missing windows; balance inventories to meet dock orders.");
      } else if (scores.shipmentScore > 0.85) {
        highlights.push("Dock schedule is flowing smoothly with on-time sailings.");
      }
    }

    if (this.activeMission?.completed) {
       highlights.push(`Mission '${this.activeMission.title}' objectives met.`);
    }

    if (issues.length) {
      return issues[0];
    }
    if (highlights.length) {
      return highlights[0];
    }
    return "Plant stabilizing…";
  }

  _formatProductLabel(product) {
    if (!this._productLabelCache) {
      this._productLabelCache = new Map();
    }
    if (this._productLabelCache.has(product)) {
      return this._productLabelCache.get(product);
    }

    const label = PRODUCT_LABELS[product] || product;
    const formatted = label
      .split(" ")
      .map((segment) =>
        segment.length ? segment.charAt(0).toUpperCase() + segment.slice(1) : segment
      )
      .join(" ");

    this._productLabelCache.set(product, formatted);
    return formatted;
  }

  _createRecorderState() {
    return {
      active: false,
      startedAt: 0,
      elapsedHours: 0,
      production: { gasoline: 0, diesel: 0, jet: 0 },
      profit: 0,
      penalty: 0,
      incidents: 0,
      reliabilityHours: 0,
      carbon: 0,
      shipments: { delivered: 0, missed: 0 },
    };
  }

  // Delegated Logistics Methods
  dispatchLogisticsConvoy() {
    return this.logisticsSystem.dispatchLogisticsConvoy();
  }

  delayNextShipment(options) {
    return this.logisticsSystem.delayNextShipment(options);
  }

  requestExtraShipment() {
    return this.logisticsSystem.requestExtraShipment();
  }

  expandStorageCapacity() {
    return this.logisticsSystem.expandStorageCapacity();
  }

  togglePerformanceRecording(options = {}) {
    const { includeTimeMachine = false } = options;

    if (this.recorder?.active) {
      const summary = this._summarizeRecorderState();
      this.lastRecordingSummary = summary ? { ...summary } : null;
      this.recorder = this._createRecorderState();

      // Also stop TimeMachine recording if it was started together
      if (includeTimeMachine && this.timeMachineSystem?.recording?.active) {
        this.timeMachineSystem.stopRecording();
      }

      if (summary) {
        const duration = summary.durationHours || 0;
        const totalVolume =
          (summary.production.gasoline || 0) +
          (summary.production.diesel || 0) +
          (summary.production.jet || 0);
        const netProfit = summary.netProfit ?? summary.profit - summary.penalty;
        const reliabilityPct = Math.round((summary.avgReliability || 0) * 100);
        const missed = summary.shipments?.missed || 0;
        const level = missed > 0 ? (missed > 1 ? "warning" : "info") : "info";
        const profitLabel = `${netProfit >= 0 ? "+" : "-"}$${Math.abs(netProfit).toFixed(1)}M`;
        const message =
          `Recording stopped after ${duration.toFixed(1)} h — ${totalVolume.toFixed(0)} kb shipped, ` +
          `${profitLabel} net, reliability ${reliabilityPct}%.`;
        this.pushLog(level, message, { recording: summary });
      } else {
        this.pushLog("info", "Shift recorder cleared.");
      }

      return { active: false, summary };
    }

    this.recorder = this._createRecorderState();
    this.recorder.active = true;
    this.recorder.startedAt = this.timeMinutes;
    this.recorder.lastUpdatedAt = this.timeMinutes;

    // Also start TimeMachine recording for full state playback
    if (includeTimeMachine && this.timeMachineSystem) {
      this.timeMachineSystem.startRecording({
        name: `Shift Recording ${this._formatTime()}`,
        scenario: this.activeScenarioKey
      });
    }

    this.pushLog("info", "Shift recorder armed — capturing performance snapshot.");
    return { active: true, summary: null };
  }

  getRecorderState() {
    const recorder = this.recorder || this._createRecorderState();
    return {
      active: Boolean(recorder.active),
      startedAt: recorder.startedAt || null,
      elapsedHours: recorder.elapsedHours || 0,
      lastUpdatedAt: recorder.lastUpdatedAt || null,
      production: { ...recorder.production },
      profit: recorder.profit || 0,
      penalty: recorder.penalty || 0,
      incidents: recorder.incidents || 0,
      shipments: { ...recorder.shipments },
      avgReliability:
        recorder.elapsedHours > 0
          ? recorder.reliabilityHours / recorder.elapsedHours
          : this.metrics.reliability || 0,
      carbonPerHour:
        recorder.elapsedHours > 0 ? recorder.carbon / recorder.elapsedHours : this.metrics.carbon || 0,
      lastSummary: this.lastRecordingSummary ? { ...this.lastRecordingSummary } : null,
    };
  }

  _summarizeRecorderState() {
    if (!this.recorder) {
      return null;
    }
    const duration = this.recorder.elapsedHours || 0;
    const avgReliability =
      duration > 0
        ? this.recorder.reliabilityHours / duration
        : Number.isFinite(this.metrics.reliability)
        ? this.metrics.reliability
        : 0;
    const production = {
      gasoline: this.recorder.production.gasoline || 0,
      diesel: this.recorder.production.diesel || 0,
      jet: this.recorder.production.jet || 0,
    };
    const summary = {
      startedAt: this.recorder.startedAt || this.timeMinutes,
      endedAt: this.timeMinutes,
      durationHours: duration,
      production,
      profit: this.recorder.profit || 0,
      penalty: this.recorder.penalty || 0,
      netProfit: (this.recorder.profit || 0) - (this.recorder.penalty || 0),
      incidents: this.recorder.incidents || 0,
      avgReliability,
      carbonPerHour:
        duration > 0 ? (this.recorder.carbon || 0) / duration : this.metrics.carbon || 0,
      shipments: {
        delivered: this.recorder.shipments.delivered || 0,
        missed: this.recorder.shipments.missed || 0,
      },
    };
    return summary;
  }

  deployPipelineBypass(targetUnitId) {
    const pipelineMap = {
      reformer: { stream: "toReformer", label: "reformer feed bypass" },
      fcc: { stream: "toCracker", label: "FCC transfer line" },
      hydrocracker: { stream: "toHydrocracker", label: "hydrocracker feed loop" },
      alkylation: { stream: "toAlkylation", label: "alkylation LPG manifold" },
    };

    const fallback = pipelineMap.hydrocracker || pipelineMap.fcc;
    const entry = pipelineMap[targetUnitId] || fallback;
    if (!entry) {
      this.pushLog("info", "No suitable pipeline to bypass.");
      return false;
    }

    const existing = this.pipelineBoosts?.[entry.stream];
    if (existing && existing.expiresAt > this.timeMinutes) {
      const remaining = Math.max(1, Math.round((existing.expiresAt - this.timeMinutes) / 60));
      this.pushLog("info", `${entry.label} already boosted for ~${remaining} more h.`);
      return false;
    }

    const duration = 300 + Math.random() * 120;
    if (!this.pipelineBoosts) {
      this.pipelineBoosts = {};
    }
    this.pipelineBoosts[entry.stream] = {
      multiplier: 1.25,
      expiresAt: this.timeMinutes + duration,
      label: entry.label,
    };
    this.pendingOperationalCost += 180;
    this.pushLog(
      "info",
      `${entry.label} staged; expect extra capacity for ~${Math.round(duration / 60)} h.`
    );
    return true;
  }

  scheduleTurnaround(unitId, options = {}) {
    if (!unitId) {
      this.pushLog("info", "Select a processing unit to schedule a turnaround.");
      return false;
    }
    const unit = this.unitMap[unitId];
    if (!unit) {
      this.pushLog("info", "Unknown unit selected.");
      return false;
    }
    if (unit.downtime > 0) {
      this.pushLog(
        "warning",
        unit.name +
          " already offline for maintenance (" +
          Math.round(unit.downtime) +
          " min remaining).",
        { unitId }
      );
      return false;
    }

    // Determine turnaround type from options or unit integrity
    const turnaroundType = options.type || (unit.integrity < 0.4 ? 'major' : 'mini');
    const baseDuration = turnaroundType === 'major' ? 480 : turnaroundType === 'standard' ? 360 : 180;
    const downtime = baseDuration + Math.random() * (baseDuration * 0.5);

    // Track in MaintenanceSystem if available
    if (this.maintenanceSystem) {
      const result = this.maintenanceSystem.scheduleTurnaround(unitId, turnaroundType, this.timeMinutes);
      if (result.success && result.turnaround) {
        // Mark as immediately starting
        result.turnaround.status = 'in_progress';
        result.turnaround.actualStart = this.timeMinutes;
        this.maintenanceSystem.activeTurnarounds.push(result.turnaround);
      }
    }

    // Apply turnaround immediately (backwards compatible)
    unit.status = "offline";
    unit.downtime = downtime;
    unit.throughput = 0;
    unit.utilization = 0;
    unit.alert = "warning";
    unit.alertTimer = Math.max(unit.alertTimer, 120);
    unit.alertDetail = {
      kind: "turnaround",
      severity: "warning",
      summary: `${turnaroundType.charAt(0).toUpperCase() + turnaroundType.slice(1)} turnaround in progress`,
      cause: `Estimated ${Math.round(downtime)} minutes until restart.`,
      guidance: "Expect improved integrity once crews wrap up.",
      recordedAt: this._formatTime(),
    };

    // Integrity boost based on turnaround type
    const integrityBoost = turnaroundType === 'major' ? 0.5 : turnaroundType === 'standard' ? 0.35 : 0.2;
    unit.integrity = clamp(unit.integrity + integrityBoost, 0, 1);

    // Cost based on turnaround type
    const cost = turnaroundType === 'major' ? 800 : turnaroundType === 'standard' ? 500 : 340;
    this.pendingOperationalCost += cost;

    this.pushLog(
      "info",
      `${unit.name} ${turnaroundType} turnaround started; crews draining and opening equipment.`,
      { unitId }
    );
    return true;
  }

  performInspection(unitId) {
    if (!unitId) {
      this.pushLog("info", "Select a processing unit to inspect.");
      return null;
    }
    const unit = this.unitMap[unitId];
    if (!unit) {
      this.pushLog("info", "Unable to find that unit on the board.");
      return null;
    }

    // Check if already being inspected
    if (this.activeInspections.some(i => i.unitId === unitId)) {
        this.pushLog("info", "Drone already en route to this unit.");
        return null;
    }

    this.activeInspections.push({
        unitId,
        duration: 45, // minutes
        elapsed: 0
    });

    this.pushLog("info", `Drone dispatched to inspect ${unit.name}.`);
    return { status: "pending" };
  }

  getCompletedInspections() {
      const finished = [...this.completedInspections];
      this.completedInspections = [];
      return finished;
  }

  getActionToysState() {
      return {
          convoys: this.logisticsSystem.activeConvoys,
          inspections: this.activeInspections
      };
  }

  _buildInspectionReport(unit) {
    const integrity = clamp(unit.integrity ?? 1, 0, 1);
    const utilization = clamp(unit.utilization ?? 0, 0, 1.5);
    const downtime = Math.max(0, unit.downtime || 0);
    const incidents = Math.max(0, unit.incidents || 0);
    const alert = unit.alert || null;

    let severityScore = 0;
    if (alert === "warning") {
      severityScore = Math.max(severityScore, 1);
    } else if (alert === "danger") {
      severityScore = Math.max(severityScore, 2);
    }
    if (integrity < 0.35) {
      severityScore = Math.max(severityScore, 2);
    } else if (integrity < 0.6) {
      severityScore = Math.max(severityScore, 1);
    }
    if (downtime > 0) {
      severityScore = Math.max(severityScore, 1);
    }

    const findings = [];
    if (downtime > 0) {
      findings.push(`Offline for ${Math.round(downtime)} minutes of maintenance.`);
    } else {
      const loadPct = Math.round(utilization * 100);
      if (loadPct > 110) {
        findings.push(`Running hot at ${loadPct}% of rated capacity.`);
        severityScore = Math.max(severityScore, 1);
      } else if (loadPct < 45) {
        findings.push(`Coasting at ${loadPct}% utilization; spare capacity available.`);
      }
    }

    const integrityPct = Math.round(integrity * 100);
    if (integrityPct < 40) {
      findings.push(`Integrity degraded to ${integrityPct}% — immediate turnaround recommended.`);
    } else if (integrityPct < 65) {
      findings.push(`Integrity drifting low at ${integrityPct}%.`);
    } else {
      findings.push(`Mechanical integrity steady at ${integrityPct}%.`);
    }

    if (incidents > 0) {
      findings.push(`Logged ${incidents} incident${incidents === 1 ? "" : "s"} this shift.`);
      severityScore = Math.max(severityScore, incidents > 1 ? 2 : 1);
    }

    const recommendations = [];
    if (integrity < 0.55) {
      recommendations.push("Increase maintenance allocation or schedule a turnaround soon.");
    }
    if (utilization > 1.05) {
      recommendations.push("Trim feed rates or deploy a bypass to relieve the unit.");
    }
    if (!recommendations.length) {
      recommendations.push("Keep monitoring — no urgent actions flagged.");
    }

    const severity = severityScore >= 2 ? "danger" : severityScore === 1 ? "warning" : "info";
    const summary = findings[0] || "Unit operating within expected range.";

    return {
      unitId: unit.id,
      unitName: unit.name,
      severity,
      integrity,
      utilization,
      incidents,
      downtime,
      summary,
      findings,
      recommendations,
      timestamp: this._formatTime(),
    };
  }

  startMission(missionId) {
    const missionDef = MISSIONS.find(m => m.id === missionId);
    if (!missionDef) {
      this.pushLog("warning", `Mission ${missionId} not found.`);
      return;
    }

    // Clone objectives so we can track progress independently
    const objectives = missionDef.objectives.map(obj => ({ ...obj }));

    this.activeMission = {
      ...missionDef,
      objectives,
      startedAt: this.timeMinutes,
      completed: false,
      failed: false
    };

    // Explicitly reset UI metric flag
    this.metrics.missionCompleted = false;

    this.pushLog("info", `Mission Started: ${missionDef.title}`);
    this.pushLog("info", missionDef.description);
  }

  _updateMission(hours, context) {
    if (!this.activeMission || this.activeMission.completed || this.activeMission.failed) {
      return;
    }

    const { shipments, metrics, production } = context;
    const mission = this.activeMission;
    let allMet = true;

    mission.objectives.forEach(obj => {
      if (obj.completed) return;

      if (obj.type === "production") {
        const produced = (production[obj.product] || 0) * hours; // kb accumulated
        obj.progress = (obj.progress || 0) + produced;
        if (obj.progress >= obj.target) {
          obj.completed = true;
          this.pushLog("info", `Objective Complete: ${obj.label}`);
        } else {
          allMet = false;
        }
      } else if (obj.type === "delivery") {
        const delivered = shipments.delivered?.[obj.product] || 0;
        obj.progress = (obj.progress || 0) + delivered;
        if (obj.progress >= obj.target) {
          obj.completed = true;
          this.pushLog("info", `Objective Complete: ${obj.label}`);
        } else {
          allMet = false;
        }
      } else if (obj.type === "reliability") {
        if (metrics.reliability >= obj.threshold) {
          obj.timeRemaining = Math.max(0, obj.timeRemaining - hours);
          if (obj.timeRemaining <= 0) {
            obj.completed = true;
            this.pushLog("info", `Objective Complete: ${obj.label}`);
          } else {
            allMet = false;
          }
        } else {
          if (obj.timeRemaining < obj.duration) {
             this.pushLog("info", `Objective Reset: ${obj.label}`);
          }
          obj.completed = false;
          obj.timeRemaining = obj.duration;
          allMet = false;
        }
      }
    });

    if (allMet) {
      this.activeMission.completed = true;
      this.metrics.missionCompleted = true; // Signal UI
      this.missionHistory.push(this.activeMission.id);
      this.pushLog("info", `MISSION COMPLETE: ${mission.title}`);
      if (mission.reward) {
        this.pushLog("info", `Reward: ${mission.reward}`);
      }

      if (mission.next) {
        this._nextMissionTimer = setTimeout(() => {
            if (this.running) {
                this.startMission(mission.next);
            }
        }, 3000);
      }
    }
  }

  getMissionState() {
    // Avoid expensive structuredClone for UI updates
    return {
      active: (this.activeMission && Array.isArray(this.activeMission.objectives))
        ? { ...this.activeMission, objectives: this.activeMission.objectives.map(o => ({...o})) }
        : (this.activeMission ? { ...this.activeMission, objectives: [] } : null),
      history: [...this.missionHistory]
    };
  }

  _updateAlerts(deltaMinutes) {
    this.units.forEach((unit) => {
      if (!unit) {
        return;
      }
      if (unit.status === "offline") {
        const severity = unit.alert === "danger" ? "danger" : "warning";
        unit.alert = severity;
        this._ensureOfflineAlertDetail(unit, severity);
        unit.alertTimer = Math.max(unit.alertTimer, severity === "danger" ? 180 : 90);
      } else if (unit.status === "online" && unit.integrity < 0.45) {
        const severity = unit.integrity < 0.28 ? "danger" : "warning";
        unit.alert = severity;
        this._ensureIntegrityAlertDetail(unit, severity);
        unit.alertTimer = Math.max(unit.alertTimer, severity === "danger" ? 60 : 30);
      } else if (unit.alert && unit.status === "online" && unit.integrity >= 0.6) {
        if (unit.alertDetail && unit.alertDetail.kind !== "incident") {
          unit.alertDetail = null;
        }
        unit.alert = null;
      }

      if (unit.alertTimer > 0) {
        unit.alertTimer = Math.max(0, unit.alertTimer - deltaMinutes);
        if (
          unit.alertTimer === 0 &&
          unit.status === "online" &&
          unit.integrity >= 0.6 &&
          unit.alert !== "danger"
        ) {
          if (unit.alertDetail && unit.alertDetail.kind !== "incident") {
            unit.alertDetail = null;
          }
          unit.alert = null;
        }
      }
    });
  }

  _ensureOfflineAlertDetail(unit, severity) {
    if (unit.alertDetail && unit.alertDetail.kind === "incident") {
      return;
    }
    const summary = unit.emergencyOffline
      ? "Emergency shutdown"
      : unit.manualOffline
      ? "Manual standby"
      : "Offline for repairs";
    const cause = unit.emergencyOffline
      ? "Emergency stop engaged; crews are stabilizing conditions."
      : unit.manualOffline
      ? "Operators have parked the unit in standby."
      : "Maintenance crews are restoring the unit to service.";
    const guidance = unit.emergencyOffline
      ? "Investigate alarms and release the hold once the area is safe."
      : unit.manualOffline
      ? "Resume operations when downstream demand requires it."
      : "Increase maintenance resources to hasten repairs.";

    if (!unit.alertDetail || unit.alertDetail.kind !== "offline") {
      unit.alertDetail = {
        kind: "offline",
        severity,
        summary,
        cause,
        guidance,
        recordedAt: this._formatTime(),
      };
    } else {
      unit.alertDetail.severity = severity;
      unit.alertDetail.summary = summary;
      unit.alertDetail.cause = cause;
      unit.alertDetail.guidance = guidance;
    }
  }

  _ensureIntegrityAlertDetail(unit, severity) {
    if (unit.alertDetail && unit.alertDetail.kind === "incident") {
      return;
    }
    const integrityPercent = Math.round((unit.integrity ?? 0) * 100);
    const summary = severity === "danger" ? "Integrity critical" : "Integrity low";
    const cause = `Integrity at ${integrityPercent}%.`;
    const guidance =
      severity === "danger"
        ? "Cut feed immediately and dispatch maintenance crews."
        : "Ease throughput and increase maintenance to recover.";

    if (!unit.alertDetail || unit.alertDetail.kind !== "integrity") {
      unit.alertDetail = {
        kind: "integrity",
        severity,
        summary,
        cause,
        guidance,
        integrity: unit.integrity,
        recordedAt: this._formatTime(),
      };
    } else {
      unit.alertDetail.severity = severity;
      unit.alertDetail.summary = summary;
      unit.alertDetail.cause = cause;
      unit.alertDetail.guidance = guidance;
      unit.alertDetail.integrity = unit.integrity;
    }
  }

  getLogisticsState() {
    return this.logisticsSystem.getLogisticsState();
  }

  getStorageAlerts() {
    return this.logisticsSystem.getStorageAlerts();
  }

  // New game feature system getters (from game-features-list.md)

  /**
   * Get supply chain state including crude types and contracts
   */
  getSupplyChainState() {
    if (!this.supplyChainSystem) return null;
    return {
      crudeTanks: this.supplyChainSystem._getTankLevels(),
      crudeBlend: this.supplyChainSystem._calculateCrudeBlend(),
      marineDock: this.supplyChainSystem._getMarineDockStatus(),
      contracts: this.supplyChainSystem._getContractsSummary(),
      pipelineIntake: { ...this.supplyChainSystem.pipelineIntake },
      stats: { ...this.supplyChainSystem.stats }
    };
  }

  /**
   * Get staffing/HR system state
   */
  getStaffingState() {
    if (!this.staffingSystem) return null;
    return this.staffingSystem.getStatus();
  }

  /**
   * Get blending system state
   */
  getBlendingState() {
    if (!this.blendingSystem) return null;
    return {
      tanks: this.blendingSystem._getTankStatus(),
      blendstocks: this.blendingSystem._getBlendstockStatus(),
      quality: { ...this.blendingSystem.qualityMetrics },
      additives: this.blendingSystem._getAdditiveStatus()
    };
  }

  /**
   * Get disaster system state
   */
  getDisasterState() {
    if (!this.disasterSystem) return null;
    return {
      activeDisasters: this.disasterSystem.activeDisasters.map(d => this.disasterSystem._getDisasterStatus(d)),
      deployedTeams: this.disasterSystem.deployedTeams.map(t => ({ ...t })),
      evacuation: { ...this.disasterSystem.evacuation },
      contamination: { ...this.disasterSystem.contamination },
      dangerLevel: this.disasterSystem.getDangerLevel(),
      stats: { ...this.disasterSystem.stats }
    };
  }

  /**
   * Get maintenance system state
   */
  getMaintenanceState() {
    if (!this.maintenanceSystem) return null;
    return {
      unitHealth: this.maintenanceSystem._getUnitHealth(),
      strategies: { ...this.maintenanceSystem.unitStrategies },
      scheduledMaintenance: this.maintenanceSystem.scheduledMaintenance.map(m => ({ ...m })),
      activeTurnarounds: this.maintenanceSystem.activeTurnarounds.map(t => ({ ...t })),
      workOrders: this.maintenanceSystem.workOrders.filter(w => w.status !== 'completed').map(w => ({ ...w })),
      sensors: { ...this.maintenanceSystem.sensors },
      stats: { ...this.maintenanceSystem.stats }
    };
  }

  /**
   * Get Time Machine system state
   */
  getTimeMachineState() {
    if (!this.timeMachineSystem) return null;
    return {
      recording: this.timeMachineSystem.getRecordingStatus(),
      playback: this.timeMachineSystem.getPlaybackStatus(),
      sessions: this.timeMachineSystem.getSavedSessions(),
      markers: this.timeMachineSystem.getMarkers()
    };
  }

  /**
   * Start Time Machine recording
   */
  startRecording(metadata = {}) {
    return this.timeMachineSystem?.startRecording(metadata);
  }

  /**
   * Stop Time Machine recording
   */
  stopRecording() {
    return this.timeMachineSystem?.stopRecording();
  }

  /**
   * Start Time Machine playback
   */
  startPlayback(sessionId, options = {}) {
    return this.timeMachineSystem?.startPlayback(sessionId, options);
  }

  /**
   * Stop Time Machine playback
   */
  stopPlayback() {
    return this.timeMachineSystem?.stopPlayback();
  }

  /**
   * Create a procurement contract
   */
  createProcurementContract(options) {
    return this.supplyChainSystem?.createContract(options);
  }

  /**
   * Schedule a tanker delivery
   */
  scheduleTankerDelivery(options) {
    return this.supplyChainSystem?.scheduleDelivery(options);
  }

  /**
   * Set staffing target for a department
   */
  setStaffingTarget(departmentId, target) {
    return this.staffingSystem?.setStaffingTarget(departmentId, target);
  }

  /**
   * Start training program
   */
  startTrainingProgram(programId, departmentId = null) {
    return this.staffingSystem?.startTraining(programId, departmentId);
  }

  /**
   * Set maintenance strategy for a unit
   */
  setMaintenanceStrategy(unitId, strategyId) {
    return this.maintenanceSystem?.setStrategy(unitId, strategyId);
  }

  /**
   * Deploy emergency response team
   */
  deployEmergencyTeam(teamId, disasterId) {
    return this.disasterSystem?.deployTeam(teamId, disasterId);
  }

  /**
   * Blend gasoline to a specific grade
   */
  blendGasoline(gradeId, volumeKb) {
    return this.blendingSystem?.blendGasoline(gradeId, volumeKb);
  }

  getActiveAlerts() {
    const alerts = [];
    this.units.forEach((unit) => {
      if (!unit.alert) {
        return;
      }
      const detail = unit.alertDetail || unit.lastIncident || {};
      const summary = detail.summary
        || (unit.status === "offline"
          ? unit.emergencyOffline
            ? "Emergency shutdown"
            : "Offline for repairs"
          : unit.alert === "danger"
          ? "Critical fault"
          : unit.alert === "warning"
          ? `Integrity ${Math.round((unit.integrity ?? 0) * 100)}%`
          : "Process warning");
      const detailText = detail.cause
        || (unit.alert === "warning" && typeof unit.integrity === "number"
          ? `Integrity at ${Math.round(unit.integrity * 100)}%.`
          : "");
      const guidance = detail.guidance
        || (unit.alert === "danger"
          ? "Dispatch crews and stabilize the unit immediately."
          : unit.alert === "warning"
          ? "Increase maintenance or trim feed to recover stability."
          : "");
      alerts.push({
        type: "unit",
        unitId: unit.id,
        label: unit.name,
        name: unit.name,
        severity: detail.severity || unit.alert,
        summary,
        detail: detailText,
        guidance,
        recordedAt: detail.recordedAt || "",
      });
    });
    return alerts.concat(this.getStorageAlerts());
  }

  getDirectives() {
    return this.directives.map((directive) => ({ ...directive }));
  }

  getProcessTopology() {
    return this.processTopology;
  }

  getUnitOverride(unitId) {
    const override = this.unitOverrides[unitId];
    if (!override) {
      return { throttle: 1, offline: false };
    }
    return {
      throttle: typeof override.throttle === "number" ? clamp(override.throttle, 0, 1.2) : 1,
      offline: Boolean(override.offline),
    };
  }

  getUnitOverrides() {
    const map = {};
    Object.entries(this.unitOverrides).forEach(([unitId, override]) => {
      map[unitId] = {
        throttle: typeof override.throttle === "number" ? clamp(override.throttle, 0, 1.2) : 1,
        offline: Boolean(override.offline),
      };
    });
    return map;
  }
  createSnapshot() {
    const clone = (value) => {
      if (Array.isArray(value)) {
        return value.map((item) => clone(item));
      }
      if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clone(entry)]));
      }
      return value;
    };

    const units = this.units.map((unit) => ({
      id: unit.id,
      integrity: unit.integrity,
      status: unit.status,
      downtime: unit.downtime,
      incidents: unit.incidents,
      manualOffline: unit.manualOffline,
      emergencyOffline: unit.emergencyOffline,
      overrideThrottle: unit.overrideThrottle,
      mode: unit.mode,
      alert: unit.alert,
      alertTimer: unit.alertTimer,
      alertDetail: unit.alertDetail ? clone(unit.alertDetail) : null,
      lastIncident: unit.lastIncident ? clone(unit.lastIncident) : null,
    }));

    // Ensure performanceHistory array is populated for snapshot
    const perfHistory = this.getPerformanceHistory();

    const snapshot = {
      version: 1,
      timeMinutes: this.timeMinutes,
      running: this.running,
      speedMultiplier: this.speedMultiplier,
      params: { ...this.params },
      scenario: this.activeScenarioKey,
      metrics: { ...this.metrics },
      flows: { ...this.flows },
      marketStress: this.marketSystem.marketStress,
      pendingOperationalCost: this.pendingOperationalCost,
      logisticsRushCooldown: this.logisticsSystem.logisticsRushCooldown,
      nextShipmentIn: this.logisticsSystem.nextShipmentIn,
      emergencyShutdown: this.emergencyShutdown,
      storage: {
        capacity: { ...this.logisticsSystem.storage.capacity },
        levels: { ...this.logisticsSystem.storage.levels },
        baseCapacity: { ...(this.logisticsSystem.storageBaseCapacity || this.logisticsSystem.storage.capacity) },
      },
      storageAlerts: clone(this.logisticsSystem.storageAlertCache),
      shipments: this.logisticsSystem.shipments.map((shipment) => ({ ...shipment })),
      shipmentStats: { ...this.logisticsSystem.shipmentStats },
      pipelineBoosts: clone(this.pipelineBoosts),
      unitOverrides: this.getUnitOverrides(),
      units,
      recorder: this.getRecorderState(),
      lastRecordingSummary: this.lastRecordingSummary ? { ...this.lastRecordingSummary } : null,
      storagePressure: this.logisticsSystem.storagePressure ? { ...this.logisticsSystem.storagePressure } : null,
      extraShipmentCooldown: this.logisticsSystem.extraShipmentCooldown,
      storageUpgrades: this.logisticsSystem.storageUpgrades ? { ...this.logisticsSystem.storageUpgrades } : null,
      directives: this.directives.map((directive) => ({ ...directive })),
      directiveStats: { ...this.directiveStats },
      performanceHistory: [...perfHistory],
      logs: this.logs.map((entry) => ({ ...entry })),
      market: this.getMarketState(),
      // New system states
      supplyChain: this.supplyChainSystem?.getState() || null,
      staffing: this.staffingSystem?.getState() || null,
      blending: this.blendingSystem?.getState() || null,
      disaster: this.disasterSystem?.getState() || null,
      maintenance: this.maintenanceSystem?.getState() || null,
      timeMachine: this.timeMachineSystem?.getState() || null,
    };

    return snapshot;
  }

  loadSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new Error("Invalid snapshot payload");
    }

    this._accumulator = 0;
    this.stepOnce = false;

    if (typeof snapshot.running === "boolean") {
      this.running = snapshot.running;
    }

    if (typeof snapshot.timeMinutes === "number" && Number.isFinite(snapshot.timeMinutes)) {
      this.timeMinutes = Math.max(0, snapshot.timeMinutes);
    } else {
      this.timeMinutes = 0;
    }

    if (typeof snapshot.speedMultiplier === "number") {
      this.setSpeedMultiplier(snapshot.speedMultiplier);
    } else {
      this.setSpeedMultiplier(1);
    }

    if (snapshot.params && typeof snapshot.params === "object") {
      Object.entries(snapshot.params).forEach(([key, value]) => {
        if (key in this.params && typeof value === "number" && Number.isFinite(value)) {
          this.params[key] = value;
        }
      });
    }

    if (snapshot.scenario && this.scenarios[snapshot.scenario]) {
      this.activeScenarioKey = snapshot.scenario;
      this.activeScenario = this.scenarios[this.activeScenarioKey];
    }

    // Restore Systems
    this.marketSystem.restoreState(snapshot, this.timeMinutes);
    this.market = this.marketSystem.state;

    this.logisticsSystem.restoreState(snapshot);
    this.storage = this.logisticsSystem.storage;
    this.shipments = this.logisticsSystem.shipments;

    // ...

    this.metrics = { ...this.metrics, ...(snapshot.metrics || {}) };
    this.flows = { ...this.flows, ...(snapshot.flows || {}) };

    this.pendingOperationalCost =
      typeof snapshot.pendingOperationalCost === "number" && Number.isFinite(snapshot.pendingOperationalCost)
        ? snapshot.pendingOperationalCost
        : 0;

    if (snapshot.recorder && typeof snapshot.recorder === "object") {
      const restored = this._createRecorderState();
      restored.active = Boolean(snapshot.recorder.active);
      restored.startedAt =
        typeof snapshot.recorder.startedAt === "number" && Number.isFinite(snapshot.recorder.startedAt)
          ? snapshot.recorder.startedAt
          : 0;
      restored.elapsedHours =
        typeof snapshot.recorder.elapsedHours === "number" && Number.isFinite(snapshot.recorder.elapsedHours)
          ? Math.max(0, snapshot.recorder.elapsedHours)
          : 0;
      restored.lastUpdatedAt =
        typeof snapshot.recorder.lastUpdatedAt === "number" && Number.isFinite(snapshot.recorder.lastUpdatedAt)
          ? snapshot.recorder.lastUpdatedAt
          : null;
      restored.profit =
        typeof snapshot.recorder.profit === "number" && Number.isFinite(snapshot.recorder.profit)
          ? snapshot.recorder.profit
          : 0;
      restored.penalty =
        typeof snapshot.recorder.penalty === "number" && Number.isFinite(snapshot.recorder.penalty)
          ? Math.max(0, snapshot.recorder.penalty)
          : 0;
      restored.incidents =
        typeof snapshot.recorder.incidents === "number" && Number.isFinite(snapshot.recorder.incidents)
          ? Math.max(0, snapshot.recorder.incidents)
          : 0;
      restored.reliabilityHours =
        typeof snapshot.recorder.reliabilityHours === "number" && Number.isFinite(snapshot.recorder.reliabilityHours)
          ? Math.max(0, snapshot.recorder.reliabilityHours)
          : 0;
      restored.carbon =
        typeof snapshot.recorder.carbon === "number" && Number.isFinite(snapshot.recorder.carbon)
          ? Math.max(0, snapshot.recorder.carbon)
          : 0;
      if (snapshot.recorder.production && typeof snapshot.recorder.production === "object") {
        ["gasoline", "diesel", "jet"].forEach((product) => {
          const value = snapshot.recorder.production[product];
          if (typeof value === "number" && Number.isFinite(value)) {
            restored.production[product] = Math.max(0, value);
          }
        });
      }
      if (snapshot.recorder.shipments && typeof snapshot.recorder.shipments === "object") {
        const delivered = snapshot.recorder.shipments.delivered;
        const missed = snapshot.recorder.shipments.missed;
        restored.shipments.delivered =
          typeof delivered === "number" && Number.isFinite(delivered) ? Math.max(0, delivered) : 0;
        restored.shipments.missed =
          typeof missed === "number" && Number.isFinite(missed) ? Math.max(0, missed) : 0;
      }
      this.recorder = restored;
    } else {
      this.recorder = this._createRecorderState();
    }

    if (snapshot.lastRecordingSummary && typeof snapshot.lastRecordingSummary === "object") {
      this.lastRecordingSummary = { ...snapshot.lastRecordingSummary };
    } else {
      this.lastRecordingSummary = null;
    }

    if (typeof snapshot.emergencyShutdown === "boolean") {
      this.emergencyShutdown = snapshot.emergencyShutdown;
    } else {
      this.emergencyShutdown = false;
    }

    if (snapshot.pipelineBoosts && typeof snapshot.pipelineBoosts === "object") {
      this.pipelineBoosts = {};
      Object.entries(snapshot.pipelineBoosts).forEach(([stream, boost]) => {
        if (!boost || typeof boost !== "object") {
          return;
        }
        const multiplier =
          typeof boost.multiplier === "number" && Number.isFinite(boost.multiplier)
            ? boost.multiplier
            : 1;
        const expiresAt =
          typeof boost.expiresAt === "number" && Number.isFinite(boost.expiresAt)
            ? boost.expiresAt
            : this.timeMinutes;
        const label = typeof boost.label === "string" ? boost.label : stream;
        this.pipelineBoosts[stream] = { multiplier, expiresAt, label };
      });
    } else {
      this.pipelineBoosts = {};
    }

    this.units.forEach((unit) => {
      unit.throughput = 0;
      unit.utilization = 0;
    });

    if (Array.isArray(snapshot.units)) {
      snapshot.units.forEach((entry) => {
        const unit = entry && this.unitMap[entry.id];
        if (!unit) {
          return;
        }
        if (typeof entry.integrity === "number" && Number.isFinite(entry.integrity)) {
          unit.integrity = clamp(entry.integrity, 0, 1);
        }
        if (typeof entry.downtime === "number" && Number.isFinite(entry.downtime)) {
          unit.downtime = Math.max(0, entry.downtime);
        }
        if (typeof entry.incidents === "number" && Number.isFinite(entry.incidents)) {
          unit.incidents = Math.max(0, entry.incidents);
        }
        if (typeof entry.status === "string") {
          unit.status = entry.status;
        }
        unit.manualOffline = Boolean(entry.manualOffline);
        unit.emergencyOffline = Boolean(entry.emergencyOffline);
        if (typeof entry.overrideThrottle === "number" && Number.isFinite(entry.overrideThrottle)) {
          unit.overrideThrottle = clamp(entry.overrideThrottle, 0, 1.2);
        }
        if (typeof entry.mode === "string") {
          unit.mode = entry.mode;
        }
        if (typeof entry.alert === "string" || entry.alert === null) {
          unit.alert = entry.alert;
        }
        if (typeof entry.alertTimer === "number" && Number.isFinite(entry.alertTimer)) {
          unit.alertTimer = Math.max(0, entry.alertTimer);
        } else {
          unit.alertTimer = Math.max(0, unit.alertTimer || 0);
        }
        unit.alertDetail = entry.alertDetail ? { ...entry.alertDetail } : null;
        unit.lastIncident = entry.lastIncident ? { ...entry.lastIncident } : null;
      });
    }

    this.unitOverrides = Object.create(null);
    if (snapshot.unitOverrides && typeof snapshot.unitOverrides === "object") {
      Object.entries(snapshot.unitOverrides).forEach(([unitId, override]) => {
        if (!override || typeof override !== "object") {
          return;
        }
        const unit = this.unitMap[unitId];
        if (!unit) {
          return;
        }
        const record = {};
        if (typeof override.throttle === "number" && Number.isFinite(override.throttle)) {
          record.throttle = clamp(override.throttle, 0, 1.2);
          unit.overrideThrottle = record.throttle;
        }
        if (override.offline) {
          record.offline = true;
          unit.manualOffline = unit.manualOffline || !unit.emergencyOffline;
          if (unit.downtime <= 0 && unit.status !== "offline") {
            unit.status = "standby";
          }
        }
        if (Object.keys(record).length) {
          this.unitOverrides[unitId] = record;
        }
      });
    }

    if (Array.isArray(snapshot.directives)) {
      this.directives = snapshot.directives.map((directive) => ({ ...directive }));
    } else {
      this.directives = [];
    }
    // Legacy directive cleanup if present in snapshot
    if (this.directives.length > 0) {
        this.directives = [];
    }

    if (snapshot.directiveStats && typeof snapshot.directiveStats === "object") {
      this.directiveStats = {
        total:
          typeof snapshot.directiveStats.total === "number" && Number.isFinite(snapshot.directiveStats.total)
            ? Math.max(0, snapshot.directiveStats.total)
            : 0,
        completed:
          typeof snapshot.directiveStats.completed === "number" && Number.isFinite(snapshot.directiveStats.completed)
            ? Math.max(0, snapshot.directiveStats.completed)
            : 0,
        failed:
          typeof snapshot.directiveStats.failed === "number" && Number.isFinite(snapshot.directiveStats.failed)
            ? Math.max(0, snapshot.directiveStats.failed)
            : 0,
      };
    } else {
      this.directiveStats = { total: this.directives.length, completed: 0, failed: 0 };
    }

    if (Array.isArray(snapshot.performanceHistory)) {
      const history = snapshot.performanceHistory
        .filter((entry) => typeof entry === "number" || (entry && typeof entry === "object"));

      // Initialize buffer if needed
      if (!this._perfBuffer) {
        this._perfBuffer = new Float32Array(240);
        this._perfHead = 0;
        this._perfCount = 0;
      }

      // Populate buffer from snapshot history
      // Note: snapshot history is ordered old -> new.
      // We push them into the buffer in order.
      history.forEach((entry) => {
        // Handle object wrapper if present (legacy snapshot artifact)
        const val = (typeof entry === 'object' && entry !== null) ? (Object.values(entry)[0] || 0) : entry;
        if (typeof val === 'number') {
           this._perfBuffer[this._perfHead] = val;
           this._perfHead = (this._perfHead + 1) % 240;
           if (this._perfCount < 240) this._perfCount++;
        }
      });

      // Don't restore this.performanceHistory array, we use buffer now.
      this.performanceHistory = [];
    } else {
      this.performanceHistory = [];
    }

    if (Array.isArray(snapshot.logs)) {
      this.logs = snapshot.logs
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({
          level: entry.level || "info",
          message: entry.message || "",
          timestamp: entry.timestamp || this._formatTime(),
          unitId: entry.unitId,
          product: entry.product,
        }))
        .slice(-80);
    } else {
      this.logs = [];
    }

    // Restore new system states
    if (snapshot.supplyChain && this.supplyChainSystem) {
      this.supplyChainSystem.restoreState(snapshot.supplyChain);
    }
    if (snapshot.staffing && this.staffingSystem) {
      this.staffingSystem.restoreState(snapshot.staffing);
    }
    if (snapshot.blending && this.blendingSystem) {
      this.blendingSystem.restoreState(snapshot.blending);
    }
    if (snapshot.disaster && this.disasterSystem) {
      this.disasterSystem.restoreState(snapshot.disaster);
    }
    if (snapshot.maintenance && this.maintenanceSystem) {
      this.maintenanceSystem.restoreState(snapshot.maintenance);
    }
    if (snapshot.timeMachine && this.timeMachineSystem) {
      this.timeMachineSystem.restoreState(snapshot.timeMachine);
    }

    const storageLevels = this.storage?.levels || {};
    const storageCapacity = this.storage?.capacity || {};
    const levelTotal =
      (storageLevels.gasoline || 0) + (storageLevels.diesel || 0) + (storageLevels.jet || 0);
    const capacityTotal =
      (storageCapacity.gasoline || 0) + (storageCapacity.diesel || 0) + (storageCapacity.jet || 0);
    this.metrics.storageGasoline = this._round(storageLevels.gasoline || 0);
    this.metrics.storageDiesel = this._round(storageLevels.diesel || 0);
    this.metrics.storageJet = this._round(storageLevels.jet || 0);
    this.metrics.storageUtilization = capacityTotal ? clamp(levelTotal / capacityTotal, 0, 1) : 0;

    const shipmentTotal = Math.max(0, this.shipmentStats.total || 0);
    const onTime = Math.max(0, this.shipmentStats.onTime || 0);
    this.metrics.shipmentReliability = shipmentTotal ? clamp(onTime / shipmentTotal, 0, 1) : 1;

    this.metrics.directivesCompleted = this.directiveStats.completed || 0;
    const directiveTotal = Math.max(0, this.directiveStats.total || 0);
    const directiveReliability = directiveTotal
      ? clamp((this.directiveStats.completed || 0) / directiveTotal, 0, 1)
      : 1;
    this.metrics.directiveReliability = directiveReliability;

    if (!Number.isFinite(this.metrics.reliability) || this.metrics.reliability === undefined) {
      const averageIntegrity =
        this.units.reduce((sum, unit) => sum + (unit.integrity || 0), 0) / Math.max(1, this.units.length);
      this.metrics.reliability = clamp(averageIntegrity, 0, 1);
    }
  }

  setUnitThrottle(unitId, fraction, options = {}) {
    if (unitId === "__proto__" || unitId === "constructor" || unitId === "prototype") {
      return;
    }
    const unit = this.unitMap[unitId];
    if (!unit) {
      return;
    }
    const throttle = clamp(typeof fraction === "number" ? fraction : 1, 0, 1.2);
    let override = this.unitOverrides[unitId];
    if (!override) {
      override = {};
    }
    if (throttle >= 0.99) {
      delete override.throttle;
    } else {
      override.throttle = throttle;
    }
    unit.overrideThrottle = throttle;
    if (override.offline) {
      this.unitOverrides[unitId] = override;
    } else if (override.throttle === undefined) {
      delete this.unitOverrides[unitId];
    } else {
      this.unitOverrides[unitId] = override;
    }
    if (!options.quiet) {
      this.pushLog(
        "info",
        `${unit.name} throughput target set to ${Math.round(throttle * 100)}%.`,
        { unitId }
      );
    }
  }

  setUnitOffline(unitId, offline, options = {}) {
    if (unitId === "__proto__" || unitId === "constructor" || unitId === "prototype") {
      return;
    }
    const unit = this.unitMap[unitId];
    if (!unit) {
      return;
    }
    if (options.emergencyOnly && !unit.emergencyOffline) {
      return;
    }
    let override = this.unitOverrides[unitId];
    if (!override) {
      override = {};
    }

    if (offline) {
      override.offline = true;
      unit.manualOffline = !options.emergency;
      unit.emergencyOffline = Boolean(options.emergency);
      if (unit.downtime <= 0 && unit.status !== "offline") {
        unit.status = "standby";
      }
      unit.throughput = 0;
      unit.utilization = 0;
      unit.overrideThrottle = 0;
    } else {
      if (options.emergencyOnly && !unit.emergencyOffline) {
        return;
      }
      delete override.offline;
      unit.emergencyOffline = false;
      unit.manualOffline = false;
      if (override.throttle === undefined) {
        unit.overrideThrottle = 1;
      } else {
        unit.overrideThrottle = override.throttle;
      }
      if (unit.status === "standby" && unit.downtime <= 0) {
        unit.status = "online";
      }
    }

    if (override.offline || override.throttle !== undefined) {
      this.unitOverrides[unitId] = override;
    } else {
      delete this.unitOverrides[unitId];
    }

    if (!options.quiet) {
      this.pushLog(
        offline ? "warning" : "info",
        offline ? `${unit.name} placed in standby.` : `${unit.name} returned to service.`,
        { unitId }
      );
    }
  }

  clearUnitOverride(unitId, options = {}) {
    if (unitId === "__proto__" || unitId === "constructor" || unitId === "prototype") {
      return;
    }
    const unit = this.unitMap[unitId];
    if (!unit) {
      return;
    }
    delete this.unitOverrides[unitId];
    unit.manualOffline = false;
    unit.emergencyOffline = false;
    unit.overrideThrottle = 1;
    if (unit.status === "standby" && unit.downtime <= 0) {
      unit.status = "online";
    }
    if (!options.quiet) {
      this.pushLog("info", `${unit.name} reset to automatic control.`, { unitId });
    }
  }

  setAllUnitsOffline(offline, options = {}) {
    this.units.forEach((unit) => {
      if (!unit) return;
      if (offline) {
        this.setUnitOffline(unit.id, true, { ...options, quiet: true });
      } else if (!options.emergencyOnly || unit.emergencyOffline) {
        this.setUnitOffline(unit.id, false, { ...options, quiet: true });
      }
    });
  }

  triggerEmergencyShutdown() {
    if (this.emergencyShutdown) {
      return;
    }
    this.emergencyShutdown = true;
    this.setAllUnitsOffline(true, { emergency: true, quiet: true });
    this.pushLog(
      "warning",
      "Emergency shutdown drill engaged. Crude charge isolated and units standing by."
    );
  }

  releaseEmergencyShutdown() {
    if (!this.emergencyShutdown) {
      return;
    }
    this.emergencyShutdown = false;
    this.setAllUnitsOffline(false, { emergencyOnly: true, quiet: true });
    this.pushLog("info", "Emergency shutdown cleared; restart crews may warm up units.");
  }
}

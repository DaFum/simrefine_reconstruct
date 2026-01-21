/**
 * Supply Chain System
 * Manages crude oil procurement, types (Sweet/Sour, Light/Heavy),
 * marine terminal operations, and demurrage penalties.
 */

export const CRUDE_TYPES = {
  WTI: {
    id: 'wti',
    name: 'West Texas Intermediate',
    category: 'sweet_light',
    sulfur: 0.24,      // % sulfur content
    apiGravity: 39.6,  // API gravity (higher = lighter)
    basePrice: 52,
    yields: {
      gasoline: 0.42,
      diesel: 0.26,
      jet: 0.10,
      lpg: 0.08,
      resid: 0.14
    },
    description: 'Premium light sweet crude with excellent gasoline yield'
  },
  BRENT: {
    id: 'brent',
    name: 'Brent Crude',
    category: 'sweet_light',
    sulfur: 0.37,
    apiGravity: 38.3,
    basePrice: 54,
    yields: {
      gasoline: 0.40,
      diesel: 0.27,
      jet: 0.11,
      lpg: 0.07,
      resid: 0.15
    },
    description: 'North Sea benchmark with balanced product slate'
  },
  ANS: {
    id: 'ans',
    name: 'Alaska North Slope',
    category: 'sour_medium',
    sulfur: 1.06,
    apiGravity: 31.9,
    basePrice: 46,
    yields: {
      gasoline: 0.32,
      diesel: 0.30,
      jet: 0.12,
      lpg: 0.06,
      resid: 0.20
    },
    description: 'Medium sour crude, requires more hydrotreating'
  },
  MAYA: {
    id: 'maya',
    name: 'Maya (Mexican Heavy)',
    category: 'sour_heavy',
    sulfur: 3.3,
    apiGravity: 22.0,
    basePrice: 38,
    yields: {
      gasoline: 0.22,
      diesel: 0.28,
      jet: 0.08,
      lpg: 0.05,
      resid: 0.37
    },
    description: 'Heavy sour crude, high residuum but cheap'
  },
  ARAB_LIGHT: {
    id: 'arab_light',
    name: 'Arabian Light',
    category: 'sour_light',
    sulfur: 1.77,
    apiGravity: 33.4,
    basePrice: 48,
    yields: {
      gasoline: 0.35,
      diesel: 0.29,
      jet: 0.11,
      lpg: 0.07,
      resid: 0.18
    },
    description: 'Middle East benchmark with moderate sulfur'
  }
};

export const CRUDE_CATEGORIES = {
  sweet_light: { label: 'Sweet Light', sulfurMax: 0.5, apiMin: 35 },
  sweet_medium: { label: 'Sweet Medium', sulfurMax: 0.5, apiMin: 25, apiMax: 35 },
  sour_light: { label: 'Sour Light', sulfurMin: 0.5, apiMin: 31 },
  sour_medium: { label: 'Sour Medium', sulfurMin: 0.5, apiMin: 25, apiMax: 31 },
  sour_heavy: { label: 'Sour Heavy', sulfurMin: 0.5, apiMax: 25 }
};

export class SupplyChainSystem {
  constructor(simulation) {
    this.simulation = simulation;

    // Crude inventory and tank farm
    this.crudeTanks = this._initCrudeTanks();
    this.activeContracts = [];
    this.contractHistory = [];

    // Marine terminal state
    this.marineDock = {
      slots: 2,
      occupied: [],
      queue: [],
      demurrageRate: 25000 // $/day for waiting ships
    };

    // Pipeline intake
    this.pipelineIntake = {
      connected: true,
      capacity: 60, // kbpd
      currentFlow: 0,
      crudeType: 'wti'
    };

    // Procurement settings
    this.preferredCrude = 'wti';
    this.blendStrategy = 'balanced'; // 'balanced', 'cheap', 'quality'

    // Stats
    this.stats = {
      demurragePaid: 0,
      contractsCompleted: 0,
      contractsMissed: 0,
      totalBarrelsProcured: 0
    };

    this._initializeDefaultContract();
  }

  _initCrudeTanks() {
    return {
      sweet: {
        level: 50,
        capacity: 200,
        contaminated: false,
        predominantType: 'wti'
      },
      sour: {
        level: 30,
        capacity: 150,
        contaminated: false,
        predominantType: 'ans'
      },
      blended: {
        level: 0,
        capacity: 100,
        sulfurContent: 0,
        apiGravity: 35
      }
    };
  }

  _initializeDefaultContract() {
    // Start with a basic WTI contract
    this.activeContracts.push({
      id: 'initial_wti',
      crudeType: 'wti',
      volumeRemaining: 10000, // barrels
      volumeTotal: 10000,
      pricePerBbl: CRUDE_TYPES.WTI.basePrice,
      deliverySchedule: 'weekly',
      startTime: 0,
      expiresAt: 60 * 24 * 30, // 30 days
      status: 'active'
    });
  }

  /**
   * Create a new procurement contract
   */
  createContract(options) {
    const crudeType = CRUDE_TYPES[options.crudeType?.toUpperCase()] || CRUDE_TYPES.WTI;
    const volume = options.volume || 10000;
    const duration = options.durationDays || 30;
    const currentTime = this.simulation?.timeMinutes || 0;

    // Price varies based on market conditions and contract size
    const volumeDiscount = volume > 50000 ? 0.95 : volume > 20000 ? 0.97 : 1;
    const durationPremium = duration < 14 ? 1.03 : duration > 60 ? 0.98 : 1;
    const marketStress = this.simulation?.marketStress || 0.16;
    const finalPrice = crudeType.basePrice * volumeDiscount * durationPremium * (1 + marketStress * 0.2);

    const contract = {
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      crudeType: crudeType.id,
      crudeData: crudeType,
      volumeRemaining: volume,
      volumeTotal: volume,
      pricePerBbl: Math.round(finalPrice * 100) / 100,
      deliverySchedule: options.deliverySchedule || 'weekly',
      startTime: currentTime,
      expiresAt: currentTime + (duration * 24 * 60),
      status: 'active',
      penaltyRate: options.penaltyRate || 0.1 // 10% penalty for unfulfilled
    };

    this.activeContracts.push(contract);
    return contract;
  }

  /**
   * Schedule a tanker delivery
   */
  scheduleDelivery(options) {
    const crudeType = CRUDE_TYPES[options.crudeType?.toUpperCase()] || CRUDE_TYPES.WTI;
    const volume = options.volume || 25000;
    const currentTime = this.simulation?.timeMinutes || 0;
    const arrivalTime = currentTime + (options.arrivalHours || 24) * 60;

    const shipment = {
      id: `tanker_${Date.now()}`,
      crudeType: crudeType.id,
      crudeData: crudeType,
      volume,
      arrivalTime,
      berthingTime: null,
      unloadStartTime: null,
      unloadEndTime: null,
      status: 'enroute', // enroute, waiting, berthing, unloading, complete
      demurrage: 0,
      waitingHours: 0
    };

    this.marineDock.queue.push(shipment);
    return shipment;
  }

  /**
   * Main update loop
   */
  update(deltaMinutes, context) {
    const hours = deltaMinutes / 60;

    // Update marine terminal
    this._updateMarineTerminal(hours);

    // Update pipeline intake
    this._updatePipelineIntake(hours, context);

    // Check contract status
    this._updateContracts(hours);

    // Calculate crude blend for production
    const crudeBlend = this._calculateCrudeBlend();

    return {
      crudeTanks: this._getTankLevels(),
      crudeBlend,
      marineDock: this._getMarineDockStatus(),
      contracts: this._getContractsSummary(),
      demurrageCost: this._calculateDemurrageCost(hours),
      pipelineStatus: { ...this.pipelineIntake }
    };
  }

  _updateMarineTerminal(hours) {
    const currentTime = this.simulation?.timeMinutes || 0;

    // Process ships at berth
    this.marineDock.occupied = this.marineDock.occupied.filter(ship => {
      if (ship.status === 'unloading') {
        // Unloading rate: ~50,000 barrels per hour per berth
        const unloaded = Math.min(ship.volume, 50000 * hours);
        ship.volume -= unloaded;

        // Add to appropriate tank
        this._addToTank(ship.crudeData, unloaded);

        if (ship.volume <= 0) {
          ship.status = 'complete';
          ship.unloadEndTime = currentTime;
          this.stats.totalBarrelsProcured += ship.crudeData ?
            (ship.crudeData.basePrice ? ship.volume : 0) : 0;
          // Emit tanker unloaded event
          if (this.simulation?.eventBus) {
            this.simulation.eventBus.emit('TANKER_UNLOADED', {
              shipId: ship.id,
              crudeType: ship.crudeType,
              demurrage: ship.demurrage
            });
          }
          return false; // Remove from occupied
        }
      }
      return true;
    });

    // Move ships from queue to berth if space available
    while (this.marineDock.occupied.length < this.marineDock.slots &&
           this.marineDock.queue.length > 0) {
      const nextShip = this.marineDock.queue.find(s =>
        s.arrivalTime <= currentTime && s.status === 'waiting'
      );

      if (nextShip) {
        nextShip.status = 'unloading';
        nextShip.berthingTime = currentTime;
        nextShip.unloadStartTime = currentTime;
        this.marineDock.occupied.push(nextShip);
        this.marineDock.queue = this.marineDock.queue.filter(s => s.id !== nextShip.id);
      } else {
        break;
      }
    }

    // Update waiting ships (demurrage)
    this.marineDock.queue.forEach(ship => {
      if (ship.arrivalTime <= currentTime && ship.status === 'enroute') {
        ship.status = 'waiting';
        // Emit tanker arrived event
        if (this.simulation?.eventBus) {
          this.simulation.eventBus.emit('TANKER_ARRIVED', {
            shipId: ship.id,
            crudeType: ship.crudeType,
            volume: ship.volume
          });
        }
      }

      if (ship.status === 'waiting') {
        ship.waitingHours += hours;
        ship.demurrage = ship.waitingHours * (this.marineDock.demurrageRate / 24);
        this.stats.demurragePaid += (this.marineDock.demurrageRate / 24) * hours;
      }
    });
  }

  _updatePipelineIntake(hours, context) {
    if (!this.pipelineIntake.connected) {
      this.pipelineIntake.currentFlow = 0;
      return;
    }

    // Pipeline provides steady flow
    const crudeType = CRUDE_TYPES[this.pipelineIntake.crudeType?.toUpperCase()] || CRUDE_TYPES.WTI;
    const flowRate = Math.min(
      this.pipelineIntake.capacity,
      context?.demandRate || this.pipelineIntake.capacity * 0.8
    );

    this.pipelineIntake.currentFlow = flowRate;
    const volumeDelivered = (flowRate / 24) * hours * 1000; // Convert kbpd to barrels per hour

    this._addToTank(crudeType, volumeDelivered);
  }

  _updateContracts(_hours) {
    const currentTime = this.simulation?.timeMinutes || 0;

    this.activeContracts = this.activeContracts.filter(contract => {
      if (contract.expiresAt <= currentTime) {
        if (contract.volumeRemaining > 0) {
          // Contract not fulfilled
          contract.status = 'expired_unfulfilled';
          this.stats.contractsMissed++;
        } else {
          contract.status = 'completed';
          this.stats.contractsCompleted++;
        }
        this.contractHistory.push(contract);
        return false;
      }
      return true;
    });
  }

  _addToTank(crudeType, volume) {
    if (!crudeType) return;

    const isSour = crudeType.sulfur > 0.5;
    const tank = isSour ? this.crudeTanks.sour : this.crudeTanks.sweet;

    // Check for contamination (mixing sweet and sour)
    if (!isSour && tank === this.crudeTanks.sour) {
      tank.contaminated = true;
    }

    tank.level = Math.min(tank.level + volume / 1000, tank.capacity); // Convert to kb
    tank.predominantType = crudeType.id;
  }

  _calculateCrudeBlend() {
    const sweetTank = this.crudeTanks.sweet;
    const sourTank = this.crudeTanks.sour;

    const sweetType = CRUDE_TYPES[sweetTank.predominantType?.toUpperCase()] || CRUDE_TYPES.WTI;
    const sourType = CRUDE_TYPES[sourTank.predominantType?.toUpperCase()] || CRUDE_TYPES.ANS;

    const totalLevel = sweetTank.level + sourTank.level;
    if (totalLevel <= 0) {
      return {
        available: false,
        sulfurContent: 0.5,
        apiGravity: 35,
        yields: CRUDE_TYPES.WTI.yields,
        effectivePrice: 50
      };
    }

    const sweetRatio = sweetTank.level / totalLevel;
    const sourRatio = sourTank.level / totalLevel;

    // Blend properties
    const sulfurContent = sweetType.sulfur * sweetRatio + sourType.sulfur * sourRatio;
    const apiGravity = sweetType.apiGravity * sweetRatio + sourType.apiGravity * sourRatio;
    const effectivePrice = sweetType.basePrice * sweetRatio + sourType.basePrice * sourRatio;

    // Blend yields
    const yields = {};
    Object.keys(CRUDE_TYPES.WTI.yields).forEach(product => {
      yields[product] = sweetType.yields[product] * sweetRatio +
                        sourType.yields[product] * sourRatio;
    });

    return {
      available: true,
      sulfurContent,
      apiGravity,
      yields,
      effectivePrice,
      sweetRatio,
      sourRatio,
      totalLevel,
      quality: apiGravity > 35 && sulfurContent < 0.5 ? 'premium' :
               apiGravity > 30 && sulfurContent < 1.5 ? 'standard' : 'heavy'
    };
  }

  _getTankLevels() {
    return {
      sweet: {
        level: this.crudeTanks.sweet.level,
        capacity: this.crudeTanks.sweet.capacity,
        utilization: this.crudeTanks.sweet.level / this.crudeTanks.sweet.capacity,
        type: this.crudeTanks.sweet.predominantType,
        contaminated: this.crudeTanks.sweet.contaminated
      },
      sour: {
        level: this.crudeTanks.sour.level,
        capacity: this.crudeTanks.sour.capacity,
        utilization: this.crudeTanks.sour.level / this.crudeTanks.sour.capacity,
        type: this.crudeTanks.sour.predominantType,
        contaminated: this.crudeTanks.sour.contaminated
      }
    };
  }

  _getMarineDockStatus() {
    return {
      slotsTotal: this.marineDock.slots,
      slotsOccupied: this.marineDock.occupied.length,
      shipsWaiting: this.marineDock.queue.filter(s => s.status === 'waiting').length,
      shipsEnroute: this.marineDock.queue.filter(s => s.status === 'enroute').length,
      currentDemurrage: this.marineDock.queue.reduce((sum, s) => sum + (s.demurrage || 0), 0),
      queue: this.marineDock.queue.map(s => ({
        id: s.id,
        crudeType: s.crudeType,
        volume: s.volume,
        status: s.status,
        waitingHours: s.waitingHours,
        demurrage: s.demurrage
      }))
    };
  }

  _getContractsSummary() {
    return this.activeContracts.map(c => ({
      id: c.id,
      crudeType: c.crudeType,
      volumeRemaining: c.volumeRemaining,
      volumeTotal: c.volumeTotal,
      pricePerBbl: c.pricePerBbl,
      fulfillmentPercent: ((c.volumeTotal - c.volumeRemaining) / c.volumeTotal) * 100,
      status: c.status
    }));
  }

  _calculateDemurrageCost(hours) {
    return this.marineDock.queue
      .filter(s => s.status === 'waiting')
      .reduce((sum, _s) => sum + (this.marineDock.demurrageRate / 24) * hours, 0);
  }

  /**
   * Consume crude from tanks for production
   */
  consumeCrude(amount) {
    const sweetTank = this.crudeTanks.sweet;
    const sourTank = this.crudeTanks.sour;

    // Consume proportionally from both tanks
    const totalLevel = sweetTank.level + sourTank.level;
    if (totalLevel <= 0) return false;

    const sweetConsume = (sweetTank.level / totalLevel) * amount;
    const sourConsume = (sourTank.level / totalLevel) * amount;

    sweetTank.level = Math.max(0, sweetTank.level - sweetConsume);
    sourTank.level = Math.max(0, sourTank.level - sourConsume);

    return true;
  }

  /**
   * Get current crude cost per barrel based on blend
   */
  getCrudePrice() {
    const blend = this._calculateCrudeBlend();
    return blend.effectivePrice || 50;
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      crudeTanks: JSON.parse(JSON.stringify(this.crudeTanks)),
      activeContracts: JSON.parse(JSON.stringify(this.activeContracts)),
      marineDock: {
        occupied: this.marineDock.occupied.map(s => ({ ...s })),
        queue: this.marineDock.queue.map(s => ({ ...s }))
      },
      pipelineIntake: { ...this.pipelineIntake },
      stats: { ...this.stats }
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.crudeTanks) {
      this.crudeTanks = JSON.parse(JSON.stringify(state.crudeTanks));
    }
    if (state.activeContracts) {
      this.activeContracts = JSON.parse(JSON.stringify(state.activeContracts));
    }
    if (state.marineDock) {
      this.marineDock.occupied = state.marineDock.occupied || [];
      this.marineDock.queue = state.marineDock.queue || [];
    }
    if (state.pipelineIntake) {
      Object.assign(this.pipelineIntake, state.pipelineIntake);
    }
    if (state.stats) {
      Object.assign(this.stats, state.stats);
    }
  }

  reset() {
    this.crudeTanks = this._initCrudeTanks();
    this.activeContracts = [];
    this.contractHistory = [];
    this.marineDock.occupied = [];
    this.marineDock.queue = [];
    this.pipelineIntake.currentFlow = 0;
    this.stats = {
      demurragePaid: 0,
      contractsCompleted: 0,
      contractsMissed: 0,
      totalBarrelsProcured: 0
    };
    this._initializeDefaultContract();
  }
}

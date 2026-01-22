/**
 * Blending System
 * Manages product blending tanks, octane balancing, additives,
 * and quality specifications for final products.
 */

export const GASOLINE_GRADES = {
  regular: {
    id: 'regular',
    name: 'Regular Unleaded',
    octaneMin: 87,
    octaneTarget: 87,
    priceMultiplier: 1.0,
    demandShare: 0.55
  },
  midgrade: {
    id: 'midgrade',
    name: 'Mid-Grade',
    octaneMin: 89,
    octaneTarget: 89,
    priceMultiplier: 1.04,
    demandShare: 0.15
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    octaneMin: 92,
    octaneTarget: 93,
    priceMultiplier: 1.12,
    demandShare: 0.30
  }
};

export const BLENDSTOCKS = {
  reformate: {
    id: 'reformate',
    name: 'Reformate',
    octane: 98,
    rvp: 3.5,  // Reid Vapor Pressure
    sulfur: 2, // ppm
    source: 'reformer'
  },
  alkylate: {
    id: 'alkylate',
    name: 'Alkylate',
    octane: 96,
    rvp: 4.5,
    sulfur: 0,
    source: 'alkylation'
  },
  fccGasoline: {
    id: 'fccGasoline',
    name: 'FCC Gasoline',
    octane: 92,
    rvp: 7.0,
    sulfur: 150,
    source: 'fcc'
  },
  straightRunNaphtha: {
    id: 'straightRunNaphtha',
    name: 'Straight-Run Naphtha',
    octane: 65,
    rvp: 9.0,
    sulfur: 50,
    source: 'distillation'
  },
  isomerate: {
    id: 'isomerate',
    name: 'Isomerate',
    octane: 87,
    rvp: 11.0,
    sulfur: 0,
    source: 'isomerization'
  },
  butane: {
    id: 'butane',
    name: 'Butane',
    octane: 94,
    rvp: 52.0,
    sulfur: 0,
    source: 'fractionation'
  }
};

export const ADDITIVES = {
  detergent: {
    id: 'detergent',
    name: 'Detergent Package',
    costPerGallon: 0.02,
    function: 'Keeps injectors clean',
    required: true
  },
  antioxidant: {
    id: 'antioxidant',
    name: 'Antioxidant',
    costPerGallon: 0.008,
    function: 'Prevents gum formation',
    required: true
  },
  corrosionInhibitor: {
    id: 'corrosionInhibitor',
    name: 'Corrosion Inhibitor',
    costPerGallon: 0.005,
    function: 'Protects fuel system',
    required: true
  },
  octaneBooster: {
    id: 'octaneBooster',
    name: 'Octane Booster (MMT)',
    costPerGallon: 0.03,
    octaneBoost: 2,
    function: 'Increases octane rating',
    required: false
  },
  stabilizer: {
    id: 'stabilizer',
    name: 'Fuel Stabilizer',
    costPerGallon: 0.015,
    function: 'Extends storage life',
    required: false
  }
};

export const DIESEL_SPECS = {
  ulsd: {
    id: 'ulsd',
    name: 'Ultra-Low Sulfur Diesel',
    sulfurMax: 15, // ppm
    cetaneMin: 40,
    priceMultiplier: 1.0
  },
  winterDiesel: {
    id: 'winterDiesel',
    name: 'Winter Diesel',
    sulfurMax: 15,
    cetaneMin: 42,
    cloudPointMax: -20, // Celsius
    priceMultiplier: 1.05
  }
};

export class BlendingSystem {
  constructor(simulation) {
    this.simulation = simulation;

    // Blending tanks
    this.blendingTanks = {
      gasoline: this._initGasolineTanks(),
      diesel: this._initDieselTanks(),
      jet: this._initJetTanks()
    };

    // Blendstock inventory
    this.blendstockInventory = this._initBlendstockInventory();

    // Current blend recipes
    this.activeRecipes = {
      regular: this._defaultRegularRecipe(),
      midgrade: this._defaultMidgradeRecipe(),
      premium: this._defaultPremiumRecipe(),
      diesel: this._defaultDieselRecipe(),
      jetA: this._defaultJetRecipe()
    };

    // Quality metrics
    this.qualityMetrics = {
      gasolineOctane: 87,
      dieselCetane: 42,
      dieselSulfur: 10,
      jetFreezePoint: -47,
      offspecCount: 0,
      blendEfficiency: 0.98
    };

    // Additive usage
    this.additiveUsage = {};
    Object.keys(ADDITIVES).forEach(id => {
      this.additiveUsage[id] = { enabled: ADDITIVES[id].required, consumption: 0 };
    });
  }

  _initGasolineTanks() {
    return {
      regular: { level: 0, capacity: 80, octane: 87, rvp: 8.0, sulfur: 30 },
      midgrade: { level: 0, capacity: 30, octane: 89, rvp: 7.5, sulfur: 25 },
      premium: { level: 0, capacity: 50, octane: 93, rvp: 7.0, sulfur: 20 }
    };
  }

  _initDieselTanks() {
    return {
      ulsd: { level: 0, capacity: 100, cetane: 42, sulfur: 10, cloudPoint: -10 },
      winterDiesel: { level: 0, capacity: 40, cetane: 44, sulfur: 8, cloudPoint: -25 }
    };
  }

  _initJetTanks() {
    return {
      jetA: { level: 0, capacity: 60, freezePoint: -47, flashPoint: 38, density: 0.81 }
    };
  }

  _initBlendstockInventory() {
    const inventory = {};
    Object.keys(BLENDSTOCKS).forEach(id => {
      inventory[id] = { level: 50, capacity: 100 };
    });
    return inventory;
  }

  _defaultRegularRecipe() {
    return {
      reformate: 0.25,
      alkylate: 0.10,
      fccGasoline: 0.35,
      straightRunNaphtha: 0.25,
      butane: 0.05
    };
  }

  _defaultMidgradeRecipe() {
    return {
      reformate: 0.35,
      alkylate: 0.15,
      fccGasoline: 0.30,
      straightRunNaphtha: 0.15,
      butane: 0.05
    };
  }

  _defaultPremiumRecipe() {
    return {
      reformate: 0.45,
      alkylate: 0.25,
      fccGasoline: 0.20,
      straightRunNaphtha: 0.05,
      butane: 0.05
    };
  }

  _defaultDieselRecipe() {
    return {
      straightRunDiesel: 0.60,
      hydrocrackerDiesel: 0.30,
      lcoDiesel: 0.10
    };
  }

  _defaultJetRecipe() {
    return {
      straightRunKero: 0.50,
      hydrocrackerKero: 0.40,
      hydrotreatedKero: 0.10
    };
  }

  /**
   * Calculate blended octane from recipe
   */
  calculateBlendOctane(recipe) {
    let totalOctane = 0;
    let totalVolume = 0;

    Object.entries(recipe).forEach(([stockId, fraction]) => {
      const stock = BLENDSTOCKS[stockId];
      if (stock && fraction > 0) {
        totalOctane += stock.octane * fraction;
        totalVolume += fraction;
      }
    });

    return totalVolume > 0 ? totalOctane / totalVolume : 0;
  }

  /**
   * Calculate RVP from recipe (complex non-linear blending)
   */
  calculateBlendRVP(recipe) {
    // RVP blends non-linearly, use Raoult's law approximation
    let rvpSum = 0;
    let totalVolume = 0;

    Object.entries(recipe).forEach(([stockId, fraction]) => {
      const stock = BLENDSTOCKS[stockId];
      if (stock && fraction > 0) {
        rvpSum += stock.rvp ** 1.25 * fraction;
        totalVolume += fraction;
      }
    });

    return totalVolume > 0 ? (rvpSum / totalVolume) ** 0.8 : 0;
  }

  /**
   * Blend gasoline to a specific grade
   */
  blendGasoline(gradeId, volumeKb) {
    const grade = GASOLINE_GRADES[gradeId];
    const recipe = this.activeRecipes[gradeId];
    const tank = this.blendingTanks.gasoline[gradeId];

    if (!grade || !recipe || !tank) return { success: false, error: 'Invalid grade' };

    // Check blendstock availability
    let canBlend = true;
    Object.entries(recipe).forEach(([stockId, fraction]) => {
      const stock = this.blendstockInventory[stockId];
      if (stock && stock.level < volumeKb * fraction) {
        canBlend = false;
      }
    });

    if (!canBlend) {
      return { success: false, error: 'Insufficient blendstock' };
    }

    // Calculate blend properties
    const octane = this.calculateBlendOctane(recipe);
    const rvp = this.calculateBlendRVP(recipe);

    // Check octane meets spec
    if (octane < grade.octaneMin) {
      // Try to adjust recipe or use octane booster
      if (this.additiveUsage.octaneBooster?.enabled) {
        const boostedOctane = octane + ADDITIVES.octaneBooster.octaneBoost;
        if (boostedOctane >= grade.octaneMin) {
          // Use octane booster
          this.additiveUsage.octaneBooster.consumption += volumeKb * 42; // barrels to gallons
        } else {
          return { success: false, error: 'Cannot meet octane spec', actual: octane, required: grade.octaneMin };
        }
      } else {
        return { success: false, error: 'Octane too low', actual: octane, required: grade.octaneMin };
      }
    }

    // Consume blendstocks
    Object.entries(recipe).forEach(([stockId, fraction]) => {
      const stock = this.blendstockInventory[stockId];
      if (stock) {
        stock.level = Math.max(0, stock.level - volumeKb * fraction);
      }
    });

    // Add to blend tank
    const prevLevel = tank.level;
    tank.level = Math.min(tank.capacity, tank.level + volumeKb);
    const actualBlended = tank.level - prevLevel;

    // Update tank properties (running average)
    if (prevLevel > 0) {
      tank.octane = (tank.octane * prevLevel + octane * actualBlended) / tank.level;
      tank.rvp = (tank.rvp * prevLevel + rvp * actualBlended) / tank.level;
    } else {
      tank.octane = octane;
      tank.rvp = rvp;
    }

    // Add additives
    Object.entries(this.additiveUsage).forEach(([addId, usage]) => {
      if (usage.enabled && ADDITIVES[addId]) {
        usage.consumption += actualBlended * 42 * ADDITIVES[addId].costPerGallon;
      }
    });

    return {
      success: true,
      blended: actualBlended,
      octane,
      rvp,
      meetsSpec: octane >= grade.octaneMin
    };
  }

  /**
   * Optimize blend recipe to meet target octane with minimum cost
   */
  optimizeRecipe(targetOctane, _constraints = {}) {
    const stocks = Object.entries(BLENDSTOCKS)
      .filter(([id, _s]) => this.blendstockInventory[id]?.level > 0)
      .sort((a, b) => b[1].octane - a[1].octane); // Sort by octane, high to low

    // Simple linear programming approach
    const recipe = {};
    let remaining = 1.0;
    let _currentOctane = 0;

    // Add high-octane stocks until we meet target
    for (const [stockId, stock] of stocks) {
      if (remaining <= 0) break;

      const available = this.blendstockInventory[stockId].level / 100; // Normalize
      const fraction = Math.min(remaining, available, 0.5); // Max 50% of any one stock

      recipe[stockId] = fraction;
      _currentOctane += stock.octane * fraction;
      remaining -= fraction;

      if (this.calculateBlendOctane(recipe) >= targetOctane) {
        // Fill rest with cheapest stock
        const cheapest = stocks[stocks.length - 1];
        if (cheapest && remaining > 0) {
          recipe[cheapest[0]] = (recipe[cheapest[0]] || 0) + remaining;
        }
        break;
      }
    }

    // Normalize to sum to 1
    const total = Object.values(recipe).reduce((s, v) => s + v, 0);
    if (total > 0) {
      Object.keys(recipe).forEach((k) => {
        recipe[k] /= total;
      });
    }

    return {
      recipe,
      expectedOctane: this.calculateBlendOctane(recipe),
      meetsTarget: this.calculateBlendOctane(recipe) >= targetOctane
    };
  }

  /**
   * Update blendstock levels from production
   */
  receiveBlendstocks(production) {
    // Map production outputs to blendstocks
    if (production.reformate) {
      this.blendstockInventory.reformate.level =
        Math.min(this.blendstockInventory.reformate.capacity,
                 this.blendstockInventory.reformate.level + production.reformate);
    }
    if (production.alkylate) {
      this.blendstockInventory.alkylate.level =
        Math.min(this.blendstockInventory.alkylate.capacity,
                 this.blendstockInventory.alkylate.level + production.alkylate);
    }
    if (production.fccGasoline) {
      this.blendstockInventory.fccGasoline.level =
        Math.min(this.blendstockInventory.fccGasoline.capacity,
                 this.blendstockInventory.fccGasoline.level + production.fccGasoline);
    }
    if (production.naphtha) {
      this.blendstockInventory.straightRunNaphtha.level =
        Math.min(this.blendstockInventory.straightRunNaphtha.capacity,
                 this.blendstockInventory.straightRunNaphtha.level + production.naphtha);
    }
  }

  /**
   * Main update loop
   */
  update(deltaMinutes, context) {
    const hours = deltaMinutes / 60;

    // Auto-blend based on demand if enabled
    if (context?.autoBlend) {
      this._autoBlend(hours, context);
    }

    // Update quality metrics
    this._updateQualityMetrics();

    return {
      tanks: this._getTankStatus(),
      blendstocks: this._getBlendstockStatus(),
      quality: { ...this.qualityMetrics },
      additives: this._getAdditiveStatus()
    };
  }

  _autoBlend(hours, context) {
    const demand = context?.demand || { regular: 10, midgrade: 3, premium: 5 };

    Object.entries(demand).forEach(([grade, rate]) => {
      const tank = this.blendingTanks.gasoline[grade];
      if (tank && tank.level < tank.capacity * 0.8) {
        const toBlend = Math.min(rate * hours, tank.capacity - tank.level);
        if (toBlend > 0.1) {
          this.blendGasoline(grade, toBlend);
        }
      }
    });
  }

  _updateQualityMetrics() {
    const gasTanks = this.blendingTanks.gasoline;
    const totalGasLevel = gasTanks.regular.level + gasTanks.midgrade.level + gasTanks.premium.level;

    if (totalGasLevel > 0) {
      this.qualityMetrics.gasolineOctane =
        (gasTanks.regular.octane * gasTanks.regular.level +
         gasTanks.midgrade.octane * gasTanks.midgrade.level +
         gasTanks.premium.octane * gasTanks.premium.level) / totalGasLevel;
    }

    const dieselTanks = this.blendingTanks.diesel;
    const totalDieselLevel = dieselTanks.ulsd.level + dieselTanks.winterDiesel.level;
    if (totalDieselLevel > 0) {
      this.qualityMetrics.dieselCetane =
        (dieselTanks.ulsd.cetane * dieselTanks.ulsd.level +
         dieselTanks.winterDiesel.cetane * dieselTanks.winterDiesel.level) / totalDieselLevel;
      this.qualityMetrics.dieselSulfur =
        (dieselTanks.ulsd.sulfur * dieselTanks.ulsd.level +
         dieselTanks.winterDiesel.sulfur * dieselTanks.winterDiesel.level) / totalDieselLevel;
    }
  }

  _getTankStatus() {
    const status = {};

    Object.entries(this.blendingTanks).forEach(([product, tanks]) => {
      status[product] = {};
      Object.entries(tanks).forEach(([grade, tank]) => {
        status[product][grade] = {
          level: tank.level,
          capacity: tank.capacity,
          utilization: tank.level / tank.capacity,
          ...tank
        };
      });
    });

    return status;
  }

  _getBlendstockStatus() {
    return Object.entries(this.blendstockInventory).map(([id, inv]) => ({
      id,
      name: BLENDSTOCKS[id]?.name || id,
      level: inv.level,
      capacity: inv.capacity,
      utilization: inv.level / inv.capacity,
      octane: BLENDSTOCKS[id]?.octane || 0
    }));
  }

  _getAdditiveStatus() {
    return Object.entries(this.additiveUsage).map(([id, usage]) => ({
      id,
      name: ADDITIVES[id]?.name || id,
      enabled: usage.enabled,
      consumption: usage.consumption,
      costPerGallon: ADDITIVES[id]?.costPerGallon || 0
    }));
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      blendingTanks: structuredClone(this.blendingTanks),
      blendstockInventory: structuredClone(this.blendstockInventory),
      activeRecipes: structuredClone(this.activeRecipes),
      qualityMetrics: { ...this.qualityMetrics },
      additiveUsage: structuredClone(this.additiveUsage)
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.blendingTanks) {
      this.blendingTanks = structuredClone(state.blendingTanks);
    }
    if (state.blendstockInventory) {
      this.blendstockInventory = structuredClone(state.blendstockInventory);
    }
    if (state.activeRecipes) {
      this.activeRecipes = structuredClone(state.activeRecipes);
    }
    if (state.qualityMetrics) {
      Object.assign(this.qualityMetrics, state.qualityMetrics);
    }
    if (state.additiveUsage) {
      this.additiveUsage = structuredClone(state.additiveUsage);
    }
  }

  reset() {
    this.blendingTanks = {
      gasoline: this._initGasolineTanks(),
      diesel: this._initDieselTanks(),
      jet: this._initJetTanks()
    };
    this.blendstockInventory = this._initBlendstockInventory();
    this.qualityMetrics = {
      gasolineOctane: 87,
      dieselCetane: 42,
      dieselSulfur: 10,
      jetFreezePoint: -47,
      offspecCount: 0,
      blendEfficiency: 0.98
    };
    Object.keys(this.additiveUsage).forEach(id => {
      this.additiveUsage[id].consumption = 0;
    });
  }
}

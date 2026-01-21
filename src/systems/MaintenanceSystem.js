/**
 * Maintenance System
 * Manages maintenance strategies: Reactive, Preventative, Predictive
 * Component wear tracking, turnarounds, and reliability optimization.
 */

export const MAINTENANCE_STRATEGIES = {
  reactive: {
    id: 'reactive',
    name: 'Reactive Maintenance',
    description: 'Fix it when it breaks',
    costMultiplier: 0.3,  // Low upfront cost
    downtimeMultiplier: 2.5, // High downtime when things break
    reliabilityFactor: 0.7,
    wearRate: 1.3
  },
  preventative: {
    id: 'preventative',
    name: 'Preventative Maintenance',
    description: 'Scheduled maintenance intervals',
    costMultiplier: 1.0,
    downtimeMultiplier: 1.0,
    reliabilityFactor: 1.0,
    wearRate: 1.0
  },
  predictive: {
    id: 'predictive',
    name: 'Predictive Maintenance',
    description: 'AI sensors predict failures',
    costMultiplier: 1.8,  // High sensor/tech cost
    downtimeMultiplier: 0.4, // Minimal downtime
    reliabilityFactor: 1.3,
    wearRate: 0.75,
    sensorCost: 50000 // Per unit installation
  }
};

export const COMPONENT_TYPES = {
  pump: {
    id: 'pump',
    name: 'Centrifugal Pump',
    mtbf: 8760, // Mean time between failures (hours)
    repairTime: 4, // Hours
    repairCost: 15000,
    replacementCost: 85000,
    criticalThreshold: 0.2
  },
  compressor: {
    id: 'compressor',
    name: 'Compressor',
    mtbf: 6000,
    repairTime: 8,
    repairCost: 35000,
    replacementCost: 250000,
    criticalThreshold: 0.25
  },
  heatExchanger: {
    id: 'heatExchanger',
    name: 'Heat Exchanger',
    mtbf: 17520,
    repairTime: 16,
    repairCost: 25000,
    replacementCost: 180000,
    criticalThreshold: 0.15
  },
  vessel: {
    id: 'vessel',
    name: 'Pressure Vessel',
    mtbf: 43800,
    repairTime: 48,
    repairCost: 80000,
    replacementCost: 500000,
    criticalThreshold: 0.3
  },
  valve: {
    id: 'valve',
    name: 'Control Valve',
    mtbf: 26280,
    repairTime: 2,
    repairCost: 5000,
    replacementCost: 25000,
    criticalThreshold: 0.1
  },
  instrument: {
    id: 'instrument',
    name: 'Instrumentation',
    mtbf: 35040,
    repairTime: 1,
    repairCost: 2000,
    replacementCost: 8000,
    criticalThreshold: 0.05
  },
  catalyst: {
    id: 'catalyst',
    name: 'Catalyst Bed',
    mtbf: 17520,
    repairTime: 72,
    repairCost: 200000,
    replacementCost: 800000,
    criticalThreshold: 0.35
  }
};

export const TURNAROUND_TYPES = {
  minor: {
    id: 'minor',
    name: 'Minor Turnaround',
    duration: 48, // Hours
    cost: 500000,
    integrityRestored: 0.4,
    scope: ['inspection', 'cleaning', 'minor_repairs']
  },
  major: {
    id: 'major',
    name: 'Major Turnaround',
    duration: 168, // 1 week
    cost: 2500000,
    integrityRestored: 0.8,
    scope: ['full_inspection', 'catalyst_change', 'vessel_entry', 'major_repairs']
  },
  shutdown: {
    id: 'shutdown',
    name: 'Emergency Shutdown',
    duration: 24,
    cost: 1000000,
    integrityRestored: 0.2,
    scope: ['emergency_repairs', 'safety_checks']
  }
};

export class MaintenanceSystem {
  constructor(simulation) {
    this.simulation = simulation;

    // Strategy per unit
    this.unitStrategies = {};

    // Component tracking per unit
    this.components = {};

    // Scheduled maintenance
    this.scheduledMaintenance = [];

    // Active turnarounds
    this.activeTurnarounds = [];

    // Work orders
    this.workOrders = [];

    // Predictive sensors (if installed)
    this.sensors = {};

    // Stats
    this.stats = {
      totalMaintenanceCost: 0,
      plannedDowntime: 0,
      unplannedDowntime: 0,
      workOrdersCompleted: 0,
      turnaroundsCompleted: 0,
      failuresPrevented: 0
    };

    // Initialize for simulation units
    this._initializeUnits();
  }

  _initializeUnits() {
    const units = this.simulation?.units || [];

    units.forEach(unit => {
      this.unitStrategies[unit.id] = 'preventative';
      this.components[unit.id] = this._initUnitComponents(unit);
      this.sensors[unit.id] = { installed: false, coverage: 0 };
    });
  }

  _initUnitComponents(unit) {
    // Each unit has multiple components
    const components = {};

    // All units have basic components
    components.pump = { health: 0.9 + Math.random() * 0.1, runningHours: 0 };
    components.valve = { health: 0.92 + Math.random() * 0.08, runningHours: 0 };
    components.instrument = { health: 0.95 + Math.random() * 0.05, runningHours: 0 };

    // Unit-specific components
    if (unit.id === 'distillation') {
      components.heatExchanger = { health: 0.88, runningHours: 0 };
      components.vessel = { health: 0.95, runningHours: 0 };
    } else if (unit.id === 'reformer') {
      components.compressor = { health: 0.85, runningHours: 0 };
      components.catalyst = { health: 0.9, runningHours: 0 };
      components.heatExchanger = { health: 0.87, runningHours: 0 };
    } else if (unit.id === 'fcc') {
      components.compressor = { health: 0.83, runningHours: 0 };
      components.catalyst = { health: 0.85, runningHours: 0 };
      components.vessel = { health: 0.92, runningHours: 0 };
    } else if (unit.id === 'hydrocracker') {
      components.compressor = { health: 0.84, runningHours: 0 };
      components.catalyst = { health: 0.88, runningHours: 0 };
      components.heatExchanger = { health: 0.86, runningHours: 0 };
      components.vessel = { health: 0.93, runningHours: 0 };
    } else if (unit.id === 'alkylation') {
      components.pump = { health: 0.87, runningHours: 0 };
      components.heatExchanger = { health: 0.89, runningHours: 0 };
      components.vessel = { health: 0.94, runningHours: 0 };
    } else if (unit.id === 'sulfur') {
      components.catalyst = { health: 0.91, runningHours: 0 };
      components.heatExchanger = { health: 0.88, runningHours: 0 };
    }

    return components;
  }

  /**
   * Set maintenance strategy for a unit
   */
  setStrategy(unitId, strategyId) {
    if (!MAINTENANCE_STRATEGIES[strategyId]) return false;
    this.unitStrategies[unitId] = strategyId;
    return true;
  }

  /**
   * Install predictive sensors on a unit
   */
  installSensors(unitId, coverage = 1.0) {
    const cost = MAINTENANCE_STRATEGIES.predictive.sensorCost * coverage;
    this.sensors[unitId] = { installed: true, coverage };
    this.stats.totalMaintenanceCost += cost;

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info', `Predictive maintenance sensors installed on ${unitId}`);
    }

    return { success: true, cost };
  }

  /**
   * Schedule a turnaround
   */
  scheduleTurnaround(unitId, turnaroundType, startTime = null) {
    const type = TURNAROUND_TYPES[turnaroundType];
    if (!type) return { success: false, error: 'Invalid turnaround type' };

    const currentTime = this.simulation?.timeMinutes || 0;
    const scheduledStart = startTime || currentTime + 24 * 60; // Default: 24 hours from now

    const turnaround = {
      id: `ta_${Date.now()}_${unitId}`,
      unitId,
      type: turnaroundType,
      typeData: type,
      scheduledStart,
      scheduledEnd: scheduledStart + type.duration * 60,
      actualStart: null,
      actualEnd: null,
      status: 'scheduled', // scheduled, in_progress, completed
      cost: type.cost,
      contractors: [],
      scope: [...type.scope]
    };

    this.scheduledMaintenance.push(turnaround);

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info',
        `${type.name} scheduled for ${unitId} in ${Math.round((scheduledStart - currentTime) / 60)} hours`
      );
    }

    return { success: true, turnaround };
  }

  /**
   * Create a work order for component repair
   */
  createWorkOrder(unitId, componentId, priority = 'normal') {
    const component = this.components[unitId]?.[componentId];
    const componentType = COMPONENT_TYPES[componentId];

    if (!component || !componentType) {
      return { success: false, error: 'Invalid unit or component' };
    }

    const workOrder = {
      id: `wo_${Date.now()}`,
      unitId,
      componentId,
      componentType: componentType.name,
      priority, // emergency, high, normal, low
      createdAt: this.simulation?.timeMinutes || 0,
      estimatedTime: componentType.repairTime * 60, // Convert to minutes
      estimatedCost: componentType.repairCost,
      status: 'pending', // pending, assigned, in_progress, completed
      assignedCrew: null
    };

    this.workOrders.push(workOrder);

    if (this.simulation?.pushLog) {
      this.simulation.pushLog(
        priority === 'emergency' ? 'warning' : 'info',
        `Work order created for ${componentType.name} on ${unitId}`
      );
    }

    return { success: true, workOrder };
  }

  /**
   * Main update loop
   */
  update(deltaMinutes, context) {
    const hours = deltaMinutes / 60;

    // Update component wear
    this._updateComponentWear(hours, context);

    // Process scheduled maintenance
    this._processScheduledMaintenance();

    // Process active turnarounds
    this._processActiveTurnarounds(deltaMinutes);

    // Process work orders
    this._processWorkOrders(deltaMinutes);

    // Predictive maintenance checks
    if (Math.random() < 0.01 * deltaMinutes) { // Periodic check
      this._runPredictiveAnalysis();
    }

    return {
      unitHealth: this._getUnitHealth(),
      scheduledMaintenance: this.scheduledMaintenance.map(m => ({ ...m })),
      activeTurnarounds: this.activeTurnarounds.map(t => ({ ...t })),
      workOrders: this.workOrders.filter(w => w.status !== 'completed').map(w => ({ ...w })),
      stats: { ...this.stats }
    };
  }

  _updateComponentWear(hours, _context) {
    Object.entries(this.components).forEach(([unitId, components]) => {
      const strategy = MAINTENANCE_STRATEGIES[this.unitStrategies[unitId]] ||
                       MAINTENANCE_STRATEGIES.preventative;
      const unit = this.simulation?.unitMap?.[unitId];
      const isRunning = unit && unit.status === 'online';

      if (!isRunning) return; // No wear when offline

      const utilization = unit?.utilization || 0.5;

      Object.entries(components).forEach(([compId, comp]) => {
        const compType = COMPONENT_TYPES[compId];
        if (!compType) return;

        comp.runningHours += hours;

        // Calculate wear based on strategy and utilization
        const baseWearRate = 1 / compType.mtbf; // Per hour
        const wearMultiplier = strategy.wearRate * (0.7 + utilization * 0.6);
        const wear = baseWearRate * hours * wearMultiplier;

        comp.health = Math.max(0, comp.health - wear);

        // Check for failure
        if (comp.health < compType.criticalThreshold) {
          if (strategy.id === 'reactive') {
            // Reactive: let it fail
            if (Math.random() < 0.1 * hours) {
              this._triggerComponentFailure(unitId, compId, comp, compType);
            }
          } else if (strategy.id === 'preventative') {
            // Preventative: auto-create work order
            if (!this._hasActiveWorkOrder(unitId, compId)) {
              this.createWorkOrder(unitId, compId, 'high');
            }
          }
          // Predictive strategy handles this in _runPredictiveAnalysis
        }
      });
    });
  }

  _triggerComponentFailure(unitId, componentId, _component, componentType) {
    const unit = this.simulation?.unitMap?.[unitId];
    if (!unit) return;

    // Unit goes offline
    unit.status = 'offline';
    unit.downtime = componentType.repairTime * 60; // Minutes
    unit.incidents = (unit.incidents || 0) + 1;

    this.stats.unplannedDowntime += componentType.repairTime;

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('warning',
        `${componentType.name} failure on ${unitId}! Unit offline for repairs.`,
        { unitId, componentId }
      );
    }

    // Create emergency work order
    this.createWorkOrder(unitId, componentId, 'emergency');
  }

  _hasActiveWorkOrder(unitId, componentId) {
    return this.workOrders.some(wo =>
      wo.unitId === unitId &&
      wo.componentId === componentId &&
      wo.status !== 'completed'
    );
  }

  _processScheduledMaintenance() {
    const currentTime = this.simulation?.timeMinutes || 0;

    this.scheduledMaintenance = this.scheduledMaintenance.filter(maint => {
      if (maint.status === 'completed') return false;

      if (maint.status === 'scheduled' && currentTime >= maint.scheduledStart) {
        // Start the turnaround
        maint.status = 'in_progress';
        maint.actualStart = currentTime;

        // Move to active turnarounds
        this.activeTurnarounds.push(maint);

        // Take unit offline
        const unit = this.simulation?.unitMap?.[maint.unitId];
        if (unit) {
          unit.status = 'offline';
          unit.downtime = maint.typeData.duration * 60;
        }

        if (this.simulation?.pushLog) {
          this.simulation.pushLog('info', `${maint.typeData.name} started on ${maint.unitId}`);
        }

        return false; // Remove from scheduled
      }

      return true;
    });
  }

  _processActiveTurnarounds(_deltaMinutes) {
    const currentTime = this.simulation?.timeMinutes || 0;

    this.activeTurnarounds = this.activeTurnarounds.filter(ta => {
      if (currentTime >= ta.scheduledEnd) {
        // Turnaround complete
        ta.status = 'completed';
        ta.actualEnd = currentTime;

        // Restore unit health
        const components = this.components[ta.unitId];
        if (components) {
          Object.values(components).forEach(comp => {
            comp.health = Math.min(1, comp.health + ta.typeData.integrityRestored);
            comp.runningHours = 0; // Reset running hours
          });
        }

        // Unit comes back online
        const unit = this.simulation?.unitMap?.[ta.unitId];
        if (unit) {
          unit.status = 'online';
          unit.downtime = 0;
          unit.integrity = Math.min(1, unit.integrity + ta.typeData.integrityRestored);
        }

        this.stats.turnaroundsCompleted++;
        this.stats.totalMaintenanceCost += ta.cost;
        this.stats.plannedDowntime += ta.typeData.duration;

        if (this.simulation?.pushLog) {
          this.simulation.pushLog('info', `${ta.typeData.name} completed on ${ta.unitId}`);
        }
        if (this.simulation?.eventBus) {
          this.simulation.eventBus.emit('TURNAROUND_COMPLETED', {
            unitId: ta.unitId,
            type: ta.type,
            duration: ta.typeData.duration,
            cost: ta.cost
          });
        }

        return false;
      }

      return true;
    });
  }

  _processWorkOrders(_deltaMinutes) {
    const currentTime = this.simulation?.timeMinutes || 0;

    this.workOrders.forEach(wo => {
      if (wo.status === 'pending') {
        // Auto-assign based on priority
        const delay = wo.priority === 'emergency' ? 5 :
                     wo.priority === 'high' ? 30 :
                     wo.priority === 'normal' ? 120 : 480;

        if (currentTime - wo.createdAt > delay) {
          wo.status = 'in_progress';
          wo.startedAt = currentTime;
        }
      }

      if (wo.status === 'in_progress') {
        if (currentTime - wo.startedAt >= wo.estimatedTime) {
          wo.status = 'completed';
          wo.completedAt = currentTime;

          // Restore component health
          const component = this.components[wo.unitId]?.[wo.componentId];
          if (component) {
            component.health = Math.min(1, component.health + 0.5);
          }

          this.stats.workOrdersCompleted++;
          this.stats.totalMaintenanceCost += wo.estimatedCost;

          if (this.simulation?.pushLog) {
            this.simulation.pushLog('info', `Work order completed: ${wo.componentType} on ${wo.unitId}`);
          }
        }
      }
    });
  }

  _runPredictiveAnalysis() {
    Object.entries(this.sensors).forEach(([unitId, sensor]) => {
      if (!sensor.installed) return;

      const components = this.components[unitId];
      if (!components) return;

      Object.entries(components).forEach(([compId, comp]) => {
        const compType = COMPONENT_TYPES[compId];
        if (!compType) return;

        // Predict remaining useful life
        const wearRate = 1 / compType.mtbf;
        const remainingLife = (comp.health - compType.criticalThreshold) / wearRate;

        // If failure predicted within 100 hours and coverage includes this component
        if (remainingLife < 100 && Math.random() < sensor.coverage) {
          if (!this._hasActiveWorkOrder(unitId, compId)) {
            // Schedule preventive repair
            this.createWorkOrder(unitId, compId, 'normal');
            this.stats.failuresPrevented++;

            if (this.simulation?.pushLog) {
              this.simulation.pushLog('info',
                `Predictive alert: ${compType.name} on ${unitId} needs attention (${Math.round(remainingLife)}h remaining)`
              );
            }
          }
        }
      });
    });
  }

  _getUnitHealth() {
    const health = {};

    Object.entries(this.components).forEach(([unitId, components]) => {
      const compHealths = Object.values(components).map(c => c.health);
      const avgHealth = compHealths.reduce((s, h) => s + h, 0) / compHealths.length;
      const minHealth = Math.min(...compHealths);
      const strategy = this.unitStrategies[unitId];

      health[unitId] = {
        averageHealth: avgHealth,
        minimumHealth: minHealth,
        strategy,
        sensorInstalled: this.sensors[unitId]?.installed || false,
        componentCount: Object.keys(components).length,
        components: Object.entries(components).map(([id, c]) => ({
          id,
          name: COMPONENT_TYPES[id]?.name || id,
          health: c.health,
          runningHours: c.runningHours,
          critical: c.health < (COMPONENT_TYPES[id]?.criticalThreshold || 0.2)
        }))
      };
    });

    return health;
  }

  /**
   * Get overall maintenance cost rate
   */
  getMaintenanceCostRate() {
    let totalCost = 0;

    Object.entries(this.unitStrategies).forEach(([_unitId, strategyId]) => {
      const strategy = MAINTENANCE_STRATEGIES[strategyId];
      const baseCost = 5000; // Base monthly cost per unit
      totalCost += baseCost * strategy.costMultiplier / 720; // Per hour
    });

    return totalCost;
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      unitStrategies: { ...this.unitStrategies },
      components: JSON.parse(JSON.stringify(this.components)),
      sensors: JSON.parse(JSON.stringify(this.sensors)),
      scheduledMaintenance: JSON.parse(JSON.stringify(this.scheduledMaintenance)),
      workOrders: this.workOrders.filter(w => w.status !== 'completed'),
      stats: { ...this.stats }
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.unitStrategies) {
      this.unitStrategies = { ...state.unitStrategies };
    }
    if (state.components) {
      this.components = JSON.parse(JSON.stringify(state.components));
    }
    if (state.sensors) {
      this.sensors = JSON.parse(JSON.stringify(state.sensors));
    }
    if (state.scheduledMaintenance) {
      this.scheduledMaintenance = JSON.parse(JSON.stringify(state.scheduledMaintenance));
    }
    if (state.workOrders) {
      this.workOrders = JSON.parse(JSON.stringify(state.workOrders));
    }
    if (state.stats) {
      Object.assign(this.stats, state.stats);
    }
  }

  reset() {
    this._initializeUnits();
    this.scheduledMaintenance = [];
    this.activeTurnarounds = [];
    this.workOrders = [];
    // Keep stats for cumulative tracking
  }
}

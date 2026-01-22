/**
 * Disaster System
 * Manages disasters: overpressure, runaway reactions, fires, spills,
 * emergency response, and evacuation mechanics.
 */

import { clamp } from "../simulation/utils/calculations.js";

export const DISASTER_TYPES = {
  overpressure: {
    id: 'overpressure',
    name: 'Overpressure Event',
    severity: 'danger',
    spreadRate: 0,
    damagePerMinute: 5,
    cleanupCost: 150000,
    causes: ['blocked_pipe', 'pump_running', 'valve_closed'],
    effects: ['equipment_damage', 'possible_rupture', 'product_loss']
  },
  runaway: {
    id: 'runaway',
    name: 'Thermal Runaway',
    severity: 'critical',
    spreadRate: 0.02,
    damagePerMinute: 15,
    cleanupCost: 500000,
    causes: ['temperature_loss', 'catalyst_failure', 'cooling_failure'],
    effects: ['explosion_risk', 'fire_risk', 'toxic_release']
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    severity: 'critical',
    spreadRate: 0.05, // tiles per minute
    damagePerMinute: 20,
    cleanupCost: 300000,
    causes: ['ignition_source', 'hot_work', 'electrical', 'lightning'],
    effects: ['equipment_damage', 'spread_to_adjacent', 'evacuation']
  },
  spill: {
    id: 'spill',
    name: 'Product Spill',
    severity: 'warning',
    spreadRate: 0.01,
    damagePerMinute: 2,
    cleanupCost: 80000,
    causes: ['tank_overflow', 'pipe_leak', 'valve_failure', 'corrosion'],
    effects: ['ground_contamination', 'water_contamination', 'epa_fine']
  },
  gasLeak: {
    id: 'gasLeak',
    name: 'Gas Leak',
    severity: 'danger',
    spreadRate: 0.08,
    damagePerMinute: 3,
    cleanupCost: 50000,
    causes: ['seal_failure', 'flange_leak', 'relief_valve'],
    effects: ['vapor_cloud', 'ignition_risk', 'evacuation_zone']
  },
  explosion: {
    id: 'explosion',
    name: 'Explosion',
    severity: 'critical',
    spreadRate: 0,
    damagePerMinute: 100,
    cleanupCost: 2000000,
    causes: ['runaway_reaction', 'vapor_ignition', 'pressure_vessel_failure'],
    effects: ['severe_damage', 'casualties', 'full_evacuation', 'regulatory_action']
  }
};

export const EMERGENCY_TEAMS = {
  fireBrigade: {
    id: 'fireBrigade',
    name: 'Fire Brigade',
    responseTime: 5, // minutes
    effectiveness: 0.15, // fire suppression per minute
    cost: 5000, // per deployment
    handles: ['fire', 'explosion']
  },
  hazmat: {
    id: 'hazmat',
    name: 'HAZMAT Team',
    responseTime: 10,
    effectiveness: 0.12,
    cost: 8000,
    handles: ['spill', 'gasLeak', 'runaway']
  },
  medical: {
    id: 'medical',
    name: 'Medical Response',
    responseTime: 3,
    effectiveness: 0,
    cost: 3000,
    handles: ['all']
  },
  maintenance: {
    id: 'maintenance',
    name: 'Emergency Maintenance',
    responseTime: 8,
    effectiveness: 0.1,
    cost: 4000,
    handles: ['overpressure', 'gasLeak']
  }
};

export class DisasterSystem {
  constructor(simulation) {
    this.simulation = simulation;

    // Active disasters
    this.activeDisasters = [];

    // Deployed teams
    this.deployedTeams = [];

    // Evacuation state
    this.evacuation = {
      active: false,
      level: 0, // 0=none, 1=area, 2=unit, 3=full plant
      startTime: null,
      affectedAreas: [],
      personnelEvacuated: 0
    };

    // Fire spread grid (simplified)
    this.fireGrid = new Map(); // tile coordinates -> fire intensity

    // Spill contamination
    this.contamination = {
      groundSpills: [],
      waterContamination: 0,
      airQuality: 1.0 // 1 = clean, 0 = hazardous
    };

    // Stats
    this.stats = {
      totalIncidents: 0,
      firesContained: 0,
      spillsCleaned: 0,
      evacuations: 0,
      totalDamage: 0,
      finesPaid: 0,
      injuriesReported: 0
    };

    // Pressure monitoring
    this.pressurePoints = new Map();
  }

  /**
   * Check for overpressure conditions
   */
  checkOverpressure(unitId, conditions) {
    const { flowBlocked, pumpRunning } = conditions;

    if (flowBlocked && pumpRunning) {
      // Potential overpressure building
      const pressurePoint = this.pressurePoints.get(unitId) || { pressure: 100, maxPressure: 150 };
      pressurePoint.pressure += 5; // PSI per check

      if (pressurePoint.pressure > pressurePoint.maxPressure) {
        // Trigger overpressure event
        this.triggerDisaster('overpressure', {
          unitId,
          cause: 'blocked_pipe_with_pump_running',
          pressure: pressurePoint.pressure
        });
        pressurePoint.pressure = 100; // Reset after event
      }

      this.pressurePoints.set(unitId, pressurePoint);
      return { risk: pressurePoint.pressure / pressurePoint.maxPressure, pressure: pressurePoint.pressure };
    }

    // Relieve pressure if conditions clear
    if (this.pressurePoints.has(unitId)) {
      const point = this.pressurePoints.get(unitId);
      point.pressure = Math.max(100, point.pressure - 10);
      this.pressurePoints.set(unitId, point);
    }

    return { risk: 0, pressure: 100 };
  }

  /**
   * Check for runaway reaction conditions (Hydrotreater)
   */
  checkRunawayReaction(unitId, conditions) {
    const { temperature, temperatureTarget, coolingActive, catalystHealth } = conditions;

    if (!coolingActive && temperature > temperatureTarget + 50) {
      // Temperature excursion
      const severity = (temperature - temperatureTarget) / 100;

      if (severity > 0.8 || (catalystHealth < 0.3 && severity > 0.5)) {
        this.triggerDisaster('runaway', {
          unitId,
          cause: 'temperature_excursion',
          temperature,
          catalystHealth
        });
        return { risk: 1, temperature };
      }

      return { risk: severity, temperature };
    }

    return { risk: 0, temperature };
  }

  /**
   * Trigger a disaster event
   */
  triggerDisaster(typeId, context = {}) {
    const type = DISASTER_TYPES[typeId];
    if (!type) return null;

    const disaster = {
      id: `disaster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: typeId,
      typeData: type,
      unitId: context.unitId || null,
      tileX: context.tileX ?? Math.floor(Math.random() * 20),
      tileY: context.tileY ?? Math.floor(Math.random() * 20),
      intensity: context.intensity || 1.0,
      startTime: this.simulation?.timeMinutes || 0,
      damage: 0,
      contained: false,
      extinguished: false,
      cause: context.cause || 'unknown',
      affectedTiles: [],
      teamsResponding: []
    };

    this.activeDisasters.push(disaster);
    this.stats.totalIncidents++;

    // Log the event
    if (this.simulation?.pushLog) {
      this.simulation.pushLog(
        type.severity === 'critical' ? 'danger' : 'warning',
        `${type.name} detected at ${context.unitId || 'facility'}! ${context.cause || ''}`,
        { disasterId: disaster.id, unitId: context.unitId }
      );
    }

    // Emit event
    if (this.simulation?.eventBus) {
      this.simulation.eventBus.emit('DISASTER_TRIGGERED', {
        disaster: this._getDisasterStatus(disaster),
        unitId: context.unitId
      });
    }

    // Check if evacuation needed
    if (type.severity === 'critical') {
      this.initiateEvacuation(disaster.unitId ? 2 : 3);
    }

    return disaster;
  }

  /**
   * Deploy emergency response team
   */
  deployTeam(teamId, disasterId) {
    const team = EMERGENCY_TEAMS[teamId];
    const disaster = this.activeDisasters.find(d => d.id === disasterId);

    if (!team || !disaster) return { success: false, error: 'Invalid team or disaster' };

    // Check if team can handle this disaster type
    if (!team.handles.includes('all') && !team.handles.includes(disaster.type)) {
      return { success: false, error: 'Team cannot handle this disaster type' };
    }

    const deployment = {
      id: `deploy_${Date.now()}`,
      teamId,
      team,
      disasterId,
      deployTime: this.simulation?.timeMinutes || 0,
      arrivalTime: (this.simulation?.timeMinutes || 0) + team.responseTime,
      status: 'responding', // responding, active, completed
      effectiveness: 0
    };

    this.deployedTeams.push(deployment);
    disaster.teamsResponding.push(teamId);

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info', `${team.name} dispatched to ${disaster.typeData.name}`, {
        teamId, disasterId
      });
    }

    return { success: true, deployment };
  }

  /**
   * Initiate evacuation
   */
  initiateEvacuation(level = 1) {
    if (this.evacuation.active && this.evacuation.level >= level) {
      return; // Already evacuating at same or higher level
    }

    this.evacuation.active = true;
    this.evacuation.level = level;
    this.evacuation.startTime = this.simulation?.timeMinutes || 0;
    this.stats.evacuations++;

    const levelNames = ['None', 'Area', 'Unit', 'Full Plant'];
    if (this.simulation?.pushLog) {
      this.simulation.pushLog('danger',
        `${levelNames[level]} EVACUATION initiated! All personnel must evacuate immediately.`
      );
    }
    if (this.simulation?.eventBus) {
      this.simulation.eventBus.emit('EVACUATION_STARTED', { level, levelName: levelNames[level] });
    }
  }

  /**
   * End evacuation
   */
  endEvacuation() {
    if (!this.evacuation.active) return;

    const previousLevel = this.evacuation.level;
    this.evacuation.active = false;
    this.evacuation.level = 0;
    this.evacuation.affectedAreas = [];

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info', 'Evacuation ended. Personnel may return to designated areas.');
    }
    if (this.simulation?.eventBus) {
      this.simulation.eventBus.emit('EVACUATION_ENDED', { previousLevel });
    }
  }

  /**
   * Main update loop
   */
  update(deltaMinutes, _context) {
    const hours = deltaMinutes / 60;

    // Update active disasters
    this._updateDisasters(deltaMinutes);

    // Update deployed teams
    this._updateTeams(deltaMinutes);

    // Update fire spread
    this._updateFireSpread(deltaMinutes);

    // Update contamination
    this._updateContamination(deltaMinutes);

    // Check evacuation status
    this._updateEvacuation(deltaMinutes);

    // Calculate penalties
    const penalties = this._calculatePenalties(hours);

    return {
      activeDisasters: this.activeDisasters.map(d => this._getDisasterStatus(d)),
      deployedTeams: this.deployedTeams.map(t => ({ ...t })),
      evacuation: { ...this.evacuation },
      contamination: { ...this.contamination },
      penalties,
      stats: { ...this.stats }
    };
  }

  _updateDisasters(deltaMinutes) {
    this.activeDisasters = this.activeDisasters.filter(disaster => {
      if (disaster.extinguished) {
        return false;
      }

      // Apply damage
      disaster.damage += disaster.typeData.damagePerMinute * deltaMinutes * disaster.intensity;
      this.stats.totalDamage += disaster.typeData.damagePerMinute * deltaMinutes * disaster.intensity;

      // Spread if applicable
      if (disaster.typeData.spreadRate > 0 && !disaster.contained) {
        disaster.intensity = Math.min(5, disaster.intensity + disaster.typeData.spreadRate * deltaMinutes);
      }

      // Check for escalation
      if (disaster.type === 'runaway' && disaster.intensity > 3 && Math.random() < 0.01 * deltaMinutes) {
        this.triggerDisaster('explosion', {
          unitId: disaster.unitId,
          tileX: disaster.tileX,
          tileY: disaster.tileY,
          cause: 'runaway_escalation'
        });
        disaster.extinguished = true;
        return false;
      }

      // Natural decay for small incidents
      if (disaster.contained && disaster.intensity < 0.5) {
        disaster.intensity -= 0.02 * deltaMinutes;
        if (disaster.intensity <= 0) {
          disaster.extinguished = true;
          if (this.simulation?.pushLog) {
            this.simulation.pushLog('info', `${disaster.typeData.name} fully resolved.`);
          }
          return false;
        }
      }

      return true;
    });
  }

  _updateTeams(deltaMinutes) {
    const currentTime = this.simulation?.timeMinutes || 0;

    this.deployedTeams = this.deployedTeams.filter(deployment => {
      if (deployment.status === 'completed') {
        return false;
      }

      // Check if team has arrived
      if (deployment.status === 'responding' && currentTime >= deployment.arrivalTime) {
        deployment.status = 'active';
        if (this.simulation?.pushLog) {
          this.simulation.pushLog('info', `${deployment.team.name} on scene and responding.`);
        }
      }

      // Active teams fight disaster
      if (deployment.status === 'active') {
        const disaster = this.activeDisasters.find(d => d.id === deployment.disasterId);

        if (!disaster || disaster.extinguished) {
          deployment.status = 'completed';
          return false;
        }

        // Apply team effectiveness
        disaster.intensity -= deployment.team.effectiveness * deltaMinutes;

        if (disaster.intensity <= 0.3 && !disaster.contained) {
          disaster.contained = true;
          if (this.simulation?.pushLog) {
            this.simulation.pushLog('info', `${disaster.typeData.name} contained by ${deployment.team.name}.`);
          }
          if (this.simulation?.eventBus) {
            this.simulation.eventBus.emit('DISASTER_CONTAINED', {
              disasterId: disaster.id,
              type: disaster.type,
              teamId: deployment.teamId
            });
          }
        }

        if (disaster.intensity <= 0) {
          disaster.extinguished = true;
          deployment.status = 'completed';

          // Update stats
          if (disaster.type === 'fire') {
            this.stats.firesContained++;
          } else if (disaster.type === 'spill') {
            this.stats.spillsCleaned++;
          }

          if (this.simulation?.pushLog) {
            this.simulation.pushLog('info', `${disaster.typeData.name} extinguished by ${deployment.team.name}.`);
          }
        }

        deployment.effectiveness += deployment.team.effectiveness * deltaMinutes;
      }

      return true;
    });
  }

  _updateFireSpread(deltaMinutes) {
    const fires = this.activeDisasters.filter(d => d.type === 'fire' && !d.contained);

    fires.forEach(fire => {
      if (fire.intensity > 1 && Math.random() < 0.02 * deltaMinutes * fire.intensity) {
        // Spread to adjacent tile
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        const newX = fire.tileX + dx;
        const newY = fire.tileY + dy;

        const key = `${newX},${newY}`;
        if (!this.fireGrid.has(key)) {
          this.fireGrid.set(key, 0.5);
          fire.affectedTiles.push({ x: newX, y: newY });
        } else {
          this.fireGrid.set(key, Math.min(5, this.fireGrid.get(key) + 0.3));
        }
      }
    });
  }

  _updateContamination(deltaMinutes) {
    const spills = this.activeDisasters.filter(d => d.type === 'spill' && !d.extinguished);

    spills.forEach(spill => {
      // Ground contamination spreads
      this.contamination.groundSpills.push({
        x: spill.tileX + (Math.random() - 0.5) * 0.5,
        y: spill.tileY + (Math.random() - 0.5) * 0.5,
        volume: spill.intensity * deltaMinutes
      });

      // Some may reach water
      if (Math.random() < 0.01 * deltaMinutes) {
        this.contamination.waterContamination += spill.intensity * 0.1;
      }
    });

    // Air quality from gas leaks
    const gasLeaks = this.activeDisasters.filter(d => d.type === 'gasLeak' && !d.extinguished);
    gasLeaks.forEach(leak => {
      this.contamination.airQuality -= leak.intensity * 0.01 * deltaMinutes;
    });

    // Natural recovery
    this.contamination.airQuality = Math.min(1, this.contamination.airQuality + 0.005 * deltaMinutes);
    this.contamination.waterContamination = Math.max(0, this.contamination.waterContamination - 0.001 * deltaMinutes);
  }

  _updateEvacuation(_deltaMinutes) {
    if (!this.evacuation.active) return;

    // Check if all disasters resolved
    const criticalDisasters = this.activeDisasters.filter(d =>
      d.typeData.severity === 'critical' && !d.extinguished
    );

    if (criticalDisasters.length === 0) {
      // Can end evacuation after safety period
      const evacuationDuration = (this.simulation?.timeMinutes || 0) - this.evacuation.startTime;
      if (evacuationDuration > 30) { // 30 minute minimum
        this.endEvacuation();
      }
    }
  }

  _calculatePenalties(hours) {
    let penalty = 0;

    // Active disaster penalties
    this.activeDisasters.forEach(disaster => {
      penalty += disaster.typeData.damagePerMinute * disaster.intensity * hours * 60;
    });

    // Contamination fines
    if (this.contamination.waterContamination > 0.1) {
      const fine = this.contamination.waterContamination * 10000 * hours;
      penalty += fine;
      this.stats.finesPaid += fine;
    }

    // Evacuation costs (lost production)
    if (this.evacuation.active) {
      penalty += this.evacuation.level * 5000 * hours;
    }

    return penalty;
  }

  _getDisasterStatus(disaster) {
    return {
      id: disaster.id,
      type: disaster.type,
      name: disaster.typeData.name,
      severity: disaster.typeData.severity,
      unitId: disaster.unitId,
      tileX: disaster.tileX,
      tileY: disaster.tileY,
      intensity: disaster.intensity,
      damage: disaster.damage,
      contained: disaster.contained,
      teamsResponding: disaster.teamsResponding.length,
      cause: disaster.cause
    };
  }

  /**
   * Get current danger level (0-1)
   */
  getDangerLevel() {
    if (this.activeDisasters.length === 0) return 0;

    let maxDanger = 0;
    this.activeDisasters.forEach(d => {
      const severityWeight = d.typeData.severity === 'critical' ? 1 :
                            d.typeData.severity === 'danger' ? 0.7 : 0.4;
      const danger = severityWeight * clamp(d.intensity / 3, 0, 1);
      maxDanger = Math.max(maxDanger, danger);
    });

    return clamp(maxDanger, 0, 1);
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      activeDisasters: structuredClone(this.activeDisasters),
      deployedTeams: structuredClone(this.deployedTeams),
      evacuation: { ...this.evacuation },
      contamination: { ...this.contamination },
      stats: { ...this.stats }
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.activeDisasters) {
      this.activeDisasters = structuredClone(state.activeDisasters);
    }
    if (state.deployedTeams) {
      this.deployedTeams = structuredClone(state.deployedTeams);
    }
    if (state.evacuation) {
      this.evacuation = { ...this.evacuation, ...state.evacuation };
    }
    if (state.contamination) {
      this.contamination = { ...this.contamination, ...state.contamination };
    }
    if (state.stats) {
      Object.assign(this.stats, state.stats);
    }
  }

  reset() {
    this.activeDisasters = [];
    this.deployedTeams = [];
    this.evacuation = {
      active: false,
      level: 0,
      startTime: null,
      affectedAreas: [],
      personnelEvacuated: 0
    };
    this.fireGrid.clear();
    this.contamination = {
      groundSpills: [],
      waterContamination: 0,
      airQuality: 1.0
    };
    this.pressurePoints.clear();
    // Don't reset stats - they're cumulative
  }
}

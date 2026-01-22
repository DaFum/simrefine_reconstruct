/**
 * Staffing System (HR)
 * Manages personnel across departments: Operations, Maintenance, Lab, Safety
 * Affects reaction time, operator error rates, and overall plant performance
 */

import { clamp } from "../simulation/utils/calculations.js";

export const DEPARTMENTS = {
  operations: {
    id: 'operations',
    name: 'Operations',
    description: 'Control room operators and field technicians',
    baseSalary: 85000,
    minStaff: 12,
    maxStaff: 50,
    optimalRatio: 1.0, // Staff per unit
    effects: {
      reactionTime: -0.15,    // Faster response per staffing level
      operatorError: -0.12,   // Fewer mistakes
      throughputBonus: 0.03   // Higher throughput capability
    }
  },
  maintenance: {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Mechanics, welders, and instrument technicians',
    baseSalary: 78000,
    minStaff: 8,
    maxStaff: 40,
    optimalRatio: 0.8,
    effects: {
      repairSpeed: 0.2,       // Faster repairs
      preventiveMaint: 0.15,  // Better preventive maintenance
      equipmentLife: 0.1      // Longer equipment life
    }
  },
  lab: {
    id: 'lab',
    name: 'Laboratory',
    description: 'Chemists and quality control technicians',
    baseSalary: 72000,
    minStaff: 4,
    maxStaff: 20,
    optimalRatio: 0.4,
    effects: {
      qualityControl: 0.18,   // Better product quality
      blendAccuracy: 0.15,    // More accurate blending
      specCompliance: 0.12    // Better specification compliance
    }
  },
  safety: {
    id: 'safety',
    name: 'Safety',
    description: 'Safety officers and emergency response team',
    baseSalary: 80000,
    minStaff: 6,
    maxStaff: 25,
    optimalRatio: 0.5,
    effects: {
      incidentReduction: 0.2,   // Fewer incidents
      emergencyResponse: 0.25,  // Faster emergency response
      complianceBonus: 0.1      // Better regulatory compliance
    }
  }
};

export const TRAINING_PROGRAMS = {
  basic: {
    id: 'basic',
    name: 'Basic Safety & Operations',
    cost: 2000,
    duration: 40, // hours
    errorReduction: 0.05,
    description: 'Foundational safety and operating procedures'
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced Process Control',
    cost: 5000,
    duration: 80,
    errorReduction: 0.10,
    throughputBonus: 0.02,
    description: 'Advanced control techniques and optimization'
  },
  emergency: {
    id: 'emergency',
    name: 'Emergency Response',
    cost: 3500,
    duration: 60,
    emergencyBonus: 0.15,
    description: 'Fire fighting, evacuation, and crisis management'
  },
  leadership: {
    id: 'leadership',
    name: 'Supervisory Leadership',
    cost: 4500,
    duration: 48,
    efficiencyBonus: 0.08,
    description: 'Team leadership and decision making'
  }
};

export class StaffingSystem {
  constructor(simulation) {
    this.simulation = simulation;

    // Department staffing levels
    this.departments = {
      operations: { current: 20, target: 20, morale: 0.75, trained: 0.6 },
      maintenance: { current: 15, target: 15, morale: 0.75, trained: 0.5 },
      lab: { current: 6, target: 6, morale: 0.80, trained: 0.7 },
      safety: { current: 10, target: 10, morale: 0.75, trained: 0.55 }
    };

    // Training state
    this.trainingBudget = 50000; // Annual budget
    this.trainingSpent = 0;
    this.activeTraining = [];
    this.trainingHistory = [];

    // Overtime and fatigue
    this.overtimeHours = 0;
    this.fatigueLevel = 0;

    // Hiring/firing queue
    this.hiringQueue = [];
    this.separationQueue = [];

    // Performance metrics
    this.metrics = {
      totalHeadcount: 0,
      laborCostPerDay: 0,
      overallEfficiency: 1.0,
      operatorErrorRate: 0.02,
      reactionTimeMultiplier: 1.0,
      trainingLevel: 0.6
    };

    this._updateMetrics();
  }

  /**
   * Set staffing target for a department
   */
  setStaffingTarget(departmentId, target) {
    const dept = this.departments[departmentId];
    const config = DEPARTMENTS[departmentId];
    if (!dept || !config) return false;

    dept.target = clamp(target, config.minStaff, config.maxStaff);
    return true;
  }

  /**
   * Hire staff for a department
   */
  hire(departmentId, count = 1) {
    const dept = this.departments[departmentId];
    const config = DEPARTMENTS[departmentId];
    if (!dept || !config) return false;

    const newCount = Math.min(dept.current + count, config.maxStaff);
    const actualHired = newCount - dept.current;

    if (actualHired > 0) {
      // New hires reduce average training level
      const totalTrained = dept.current * dept.trained;
      dept.current = newCount;
      dept.trained = (totalTrained + actualHired * 0.3) / dept.current;
      dept.morale = Math.max(0.5, dept.morale - 0.02 * actualHired); // Minor morale dip from onboarding

      this.hiringQueue.push({
        department: departmentId,
        count: actualHired,
        timestamp: this.simulation?.timeMinutes || 0
      });
    }

    this._updateMetrics();
    return actualHired;
  }

  /**
   * Lay off staff from a department
   */
  layoff(departmentId, count = 1) {
    const dept = this.departments[departmentId];
    const config = DEPARTMENTS[departmentId];
    if (!dept || !config) return false;

    const newCount = Math.max(dept.current - count, config.minStaff);
    const actualLaidOff = dept.current - newCount;

    if (actualLaidOff > 0) {
      dept.current = newCount;
      dept.morale = Math.max(0.3, dept.morale - 0.08 * actualLaidOff); // Significant morale hit

      this.separationQueue.push({
        department: departmentId,
        count: actualLaidOff,
        timestamp: this.simulation?.timeMinutes || 0,
        type: 'layoff'
      });
    }

    this._updateMetrics();
    return actualLaidOff;
  }

  /**
   * Start a training program
   */
  startTraining(programId, departmentId = null) {
    const program = TRAINING_PROGRAMS[programId];
    if (!program) return null;

    if (this.trainingSpent + program.cost > this.trainingBudget) {
      return { error: 'Insufficient training budget' };
    }

    const training = {
      id: `training_${Date.now()}`,
      programId,
      program,
      department: departmentId,
      startTime: this.simulation?.timeMinutes || 0,
      endTime: (this.simulation?.timeMinutes || 0) + program.duration * 60,
      status: 'in_progress'
    };

    this.activeTraining.push(training);
    this.trainingSpent += program.cost;

    return training;
  }

  /**
   * Set annual training budget
   */
  setTrainingBudget(amount) {
    this.trainingBudget = Math.max(0, amount);
  }

  /**
   * Main update loop
   */
  update(deltaMinutes) {
    const hours = deltaMinutes / 60;

    // Update training progress
    this._updateTraining();

    // Adjust staffing toward targets
    this._adjustStaffing(hours);

    // Update morale
    this._updateMorale(hours);

    // Update fatigue
    this._updateFatigue(hours);

    // Calculate effects
    this._updateMetrics();

    return this.getEffects();
  }

  _updateTraining() {
    const currentTime = this.simulation?.timeMinutes || 0;

    this.activeTraining = this.activeTraining.filter(training => {
      if (training.endTime <= currentTime) {
        // Training completed
        training.status = 'completed';
        this.trainingHistory.push(training);

        // Apply training effects
        const program = training.program;
        if (training.department && this.departments[training.department]) {
          const dept = this.departments[training.department];
          dept.trained = Math.min(1, dept.trained + (program.errorReduction || 0) * 2);
        } else {
          // Apply to all departments
          Object.values(this.departments).forEach(dept => {
            dept.trained = Math.min(1, dept.trained + (program.errorReduction || 0));
          });
        }

        // Emit event
        if (this.simulation?.eventBus) {
          this.simulation.eventBus.emit('TRAINING_COMPLETED', {
            programId: training.programId,
            department: training.department,
            programName: program.name
          });
        }

        return false;
      }
      return true;
    });
  }

  _adjustStaffing(hours) {
    // Gradual adjustment toward targets (hiring/attrition)
    Object.entries(this.departments).forEach(([deptId, dept]) => {
      if (dept.current < dept.target) {
        // Hiring takes time
        const hiringRate = 0.02 * hours; // ~2% of gap per hour
        const gap = dept.target - dept.current;
        if (Math.random() < hiringRate && gap > 0) {
          this.hire(deptId, 1);
        }
      } else if (dept.current > dept.target) {
        // Natural attrition plus layoffs
        const attritionRate = 0.01 * hours;
        if (Math.random() < attritionRate) {
          dept.current = Math.max(dept.target, dept.current - 1);
          this._updateMetrics();
        }
      }
    });
  }

  _updateMorale(hours) {
    Object.values(this.departments).forEach(dept => {
      // Morale recovery
      const targetMorale = 0.75 + dept.trained * 0.15;
      const recoveryRate = 0.01 * hours;
      dept.morale += (targetMorale - dept.morale) * recoveryRate;

      // Fatigue reduces morale
      if (this.fatigueLevel > 0.3) {
        dept.morale -= this.fatigueLevel * 0.005 * hours;
      }

      dept.morale = clamp(dept.morale, 0.2, 1);
    });
  }

  _updateFatigue(hours) {
    // Calculate overtime from staffing shortages
    const totalStaff = Object.values(this.departments).reduce((sum, d) => sum + d.current, 0);
    const totalTarget = Object.values(this.departments).reduce((sum, d) => sum + d.target, 0);
    const shortageRatio = totalStaff < totalTarget ? (totalTarget - totalStaff) / totalTarget : 0;

    // Overtime increases fatigue
    if (shortageRatio > 0.1) {
      this.overtimeHours += shortageRatio * hours * 2;
      this.fatigueLevel = clamp(this.fatigueLevel + shortageRatio * 0.02 * hours, 0, 1);
    } else {
      // Recovery
      this.fatigueLevel = Math.max(0, this.fatigueLevel - 0.01 * hours);
      this.overtimeHours = Math.max(0, this.overtimeHours - hours * 0.5);
    }
  }

  _updateMetrics() {
    let totalHeadcount = 0;
    let totalCost = 0;
    let weightedEfficiency = 0;
    let weightedTraining = 0;
    let totalWeight = 0;

    Object.entries(this.departments).forEach(([deptId, dept]) => {
      const config = DEPARTMENTS[deptId];
      totalHeadcount += dept.current;
      totalCost += dept.current * config.baseSalary / 365; // Daily cost

      const staffingRatio = dept.current / (config.optimalRatio * 6); // 6 units
      const efficiency = clamp(staffingRatio * dept.morale * (0.5 + dept.trained * 0.5), 0.3, 1.2);
      weightedEfficiency += efficiency * dept.current;
      weightedTraining += dept.trained * dept.current;
      totalWeight += dept.current;
    });

    this.metrics.totalHeadcount = totalHeadcount;
    this.metrics.laborCostPerDay = totalCost;
    this.metrics.overallEfficiency = totalWeight > 0 ? weightedEfficiency / totalWeight : 1;
    this.metrics.trainingLevel = totalWeight > 0 ? weightedTraining / totalWeight : 0.5;

    // Calculate operator error rate
    const operations = this.departments.operations;
    const baseError = 0.03;
    const trainingReduction = operations.trained * 0.02;
    const moraleReduction = (operations.morale - 0.5) * 0.015;
    const fatigueIncrease = this.fatigueLevel * 0.025;
    this.metrics.operatorErrorRate = clamp(
      baseError - trainingReduction - moraleReduction + fatigueIncrease,
      0.005, 0.08
    );

    // Reaction time multiplier
    const safety = this.departments.safety;
    const staffingBonus = clamp(safety.current / DEPARTMENTS.safety.optimalRatio / 6, 0.5, 1.5);
    this.metrics.reactionTimeMultiplier = clamp(
      1 / (staffingBonus * (0.5 + safety.trained * 0.5) * safety.morale),
      0.5, 2.0
    );
  }

  /**
   * Get staffing effects on plant operations
   */
  getEffects() {
    return {
      efficiency: this.metrics.overallEfficiency,
      operatorErrorRate: this.metrics.operatorErrorRate,
      reactionTimeMultiplier: this.metrics.reactionTimeMultiplier,
      trainingLevel: this.metrics.trainingLevel,
      laborCost: this.metrics.laborCostPerDay,
      maintenanceBonus: this._getDepartmentEffect('maintenance', 'repairSpeed'),
      safetyBonus: this._getDepartmentEffect('safety', 'incidentReduction'),
      qualityBonus: this._getDepartmentEffect('lab', 'qualityControl'),
      morale: this._getAverageMorale(),
      fatigue: this.fatigueLevel
    };
  }

  _getDepartmentEffect(deptId, effectKey) {
    const dept = this.departments[deptId];
    const config = DEPARTMENTS[deptId];
    if (!dept || !config || !config.effects[effectKey]) return 0;

    const staffingRatio = clamp(dept.current / (config.optimalRatio * 6), 0.5, 1.5);
    return config.effects[effectKey] * staffingRatio * dept.trained * dept.morale;
  }

  _getAverageMorale() {
    const depts = Object.values(this.departments);
    return depts.reduce((sum, d) => sum + d.morale, 0) / depts.length;
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      departments: structuredClone(this.departments),
      trainingBudget: this.trainingBudget,
      trainingSpent: this.trainingSpent,
      activeTraining: structuredClone(this.activeTraining),
      overtimeHours: this.overtimeHours,
      fatigueLevel: this.fatigueLevel,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.departments) {
      this.departments = structuredClone(state.departments);
    }
    if (typeof state.trainingBudget === 'number') {
      this.trainingBudget = state.trainingBudget;
    }
    if (typeof state.trainingSpent === 'number') {
      this.trainingSpent = state.trainingSpent;
    }
    if (state.activeTraining) {
      this.activeTraining = structuredClone(state.activeTraining);
    }
    if (typeof state.overtimeHours === 'number') {
      this.overtimeHours = state.overtimeHours;
    }
    if (typeof state.fatigueLevel === 'number') {
      this.fatigueLevel = state.fatigueLevel;
    }
    if (state.metrics) {
      Object.assign(this.metrics, state.metrics);
    }
    this._updateMetrics();
  }

  /**
   * Get full status for UI
   */
  getStatus() {
    return {
      departments: Object.entries(this.departments).map(([id, dept]) => ({
        id,
        name: DEPARTMENTS[id].name,
        current: dept.current,
        target: dept.target,
        min: DEPARTMENTS[id].minStaff,
        max: DEPARTMENTS[id].maxStaff,
        morale: dept.morale,
        trained: dept.trained,
        costPerDay: dept.current * DEPARTMENTS[id].baseSalary / 365
      })),
      training: {
        budget: this.trainingBudget,
        spent: this.trainingSpent,
        remaining: this.trainingBudget - this.trainingSpent,
        active: this.activeTraining.length
      },
      metrics: { ...this.metrics },
      fatigue: this.fatigueLevel,
      overtime: this.overtimeHours
    };
  }

  reset() {
    this.departments = {
      operations: { current: 20, target: 20, morale: 0.75, trained: 0.6 },
      maintenance: { current: 15, target: 15, morale: 0.75, trained: 0.5 },
      lab: { current: 6, target: 6, morale: 0.80, trained: 0.7 },
      safety: { current: 10, target: 10, morale: 0.75, trained: 0.55 }
    };
    this.trainingBudget = 50000;
    this.trainingSpent = 0;
    this.activeTraining = [];
    this.trainingHistory = [];
    this.overtimeHours = 0;
    this.fatigueLevel = 0;
    this.hiringQueue = [];
    this.separationQueue = [];
    this._updateMetrics();
  }
}

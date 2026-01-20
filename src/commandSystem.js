export class CommandSystem {
  constructor(simulation, eventBus) {
    this.simulation = simulation;
    this.eventBus = eventBus;

    this.handlers = {
      'INSPECT_UNIT': this._handleInspectUnit.bind(this),
      'DEPLOY_BYPASS': this._handleDeployBypass.bind(this),
      'SCHEDULE_MAINTENANCE': this._handleScheduleMaintenance.bind(this),
      'DISPATCH_CONVOY': () => this._handleDispatchConvoy(),
      'SET_PARAM': this._handleSetParam.bind(this),
      'SET_THROTTLE': this._handleSetThrottle.bind(this),
      'TOGGLE_UNIT_OFFLINE': this._handleToggleUnitOffline.bind(this),
      'CLEAR_OVERRIDE': this._handleClearOverride.bind(this),
      'APPLY_SCENARIO': this._handleApplyScenario.bind(this),
      // Supply Chain commands
      'CREATE_CONTRACT': this._handleCreateContract.bind(this),
      'SCHEDULE_DELIVERY': this._handleScheduleDelivery.bind(this),
      // Staffing commands
      'SET_STAFFING_TARGET': this._handleSetStaffingTarget.bind(this),
      'START_TRAINING': this._handleStartTraining.bind(this),
      // Blending commands
      'BLEND_GASOLINE': this._handleBlendGasoline.bind(this),
      // Maintenance commands
      'SET_MAINTENANCE_STRATEGY': this._handleSetMaintenanceStrategy.bind(this),
      // Disaster commands
      'DEPLOY_EMERGENCY_TEAM': this._handleDeployEmergencyTeam.bind(this),
      'INITIATE_EVACUATION': this._handleInitiateEvacuation.bind(this),
      // Time Machine commands
      'START_RECORDING': this._handleStartRecording.bind(this),
      'STOP_RECORDING': this._handleStopRecording.bind(this),
      'START_PLAYBACK': this._handleStartPlayback.bind(this),
      'STOP_PLAYBACK': this._handleStopPlayback.bind(this),
    };
  }

  dispatch(command) {
    const { type, payload } = command;

    try {
      const handler = this.handlers[type];
      if (handler) {
        handler(payload);
      } else {
        console.warn(`Unknown command type: ${type}`);
      }
    } catch (err) {
      console.error(`Error processing command ${type}:`, err);
      this.eventBus.emit("COMMAND_ERROR", { command, error: err });
    }
  }

  _handleInspectUnit({ unitId }) {
    const result = this.simulation.performInspection(unitId);
    if (result) {
      this.eventBus.emit("INSPECTION_STARTED", { unitId, report: result });
    }
  }

  _handleDeployBypass({ unitId }) {
    const success = this.simulation.deployPipelineBypass(unitId);
    if (success) {
      this.eventBus.emit("BYPASS_DEPLOYED", { unitId });
    }
  }

  _handleScheduleMaintenance({ unitId }) {
    const scheduled = this.simulation.scheduleTurnaround(unitId);
    if (scheduled) {
      this.eventBus.emit("MAINTENANCE_SCHEDULED", { unitId });
    }
  }

  _handleDispatchConvoy() {
    const result = this.simulation.dispatchLogisticsConvoy();
    if (result?.product) {
      this.eventBus.emit("CONVOY_DISPATCHED", { product: result.product });
    }
  }

  _handleSetParam({ param, value }) {
      this.simulation.setParam(param, value);
      this.eventBus.emit("PARAM_UPDATED", { param, value });
  }

  _handleSetThrottle({ unitId, value, quiet }) {
      this.simulation.setUnitThrottle(unitId, value, { quiet });
      if (!quiet) {
        this.eventBus.emit("UNIT_THROTTLE_CHANGED", { unitId, value });
      }
  }

  _handleToggleUnitOffline({ unitId, offline }) {
      this.simulation.setUnitOffline(unitId, offline);
      this.eventBus.emit("UNIT_STATUS_CHANGED", { unitId, status: offline ? 'offline' : 'online' });
  }

  _handleClearOverride({ unitId }) {
      this.simulation.clearUnitOverride(unitId);
      this.eventBus.emit("UNIT_OVERRIDE_CLEARED", { unitId });
  }

  _handleApplyScenario({ scenario }) {
      this.simulation.applyScenario(scenario);
      this.eventBus.emit("SCENARIO_APPLIED", { scenario });
  }

  // Supply Chain handlers
  _handleCreateContract({ crudeType, volume, pricePerBbl, duration }) {
    const result = this.simulation.createProcurementContract({ crudeType, volume, pricePerBbl, duration });
    if (result?.success) {
      this.eventBus.emit("CONTRACT_CREATED", { contract: result.contract });
    }
  }

  _handleScheduleDelivery({ contractId, volume, arrivalTime }) {
    const result = this.simulation.scheduleTankerDelivery({ contractId, volume, arrivalTime });
    if (result?.success) {
      this.eventBus.emit("DELIVERY_SCHEDULED", { delivery: result.delivery });
    }
  }

  // Staffing handlers
  _handleSetStaffingTarget({ departmentId, target }) {
    const result = this.simulation.setStaffingTarget(departmentId, target);
    if (result) {
      this.eventBus.emit("STAFFING_TARGET_CHANGED", { departmentId, target });
    }
  }

  _handleStartTraining({ programId, departmentId }) {
    const result = this.simulation.startTrainingProgram(programId, departmentId);
    if (result && !result.error) {
      this.eventBus.emit("TRAINING_STARTED", { programId, departmentId, training: result });
    }
  }

  // Blending handlers
  _handleBlendGasoline({ gradeId, volumeKb }) {
    const result = this.simulation.blendGasoline(gradeId, volumeKb);
    if (result?.success) {
      this.eventBus.emit("BLEND_COMPLETED", { gradeId, volumeKb, blend: result.blend });
    }
  }

  // Maintenance handlers
  _handleSetMaintenanceStrategy({ unitId, strategyId }) {
    const result = this.simulation.setMaintenanceStrategy(unitId, strategyId);
    if (result) {
      this.eventBus.emit("MAINTENANCE_STRATEGY_CHANGED", { unitId, strategyId });
    }
  }

  // Disaster handlers
  _handleDeployEmergencyTeam({ teamId, disasterId }) {
    const result = this.simulation.deployEmergencyTeam(teamId, disasterId);
    if (result?.success) {
      this.eventBus.emit("EMERGENCY_TEAM_DEPLOYED", { teamId, disasterId, deployment: result.deployment });
    }
  }

  _handleInitiateEvacuation({ level }) {
    if (this.simulation.disasterSystem) {
      this.simulation.disasterSystem.initiateEvacuation(level);
      this.eventBus.emit("EVACUATION_INITIATED", { level });
    }
  }

  // Time Machine handlers
  _handleStartRecording({ name, includeShiftRecorder }) {
    const result = this.simulation.startTimeMachineRecording({ name });
    if (result?.success) {
      if (includeShiftRecorder) {
        this.simulation.togglePerformanceRecording({ includeTimeMachine: false });
      }
      this.eventBus.emit("RECORDING_STARTED", { sessionId: result.sessionId });
    }
  }

  _handleStopRecording() {
    const result = this.simulation.stopTimeMachineRecording();
    if (result?.success) {
      this.eventBus.emit("RECORDING_STOPPED", { session: result.session });
    }
  }

  _handleStartPlayback({ sessionId, speed, ghostMode }) {
    const result = this.simulation.startTimeMachinePlayback(sessionId, { speed, ghostMode });
    if (result?.success) {
      this.eventBus.emit("PLAYBACK_STARTED", { sessionId, totalFrames: result.totalFrames });
    }
  }

  _handleStopPlayback() {
    const result = this.simulation.stopTimeMachinePlayback();
    if (result?.success) {
      this.eventBus.emit("PLAYBACK_STOPPED", {});
    }
  }
}

export class CommandSystem {
  constructor(simulation, eventBus) {
    this.simulation = simulation;
    this.eventBus = eventBus;

    this.handlers = {
      'INSPECT_UNIT': this._handleInspectUnit.bind(this),
      'DEPLOY_BYPASS': this._handleDeployBypass.bind(this),
      'SCHEDULE_MAINTENANCE': this._handleScheduleMaintenance.bind(this),
      'DISPATCH_CONVOY': this._handleDispatchConvoy.bind(this),
      'SET_PARAM': this._handleSetParam.bind(this),
      'SET_THROTTLE': this._handleSetThrottle.bind(this),
      'TOGGLE_UNIT_OFFLINE': this._handleToggleUnitOffline.bind(this),
      'CLEAR_OVERRIDE': this._handleClearOverride.bind(this),
      'APPLY_SCENARIO': this._handleApplyScenario.bind(this),
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
      this.eventBus.emit("INSPECTION_STARTED", { unitId });
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

  _handleDispatchConvoy(payload) {
    const result = this.simulation.dispatchLogisticsConvoy();
    if (result?.product) {
      this.eventBus.emit("CONVOY_DISPATCHED", { product: result.product });
    }
  }

  _handleSetParam({ param, value }) {
      this.simulation.setParam(param, value);
      this.eventBus.emit("PARAM_UPDATED", { param, value });
  }

  _handleSetThrottle({ unitId, value }) {
      this.simulation.setUnitThrottle(unitId, value);
      this.eventBus.emit("UNIT_THROTTLE_CHANGED", { unitId, value });
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
}

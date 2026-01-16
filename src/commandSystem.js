export class CommandSystem {
  constructor(simulation, eventBus) {
    this.simulation = simulation;
    this.eventBus = eventBus;
  }

  dispatch(command) {
    console.log("Dispatching command:", command);
    const { type, payload } = command;

    try {
      switch (type) {
        case "INSPECT_UNIT":
          this._handleInspectUnit(payload);
          break;
        case "DEPLOY_BYPASS":
          this._handleDeployBypass(payload);
          break;
        case "SCHEDULE_MAINTENANCE":
          this._handleScheduleMaintenance(payload);
          break;
        case "DISPATCH_CONVOY":
          this._handleDispatchConvoy(payload);
          break;
        case "SET_PARAM":
          this._handleSetParam(payload);
          break;
        case "SET_THROTTLE":
          this._handleSetThrottle(payload);
          break;
        case "TOGGLE_UNIT_OFFLINE":
          this._handleToggleUnitOffline(payload);
          break;
        case "CLEAR_OVERRIDE":
          this._handleClearOverride(payload);
          break;
        case "APPLY_SCENARIO":
            this._handleApplyScenario(payload);
            break;
        default:
          console.warn(`Unknown command type: ${type}`);
      }
    } catch (err) {
      console.error(`Error processing command ${type}:`, err);
      this.eventBus.emit("COMMAND_ERROR", { command, error: err });
    }
  }

  _handleInspectUnit({ unitId }) {
    const report = this.simulation.performInspection(unitId);
    if (report) {
      this.eventBus.emit("INSPECTION_COMPLETED", { unitId, report });
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

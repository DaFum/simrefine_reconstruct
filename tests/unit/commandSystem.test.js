import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandSystem } from '../../src/commandSystem.js';

describe('CommandSystem', () => {
  let commandSystem;
  let mockSimulation;
  let mockEventBus;

  beforeEach(() => {
    mockSimulation = {
      performInspection: vi.fn(),
      deployPipelineBypass: vi.fn(),
      scheduleTurnaround: vi.fn(),
      dispatchLogisticsConvoy: vi.fn(),
      setParam: vi.fn(),
      setUnitThrottle: vi.fn(),
      setUnitOffline: vi.fn(),
      clearUnitOverride: vi.fn(),
      applyScenario: vi.fn()
    };

    mockEventBus = {
      emit: vi.fn()
    };

    commandSystem = new CommandSystem(mockSimulation, mockEventBus);
  });

  describe('constructor', () => {
    it('should initialize with simulation and eventBus', () => {
      expect(commandSystem.simulation).toBe(mockSimulation);
      expect(commandSystem.eventBus).toBe(mockEventBus);
    });

    it('should initialize handlers map', () => {
      expect(commandSystem.handlers).toBeDefined();
      expect(typeof commandSystem.handlers).toBe('object');
    });

    it('should register all expected command handlers', () => {
      const expectedCommands = [
        'INSPECT_UNIT',
        'DEPLOY_BYPASS',
        'SCHEDULE_MAINTENANCE',
        'DISPATCH_CONVOY',
        'SET_PARAM',
        'SET_THROTTLE',
        'TOGGLE_UNIT_OFFLINE',
        'CLEAR_OVERRIDE',
        'APPLY_SCENARIO'
      ];

      expectedCommands.forEach(cmd => {
        expect(commandSystem.handlers[cmd]).toBeDefined();
        expect(typeof commandSystem.handlers[cmd]).toBe('function');
      });
    });
  });

  describe('dispatch', () => {
    it('should call the appropriate handler for a valid command', () => {
      const command = {
        type: 'INSPECT_UNIT',
        payload: { unitId: 'unit1' }
      };

      mockSimulation.performInspection.mockReturnValue({ status: 'ok' });
      commandSystem.dispatch(command);

      expect(mockSimulation.performInspection).toHaveBeenCalledWith('unit1');
    });

    it('should handle unknown command types gracefully', () => {
      const command = {
        type: 'UNKNOWN_COMMAND',
        payload: {}
      };

      expect(() => commandSystem.dispatch(command)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('Unknown command type: UNKNOWN_COMMAND');
    });

    it('should emit COMMAND_ERROR event on handler error', () => {
      const command = {
        type: 'INSPECT_UNIT',
        payload: { unitId: 'unit1' }
      };

      const error = new Error('Test error');
      mockSimulation.performInspection.mockImplementation(() => {
        throw error;
      });

      commandSystem.dispatch(command);

      expect(mockEventBus.emit).toHaveBeenCalledWith('COMMAND_ERROR', {
        command,
        error
      });
    });

    it('should handle commands with missing payload', () => {
      const command = { type: 'DISPATCH_CONVOY' };
      
      mockSimulation.dispatchLogisticsConvoy.mockReturnValue({ product: 'diesel' });
      
      expect(() => commandSystem.dispatch(command)).not.toThrow();
      expect(mockSimulation.dispatchLogisticsConvoy).toHaveBeenCalled();
    });
  });

  describe('_handleInspectUnit', () => {
    it('should perform inspection and emit event on success', () => {
      const report = { unitId: 'unit1', status: 'good', reliability: 0.95 };
      mockSimulation.performInspection.mockReturnValue(report);

      commandSystem.dispatch({
        type: 'INSPECT_UNIT',
        payload: { unitId: 'unit1' }
      });

      expect(mockSimulation.performInspection).toHaveBeenCalledWith('unit1');
      expect(mockEventBus.emit).toHaveBeenCalledWith('INSPECTION_STARTED', {
        unitId: 'unit1',
        report
      });
    });

    it('should not emit event if inspection returns falsy result', () => {
      mockSimulation.performInspection.mockReturnValue(null);

      commandSystem.dispatch({
        type: 'INSPECT_UNIT',
        payload: { unitId: 'unit1' }
      });

      expect(mockSimulation.performInspection).toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle inspection of different units', () => {
      const units = ['distillation', 'reformer', 'fcc'];
      
      units.forEach(unitId => {
        mockSimulation.performInspection.mockReturnValue({ unitId, status: 'ok' });
        
        commandSystem.dispatch({
          type: 'INSPECT_UNIT',
          payload: { unitId }
        });
      });

      expect(mockSimulation.performInspection).toHaveBeenCalledTimes(3);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('_handleDeployBypass', () => {
    it('should deploy bypass and emit event on success', () => {
      mockSimulation.deployPipelineBypass.mockReturnValue(true);

      commandSystem.dispatch({
        type: 'DEPLOY_BYPASS',
        payload: { unitId: 'unit1' }
      });

      expect(mockSimulation.deployPipelineBypass).toHaveBeenCalledWith('unit1');
      expect(mockEventBus.emit).toHaveBeenCalledWith('BYPASS_DEPLOYED', {
        unitId: 'unit1'
      });
    });

    it('should not emit event if bypass deployment fails', () => {
      mockSimulation.deployPipelineBypass.mockReturnValue(false);

      commandSystem.dispatch({
        type: 'DEPLOY_BYPASS',
        payload: { unitId: 'unit1' }
      });

      expect(mockSimulation.deployPipelineBypass).toHaveBeenCalled();
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('_handleScheduleMaintenance', () => {
    it('should schedule maintenance and emit event on success', () => {
      mockSimulation.scheduleTurnaround.mockReturnValue(true);

      commandSystem.dispatch({
        type: 'SCHEDULE_MAINTENANCE',
        payload: { unitId: 'unit1' }
      });

      expect(mockSimulation.scheduleTurnaround).toHaveBeenCalledWith('unit1');
      expect(mockEventBus.emit).toHaveBeenCalledWith('MAINTENANCE_SCHEDULED', {
        unitId: 'unit1'
      });
    });

    it('should not emit event if scheduling fails', () => {
      mockSimulation.scheduleTurnaround.mockReturnValue(false);

      commandSystem.dispatch({
        type: 'SCHEDULE_MAINTENANCE',
        payload: { unitId: 'unit1' }
      });

      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('_handleDispatchConvoy', () => {
    it('should dispatch convoy and emit event with product', () => {
      mockSimulation.dispatchLogisticsConvoy.mockReturnValue({ product: 'gasoline' });

      commandSystem.dispatch({
        type: 'DISPATCH_CONVOY',
        payload: {}
      });

      expect(mockSimulation.dispatchLogisticsConvoy).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith('CONVOY_DISPATCHED', {
        product: 'gasoline'
      });
    });

    it('should handle convoy dispatch returning null', () => {
      mockSimulation.dispatchLogisticsConvoy.mockReturnValue(null);

      commandSystem.dispatch({
        type: 'DISPATCH_CONVOY',
        payload: {}
      });

      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle convoy dispatch returning object without product', () => {
      mockSimulation.dispatchLogisticsConvoy.mockReturnValue({ status: 'pending' });

      commandSystem.dispatch({
        type: 'DISPATCH_CONVOY',
        payload: {}
      });

      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe('_handleSetParam', () => {
    it('should set parameter and emit event', () => {
      commandSystem.dispatch({
        type: 'SET_PARAM',
        payload: { param: 'marketDemand', value: 0.8 }
      });

      expect(mockSimulation.setParam).toHaveBeenCalledWith('marketDemand', 0.8);
      expect(mockEventBus.emit).toHaveBeenCalledWith('PARAM_UPDATED', {
        param: 'marketDemand',
        value: 0.8
      });
    });

    it('should handle different parameter types', () => {
      const params = [
        { param: 'speed', value: 1.5 },
        { param: 'difficulty', value: 'hard' },
        { param: 'enabled', value: true }
      ];

      params.forEach(payload => {
        commandSystem.dispatch({ type: 'SET_PARAM', payload });
      });

      expect(mockSimulation.setParam).toHaveBeenCalledTimes(3);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(3);
    });
  });

  describe('_handleSetThrottle', () => {
    it('should set throttle and emit event when not quiet', () => {
      commandSystem.dispatch({
        type: 'SET_THROTTLE',
        payload: { unitId: 'unit1', value: 0.75, quiet: false }
      });

      expect(mockSimulation.setUnitThrottle).toHaveBeenCalledWith('unit1', 0.75, { quiet: false });
      expect(mockEventBus.emit).toHaveBeenCalledWith('UNIT_THROTTLE_CHANGED', {
        unitId: 'unit1',
        value: 0.75
      });
    });

    it('should not emit event when quiet is true', () => {
      commandSystem.dispatch({
        type: 'SET_THROTTLE',
        payload: { unitId: 'unit1', value: 0.5, quiet: true }
      });

      expect(mockSimulation.setUnitThrottle).toHaveBeenCalledWith('unit1', 0.5, { quiet: true });
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });

    it('should handle edge throttle values', () => {
      [0, 0.5, 1, 1.5].forEach(value => {
        mockEventBus.emit.mockClear();
        commandSystem.dispatch({
          type: 'SET_THROTTLE',
          payload: { unitId: 'unit1', value }
        });
        
        expect(mockSimulation.setUnitThrottle).toHaveBeenCalledWith('unit1', value, { quiet: undefined });
      });
    });
  });

  describe('_handleToggleUnitOffline', () => {
    it('should set unit offline and emit event', () => {
      commandSystem.dispatch({
        type: 'TOGGLE_UNIT_OFFLINE',
        payload: { unitId: 'unit1', offline: true }
      });

      expect(mockSimulation.setUnitOffline).toHaveBeenCalledWith('unit1', true);
      expect(mockEventBus.emit).toHaveBeenCalledWith('UNIT_STATUS_CHANGED', {
        unitId: 'unit1',
        status: 'offline'
      });
    });

    it('should set unit online and emit event', () => {
      commandSystem.dispatch({
        type: 'TOGGLE_UNIT_OFFLINE',
        payload: { unitId: 'unit1', offline: false }
      });

      expect(mockSimulation.setUnitOffline).toHaveBeenCalledWith('unit1', false);
      expect(mockEventBus.emit).toHaveBeenCalledWith('UNIT_STATUS_CHANGED', {
        unitId: 'unit1',
        status: 'online'
      });
    });
  });

  describe('_handleClearOverride', () => {
    it('should clear override and emit event', () => {
      commandSystem.dispatch({
        type: 'CLEAR_OVERRIDE',
        payload: { unitId: 'unit1' }
      });

      expect(mockSimulation.clearUnitOverride).toHaveBeenCalledWith('unit1');
      expect(mockEventBus.emit).toHaveBeenCalledWith('UNIT_OVERRIDE_CLEARED', {
        unitId: 'unit1'
      });
    });
  });

  describe('_handleApplyScenario', () => {
    it('should apply scenario and emit event', () => {
      commandSystem.dispatch({
        type: 'APPLY_SCENARIO',
        payload: { scenario: 'winter' }
      });

      expect(mockSimulation.applyScenario).toHaveBeenCalledWith('winter');
      expect(mockEventBus.emit).toHaveBeenCalledWith('SCENARIO_APPLIED', {
        scenario: 'winter'
      });
    });

    it('should handle different scenario types', () => {
      const scenarios = ['summer', 'emergency', 'maintenance'];

      scenarios.forEach(scenario => {
        commandSystem.dispatch({
          type: 'APPLY_SCENARIO',
          payload: { scenario }
        });
      });

      expect(mockSimulation.applyScenario).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should continue execution after handler error', () => {
      mockSimulation.performInspection.mockImplementation(() => {
        throw new Error('Inspection failed');
      });

      expect(() => {
        commandSystem.dispatch({
          type: 'INSPECT_UNIT',
          payload: { unitId: 'unit1' }
        });
      }).not.toThrow();
    });

    it('should log errors to console', () => {
      const error = new Error('Test error');
      mockSimulation.setParam.mockImplementation(() => {
        throw error;
      });

      commandSystem.dispatch({
        type: 'SET_PARAM',
        payload: { param: 'test', value: 1 }
      });

      expect(console.error).toHaveBeenCalled();
    });
  });
});
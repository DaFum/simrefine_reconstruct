import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefinerySimulation } from '../../src/simulation.js';
import { EventBus } from '../../src/eventBus.js';

describe('Mission System Branching', () => {
  let sim;
  let bus;

  beforeEach(() => {
    bus = new EventBus();
    sim = new RefinerySimulation(bus);
    // Mock the mission content
    sim.activeMission = {
      id: 'test_mission',
      title: 'Test Mission',
      description: 'A test',
      objectives: [],
      triggers: [
        {
          type: 'metric',
          metric: 'testMetric',
          operator: '>',
          value: 50,
          fired: false,
          event: {
            id: 'test_event',
            title: 'Test Event',
            description: 'Choose now',
            choices: [
              {
                id: 'choice_a',
                label: 'Option A',
                effect: (s) => { s.metrics.testResult = 'A'; },
                nextMission: 'mission_a'
              },
              {
                id: 'choice_b',
                label: 'Option B',
                effect: (s) => { s.metrics.testResult = 'B'; }
              }
            ]
          }
        }
      ]
    };
    sim.metrics.testMetric = 0;
    sim.scenarios['mission_a'] = { name: "Mission A Scenario", description: "A" }; // Mock if needed, but missions are content
    // We need to mock startMission to check branching
    sim.startMission = vi.fn();
  });

  it('should trigger event when condition is met', () => {
    sim.metrics.testMetric = 60;
    const emitSpy = vi.spyOn(bus, 'emit');

    sim._updateMission(1, { shipments: {}, metrics: {}, production: {} });

    expect(sim.activeMission.triggers[0].fired).toBe(true);
    expect(sim.activeMission.currentEvent).toBeDefined();
    expect(sim.activeMission.currentEvent.id).toBe('test_event');
    expect(emitSpy).toHaveBeenCalledWith('MISSION_EVENT_TRIGGERED', expect.objectContaining({ event: expect.objectContaining({ id: 'test_event' }) }));
  });

  it('should handle choice with effect', () => {
    // Setup active event
    sim.activeMission.currentEvent = sim.activeMission.triggers[0].event;

    sim.handleMissionChoice('choice_b');

    expect(sim.metrics.testResult).toBe('B');
    expect(sim.activeMission.currentEvent).toBeNull();
  });

  it('should handle choice with branching', () => {
    // Setup active event
    sim.activeMission.currentEvent = sim.activeMission.triggers[0].event;

    sim.handleMissionChoice('choice_a');

    expect(sim.metrics.testResult).toBe('A');
    expect(sim.startMission).toHaveBeenCalledWith('mission_a');
  });
});

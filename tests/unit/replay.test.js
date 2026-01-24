import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeMachineSystem } from '../../src/systems/TimeMachineSystem.js';

describe('TimeMachineSystem', () => {
  let sim;
  let tm;

  beforeEach(() => {
    sim = {
      timeMinutes: 100,
      activeScenarioKey: 'test',
      params: { crudeIntake: 120 },
      getMetrics: () => ({ profitPerHour: 100 }),
      getFlows: () => ({}),
      getLogisticsState: () => ({}),
      marketSystem: { getState: () => ({}) },
      getActiveAlerts: () => [],
      units: [],
      pushLog: vi.fn(),
      running: true
    };
    tm = new TimeMachineSystem(sim);
  });

  it('should record frames', () => {
    tm.startRecording({ name: 'Test Session' });
    expect(tm.recording.active).toBe(true);
    expect(tm.recording.frames.length).toBe(1); // Initial frame

    // Simulate time advance
    sim.timeMinutes = 160; // +60 mins
    tm.update(60);
    expect(tm.recording.frames.length).toBe(2);
  });

  it('should save session on stop', () => {
    tm.startRecording();
    sim.timeMinutes = 200;
    tm.update(100);
    const result = tm.stopRecording();

    expect(result.success).toBe(true);
    expect(tm.savedSessions.length).toBe(1);
    expect(tm.savedSessions[0].frameCount).toBeGreaterThan(0);
  });

  it('should playback session', () => {
    // Create a dummy session
    tm.savedSessions.push({
      id: 'sess1',
      frames: [
        { time: 100, state: { time: 100, val: 1 } },
        { time: 160, state: { time: 160, val: 2 } },
        { time: 220, state: { time: 220, val: 3 } }
      ],
      metadata: { name: 'Test' }
    });

    const result = tm.startPlayback('sess1');
    expect(result.success).toBe(true);
    expect(tm.playback.active).toBe(true);
    expect(sim.running).toBe(false); // Should pause live sim

    tm.update(30); // Advance playback
    expect(tm.playback.currentFrame).toBeGreaterThanOrEqual(0);
  });

  it('should seek to frame', () => {
    tm.savedSessions.push({
      id: 'sess1',
      metadata: { name: 'Seek Test' },
      frames: [
        { time: 100 }, { time: 200 }, { time: 300 }
      ]
    });
    tm.startPlayback('sess1');

    tm.seekToFrame(2);
    expect(tm.playback.currentFrame).toBe(2);

    tm.seekToFrame(0);
    expect(tm.playback.currentFrame).toBe(0);
  });
});

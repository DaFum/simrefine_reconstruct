/**
 * Time Machine System
 * Record/Playback functionality with VCR controls
 * Allows reviewing past sessions to analyze what went wrong
 */

import { clamp } from "../simulation/utils/calculations.js";

export const PLAYBACK_SPEEDS = [
  { id: 'slowest', label: '0.25x', multiplier: 0.25 },
  { id: 'slow', label: '0.5x', multiplier: 0.5 },
  { id: 'normal', label: '1x', multiplier: 1 },
  { id: 'fast', label: '2x', multiplier: 2 },
  { id: 'fastest', label: '4x', multiplier: 4 }
];

export class TimeMachineSystem {
  constructor(simulation) {
    this.simulation = simulation;

    // Recording state
    this.recording = {
      active: false,
      startTime: null,
      endTime: null,
      frames: [],
      metadata: null,
      maxFrames: 10000, // Limit memory usage
      frameInterval: 60, // Record every 60 sim minutes
      lastRecordedTime: 0
    };

    // Playback state
    this.playback = {
      active: false,
      paused: false,
      speed: 1,
      currentFrame: 0,
      session: null,
      ghostMode: false
    };

    // Saved sessions
    this.savedSessions = [];
    this.maxSavedSessions = 10;

    // Event markers (for highlighting key moments)
    this.markers = [];
  }

  /**
   * Start recording the simulation
   */
  startRecording(metadata = {}) {
    if (this.recording.active) {
      return { success: false, error: 'Already recording' };
    }

    this.recording = {
      active: true,
      startTime: this.simulation?.timeMinutes || 0,
      endTime: null,
      frames: [],
      metadata: {
        name: metadata.name || `Session ${Date.now()}`,
        scenario: this.simulation?.activeScenarioKey || 'unknown',
        startDate: new Date().toISOString(),
        ...metadata
      },
      maxFrames: this.recording.maxFrames,
      frameInterval: this.recording.frameInterval,
      lastRecordedTime: 0
    };

    // Record initial state
    this._recordFrame();

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info', 'Time Machine: Recording started');
    }

    return { success: true, sessionId: this.recording.metadata.name };
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.recording.active) {
      return { success: false, error: 'Not recording' };
    }

    this.recording.active = false;
    this.recording.endTime = this.simulation?.timeMinutes || 0;

    // Create session object
    const session = {
      id: `session_${Date.now()}`,
      metadata: { ...this.recording.metadata },
      startTime: this.recording.startTime,
      endTime: this.recording.endTime,
      duration: this.recording.endTime - this.recording.startTime,
      frameCount: this.recording.frames.length,
      frames: [...this.recording.frames],
      markers: [...this.markers]
    };

    // Save session
    this.savedSessions.unshift(session);
    if (this.savedSessions.length > this.maxSavedSessions) {
      this.savedSessions.pop();
    }

    // Clear recording buffer
    this.recording.frames = [];
    this.markers = [];

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info',
        `Time Machine: Recording stopped. ${session.frameCount} frames captured over ${(session.duration / 60).toFixed(1)} hours`
      );
    }

    return { success: true, session };
  }

  /**
   * Record current frame (called during update)
   */
  _recordFrame() {
    if (!this.recording.active) return;

    const currentTime = this.simulation?.timeMinutes || 0;

    // Check interval
    if (currentTime - this.recording.lastRecordedTime < this.recording.frameInterval) {
      return;
    }

    // Check max frames
    if (this.recording.frames.length >= this.recording.maxFrames) {
      // Remove oldest frames (rolling buffer)
      this.recording.frames.shift();
    }

    // Capture frame
    const frame = {
      time: currentTime,
      timestamp: Date.now(),
      state: this._captureState()
    };

    this.recording.frames.push(frame);
    this.recording.lastRecordedTime = currentTime;
  }

  /**
   * Capture current simulation state
   */
  _captureState() {
    const sim = this.simulation;
    if (!sim) return {};

    return {
      // Core params
      params: { ...sim.params },
      scenario: sim.activeScenarioKey,

      // Metrics snapshot
      metrics: { ...sim.getMetrics() },

      // Unit states
      units: sim.units.map(u => ({
        id: u.id,
        status: u.status,
        throughput: u.throughput,
        utilization: u.utilization,
        integrity: u.integrity,
        incidents: u.incidents,
        alert: u.alert
      })),

      // Flows
      flows: { ...sim.getFlows() },

      // Logistics
      logistics: this._captureLogistics(),

      // Market
      market: sim.marketSystem?.getState() || {},

      // Active alerts
      alerts: sim.getActiveAlerts?.() || []
    };
  }

  _captureLogistics() {
    const logistics = this.simulation?.getLogisticsState?.();
    if (!logistics) return {};

    return {
      storage: logistics.storage,
      shipments: logistics.shipments?.slice(0, 10), // Limit for memory
      stats: logistics.stats
    };
  }

  /**
   * Add an event marker
   */
  addMarker(label, type = 'event') {
    const marker = {
      id: `marker_${Date.now()}`,
      time: this.simulation?.timeMinutes || 0,
      label,
      type, // 'event', 'incident', 'milestone', 'user'
      timestamp: Date.now()
    };

    this.markers.push(marker);
    return marker;
  }

  /**
   * Start playback of a saved session
   */
  startPlayback(sessionId, options = {}) {
    const session = this.savedSessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.frames.length === 0) {
      return { success: false, error: 'Session has no frames' };
    }

    this.playback = {
      active: true,
      paused: false,
      speed: options.speed || 1,
      currentFrame: 0,
      session,
      ghostMode: options.ghostMode || false,
      startedAt: Date.now()
    };

    // Pause live simulation during playback
    if (this.simulation && !options.ghostMode) {
      this.simulation.running = false;
    }

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info',
        `Time Machine: Playing back "${session.metadata.name}" (${session.frameCount} frames)`
      );
    }

    return { success: true, totalFrames: session.frames.length };
  }

  /**
   * Stop playback
   */
  stopPlayback() {
    if (!this.playback.active) {
      return { success: false, error: 'Not playing' };
    }

    this.playback.active = false;
    this.playback.session = null;

    if (this.simulation?.pushLog) {
      this.simulation.pushLog('info', 'Time Machine: Playback stopped');
    }

    return { success: true };
  }

  /**
   * Pause/Resume playback
   */
  togglePlaybackPause() {
    if (!this.playback.active) return false;
    this.playback.paused = !this.playback.paused;
    return this.playback.paused;
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(multiplier) {
    const preset = PLAYBACK_SPEEDS.find(p => Math.abs(p.multiplier - multiplier) < 0.01);
    this.playback.speed = preset?.multiplier || clamp(multiplier, 0.1, 10);
    return this.playback.speed;
  }

  /**
   * Seek to specific frame
   */
  seekToFrame(frameIndex) {
    if (!this.playback.active || !this.playback.session) {
      return { success: false, error: 'No active playback' };
    }

    const session = this.playback.session;
    this.playback.currentFrame = clamp(frameIndex, 0, session.frames.length - 1);

    return {
      success: true,
      frame: this.playback.currentFrame,
      time: session.frames[this.playback.currentFrame]?.time || 0
    };
  }

  /**
   * Seek to specific time in session
   */
  seekToTime(targetTime) {
    if (!this.playback.active || !this.playback.session) {
      return { success: false, error: 'No active playback' };
    }

    const session = this.playback.session;
    let bestFrame = 0;

    for (let i = 0; i < session.frames.length; i++) {
      if (session.frames[i].time <= targetTime) {
        bestFrame = i;
      } else {
        break;
      }
    }

    return this.seekToFrame(bestFrame);
  }

  /**
   * Rewind by specified amount
   */
  rewind(minutes = 60) {
    if (!this.playback.active) return false;

    const currentFrame = this.playback.session.frames[this.playback.currentFrame];
    if (!currentFrame) return false;

    return this.seekToTime(currentFrame.time - minutes);
  }

  /**
   * Fast forward by specified amount
   */
  fastForward(minutes = 60) {
    if (!this.playback.active) return false;

    const currentFrame = this.playback.session.frames[this.playback.currentFrame];
    if (!currentFrame) return false;

    return this.seekToTime(currentFrame.time + minutes);
  }

  /**
   * Get current playback frame state
   */
  getCurrentPlaybackState() {
    if (!this.playback.active || !this.playback.session) {
      return null;
    }

    const frame = this.playback.session.frames[this.playback.currentFrame];
    if (!frame) return null;

    return {
      ...frame.state,
      _playback: {
        frame: this.playback.currentFrame,
        totalFrames: this.playback.session.frames.length,
        time: frame.time,
        progress: this.playback.currentFrame / (this.playback.session.frames.length - 1),
        paused: this.playback.paused,
        speed: this.playback.speed
      }
    };
  }

  /**
   * Update called each frame
   */
  update(deltaMinutes) {
    // Handle recording
    if (this.recording.active) {
      this._recordFrame();
    }

    // Handle playback
    if (this.playback.active && !this.playback.paused) {
      this._advancePlayback(deltaMinutes);
    }

    return {
      recording: this.getRecordingStatus(),
      playback: this.getPlaybackStatus(),
      sessions: this.getSavedSessions()
    };
  }

  _advancePlayback(deltaMinutes) {
    if (!this.playback.session) return;

    const session = this.playback.session;
    const currentFrame = session.frames[this.playback.currentFrame];
    const nextFrame = session.frames[this.playback.currentFrame + 1];

    if (!nextFrame) {
      // End of playback
      this.playback.paused = true;
      return;
    }

    // Calculate time to advance based on playback speed
    const timeDelta = deltaMinutes * this.playback.speed;
    const targetTime = (currentFrame?.time || 0) + timeDelta;

    // Find appropriate frame
    while (this.playback.currentFrame < session.frames.length - 1) {
      const next = session.frames[this.playback.currentFrame + 1];
      if (next.time <= targetTime) {
        this.playback.currentFrame++;
      } else {
        break;
      }
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus() {
    if (!this.recording.active) {
      return { active: false };
    }

    const duration = (this.simulation?.timeMinutes || 0) - this.recording.startTime;

    return {
      active: true,
      startTime: this.recording.startTime,
      duration,
      frameCount: this.recording.frames.length,
      metadata: this.recording.metadata
    };
  }

  /**
   * Get playback status
   */
  getPlaybackStatus() {
    if (!this.playback.active) {
      return { active: false };
    }

    const session = this.playback.session;
    const currentFrame = session?.frames[this.playback.currentFrame];

    return {
      active: true,
      paused: this.playback.paused,
      speed: this.playback.speed,
      ghostMode: this.playback.ghostMode,
      sessionName: session?.metadata?.name || 'Unknown',
      currentFrame: this.playback.currentFrame,
      totalFrames: session?.frames.length || 0,
      currentTime: currentFrame?.time || 0,
      startTime: session?.startTime || 0,
      endTime: session?.endTime || 0,
      progress: session?.frames.length > 1 ?
        this.playback.currentFrame / (session.frames.length - 1) : 0
    };
  }

  /**
   * Get list of saved sessions
   */
  getSavedSessions() {
    return this.savedSessions.map(s => ({
      id: s.id,
      name: s.metadata.name,
      scenario: s.metadata.scenario,
      startDate: s.metadata.startDate,
      duration: s.duration,
      frameCount: s.frameCount,
      markers: s.markers?.length || 0
    }));
  }

  /**
   * Get markers for current session/playback
   */
  getMarkers() {
    if (this.playback.active && this.playback.session) {
      return this.playback.session.markers || [];
    }
    return this.markers;
  }

  /**
   * Export session as JSON
   */
  exportSession(sessionId) {
    const session = this.savedSessions.find(s => s.id === sessionId);
    if (!session) return null;

    return JSON.stringify(session, null, 2);
  }

  /**
   * Import session from JSON
   */
  importSession(jsonString) {
    try {
      const session = JSON.parse(jsonString);

      if (!session.id || !session.frames || !Array.isArray(session.frames)) {
        return { success: false, error: 'Invalid session format' };
      }

      // Add to saved sessions
      session.id = `imported_${Date.now()}`; // Generate new ID
      this.savedSessions.unshift(session);

      if (this.savedSessions.length > this.maxSavedSessions) {
        this.savedSessions.pop();
      }

      return { success: true, sessionId: session.id };
    } catch (e) {
      return { success: false, error: `Failed to parse session: ${e.message}` };
    }
  }

  /**
   * Delete a saved session
   */
  deleteSession(sessionId) {
    const index = this.savedSessions.findIndex(s => s.id === sessionId);
    if (index === -1) {
      return { success: false, error: 'Session not found' };
    }

    this.savedSessions.splice(index, 1);
    return { success: true };
  }

  /**
   * Get state for saving
   */
  getState() {
    return {
      savedSessions: this.savedSessions.map(s => ({
        ...s,
        frames: s.frames // Include frames in save
      }))
    };
  }

  /**
   * Restore state
   */
  restoreState(state) {
    if (state.savedSessions && Array.isArray(state.savedSessions)) {
      this.savedSessions = state.savedSessions;
    }
  }

  reset() {
    this.recording = {
      active: false,
      startTime: null,
      endTime: null,
      frames: [],
      metadata: null,
      maxFrames: 10000,
      frameInterval: 60,
      lastRecordedTime: 0
    };
    this.playback = {
      active: false,
      paused: false,
      speed: 1,
      currentFrame: 0,
      session: null,
      ghostMode: false
    };
    this.markers = [];
    // Don't clear savedSessions - persist across resets
  }
}

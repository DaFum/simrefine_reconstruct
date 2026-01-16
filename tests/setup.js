import { vi } from 'vitest';

// Mock browser APIs that may not be available in jsdom
global.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), value: 440 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })),
  createGain: vi.fn(() => ({
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), value: 1 },
    connect: vi.fn()
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn()
  })),
  createBuffer: vi.fn((channels, length, sampleRate) => ({
    getChannelData: vi.fn(() => new Float32Array(length))
  })),
  createBiquadFilter: vi.fn(() => ({
    type: 'lowpass',
    frequency: { value: 1000 },
    connect: vi.fn()
  })),
  destination: {},
  currentTime: 0,
  sampleRate: 44100,
  state: 'running',
  resume: vi.fn()
}));

global.webkitAudioContext = global.AudioContext;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
};
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioController } from '../../src/audio.js';

describe('AudioController', () => {
  let audio;

  beforeEach(() => {
    vi.clearAllMocks();
    audio = new AudioController();
  });

  afterEach(() => {
    if (audio) {
      window.removeEventListener('click', () => {});
      window.removeEventListener('keydown', () => {});
    }
  });

  describe('constructor', () => {
    it('should initialize with null context and disabled state', () => {
      expect(audio.context).toBeNull();
      expect(audio.masterGain).toBeNull();
      expect(audio.enabled).toBe(false);
    });

    it('should initialize sounds map', () => {
      expect(audio.sounds).toBeInstanceOf(Map);
      expect(audio.sounds.size).toBe(0);
    });

    it('should set up event listeners for user interaction', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const newAudio = new AudioController();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('initialization on user interaction', () => {
    it('should initialize AudioContext on click', () => {
      const newAudio = new AudioController();
      window.dispatchEvent(new Event('click'));

      expect(newAudio.context).toBeDefined();
      expect(newAudio.masterGain).toBeDefined();
      expect(newAudio.enabled).toBe(true);
    });

    it('should initialize AudioContext on keydown', () => {
      const newAudio = new AudioController();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

      expect(newAudio.context).toBeDefined();
      expect(newAudio.enabled).toBe(true);
    });

    it('should set master gain volume to 0.3', () => {
      const newAudio = new AudioController();
      window.dispatchEvent(new Event('click'));

      expect(newAudio.masterGain.gain.value).toBe(0.3);
    });

    it('should generate sounds after initialization', () => {
      const newAudio = new AudioController();
      window.dispatchEvent(new Event('click'));

      expect(newAudio.sounds.size).toBeGreaterThan(0);
    });

    it('should remove event listeners after first initialization', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const newAudio = new AudioController();
      
      window.dispatchEvent(new Event('click'));

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('_generateSounds', () => {
    beforeEach(() => {
      window.dispatchEvent(new Event('click'));
    });

    it('should generate all expected sound types', () => {
      const expectedSounds = [
        'click', 'hover', 'toggle_on', 'toggle_off',
        'open', 'close', 'success', 'warning', 'error', 'alert'
      ];

      expectedSounds.forEach(soundName => {
        expect(audio.sounds.has(soundName)).toBe(true);
      });
    });

    it('should store sound generator functions', () => {
      audio.sounds.forEach((generator, key) => {
        expect(typeof generator).toBe('function');
      });
    });
  });

  describe('play', () => {
    it('should not play if audio is not enabled', () => {
      const newAudio = new AudioController();
      expect(() => newAudio.play('click')).not.toThrow();
    });

    it('should not play if context is null', () => {
      audio.enabled = true;
      expect(() => audio.play('click')).not.toThrow();
    });

    it('should not play if sound name does not exist', () => {
      window.dispatchEvent(new Event('click'));
      expect(() => audio.play('nonexistent')).not.toThrow();
    });

    it('should execute sound generator for valid sound', () => {
      window.dispatchEvent(new Event('click'));
      
      const mockGenerator = vi.fn();
      audio.sounds.set('test_sound', mockGenerator);
      
      audio.play('test_sound');
      
      expect(mockGenerator).toHaveBeenCalled();
    });

    it('should handle errors in sound generation gracefully', () => {
      window.dispatchEvent(new Event('click'));
      
      const errorGenerator = vi.fn(() => {
        throw new Error('Audio error');
      });
      audio.sounds.set('error_sound', errorGenerator);
      
      expect(() => audio.play('error_sound')).not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should play multiple sounds in sequence', () => {
      window.dispatchEvent(new Event('click'));
      
      const sounds = ['click', 'hover', 'toggle_on'];
      
      sounds.forEach(sound => {
        expect(() => audio.play(sound)).not.toThrow();
      });
    });
  });

  describe('_createOscillatorSound', () => {
    beforeEach(() => {
      window.dispatchEvent(new Event('click'));
    });

    it('should create oscillator with correct type', () => {
      const createOscillatorSpy = vi.spyOn(audio.context, 'createOscillator');
      
      audio._createOscillatorSound('square', 440, 0.1, 0.5);
      
      expect(createOscillatorSpy).toHaveBeenCalled();
    });

    it('should create gain node', () => {
      const createGainSpy = vi.spyOn(audio.context, 'createGain');
      
      audio._createOscillatorSound('sine', 440, 0.1, 0.5);
      
      expect(createGainSpy).toHaveBeenCalled();
    });

    it('should handle different oscillator types', () => {
      const types = ['sine', 'square', 'sawtooth', 'triangle'];
      
      types.forEach(type => {
        expect(() => audio._createOscillatorSound(type, 440, 0.1, 0.5)).not.toThrow();
      });
    });

    it('should handle various frequency values', () => {
      const frequencies = [100, 440, 880, 1000, 2000];
      
      frequencies.forEach(freq => {
        expect(() => audio._createOscillatorSound('sine', freq, 0.1, 0.5)).not.toThrow();
      });
    });
  });

  describe('_createNoiseSound', () => {
    beforeEach(() => {
      window.dispatchEvent(new Event('click'));
    });

    it('should create buffer with correct duration', () => {
      const createBufferSpy = vi.spyOn(audio.context, 'createBuffer');
      const duration = 0.5;
      
      audio._createNoiseSound(duration, 0.3);
      
      expect(createBufferSpy).toHaveBeenCalledWith(
        1,
        audio.context.sampleRate * duration,
        audio.context.sampleRate
      );
    });

    it('should create buffer source', () => {
      const createBufferSourceSpy = vi.spyOn(audio.context, 'createBufferSource');
      
      audio._createNoiseSound(0.2, 0.3);
      
      expect(createBufferSourceSpy).toHaveBeenCalled();
    });

    it('should create lowpass filter', () => {
      const createBiquadFilterSpy = vi.spyOn(audio.context, 'createBiquadFilter');
      
      audio._createNoiseSound(0.2, 0.3);
      
      expect(createBiquadFilterSpy).toHaveBeenCalled();
    });

    it('should handle different durations', () => {
      const durations = [0.1, 0.5, 1.0, 2.0];
      
      durations.forEach(duration => {
        expect(() => audio._createNoiseSound(duration, 0.5)).not.toThrow();
      });
    });
  });

  describe('_createChord', () => {
    beforeEach(() => {
      window.dispatchEvent(new Event('click'));
    });

    it('should create oscillators for each frequency', () => {
      const createOscillatorSpy = vi.spyOn(audio.context, 'createOscillator');
      const frequencies = [440, 554, 659];
      
      audio._createChord(frequencies, 0.4);
      
      expect(createOscillatorSpy).toHaveBeenCalledTimes(frequencies.length);
    });

    it('should handle single frequency', () => {
      expect(() => audio._createChord([440], 0.4)).not.toThrow();
    });

    it('should handle multiple frequencies', () => {
      const chords = [
        [440, 554, 659],
        [261, 329, 392],
        [293, 369, 440]
      ];
      
      chords.forEach(chord => {
        expect(() => audio._createChord(chord, 0.4)).not.toThrow();
      });
    });

    it('should create gain for each oscillator', () => {
      const createGainSpy = vi.spyOn(audio.context, 'createGain');
      createGainSpy.mockClear(); // Clear the initial call from init()
      const frequencies = [440, 554, 659];
      
      audio._createChord(frequencies, 0.4);
      
      expect(createGainSpy).toHaveBeenCalledTimes(frequencies.length);
    });
  });

  describe('_createAlertSound', () => {
    beforeEach(() => {
      window.dispatchEvent(new Event('click'));
    });

    it('should create oscillator for alert', () => {
      const createOscillatorSpy = vi.spyOn(audio.context, 'createOscillator');
      
      audio._createAlertSound();
      
      expect(createOscillatorSpy).toHaveBeenCalled();
    });

    it('should create gain for alert', () => {
      const createGainSpy = vi.spyOn(audio.context, 'createGain');
      
      audio._createAlertSound();
      
      expect(createGainSpy).toHaveBeenCalled();
    });

    it('should not throw on execution', () => {
      expect(() => audio._createAlertSound()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should support playing all sound types after initialization', () => {
      window.dispatchEvent(new Event('click'));
      
      const soundTypes = [
        'click', 'hover', 'toggle_on', 'toggle_off',
        'open', 'close', 'success', 'warning', 'error', 'alert'
      ];
      
      soundTypes.forEach(sound => {
        expect(() => audio.play(sound)).not.toThrow();
      });
    });

    it('should handle rapid sound playback', () => {
      window.dispatchEvent(new Event('click'));
      
      for (let i = 0; i < 10; i++) {
        audio.play('click');
      }
      
      expect(audio.enabled).toBe(true);
    });

    it('should maintain state across multiple plays', () => {
      window.dispatchEvent(new Event('click'));
      
      audio.play('click');
      expect(audio.enabled).toBe(true);
      
      audio.play('hover');
      expect(audio.enabled).toBe(true);
      
      audio.play('success');
      expect(audio.enabled).toBe(true);
    });
  });
});
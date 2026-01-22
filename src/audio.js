export class AudioController {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.enabled = false;
    this.sounds = new Map();

    // Attempt to initialize on user interaction
    this._initHandler = () => {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        window.removeEventListener('click', this._initHandler);
        window.removeEventListener('keydown', this._initHandler);
        this.enabled = false;
        return;
      }

      if (!this.context) {
        this.context = new AudioCtor();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3; // Default volume
        this.masterGain.connect(this.context.destination);
        this.enabled = true;
        this._generateSounds();
      }
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      window.removeEventListener('click', this._initHandler);
      window.removeEventListener('keydown', this._initHandler);
    };

    window.addEventListener('click', this._initHandler);
    window.addEventListener('keydown', this._initHandler);
  }

  destroy() {
    // Explicitly remove listeners
    if (this._initHandler) {
      window.removeEventListener('click', this._initHandler);
      window.removeEventListener('keydown', this._initHandler);
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (_e) {
        // Ignore disconnect errors
      }
      this.masterGain = null;
    }
    this.sounds.clear();
    this._sharedNoiseBuffer = null;
    this.enabled = false;
  }

  _getNoiseBuffer() {
    if (!this._sharedNoiseBuffer && this.context) {
      const bufferSize = this.context.sampleRate * 2.0; // 2 seconds of noise
      this._sharedNoiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = this._sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this._sharedNoiseBuffer;
  }

  _generateSounds() {
    // We synthesize simple sounds so we don't need external assets
    this.sounds.set('click', () => this._createOscillatorSound('square', 800, 0.05, 0.1));
    this.sounds.set('hover', () => this._createOscillatorSound('sine', 400, 0.02, 0.05));
    this.sounds.set('toggle_on', () => this._createOscillatorSound('sine', 600, 0.1, 0.1));
    this.sounds.set('toggle_off', () => this._createOscillatorSound('sine', 300, 0.1, 0.1));
    this.sounds.set('open', () => this._createNoiseSound(0.2, 0.3));
    this.sounds.set('close', () => this._createNoiseSound(0.15, 0.2));
    this.sounds.set('success', () => this._createChord([440, 554, 659], 0.4)); // A major
    this.sounds.set('warning', () => this._createOscillatorSound('sawtooth', 200, 0.3, 0.3));
    this.sounds.set('error', () => this._createOscillatorSound('sawtooth', 100, 0.4, 0.4));
    this.sounds.set('alert', () => this._createAlertSound());

    // Enhanced alarm sounds for different priority levels (from game-features-list.md)
    this.sounds.set('alarm_low', () => this._createLowPriorityAlarm());      // Low = Beep
    this.sounds.set('alarm_medium', () => this._createMediumPriorityAlarm()); // Medium = Double beep
    this.sounds.set('alarm_high', () => this._createHighPriorityAlarm());    // High = Siren

    // Ambient/atmospheric sounds
    this.sounds.set('pump_hum', () => this._createPumpHum());
    this.sounds.set('steam_hiss', () => this._createSteamHiss());
    this.sounds.set('machinery', () => this._createMachineryLoop());

    // Disaster-related sounds
    this.sounds.set('fire_crackle', () => this._createFireCrackle());
    this.sounds.set('explosion', () => this._createExplosionSound());
    this.sounds.set('evacuation', () => this._createEvacuationAlarm());

    // Transaction/economy sounds
    this.sounds.set('cash_register', () => this._createCashRegister());
    this.sounds.set('contract_signed', () => this._createContractSigned());
  }

  play(name) {
    if (!this.enabled || !this.context || !this.sounds.has(name)) return;
    try {
        const soundGen = this.sounds.get(name);
        soundGen();
    } catch (e) {
        console.warn('Audio play error', e);
    }
  }

  _createOscillatorSound(type, freq, duration, vol) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.context.currentTime + duration);

    gain.gain.setValueAtTime(vol, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  _createNoiseSound(duration, vol) {
    const buffer = this._getNoiseBuffer();
    if (!buffer) return;

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(vol, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    // Simple lowpass filter to make it less harsh
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Play a random segment of the noise buffer
    const startTime = Math.random() * (buffer.duration - duration);
    noise.start(this.context.currentTime, startTime, duration);
  }

  _createChord(freqs, duration) {
    freqs.forEach(freq => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.context.currentTime + duration);
    });
  }

  _createAlertSound() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.context.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(600, this.context.currentTime + 0.4);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.6);
  }

  // Low priority alarm - single soft beep
  _createLowPriorityAlarm() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.context.currentTime);

    gain.gain.setValueAtTime(0.15, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.2);
  }

  // Medium priority alarm - double beep
  _createMediumPriorityAlarm() {
    const now = this.context.currentTime;

    for (let i = 0; i < 2; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now + i * 0.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.2, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.1);
    }
  }

  // High priority alarm - siren
  _createHighPriorityAlarm() {
    const now = this.context.currentTime;
    const duration = 1.2;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    // Siren oscillation between two frequencies
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
    osc.frequency.linearRampToValueAtTime(800, now + 0.6);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.9);
    osc.frequency.linearRampToValueAtTime(800, now + 1.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Pump hum - continuous low frequency
  _createPumpHum() {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, this.context.currentTime);

    gain.gain.setValueAtTime(0.03, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.5);
  }

  // Steam hiss - filtered noise
  _createSteamHiss() {
    const buffer = this._getNoiseBuffer();
    if (!buffer) return;

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    // Play random 0.4s segment
    const duration = 0.4;
    const startTime = Math.random() * (buffer.duration - duration);
    noise.start(this.context.currentTime, startTime, duration);
  }

  // Machinery loop - rhythmic pulsing
  _createMachineryLoop() {
    const now = this.context.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + (i % 2) * 20, now + i * 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.05, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.1);
    }
  }

  // Fire crackle - random pops
  _createFireCrackle() {
    const now = this.context.currentTime;

    for (let i = 0; i < 5; i++) {
      const delay = Math.random() * 0.3;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100 + Math.random() * 200, now + delay);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.08, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + delay);
      osc.stop(now + delay + 0.05);
    }
  }

  // Explosion - bass boom with noise
  _createExplosionSound() {
    const now = this.context.currentTime;

    // Bass boom
    const osc = this.context.createOscillator();
    const oscGain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);

    // Noise burst
    const buffer = this._getNoiseBuffer();
    if (buffer) {
      const noise = this.context.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const noiseGain = this.context.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      noise.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      const duration = 0.3;
      const startTime = Math.random() * (buffer.duration - duration);
      noise.start(now, startTime, duration);
    }
  }

  // Evacuation alarm - alternating tones
  _createEvacuationAlarm() {
    const now = this.context.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 660 : 880, now + i * 0.25);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.3, now + i * 0.25);
      gain.gain.linearRampToValueAtTime(0.01, now + i * 0.25 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.2);
    }
  }

  // Cash register - coin sound
  _createCashRegister() {
    const now = this.context.currentTime;

    const frequencies = [1800, 2200, 1800];
    frequencies.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.1);
    });
  }

  // Contract signed - pen scratch and stamp
  _createContractSigned() {
    // Pen scratch
    const bufferSize = this.context.sampleRate * 0.2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.1, this.context.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();

    // Stamp thud
    setTimeout(() => {
      if (!this.context) return;
      const osc = this.context.createOscillator();
      const stampGain = this.context.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.1);

      stampGain.gain.setValueAtTime(0.2, this.context.currentTime);
      stampGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

      osc.connect(stampGain);
      stampGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.context.currentTime + 0.1);
    }, 200);
  }

  // Set master volume (0-1)
  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  // Mute/unmute
  toggleMute() {
    if (!this.masterGain) return false;
    if (this.masterGain.gain.value > 0) {
      this._previousVolume = this.masterGain.gain.value;
      this.masterGain.gain.value = 0;
      return true; // Now muted
    }
      this.masterGain.gain.value = this._previousVolume || 0.3;
      return false; // Now unmuted
  }
}

export class AudioController {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.enabled = false;
    this.sounds = new Map();

    // Attempt to initialize on user interaction
    const init = () => {
      if (!this.context) {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3; // Default volume
        this.masterGain.connect(this.context.destination);
        this.enabled = true;
        this._generateSounds();
      }
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };

    window.addEventListener('click', init);
    window.addEventListener('keydown', init);
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
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

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

    noise.start();
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
}

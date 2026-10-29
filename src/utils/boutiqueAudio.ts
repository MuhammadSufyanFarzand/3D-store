// ============================================================================
// SAQIB VISUALS — PROCEDURAL WEB AUDIO BOUTIQUE SOUND & SFX ENGINE
// Zero external audio files required; 100% Web Audio API synthesis
// ============================================================================

class BoutiqueAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  private isAmbientPlaying: boolean = false;
  private lastHoverSoundTime: number = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore autoplay restrictions until user gesture
      });
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.028, now + 0.35);
    }
    if (!muted && !this.isAmbientPlaying) {
      this.startAmbientPad();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Starts a warm, ultra-subtle luxury boutique lounge harmonic pad in the background
   */
  public startAmbientPad() {
    if (this.isMuted || this.isAmbientPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.026, ctx.currentTime + 1.8);

      // Warm low-pass filter for velvet acoustic feel
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, ctx.currentTime);

      masterGain.connect( ctx.destination );
      filter.connect(masterGain);

      // Warm Fmaj9 / Dm11 luxury architectural chord frequencies
      const freqs = [110.0, 164.81, 220.0, 261.63, 329.63];
      const oscs: OscillatorNode[] = [];

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        // Subtle detune for lush chorus warmth
        osc.detune.setValueAtTime((idx - 2) * 4.5, ctx.currentTime);
        oscGain.gain.setValueAtTime(0.18 / freqs.length, ctx.currentTime);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscs.push(osc);
      });

      this.ambientGain = masterGain;
      this.ambientOscs = oscs;
      this.isAmbientPlaying = true;
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  /**
   * Plays a luxury brass boutique entrance bell chime + glass door hydraulic whoosh
   */
  public playStorefrontDoorChime() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Two-note luxury atelier brass chime (E5 -> B5 -> G#6 harmonic shimmer)
      const notes = [
        { freq: 659.25, delay: 0.0, dur: 1.6, gain: 0.09 },
        { freq: 987.77, delay: 0.16, dur: 1.9, gain: 0.085 },
        { freq: 1318.51, delay: 0.32, dur: 2.2, gain: 0.055 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now + n.delay);

        gain.gain.setValueAtTime(0.0001, now + n.delay);
        gain.gain.exponentialRampToValueAtTime(n.gain, now + n.delay + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.delay);
        osc.stop(now + n.delay + n.dur + 0.05);
      });

      // 2. Soft pneumatic glass door swing air whoosh
      const bufferSize = Math.floor(ctx.sampleRate * 0.55);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(280, now);
      bandpass.frequency.exponentialRampToValueAtTime(620, now + 0.25);
      bandpass.frequency.exponentialRampToValueAtTime(180, now + 0.55);
      bandpass.Q.setValueAtTime(2.2, now);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.0001, now);
      whooshGain.gain.linearRampToValueAtTime(0.035, now + 0.15);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.54);

      whiteNoise.connect(bandpass);
      bandpass.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whiteNoise.start(now);

      // Also start subtle background boutique pad once inside
      this.startAmbientPad();
    } catch {
      // Ignore
    }
  }

  /**
   * Plays a subtle metallic hanger slide / shelf hover tick when browsing pieces
   */
  public playHangerSlideSfx(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastHoverSoundTime < 90) return;
    this.lastHoverSoundTime = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 520 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.42, now + 0.065);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.032, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Plays a deep architectural camera rotation whoosh + brass click when rotating walls
   */
  public playWallRotateSfx() {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.14);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Ignore
    }
  }

  /**
   * Plays a tactile chandelier / spotlight mood switch chime
   */
  public playLightingToggleSfx(isNightMode: boolean) {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startFreq = isNightMode ? 740 : 440;
      const endFreq = isNightMode ? 440 : 880;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Ignore
    }
  }
}

export const boutiqueAudio = new BoutiqueAudioEngine();

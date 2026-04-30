'use client';

/**
 * Procedural 8-bit SFX synthesizer for Rollin' Tanks.
 * Uses the Web Audio API only — no external files, no deps.
 *
 * AudioContext requires a user gesture to start on most browsers, so we
 * lazily create + resume on first call to any sfx.* function. Calls
 * before the first gesture queue up but never throw.
 */

let ctx = null;
let masterGain = null;
let muted = false;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function noiseBuffer(duration = 0.3) {
  const c = getCtx();
  if (!c) return null;
  const sr = c.sampleRate;
  const len = Math.floor(sr * duration);
  const buf = c.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function envGain(start, attack, sustain, release) {
  const c = getCtx();
  if (!c) return null;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(start, t + attack);
  g.gain.linearRampToValueAtTime(start * 0.7, t + attack + sustain);
  g.gain.linearRampToValueAtTime(0, t + attack + sustain + release);
  return g;
}

function tone({ freq = 440, type = 'square', start = 0.3, attack = 0.005, sustain = 0.05, release = 0.1, freqEnd = null }) {
  const c = getCtx();
  if (!c || muted) return;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  if (freqEnd != null) {
    osc.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + attack + sustain + release);
  }
  const g = envGain(start, attack, sustain, release);
  if (!g) return;
  osc.connect(g).connect(masterGain);
  osc.start();
  osc.stop(c.currentTime + attack + sustain + release + 0.01);
}

function noiseBurst({ duration = 0.15, start = 0.4, bandpass = null, hpf = null, lpf = null }) {
  const c = getCtx();
  if (!c || muted) return;
  const buf = noiseBuffer(duration);
  if (!buf) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  let node = src;
  if (bandpass) {
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = bandpass.start;
    bp.Q.value = 2;
    if (bandpass.end != null) {
      bp.frequency.linearRampToValueAtTime(bandpass.end, c.currentTime + duration);
    }
    node.connect(bp);
    node = bp;
  }
  if (hpf) {
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hpf;
    node.connect(f);
    node = f;
  }
  if (lpf) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lpf;
    node.connect(f);
    node = f;
  }
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(start, c.currentTime + 0.005);
  g.gain.linearRampToValueAtTime(0, c.currentTime + duration);
  node.connect(g).connect(masterGain);
  src.start();
  src.stop(c.currentTime + duration + 0.01);
}

export const sfx = {
  /** Initialize/unlock the AudioContext on a user gesture. Safe to call repeatedly. */
  unlock() {
    getCtx();
  },

  setMuted(value) {
    muted = !!value;
  },

  isMuted() {
    return muted;
  },

  /** Lobby/menu blip. */
  uiBlip() {
    tone({ freq: 660, type: 'square', start: 0.18, attack: 0.005, sustain: 0.02, release: 0.04 });
  },

  /** Three quick clacks for dice tumbling. */
  dice() {
    const c = getCtx();
    if (!c || muted) return;
    [0, 0.07, 0.14].forEach((delay, i) => {
      setTimeout(() => {
        noiseBurst({ duration: 0.04, start: 0.5, bandpass: { start: 1500 + i * 200 } });
      }, delay * 1000);
    });
  },

  /** Cannon fire — descending square + noise tail. */
  shoot() {
    tone({ freq: 220, freqEnd: 80, type: 'square', start: 0.35, attack: 0.005, sustain: 0.04, release: 0.08 });
    setTimeout(() => {
      noiseBurst({ duration: 0.12, start: 0.25, lpf: 1200 });
    }, 30);
  },

  /** Whoosh during bullet flight. */
  whoosh(duration = 0.6) {
    noiseBurst({ duration, start: 0.18, bandpass: { start: 600, end: 1800 } });
  },

  /** Normal hit. */
  hit() {
    tone({ freq: 200, freqEnd: 50, type: 'sawtooth', start: 0.3, attack: 0.005, sustain: 0.04, release: 0.12 });
    noiseBurst({ duration: 0.1, start: 0.3, hpf: 800 });
  },

  /** King shot — bigger hit + triumphant arpeggio. */
  kingShot() {
    // Heavy thud
    tone({ freq: 80, freqEnd: 30, type: 'sawtooth', start: 0.4, attack: 0.005, sustain: 0.06, release: 0.2 });
    noiseBurst({ duration: 0.18, start: 0.35, hpf: 600 });
    // Major arpeggio (E5 G#5 B5 E6) — all "good" notes for the attacker
    const notes = [659, 831, 988, 1319];
    notes.forEach((f, i) => {
      setTimeout(() => {
        tone({ freq: f, type: 'square', start: 0.22, attack: 0.005, sustain: 0.05, release: 0.1 });
      }, 80 + i * 70);
    });
  },

  /** Explosion — pitched-noise sweep + sub-bass. */
  explode() {
    noiseBurst({ duration: 0.4, start: 0.45, bandpass: { start: 800, end: 100 } });
    tone({ freq: 60, freqEnd: 30, type: 'sine', start: 0.4, attack: 0.005, sustain: 0.1, release: 0.3 });
  },

  /** Ascending arpeggio for victory. */
  victory() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      setTimeout(() => {
        tone({ freq: f, type: 'square', start: 0.3, attack: 0.01, sustain: 0.1, release: 0.2 });
      }, i * 130);
    });
  },

  /** Descending minor arpeggio for defeat. */
  defeat() {
    const notes = [523, 440, 349, 262]; // C5 A4 F4 C4
    notes.forEach((f, i) => {
      setTimeout(() => {
        tone({ freq: f, type: 'triangle', start: 0.25, attack: 0.02, sustain: 0.15, release: 0.3 });
      }, i * 200);
    });
  },

  /** Highlight beat when it becomes your turn. */
  yourTurn() {
    tone({ freq: 880, type: 'square', start: 0.18, attack: 0.005, sustain: 0.04, release: 0.06 });
    setTimeout(() => {
      tone({ freq: 1320, type: 'square', start: 0.18, attack: 0.005, sustain: 0.04, release: 0.06 });
    }, 90);
  },
};

export default sfx;

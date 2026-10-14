// The site's music, generated live with Web Audio (no files to download): a
// slow, warm chord progression on soft pads with a few bell notes drifting
// over it, all through a long reverb. Hovering a project rings one more bell.

// shared with the showcase pages, so the visitor's choice carries over
const KEY = 'shaan-sound';
const store = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(KEY, v); } catch { /* no storage */ } },
};

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// Am9 – Fmaj7 – Cmaj7/E – G6, voiced low and open
const CHORDS = [
  [45, 52, 59, 60, 64, 71],
  [41, 48, 55, 57, 64, 69],
  [40, 48, 55, 59, 64, 67],
  [43, 50, 57, 59, 62, 64],
];
const BELLS = [69, 71, 72, 76, 79, 81, 84]; // A minor pentatonic, up high
const BAR = 8; // seconds per chord
const VOLUME = 0.6;

let ctx, master, bus, wet;
let on = false;
let next = 0;
let step = 0;
let timer = 0;
let sleep = 0;
const subs = new Set();

function impulse(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.ratio.value = 4;
  limiter.connect(ctx.destination);
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(limiter);
  const verb = ctx.createConvolver();
  verb.buffer = impulse(4.5);
  wet = ctx.createGain();
  wet.gain.value = 0.85;
  wet.connect(verb).connect(master);
  bus = ctx.createGain();
  bus.connect(master);
  bus.connect(wet);
}

// one chord: two detuned voices per note through a soft low-pass, swelling in
// and overlapping the next chord so the changes are seamless
function chord(notes, t) {
  notes.forEach((m, i) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650 + i * 110;
    filter.Q.value = 0.4;
    const g = ctx.createGain();
    const peak = i === 0 ? 0.05 : 0.026;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 2.6);
    g.gain.setValueAtTime(peak, t + BAR - 0.4);
    g.gain.linearRampToValueAtTime(0, t + BAR + 3.6);
    [-7, 7].forEach((detune) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = detune;
      o.connect(filter);
      o.start(t);
      o.stop(t + BAR + 4);
    });
    filter.connect(g).connect(bus);
  });
}

// a soft bell: a sine plus a quiet inharmonic partial, quick attack, long tail
function bell(f, t, level) {
  [1, 2.76].forEach((k, j) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f * k;
    const v = j ? level * 0.25 : level;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (j ? 1.2 : 3.2));
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 3.3);
  });
}

// schedules a little ahead of time, so timers firing late never cause gaps
function tick() {
  while (next < ctx.currentTime + 1.5) {
    chord(CHORDS[step % CHORDS.length], next);
    const count = 2 + Math.floor(Math.random() * 3);
    for (let k = 0; k < count; k++) {
      bell(hz(BELLS[Math.floor(Math.random() * BELLS.length)]), next + 1 + Math.random() * (BAR - 2), 0.03);
    }
    next += BAR;
    step++;
  }
}

function set(v) {
  on = v;
  store.set(v ? '1' : '0');
  if (v) {
    if (!ctx) build();
    clearTimeout(sleep);
    ctx.resume();
    if (!timer) {
      next = ctx.currentTime + 0.05;
      tick();
      timer = setInterval(tick, 400);
    }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(VOLUME, ctx.currentTime, 1.4);
  } else if (ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
    // once faded, stop scheduling and let the audio thread rest
    sleep = setTimeout(() => {
      clearInterval(timer);
      timer = 0;
      ctx.suspend();
    }, 2000);
  }
  subs.forEach((f) => f(on));
}

export const sound = {
  set,
  toggle: () => set(!on),
  get on() { return on; },
  // the visitor turned sound on last time (it still needs a click to start)
  wanted: () => store.get() === '1',
  subscribe(f) {
    subs.add(f);
    return () => subs.delete(f);
  },
  ping(i) {
    if (!on || !ctx) return;
    bell(hz(BELLS[i % BELLS.length]), ctx.currentTime + 0.01, 0.022);
  },
};

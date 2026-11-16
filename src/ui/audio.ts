// Tiny Web Audio synth. Prototype sounds are generated tones (docs/design/desk.md).
// Two buses: game sounds (the RPG and the desk) and apartment sounds (her). The headset muffles the apartment bus.
import { T } from '../config/tuning';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let aptBus: GainNode | null = null;
let aptFilter: BiquadFilterNode | null = null;
let gameBus: GainNode | null = null;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new AudioContext();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    aptFilter = ctx.createBiquadFilter(); aptFilter.type = 'lowpass'; aptFilter.frequency.value = 20000;
    aptBus = ctx.createGain(); aptBus.gain.value = 1;
    aptBus.connect(aptFilter); aptFilter.connect(master);
    gameBus = ctx.createGain(); gameBus.gain.value = 1; gameBus.connect(master);
  } catch { ctx = null; }
}

export function setHeadset(on: boolean) {
  if (!ctx || !aptBus || !aptFilter) return;
  aptBus.gain.setTargetAtTime(on ? T.HEADSET_APT_VOLUME : 1, ctx.currentTime, 0.05);
  aptFilter.frequency.setTargetAtTime(on ? 500 : 20000, ctx.currentTime, 0.05);
}

type Bus = 'game' | 'apt' | 'loud';
const out = (bus: Bus) => (bus === 'apt' ? aptBus : bus === 'loud' ? master : gameBus);

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3, when = 0, slideTo?: number, bus: Bus = 'game') {
  const dest = out(bus);
  if (!ctx || !dest) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(dest);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol: number, cutoff: number, when = 0, bus: Bus = 'game', type: BiquadFilterType = 'lowpass') {
  const dest = out(bus);
  if (!ctx || !dest) return;
  const t0 = ctx.currentTime + when;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t0);
}

export const sfx = {
  // Apartment bus (muffled by the headset).
  step(loud: number) { noise(0.09, 0.25 + loud * 0.6, 300 + loud * 300, 0, 'apt'); },
  handle() { tone(900, 0.05, 'square', 0.15, 0, undefined, 'apt'); tone(500, 0.08, 'square', 0.15, 0.06, undefined, 'apt'); },
  door() { tone(180, 0.5, 'sawtooth', 0.08, 0, 120, 'apt'); },
  apt(id: string) {
    if (id === 'tv') { for (let i = 0; i < 3; i++) tone(300 + Math.random() * 200, 0.12, 'triangle', 0.06, i * 0.15, undefined, 'apt'); noise(0.4, 0.08, 1500, 0.1, 'apt', 'bandpass'); }
    if (id === 'tea') tone(1200, 1.0, 'sine', 0.05, 0, 2200, 'apt');
    if (id === 'toilet') noise(0.9, 0.2, 600, 0, 'apt');
    if (id === 'shower') noise(1.4, 0.07, 3000, 0, 'apt', 'highpass');
    if (id === 'sleep') { tone(90, 0.9, 'sawtooth', 0.04, 0, 70, 'apt'); noise(0.9, 0.05, 250, 0.1, 'apt'); }
  },
  // Game bus.
  ring() { for (let i = 0; i < 4; i++) { tone(880, 0.08, 'sine', 0.2, i * 0.16); tone(660, 0.08, 'sine', 0.2, i * 0.16 + 0.08); } },
  ping() { tone(1320, 0.08, 'sine', 0.25); tone(1760, 0.12, 'sine', 0.2, 0.08); },
  hit() { tone(220, 0.06, 'square', 0.08, 0, 110); },
  crit() { tone(440, 0.1, 'square', 0.12, 0, 220); noise(0.08, 0.15, 2000); },
  ability() { tone(520, 0.12, 'triangle', 0.18, 0, 1040); },
  heal() { tone(660, 0.1, 'sine', 0.15); tone(990, 0.15, 'sine', 0.15, 0.08); },
  loot(r: number) { const base = [330, 392, 494, 587, 784][r]; for (let i = 0; i <= r; i++) tone(base * (1 + i * 0.25), 0.12, 'triangle', 0.15 + r * 0.03, i * 0.07); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.12, i * 0.08)); },
  bad() { tone(200, 0.25, 'sawtooth', 0.15, 0, 90); },
  good() { tone(660, 0.08, 'square', 0.12); tone(880, 0.12, 'square', 0.12, 0.07); },
  key() { tone(1200 + Math.random() * 200, 0.03, 'square', 0.05); },
  click() { tone(700, 0.03, 'square', 0.08); },
  hiss(loud: boolean) { noise(loud ? 0.7 : 0.35, loud ? 0.5 : 0.12, loud ? 6000 : 2500, 0, 'game', 'highpass'); tone(1800, 0.05, 'square', 0.1); },
  /** Real-life can sounds: tab click, then the gas. */
  canOpen() { tone(2400, 0.02, 'square', 0.12); tone(1500, 0.03, 'square', 0.1, 0.03); noise(0.45, 0.16, 3000, 0.05, 'game', 'highpass'); },
  /** Aluminium can hitting something. p = 0..1 impact strength. */
  clank(p: number) { const v = 0.05 + p * 0.18; tone(1900 + Math.random() * 900, 0.05, 'triangle', v); tone(3100 + Math.random() * 600, 0.04, 'square', v * 0.4, 0.01); noise(0.04, v * 0.6, 5000); },
  /** Bin rattle when a can drops in. */
  binDrop() { [0, 0.05, 0.11].forEach((w, i) => tone(1400 - i * 260, 0.06, 'triangle', 0.14, w)); noise(0.12, 0.12, 3500, 0.02); },
  buzz() { tone(110, 0.25, 'sawtooth', 0.12, 0); tone(110, 0.25, 'sawtooth', 0.12, 0.35); },
  flip() { noise(0.12, 0.15, 1200); tone(240, 0.06, 'square', 0.08, 0.1); },
  creak() { tone(140, 0.4, 'sawtooth', 0.04, 0, 210, 'apt'); },
  /** Phone on vibrate: a long rattling buzz for calls, a short double buzz for messages. */
  vibCall() { for (let i = 0; i < 14; i++) tone(148 + (i % 2) * 9, 0.05, 'sawtooth', 0.09, i * 0.05); noise(0.7, 0.05, 900); },
  vibMsg() { for (const w of [0, 0.22]) for (let i = 0; i < 3; i++) tone(162, 0.045, 'sawtooth', 0.09, w + i * 0.045); },
  /** Fullscreen mode switch: the monitor's faint relay click + a short hum drop. */
  monClick() { tone(1900, 0.012, 'square', 0.05); tone(95, 0.12, 'sine', 0.05, 0.01, 60); noise(0.03, 0.03, 2500, 0.005); },
  bark() { tone(420, 0.09, 'sawtooth', 0.14, 0, 300, 'apt'); tone(380, 0.12, 'sawtooth', 0.14, 0.14, 260, 'apt'); },
  whine() { tone(900, 0.5, 'sine', 0.06, 0, 1300, 'apt'); },
  lick() { noise(0.08, 0.1, 1800); },
  kiss() { tone(1600, 0.05, 'sine', 0.12); noise(0.05, 0.08, 4000, 0.02); },
  plug() { tone(300, 0.04, 'square', 0.15); tone(1200, 0.03, 'square', 0.1, 0.04); },
  gulp() { tone(160, 0.12, 'sine', 0.25, 0, 90); tone(120, 0.1, 'sine', 0.2, 0.12, 80); },
  // Jumpscare sting: loud dissonant stab, not muffled.
  sting() { [233, 247, 370, 392].forEach(f => tone(f, 0.6, 'sawtooth', 0.22, 0, undefined, 'loud')); noise(0.5, 0.5, 4000, 0, 'loud'); },
};

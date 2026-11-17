// Sound (docs/design/screen.md, Audio). Her and the desk play real samples (src/assets/sfx/, inlined into the build);
// the RPG's own blips stay generated tones, like the game on the monitor they come from.
// Buses: game (the RPG and the desk), apt (her: muffled by the headset) and loud (through the speakers, never muffled).
import { T } from '../config/tuning';
import { MIX, LOOP_SEC, LOOP_PAD, AMBIENCE, END_CUE } from '../data/sounds';
import { ROOM_DISTANCE } from '../data/apartment';
import type { Room } from '../core/state';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let aptBus: GainNode | null = null;
let aptFilter: BiquadFilterNode | null = null;
let gameBus: GainNode | null = null;

// ---------- the sample bank ----------

// Vite inlines these at build time; the headless sims (tsx, no Vite) get an empty bank and stay silent.
let baked: Record<string, string> = {};
let own: Record<string, string> = {};
try {
  baked = import.meta.glob('../assets/sfx/*.mp3', { eager: true, query: '?inline', import: 'default' }) as Record<string, string>;
  own = import.meta.glob('../assets/sfx/own/*.{mp3,ogg,wav,m4a}', { eager: true, query: '?inline', import: 'default' }) as Record<string, string>;
} catch { /* not under Vite */ }

/** cue -> data URLs (variants are name_0, name_1, ...). Your files in own/ replace a cue completely. */
function collect(): Record<string, { urls: string[]; own: boolean }> {
  const out: Record<string, { urls: string[]; own: boolean }> = {};
  const add = (files: Record<string, string>, isOwn: boolean) => {
    const seen = new Set<string>();
    for (const path of Object.keys(files).sort()) {
      const name = path.split('/').pop()!.replace(/\.[a-z0-9]+$/i, '');
      const cue = name.replace(/_\d+$/, '');
      if (isOwn && !seen.has(cue)) { out[cue] = { urls: [], own: true }; seen.add(cue); }
      (out[cue] ??= { urls: [], own: isOwn }).urls.push(files[path]);
    }
  };
  add(baked, false);
  add(own, true);
  return out;
}
const BANK = collect();
const buffers: Record<string, AudioBuffer[]> = {};
const loopAt: Record<string, [number, number]> = {};
const lastPick: Record<string, number> = {};
let loaded = 0;
let failed = 0;
/** For the debug board and tests. */
export const soundCues = () => Object.keys(BANK).sort();
export const soundStatus = () => ({ cues: Object.keys(BANK).length, files: Object.values(BANK).reduce((a, b) => a + b.urls.length, 0), loaded, failed });

function dataToBuffer(url: string): ArrayBuffer {
  const b64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function decode(c: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((ok, bad) => { const p = c.decodeAudioData(data, ok, bad); if (p && typeof p.catch === 'function') p.catch(bad); });
}

/** Where the loop sits inside a baked loop file: after the encoder's silence and our wrap-around pad. */
function findLoop(cue: string, b: AudioBuffer, isOwn: boolean): [number, number] {
  if (isOwn || !LOOP_SEC[cue]) return [0, b.duration];
  const d = b.getChannelData(0);
  let i = 0;
  while (i < d.length && Math.abs(d[i]) < 0.002) i++;
  const start = i / b.sampleRate + LOOP_PAD;
  return [start, Math.min(b.duration, start + LOOP_SEC[cue])];
}

async function loadBank(c: AudioContext) {
  await Promise.all(Object.entries(BANK).map(async ([cue, e]) => {
    const list: AudioBuffer[] = [];
    for (const u of e.urls) {
      try { list.push(await decode(c, dataToBuffer(u))); loaded++; } catch { failed++; }
    }
    if (list.length) { buffers[cue] = list; loopAt[cue] = findLoop(cue, list[0], e.own); }
  }));
}

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try {
    ctx = new AudioContext();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
    aptFilter = ctx.createBiquadFilter(); aptFilter.type = 'lowpass'; aptFilter.frequency.value = 20000;
    aptBus = ctx.createGain(); aptBus.gain.value = 1;
    aptBus.connect(aptFilter); aptFilter.connect(master);
    gameBus = ctx.createGain(); gameBus.gain.value = 1; gameBus.connect(master);
    void loadBank(ctx);
  } catch { ctx = null; }
}

export function setHeadset(on: boolean) {
  if (!ctx || !aptBus || !aptFilter) return;
  aptBus.gain.setTargetAtTime(on ? T.HEADSET_APT_VOLUME : 1, ctx.currentTime, 0.05);
  aptFilter.frequency.setTargetAtTime(on ? T.HEADSET_APT_LOWPASS : 20000, ctx.currentTime, 0.05);
}

type Bus = 'game' | 'apt' | 'loud';
const out = (bus: Bus) => (bus === 'apt' ? aptBus : bus === 'loud' ? master : gameBus);

interface PlayOpts { vol?: number; bus?: Bus; when?: number; room?: Room; lowpass?: number; jitter?: number; variant?: number }

/** Plays a sample cue. Returns false when it is not loaded (yet), so callers can fall back to a tone. */
export function play(cue: string, o: PlayOpts = {}): boolean {
  const list = buffers[cue];
  const dest = out(o.bus ?? 'game');
  if (!ctx || !dest || !list?.length) return false;
  let k = o.variant ?? Math.floor(Math.random() * list.length);
  if (o.variant === undefined && list.length > 1 && k === lastPick[cue]) k = (k + 1) % list.length;   // never the same step twice
  lastPick[cue] = k;
  const t0 = ctx.currentTime + (o.when ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = list[k];
  if (o.jitter) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * o.jitter;
  const g = ctx.createGain();
  let vol = (o.vol ?? 1) * (MIX[cue] ?? 0.5);
  let lowpass = o.lowpass;
  if (o.room) { const d = ROOM_DISTANCE[o.room]; vol *= T.APT_ROOM_GAIN[d]; lowpass = Math.min(lowpass ?? 20000, T.APT_ROOM_LOWPASS[d]); }
  g.gain.value = vol;
  let node: AudioNode = src;
  if (lowpass && lowpass < 16000) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; src.connect(f); node = f; }
  node.connect(g); g.connect(dest);
  src.start(t0);
  return true;
}

// ---------- her continuous sounds (TV, kettle, shower) ----------

let amb: { cue: string; room: Room; level: number; src: AudioBufferSourceNode; gain: GainNode } | null = null;

/** Keeps exactly one of her loops running. Call every frame with what should play (null = silence). */
export function ambience(cue: string | null, room: Room = 'living', level = 1) {
  if (!ctx || !aptBus) return;
  const now = ctx.currentTime;
  if (amb && amb.cue === cue && amb.room === room) {
    if (Math.abs(amb.level - level) > 0.02) { amb.level = level; amb.gain.gain.setTargetAtTime(ambVol(cue!, room, level), now, 0.3); }
    return;
  }
  if (amb) {
    const old = amb;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0, now + T.AMB_FADE_SEC);
    old.src.stop(now + T.AMB_FADE_SEC + 0.05);
    amb = null;
  }
  const b = cue ? buffers[cue]?.[0] : undefined;
  if (!cue || !b) return;                         // not decoded yet: the next frame tries again
  const [ls, le] = loopAt[cue] ?? [0, b.duration];
  const src = ctx.createBufferSource();
  src.buffer = b; src.loop = true; src.loopStart = ls; src.loopEnd = le;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = T.APT_ROOM_LOWPASS[ROOM_DISTANCE[room]];
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(ambVol(cue, room, level), now + T.AMB_FADE_SEC);
  src.connect(f); f.connect(g); g.connect(aptBus);
  src.start(now, ls + Math.random() * (le - ls));   // never starts the TV show at the same line
  amb = { cue, room, level, src, gain: g };
}
const ambVol = (cue: string, room: Room, level: number) => (MIX[cue] ?? 0.5) * T.APT_ROOM_GAIN[ROOM_DISTANCE[room]] * level;
export const stopAmbience = () => ambience(null);
/** For tests: what is looping now. */
export const ambienceNow = () => (amb ? { cue: amb.cue, room: amb.room, level: amb.level } : null);
export const loopPoints = () => ({ ...loopAt });
/** Which loop an activity has (for apartment.ts). */
export const ambienceFor = (activity: string) => AMBIENCE[activity] ?? null;

// ---------- generated tones (the RPG, phone UI, fallbacks) ----------

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

/** Bell-ish loot pings: more notes and more shimmer per rarity. Legendary gets its own fanfare. */
function lootTone(r: number) {
  const base = [330, 392, 494, 587][r];
  for (let i = 0; i <= r; i++) {
    const f = base * (1 + i * 0.25);
    tone(f, 0.16 + r * 0.03, 'triangle', 0.13 + r * 0.03, i * 0.07);
    tone(f * 2.76, 0.08, 'sine', 0.03 + r * 0.015, i * 0.07);
  }
  if (r >= 3) { tone(base / 2, 0.3, 'triangle', 0.12); noise(0.25, 0.06, 6000, 0.05, 'game', 'highpass'); }
}

let downAt = -1;

export const sfx = {
  // ----- her (apartment bus) -----
  /** Her footsteps. loud 0..1 (quiet room-to-room moves use the soft ones). */
  step(loud: number) {
    if (!play(loud < 0.3 ? 'stepsoft' : 'step', { bus: 'apt', vol: 0.35 + loud, lowpass: 700 + loud * 3200, jitter: 0.05 }))
      noise(0.09, 0.25 + loud * 0.6, 300 + loud * 300, 0, 'apt');
  },
  /** A step that the headset does not muffle (Earplugs of Peace). */
  stepClear(loud: number) { if (!play('step', { bus: 'game', vol: 0.25 + loud * 0.6, lowpass: 900 + loud * 2000, jitter: 0.05 })) noise(0.09, 0.15 + loud * 0.4, 300 + loud * 300, 0, 'game'); },
  handle() { if (!play('latch', { bus: 'apt' })) { tone(900, 0.05, 'square', 0.15, 0, undefined, 'apt'); tone(500, 0.08, 'square', 0.15, 0.06, undefined, 'apt'); } },
  door() { if (!play('door', { bus: 'apt' })) tone(180, 0.5, 'sawtooth', 0.08, 0, 120, 'apt'); },
  doorClose() { play('doorclose', { bus: 'apt' }); },
  /** She arrives at an activity. */
  aptStart(id: string, room: Room) { if (id === 'toilet') play('flush', { bus: 'apt', room }); },
  /** Every few seconds while she is at it (on top of the loop). */
  aptTick(id: string, room: Room) {
    if (id === 'tv' && Math.random() < T.TV_LAUGH_CHANCE) play('laugh', { bus: 'apt', room, vol: 0.7 + Math.random() * 0.5 });
    if (id === 'sleep' && Math.random() < T.SLEEP_BREATH_CHANCE) play('breath', { bus: 'apt', room });
  },
  /** The sound that ends each activity: credits, the kettle clicks off, the tap, the hair dryer, a goodbye. */
  endCue(id: string, room: Room) { const c = END_CUE[id]; if (c) play(c, { bus: 'apt', room }); },
  plates() { play('plate', { bus: 'apt', jitter: 0.04 }) || tone(2600 + Math.random() * 500, 0.05, 'triangle', 0.07, 0, undefined, 'apt'); },
  hum() { play('hum', { bus: 'apt', lowpass: 2400 }) || tone(440, 0.35, 'sine', 0.05, 0, 449, 'apt'); },
  creak() { play('creak', { bus: 'apt' }) || tone(140, 0.4, 'sawtooth', 0.04, 0, 210, 'apt'); },
  bark() { if (!play('bark', { bus: 'apt' })) { tone(420, 0.09, 'sawtooth', 0.14, 0, 300, 'apt'); tone(380, 0.12, 'sawtooth', 0.14, 0.14, 260, 'apt'); } },
  whine() { play('whine', { bus: 'apt', jitter: 0.05 }) || tone(900, 0.5, 'sine', 0.06, 0, 1300, 'apt'); },

  // ----- the desk -----
  ring() { for (let i = 0; i < 4; i++) { tone(880, 0.08, 'sine', 0.2, i * 0.16); tone(660, 0.08, 'sine', 0.2, i * 0.16 + 0.08); } },
  ping() { tone(1320, 0.08, 'sine', 0.25); tone(1760, 0.12, 'sine', 0.2, 0.08); },
  vibCall() { if (!play('buzz')) for (let i = 0; i < 14; i++) tone(148 + (i % 2) * 9, 0.05, 'sawtooth', 0.09, i * 0.05); },
  vibMsg() { if (!play('buzzmsg')) for (const w of [0, 0.22]) for (let i = 0; i < 3; i++) tone(162, 0.045, 'sawtooth', 0.09, w + i * 0.045); },
  key() { play('key', { jitter: 0.06 }) || tone(1200 + Math.random() * 200, 0.03, 'square', 0.05); },
  click() { tone(700, 0.03, 'square', 0.08); },
  hiss(_loud: boolean) { play('can') || noise(0.35, 0.12, 2500, 0, 'game', 'highpass'); },
  canOpen() { play('can') || noise(0.45, 0.16, 3000, 0.05, 'game', 'highpass'); },
  fridge() { play('fridge') || tone(180, 0.3, 'sawtooth', 0.06, 0, 120); },
  /** A can hits the bin. p 0..1 = how hard. */
  clank(p: number) { play('tin', { vol: 0.3 + p * 0.8, jitter: 0.08 }) || tone(1900 + Math.random() * 900, 0.05, 'triangle', 0.05 + p * 0.18); },
  binDrop() { play('bin') || noise(0.12, 0.12, 3500, 0.02); },
  gulp() { play('gulp', { jitter: 0.05 }) || tone(160, 0.12, 'sine', 0.25, 0, 90); },
  monClick() { tone(1900, 0.012, 'square', 0.05); tone(95, 0.12, 'sine', 0.05, 0.01, 60); noise(0.03, 0.03, 2500, 0.005); },
  lick() { noise(0.08, 0.1, 1800); },
  kiss() { tone(1600, 0.05, 'sine', 0.12); noise(0.05, 0.08, 4000, 0.02); },
  plug() { tone(300, 0.04, 'square', 0.15); tone(1200, 0.03, 'square', 0.1, 0.04); },
  buzz() { tone(110, 0.25, 'sawtooth', 0.12, 0); tone(110, 0.25, 'sawtooth', 0.12, 0.35); },
  flip() { noise(0.12, 0.15, 1200); tone(240, 0.06, 'square', 0.08, 0.1); },

  // ----- the RPG (game bus) -----
  hit() { tone(220, 0.06, 'square', 0.08, 0, 110); },
  crit() { tone(440, 0.1, 'square', 0.12, 0, 220); noise(0.08, 0.15, 2000); },
  ability() { tone(520, 0.12, 'triangle', 0.18, 0, 1040); },
  heal() { tone(660, 0.1, 'sine', 0.15); tone(990, 0.15, 'sine', 0.15, 0.08); },
  loot(r: number) { if (r >= 4) sfx.legendary(); else lootTone(Math.max(0, r)); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.12, i * 0.08)); },
  bad() { tone(200, 0.25, 'sawtooth', 0.15, 0, 90); },
  good() { tone(660, 0.08, 'square', 0.12); tone(880, 0.12, 'square', 0.12, 0.07); },
  coin() { play('coins', { variant: 1 }) || (tone(1320, 0.05, 'square', 0.1), tone(1760, 0.12, 'square', 0.1, 0.06)); },
  windup() { tone(110, 1.4, 'sawtooth', 0.12, 0, 330, 'loud'); tone(55, 1.4, 'square', 0.08, 0, 110, 'loud'); },
  slam() { if (!play('slam', { bus: 'loud' })) { tone(70, 0.5, 'sawtooth', 0.25, 0, 35, 'loud'); noise(0.4, 0.4, 900, 0, 'loud'); } },
  // Audio-first: each of these must be recognisable with Excel covering the screen.
  legendary() { if (!play('legendary')) [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, 'square', 0.14, i * 0.07)); },
  bagFull() { play('bagfull') || tone(330, 0.2, 'square', 0.1, 0, 220); },
  goblin() { play('goblin') || [1200, 1400, 1200, 1500].forEach((f, i) => tone(f, 0.05, 'square', 0.08, i * 0.08)); },
  goblinCatch() { play('goblincatch') || sfx.good(); },
  goblinLost() { play('goblinlost') || tone(600, 0.3, 'triangle', 0.08, 0, 300); },
  /** A hero goes down (once per moment, even when a slam drops three). */
  down() { const now = ctx?.currentTime ?? 0; if (now - downAt < 0.4) return; downAt = now; play('down') || sfx.bad(); },
  enrage() { play('enrage', { bus: 'loud' }) || tone(80, 0.8, 'sawtooth', 0.2, 0, 60, 'loud'); },
  /** Party wipe: wah wah wah waaah, then he slams the desk (the Noise echo). */
  wipe() { if (!play('wipe')) [233, 220, 208, 196].forEach((f, i) => tone(f, 0.35, 'sawtooth', 0.12, i * 0.36)); play('slam', { bus: 'loud', when: 1.7, vol: 0.8 }); },
  /** Caught: only for her (the boss enrage has its own roar now). */
  sting() { [233, 247, 370, 392].forEach(f => tone(f, 0.6, 'sawtooth', 0.22, 0, undefined, 'loud')); noise(0.5, 0.5, 4000, 0, 'loud'); },
};

/** Debug board (F1): play any cue as it would sound next door. */
export function audition(cue: string) {
  initAudio();
  if (LOOP_SEC[cue]) { ambience(amb?.cue === cue ? null : cue, 'living'); return; }
  play(cue);
}

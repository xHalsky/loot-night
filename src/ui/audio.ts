// Sound (docs/design/screen.md, Audio). Her and the desk play real samples (src/assets/sfx/, inlined into the build);
// the RPG's own blips stay generated tones, like the game on the monitor they come from.
// Buses: game (the RPG and the desk), apt (her, beyond your door: muffled while it is shut, #158, and by the headset),
// room (in your room: the dog, your own door; the headset only) and loud (through the speakers, never muffled).
import { T } from '../config/tuning';
import { MIX, LOOP_SEC, LOOP_PAD, AMBIENCE, END_CUE } from '../data/sounds';
import type { Room } from '../core/state';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let aptBus: GainNode | null = null;     // her side of the door
let doorLP: BiquadFilterNode | null = null, doorGain: GainNode | null = null;   // the door: shut, it muffles her
let roomBus: GainNode | null = null;    // your side of the door
let hsIn: GainNode | null = null, hsFilter: BiquadFilterNode | null = null;   // the headset over both
let gameBus: GainNode | null = null;
let doorNow = -1;

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
    hsIn = ctx.createGain(); hsIn.gain.value = 1;
    hsFilter = ctx.createBiquadFilter(); hsFilter.type = 'lowpass'; hsFilter.frequency.value = 20000;
    hsIn.connect(hsFilter); hsFilter.connect(master);
    doorLP = ctx.createBiquadFilter(); doorLP.type = 'lowpass'; doorLP.frequency.value = T.DOOR_SHUT_LOWPASS; doorLP.Q.value = 0.5;
    doorGain = ctx.createGain(); doorGain.gain.value = T.DOOR_SHUT_GAIN;
    aptBus = ctx.createGain(); aptBus.gain.value = 1;
    aptBus.connect(doorLP); doorLP.connect(doorGain); doorGain.connect(hsIn);
    roomBus = ctx.createGain(); roomBus.gain.value = 1; roomBus.connect(hsIn);
    doorNow = 0; doorTo = { lowpass: T.DOOR_SHUT_LOWPASS, gain: T.DOOR_SHUT_GAIN };
    gameBus = ctx.createGain(); gameBus.gain.value = 1; gameBus.connect(master);
    void loadBank(ctx);
  } catch { ctx = null; }
}

export function setHeadset(on: boolean) {
  if (!ctx || !hsIn || !hsFilter) return;
  hsIn.gain.setTargetAtTime(on ? T.HEADSET_APT_VOLUME : 1, ctx.currentTime, 0.05);
  hsFilter.frequency.setTargetAtTime(on ? T.HEADSET_APT_LOWPASS : 20000, ctx.currentTime, 0.05);
}

/** How open your door is, 0 shut .. 1 open (a peek's crack opens it all the way for sound; leaning in; her in the
 *  doorway). Shut, her side comes through low and dull (#158): a peek hears what she is doing, clear. Every frame. */
export function setDoorOpen(open: number) {
  if (!ctx || !doorLP || !doorGain) return;
  const o = Math.max(0, Math.min(1, open));
  if (Math.abs(o - doorNow) < 0.01) return;
  doorNow = o;
  const t = ctx.currentTime;
  doorTo = { lowpass: T.DOOR_SHUT_LOWPASS * (20000 / T.DOOR_SHUT_LOWPASS) ** o, gain: T.DOOR_SHUT_GAIN + (1 - T.DOOR_SHUT_GAIN) * o };
  doorLP.frequency.setTargetAtTime(doorTo.lowpass, t, T.DOOR_SOUND_SEC);
  doorGain.gain.setTargetAtTime(doorTo.gain, t, T.DOOR_SOUND_SEC);
}
let doorTo = { lowpass: 0, gain: 0 };
/** For the tests: where the door's sound is going (its low-pass and gain glide there over DOOR_SOUND_SEC). */
export const doorSound = () => (doorLP && doorGain ? { ...doorTo, open: doorNow } : null);

type Bus = 'game' | 'apt' | 'room' | 'loud';
const out = (bus: Bus) => (bus === 'apt' ? aptBus : bus === 'room' ? roomBus : bus === 'loud' ? master : gameBus);

interface PlayOpts { vol?: number; bus?: Bus; when?: number; lowpass?: number; jitter?: number; variant?: number; pan?: number }

/** The cues started lately, newest last (for the tests: test/aojsound.py). */
const heard: string[] = [];
export const soundLog = (clear = false) => { const out = heard.slice(); if (clear) heard.length = 0; return out; };

/** Starts a sample cue; returns its source and gain (to stop it), or null when it is not loaded (yet). */
function start(cue: string, o: PlayOpts = {}): { src: AudioBufferSourceNode; g: GainNode } | null {
  const list = buffers[cue];
  const dest = out(o.bus ?? 'game');
  if (!ctx || !dest || !list?.length) return null;
  let k = o.variant != null ? o.variant % list.length : Math.floor(Math.random() * list.length);
  if (o.variant == null && list.length > 1 && k === lastPick[cue]) k = (k + 1) % list.length;   // never the same step twice
  lastPick[cue] = k;
  const t0 = ctx.currentTime + (o.when ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = list[k];
  if (o.jitter) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * o.jitter;
  const g = ctx.createGain();
  const vol = (o.vol ?? 1) * (MIX[cue] ?? 0.5);   // no room makes her quieter or duller (#158): the door does, and you find her by what you hear
  const lowpass = o.lowpass;
  g.gain.value = vol;
  let node: AudioNode = src;
  if (lowpass && lowpass < 16000) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; src.connect(f); node = f; }
  node.connect(g);
  if (o.pan) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(dest); }   // the RPG: the party left, the enemies right
  else g.connect(dest);
  src.start(t0);
  heard.push(cue); if (heard.length > 300) heard.shift();
  return { src, g };
}

/** Plays a sample cue. Returns false when it is not loaded (yet), so callers can fall back to a tone. */
export function play(cue: string, o: PlayOpts = {}): boolean { return !!start(cue, o); }

// ---------- timeline-locked sources (the launch, #127) ----------

/** A source started at an offset into its cue, for sounds locked to a timeline (the launch's cue sheet, its theme and
 *  its rain): the launch stops them on pause and restarts them where its clock says. */
export interface TimedSrc { cue: string; started: number; offset: number; gain: GainNode; src: AudioBufferSourceNode; stop(fade?: number): void }
/** How many files a cue has (0 = not loaded yet). */
export const cueVariants = (cue: string) => buffers[cue]?.length ?? 0;
/** A cue's length in seconds (a loop's: its loop), or -1 when it is not loaded. */
export function cueLen(cue: string, k = 0): number { const b = buffers[cue]?.[k]; if (!b) return -1; if (LOOP_SEC[cue]) { const [a, e] = loopAt[cue]; return e - a; } return b.duration; }
export const audioTime = () => (ctx ? ctx.currentTime : 0);
export function startAt(cue: string, k: number, offset: number, vol = 1): TimedSrc | null {
  const b = buffers[cue]?.[k], dest = out('game');
  if (!ctx || !dest || !b) return null;
  const src = ctx.createBufferSource(); src.buffer = b;
  let off = Math.max(0, offset);
  if (LOOP_SEC[cue]) { const [ls, le] = loopAt[cue]; src.loop = true; src.loopStart = ls; src.loopEnd = le; off = ls + (off % (le - ls)); }
  else if (off >= b.duration) return null;
  const g = ctx.createGain(); g.gain.value = vol * (MIX[cue] ?? 0.5);
  src.connect(g); g.connect(dest);
  const now = ctx.currentTime; src.start(now, off);
  const c = ctx;
  return { cue, started: now, offset: off, gain: g, src, stop(fade = 0.03) { try { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + fade); src.stop(t + fade + 0.02); } catch { /* already stopped */ } } };
}
/** Sets a timed source's level (a loop's fade in and out), smoothed a little. */
export function setTimedVol(h: TimedSrc, vol: number) { if (ctx) h.gain.gain.setTargetAtTime(vol * (MIX[h.cue] ?? 0.5), ctx.currentTime, 0.03); }

// ---------- her continuous sounds (TV, kettle, shower) ----------

let amb: { cue: string; room: Room; level: number; src: AudioBufferSourceNode; gain: GainNode } | null = null;

/** Keeps exactly one of her loops running. Call every frame with what should play (null = silence). */
export function ambience(cue: string | null, room: Room = 'living', level = 1) {
  if (!ctx || !aptBus) return;
  const now = ctx.currentTime;
  if (amb && amb.cue === cue && amb.room === room) {
    if (Math.abs(amb.level - level) > 0.02) { amb.level = level; amb.gain.gain.setTargetAtTime(ambVol(cue!, level), now, 0.3); }
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
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(ambVol(cue, level), now + T.AMB_FADE_SEC);
  src.connect(g); g.connect(aptBus);   // through the door, like the rest of her (#158)
  src.start(now, ls + Math.random() * (le - ls));   // never starts the TV show at the same line
  amb = { cue, room, level, src, gain: g };
}
const ambVol = (cue: string, level: number) => (MIX[cue] ?? 0.5) * level;   // the same in every room (#158)

// ---------- the RPG's music (#159) ----------

let mus: { cue: string; level: number; src: AudioBufferSourceNode; gain: GainNode } | null = null;

/** Keeps the RPG's music going: call every frame with the track that fits (null: none). level 0..1: 0 while paused
 *  (it keeps its place). A new track crossfades in from its loop's start. */
export function music(cue: string | null, level = 1) {
  if (!ctx || !gameBus) return;
  const now = ctx.currentTime;
  if (mus && mus.cue === cue) {
    if (Math.abs(mus.level - level) > 0.01) { mus.level = level; mus.gain.gain.setTargetAtTime((MIX[cue!] ?? 0.3) * level, now, 0.15); }
    return;
  }
  if (mus) {
    const old = mus;
    old.gain.gain.cancelScheduledValues(now);
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0, now + T.MUSIC_FADE_SEC);
    old.src.stop(now + T.MUSIC_FADE_SEC + 0.05);
    mus = null;
  }
  const b = cue ? buffers[cue]?.[0] : undefined;
  if (!cue || !b) return;                         // not decoded yet: the next frame tries again
  const [ls, le] = loopAt[cue] ?? [0, b.duration];
  const src = ctx.createBufferSource();
  src.buffer = b; src.loop = true; src.loopStart = ls; src.loopEnd = le;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime((MIX[cue] ?? 0.3) * level, now + T.MUSIC_FADE_SEC);
  src.connect(g); g.connect(gameBus);
  src.start(now, ls);
  mus = { cue, level, src, gain: g };
}
/** For tests: the track playing and its level. */
export const musicNow = () => (mus ? { cue: mus.cue, level: mus.level } : null);
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

// ---------- the RPG's helpers (#155) ----------
const PAN_FOE = 0.22, PAN_PARTY = -0.22;
const BOSS_MOVE = new Set(['smash', 'toll', 'execute']);   // the bosses' moves come through the speakers
const lastAt: Record<string, number> = {};
const dieNext: Record<string, number> = {};
/** An RPG cue heard at most once per `gap` s (a Fire hitting five, a swarm biting five times). True when it played or
 *  was just heard; false when it is not loaded (the caller's tone then). */
function rpg(cue: string, o: PlayOpts = {}, gap = 0.05): boolean {
  if (!ctx || !buffers[cue]?.length) return false;
  const now = ctx.currentTime;
  if (now - (lastAt[cue] ?? -9) < gap) return true;
  lastAt[cue] = now;
  return play(cue, o);
}
/** The wind-ups playing, by who makes them. */
const winds = new Map<number, { src: AudioBufferSourceNode; g: GainNode }>();
function windStop(uid: number, fade = 0.05) {
  const w = winds.get(uid);
  if (!w || !ctx) return;
  winds.delete(uid);
  const t = ctx.currentTime;
  w.g.gain.cancelScheduledValues(t); w.g.gain.setValueAtTime(w.g.gain.value, t); w.g.gain.linearRampToValueAtTime(0, t + fade);
  try { w.src.stop(t + fade + 0.02); } catch { /* already stopped */ }
}

export const sfx = {
  // ----- her (apartment bus) -----
  /** Her footsteps. loud 0..1 (quiet room-to-room moves use the soft ones). */
  step(loud: number) {
    if (!play(loud < 0.3 ? 'stepsoft' : 'step', { bus: 'apt', vol: 0.35 + loud, lowpass: 700 + loud * 3200, jitter: 0.05 }))
      noise(0.09, 0.25 + loud * 0.6, 300 + loud * 300, 0, 'apt');
  },
  /** A step that the headset does not muffle (Earplugs of Peace). */
  stepClear(loud: number) { if (!play('step', { bus: 'game', vol: 0.25 + loud * 0.6, lowpass: 900 + loud * 2000, jitter: 0.05 })) noise(0.09, 0.15 + loud * 0.4, 300 + loud * 300, 0, 'game'); },
  handle() { if (!play('latch', { bus: 'room' })) { tone(900, 0.05, 'square', 0.15, 0, undefined, 'room'); tone(500, 0.08, 'square', 0.15, 0.06, undefined, 'room'); } },   // your door's own handle: in your room
  door() { if (!play('door', { bus: 'room' })) tone(180, 0.5, 'sawtooth', 0.08, 0, 120, 'room'); },
  doorClose() { play('doorclose', { bus: 'room' }); },
  /** She arrives at an activity. */
  aptStart(id: string, _room: Room) { if (id === 'toilet') play('flush', { bus: 'apt' }); if (id === 'bath') play('tap', { bus: 'apt' }); },   // the bath: the tap runs as she fills it
  /** Every few seconds while she is at it (on top of the loop). */
  aptTick(id: string, _room: Room) {
    if (id === 'tv' && Math.random() < T.TV_LAUGH_CHANCE) play('laugh', { bus: 'apt', vol: 0.7 + Math.random() * 0.5 });
    if (id === 'sleep' && Math.random() < T.SLEEP_BREATH_CHANCE) play('breath', { bus: 'apt' });
  },
  /** The sound that ends each activity: credits, the kettle clicks off, the tap, the hair dryer, a goodbye. */
  endCue(id: string, _room: Room) { const c = END_CUE[id]; if (c) play(c, { bus: 'apt' }); },
  plates() { play('plate', { bus: 'apt', jitter: 0.04 }) || tone(2600 + Math.random() * 500, 0.05, 'triangle', 0.07, 0, undefined, 'apt'); },
  hum() { play('hum', { bus: 'apt', lowpass: 2400 }) || tone(440, 0.35, 'sine', 0.05, 0, 449, 'apt'); },
  /** Her voice calling you: 0 "babe?" (the tease), 1 "baaabe.", 2 "babe, towel!", 3 "babe, wine?" (from the bathroom). */
  babe(k: number, _room?: Room) { play('babe', { bus: 'apt', variant: k }) || tone(520, 0.3, 'sine', 0.05, 0, 600, 'apt'); },
  creak() { play('creak', { bus: 'room' }) || tone(140, 0.4, 'sawtooth', 0.04, 0, 210, 'room'); },   // your door
  bark() { if (!play('bark', { bus: 'room' })) { tone(420, 0.09, 'sawtooth', 0.14, 0, 300, 'room'); tone(380, 0.12, 'sawtooth', 0.14, 0.14, 260, 'room'); } },   // the dog is at your desk
  whine() { play('whine', { bus: 'room', jitter: 0.05 }) || tone(900, 0.5, 'sine', 0.06, 0, 1300, 'room'); },

  // ----- the desk -----
  ring() { for (let i = 0; i < 4; i++) { tone(880, 0.08, 'sine', 0.2, i * 0.16); tone(660, 0.08, 'sine', 0.2, i * 0.16 + 0.08); } },
  ping() { tone(1320, 0.08, 'sine', 0.25); tone(1760, 0.12, 'sine', 0.2, 0.08); },
  chatIn() { tone(1175, 0.04, 'sine', 0.12); tone(1568, 0.06, 'sine', 0.09, 0.04); },   // a bubble lands in Monday's chat (#102): soft, they come fast
  // the smart home (#57): synthesised until they get files
  doorbell() { tone(784, 0.45, 'sine', 0.16, 0, undefined, 'apt'); tone(622, 0.7, 'sine', 0.16, 0.42, undefined, 'apt'); },
  timer() { for (let k = 0; k < 3; k++) tone(2093, 0.07, 'square', 0.05, k * 0.18, undefined, 'apt'); },
  vacuum() { noise(1.6, 0.05, 900, 0, 'apt'); tone(118, 1.6, 'sawtooth', 0.025, 0, 126, 'apt'); },
  vibCall() { if (!play('buzz')) for (let i = 0; i < 14; i++) tone(148 + (i % 2) * 9, 0.05, 'sawtooth', 0.09, i * 0.05); },
  vibMsg() { if (!play('buzzmsg')) for (const w of [0, 0.22]) for (let i = 0; i < 3; i++) tone(162, 0.045, 'sawtooth', 0.09, w + i * 0.045); },
  key() { play('key', { jitter: 0.06 }) || tone(1200 + Math.random() * 200, 0.03, 'square', 0.05); },
  click() { tone(700, 0.03, 'square', 0.08); },
  // Q4 (#55): every action has its own sound
  q4Sum() { tone(1100, 0.025, 'square', 0.07); tone(1650, 0.04, 'triangle', 0.06, 0.03); noise(0.03, 0.05, 3500, 0.01); },
  q4Stamp() { tone(120, 0.12, 'sine', 0.35, 0, 60); noise(0.08, 0.2, 900); tone(1650, 0.06, 'triangle', 0.08, 0.06); },
  q4Tick() { tone(2400 + Math.random() * 300, 0.012, 'square', 0.045); },
  q4Clack() { for (let i = 0; i < 7; i++) { tone(900 + Math.random() * 500, 0.015, 'square', 0.06, i * 0.08); noise(0.02, 0.06, 2200, i * 0.08); } },
  q4Whir() { tone(220, 0.5, 'triangle', 0.06, 0, 520); },
  q4Promo() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.14, 'square', 0.1, i * 0.07)); noise(0.3, 0.05, 5000, 0.35); },
  hiss(_loud: boolean) { play('can') || noise(0.35, 0.12, 2500, 0, 'game', 'highpass'); },
  canOpen() { play('can') || noise(0.45, 0.16, 3000, 0.05, 'game', 'highpass'); },
  fridge() { play('fridge') || tone(180, 0.3, 'sawtooth', 0.06, 0, 120); },
  /** A can hits the bin. p 0..1 = how hard. */
  clank(p: number) { play('tin', { vol: 0.3 + p * 0.8, jitter: 0.08 }) || tone(1900 + Math.random() * 900, 0.05, 'triangle', 0.05 + p * 0.18); },
  binDrop() { play('bin') || noise(0.12, 0.12, 3500, 0.02); },
  gulp() { play('gulp', { jitter: 0.05 }) || tone(160, 0.12, 'sine', 0.25, 0, 90); },
  // the Goblin Fuel break (#61): drawer runners, the tab's pop, spills
  drawerSlide(v: number) { noise(0.07, 0.03 + v * 0.05, 700 + v * 900); },
  drawerThunk() { tone(90, 0.09, 'sine', 0.3, 0, 55); noise(0.05, 0.08, 900); },
  pop() { tone(1500, 0.02, 'square', 0.14); tone(220, 0.07, 'sine', 0.35, 0.005, 70); noise(0.04, 0.18, 4500, 0, 'game', 'highpass'); },
  tabCreak() { tone(2400 + Math.random() * 600, 0.015, 'square', 0.03); },
  splash() { noise(0.09, 0.07, 1600 + Math.random() * 800); },
  canOnDesk() { play('tin', { vol: 0.25, jitter: 0.05 }) || tone(1400, 0.04, 'triangle', 0.1); tone(140, 0.06, 'sine', 0.2, 0, 90); },
  monClick() { tone(1900, 0.012, 'square', 0.05); tone(95, 0.12, 'sine', 0.05, 0.01, 60); noise(0.03, 0.03, 2500, 0.005); },
  lick() { noise(0.08, 0.1, 1800); },
  kiss() { tone(1600, 0.05, 'sine', 0.12); noise(0.05, 0.08, 4000, 0.02); },
  plug() { tone(300, 0.04, 'square', 0.15); tone(1200, 0.03, 'square', 0.1, 0.04); },
  buzz() { tone(110, 0.25, 'sawtooth', 0.12, 0); tone(110, 0.25, 'sawtooth', 0.12, 0.35); },
  flip() { noise(0.12, 0.15, 1200); tone(240, 0.06, 'square', 0.08, 0.1); },

  // ----- the RPG (game bus): Age of Judgment's own sounds (#155), console samples (tools/sfx/aoj_sfx.py). The tones
  // only play until the bank has loaded. The party sits left in the stereo field, the enemies right. -----
  /** A blow lands on an enemy: the weapon's own (slash, stab, bolt, smite, bash, backstab, fire, frost); a crit's crunch
   *  over it. 'none': the cast has its own sound (Cataclysm). */
  strike(kind: string, crit: boolean) {
    if (kind === 'none') return;
    if (!rpg('rpg_' + kind, { pan: PAN_FOE, vol: crit ? 1.15 : 1 }, 0.045)) { if (crit) { tone(440, 0.1, 'square', 0.12, 0, 220); noise(0.08, 0.15, 2000); } else tone(220, 0.06, 'square', 0.08, 0, 110); }
    if (crit) rpg('rpg_crit', { pan: PAN_FOE }, 0.06);
  },
  /** An enemy's blow on a hero: steel on mail, a bite (Ironwings, Cherubs), a hex (the Confessor). */
  hurt(kind: 'hurt' | 'bite' | 'hex') { rpg('rpg_' + kind, { pan: PAN_PARTY }, 0.06) || tone(160, 0.06, 'square', 0.06, 0, 90); },
  /** A miss: Smoke Bomb, a dodge, a drowsy swing. */
  whiff(party = true) { rpg('rpg_whiff', { pan: party ? PAN_PARTY : PAN_FOE }, 0.08); },
  /** A skill or an ultimate: each has its own (taunt, backstab, smoke, mend, ward, laststand, heist, cataclysm, miracle). */
  skill(id: string) { rpg('rpg_' + id, {}, 0.05) || tone(520, 0.12, 'triangle', 0.18, 0, 1040); },
  /** The Priest heals one hero. */
  healOne() { rpg('rpg_heal', { pan: PAN_PARTY }, 0.2) || (tone(660, 0.1, 'sine', 0.15), tone(990, 0.15, 'sine', 0.15, 0.08)); },
  /** A hero back on his feet (the shrine, a feather). */
  revive() { rpg('rpg_revive', {}, 0.3) || (tone(660, 0.1, 'sine', 0.15), tone(990, 0.15, 'sine', 0.15, 0.08)); },
  /** The Confessor mends one of them. */
  darkMend() { rpg('rpg_darkmend', { pan: PAN_FOE }, 0.4); },
  shieldBreak() { rpg('rpg_shieldbreak', { pan: PAN_FOE }) || (tone(440, 0.1, 'square', 0.12, 0, 220), noise(0.08, 0.15, 2000)); },
  /** A mark cashed in (Shatter, Backstab on Stagger, Fire on Stagger). */
  combo() { rpg('rpg_combo', { pan: PAN_FOE }, 0.08) || tone(880, 0.12, 'square', 0.1, 0, 1320); },
  /** A hero levels up (several at once: heard once). */
  levelUp() { rpg('rpg_levelup', {}, 0.4) || [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.12, i * 0.08)); },
  /** Not now (a skill not ready, the wrong slot, locked, too poor): a latch that will not give. */
  refuse() { rpg('rpg_refuse', {}, 0.08) || tone(200, 0.25, 'sawtooth', 0.15, 0, 90); },
  /** The realm's own buttons (the town's tabs, the tree, the heroes, a service). */
  ui() { rpg('rpg_ui', {}, 0.03) || tone(700, 0.03, 'square', 0.08); },
  /** A named RPG cue with nothing else to it: swap, page, pickup, equip, unequip, drop, lock, gold, sell, souls, list,
   *  build, tree, respec, curio, pick, chest, groan, curse, sneak, withdraw, floor; loud: through the speakers (a crash,
   *  the potion rack: they make Noise). */
  aoj(cue: string, loud = false) { rpg('rpg_' + cue, loud ? { bus: 'loud' } : {}, 0.05) || tone(700, 0.03, 'square', 0.08); },
  /** A big move winds up (smash, toll, execute: the bosses; hook, shove: the line-breakers): its sound runs for the
   *  wind-up and is cut where the move lands, is stopped or its maker dies. */
  windup(move: string, uid: number) {
    windStop(uid);
    const w = start('rpg_wind_' + move, { bus: BOSS_MOVE.has(move) ? 'loud' : 'game', pan: PAN_FOE });
    if (w) winds.set(uid, w);
    else if (ctx) { tone(110, 1.4, 'sawtooth', 0.12, 0, 330, 'loud'); tone(55, 1.4, 'square', 0.08, 0, 110, 'loud'); }
  },
  /** The move lands. */
  land(move: string, uid: number) {
    windStop(uid, 0.02);
    if (!play('rpg_' + move, { bus: BOSS_MOVE.has(move) ? 'loud' : 'game', pan: move === 'toll' ? PAN_FOE : 0.1 })) { tone(70, 0.5, 'sawtooth', 0.25, 0, 35, 'loud'); noise(0.4, 0.4, 900, 0, 'loud'); }
  },
  /** Bash stops the SMASH. */
  interrupt(uid: number) { windStop(uid, 0.06); play('rpg_interrupt', { pan: PAN_FOE }) || sfx.good(); },
  /** An enemy crumbles (#154): its own kind's fall (DIE_CUE), a boss its own; a swarm's bodies one by one. Several at
   *  once (a Fire, a Cataclysm) follow each other a moment apart; the variant follows the corpse (no random draw). */
  die(cue: string, uid: number, boss: boolean) {
    windStop(Math.floor(uid / 8), 0.08);
    if (!ctx) return;
    const now = ctx.currentTime, next = dieNext[cue] ?? 0, when = Math.max(0, next - now);
    if (!boss && when > (cue === 'die_cherub' ? 0.25 : 0.5)) return;   // heard enough of those
    dieNext[cue] = now + when + (cue === 'die_cherub' ? 0.09 : 0.16);
    play(cue, { variant: uid, when, pan: PAN_FOE, bus: boss ? 'loud' : 'game' });
  },
  /** Loot falls on the stone from a kill; one rare or better glints as it lands. */
  dropFloor(rare: boolean) { rpg('rpg_floordrop', { pan: PAN_FOE, when: 0.35 }, 0.1); if (rare) rpg('rpg_glint', { pan: PAN_FOE, when: 0.4 }, 0.2); },
  /** An item goes in the bag: its rarity's sound (r 0 to 3); the legendary its own. */
  loot(r: number) { if (r >= 4) sfx.legendary(); else rpg('rpg_loot', { variant: Math.max(0, r) }, 0.12) || lootTone(Math.max(0, r)); },
  /** The Appraiser reads it, then its rarity sounds. */
  identify(r: number) { rpg('rpg_identify', {}, 0.1); if (r >= 4) play('legendary', { when: 0.35 }) || sfx.legendary(); else play('rpg_loot', { variant: r, when: 0.35 }) || lootTone(r); },
  /** Gold in the realm. */
  gold(when = 0) { rpg('rpg_gold', { when }, 0.1) || sfx.coin(); },
  /** A run blessing taken (curios): one each. */
  bless(k: number) { rpg('rpg_bless', { variant: k }, 0.1) || sfx.good(); },
  spotted() { rpg('rpg_spotted', { pan: PAN_FOE }, 0.3) || (tone(620, 0.07, 'square', 0.09, 0, 1240), tone(1240, 0.06, 'square', 0.07, 0.07)); },   // the next pack sees the party: "!" (#118)
  /** Through the portal (to the crypt, back to town). */
  portal() { rpg('rpg_portal', {}, 0.5) || tone(220, 0.6, 'triangle', 0.08, 0, 660); },
  /** A boss or the Abbot slain: after his fall. */
  victory() { play('rpg_victory', { when: 1.2 }) || [523, 659, 784].forEach((f, i) => tone(f, 0.2, 'square', 0.1, 1.2 + i * 0.1)); },
  // Audio-first: each of these must be recognisable with Excel covering the screen.
  legendary() { if (!play('legendary')) [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, 'square', 0.14, i * 0.07)); },
  bagFull() { play('bagfull') || tone(330, 0.2, 'square', 0.1, 0, 220); },
  /** An item thrown in the bag's trash can (#148): a clank in the iron bin, a crunch, two notes down. */
  trash() { play('trash') || (noise(0.12, 0.14, 2600, 0), tone(420, 0.16, 'square', 0.08, 0.04, 140)); },
  goblin() { play('goblin') || [1200, 1400, 1200, 1500].forEach((f, i) => tone(f, 0.05, 'square', 0.08, i * 0.08)); },
  goblinCatch() { play('goblincatch') || sfx.good(); },
  goblinLost() { play('goblinlost') || tone(600, 0.3, 'triangle', 0.08, 0, 300); },
  /** A hero goes down (once per moment, even when a slam drops three). */
  down() { const now = ctx?.currentTime ?? 0; if (now - downAt < 0.4) return; downAt = now; play('down', { pan: PAN_PARTY }) || sfx.bad(); },
  /** A boss ENRAGED: one roar each (0 the Gaoler, 1 the Bellringer, 2 the Inquisitor, 3 the Abbot, also when he wakes). */
  enrage(k = 0) { play('enrage', { bus: 'loud', variant: k, pan: PAN_FOE }) || tone(80, 0.8, 'sawtooth', 0.2, 0, 60, 'loud'); },
  /** Party wipe: the dirge, and on its last chord he slams the desk (the Noise echo: real life, the desk slam). */
  wipe() { for (const k of [...winds.keys()]) windStop(k, 0.1); if (!play('wipe')) [233, 220, 208, 196].forEach((f, i) => tone(f, 0.35, 'sawtooth', 0.12, i * 0.36)); play('slam', { bus: 'loud', when: 1.7, vol: 0.8 }); },
  // ----- shared by the desk and the RPG's old callers -----
  heal() { tone(660, 0.1, 'sine', 0.15); tone(990, 0.15, 'sine', 0.15, 0.08); },
  level() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.12, i * 0.08)); },
  bad() { tone(200, 0.25, 'sawtooth', 0.15, 0, 90); },
  good() { tone(660, 0.08, 'square', 0.12); tone(880, 0.12, 'square', 0.12, 0.07); },
  coin() { play('coins', { variant: 1 }) || (tone(1320, 0.05, 'square', 0.1), tone(1760, 0.12, 'square', 0.1, 0.06)); },
  /** The desk slam (him, in the room). */
  slam() { if (!play('slam', { bus: 'loud' })) { tone(70, 0.5, 'sawtooth', 0.25, 0, 35, 'loud'); noise(0.4, 0.4, 900, 0, 'loud'); } },
  /** Caught: only for her (the boss enrage has its own roar now). */
  sting() { [233, 247, 370, 392].forEach(f => tone(f, 0.6, 'sawtooth', 0.22, 0, undefined, 'loud')); noise(0.5, 0.5, 4000, 0, 'loud'); },
};

/** Debug board (F1): play any cue as it would sound next door. */
export function audition(cue: string) {
  initAudio();
  if (cue.startsWith('mus_')) { music(mus?.cue === cue ? null : cue); return; }   // a track: on, or off again
  if (LOOP_SEC[cue]) { ambience(amb?.cue === cue ? null : cue, 'living'); return; }
  play(cue);
}

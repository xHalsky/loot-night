// The launch's sound and music (#127, aoj-world §7b): the cue sheet (render/page/aoj.js LAUNCH_SOUND, LAUNCH_LOOPS,
// LAUNCH_MUSIC) played against the launch's one clock (systems/launch.ts). Each cue fires once as T passes its time,
// never for a jump past it; the theme plays at offset T - 6.2 and restarts at the right offset when it drifts more than
// 0.1 s; pause stops all of it and unpause resumes it where T is; the skip stops it all. All on the game bus; the
// launch makes no Noise (the night hasn't started).
import { PK } from 'virtual:pagekit';
import { S } from '../core/state';
import { launchT, launchSkipped } from '../systems/launch';
import { startAt, cueLen, cueVariants, audioTime, setTimedVol, type TimedSrc } from './audio';
import { stepLaunchSheet, type LaunchSheet } from '../systems/launchSheet';

type Voice = { cue: string; k: number; at: number; h: TimedSrc | null; kind: 'shot' | 'music' | 'loop'; to?: number; fin?: number; fout?: number; vol?: number };
let sheet: LaunchSheet | null = null, lastT = -1, voices: Voice[] = [], dead = false, music: Voice | null = null, loops: Voice[] = [];
/** For the tests: every cue fired, in order, with its launch time. */
export const launchFired: [number, string][] = [];

function reset() { stopLaunchSound(); voices = []; music = null; loops = []; lastT = -1; dead = false; launchFired.length = 0; }
/** Stops every launch sound now (the skip; leaving the night). */
export function stopLaunchSound() { for (const v of [...voices, ...(music ? [music] : []), ...loops]) { v.h?.stop(0.05); v.h = null; } dead = true; }

/** Every frame. */
export function updateLaunchSound() {
  const T = launchT();
  if (T < 0) { if (lastT >= 0) reset(); return; }
  if (!PK.ready()) return;
  if (!sheet) {
    sheet = PK.launchSheet() as LaunchSheet; sheet = { ...sheet, sound: [...sheet.sound].sort((a, b) => a[0] - b[0]) };   // in time order (stable)
    music = { cue: sheet.music.cue, k: 0, at: sheet.music.at, h: null, kind: 'music', to: sheet.music.end };
    loops = sheet.loops.map(([cue, a, b, fin, fout]) => ({ cue, k: 0, at: a, to: b, fin, fout, h: null, kind: 'loop' as const }));
  }
  if (lastT < 0) lastT = T;   // the first frame of this launch
  if (launchSkipped()) { if (!dead) stopLaunchSound(); lastT = T; return; }
  if (dead) return;
  const g = S.g;
  if (g.paused || g.screen !== 'night') {   // pause holds it all: stopped now, restarted where T is on unpause
    for (const v of [...voices, ...(music ? [music] : []), ...loops]) { v.h?.stop(0.04); v.h = null; }
    lastT = T; return;
  }
  // the one-shots: each fires once as T passes it; a jump (a hitch over half a second) fires nothing it jumped
  if (lastT >= 0) stepLaunchSheet(sheet.sound, lastT, T, (at, cue) => {
    const n = cueVariants(cue), occ = launchFired.filter(([, c]) => c === cue).length; launchFired.push([at, cue]);
    voices.push({ cue, k: n > 1 ? occ % n : 0, at, h: null, kind: 'shot' });   // a cue's files in turn (L A B S rising; the keys)
  });
  lastT = T;
  const now = audioTime();
  // keep what should sound at T sounding, at the right offset
  voices = voices.filter((v) => { const len = cueLen(v.cue, v.k); return len < 0 || T - v.at < len + 0.05; });
  for (const v of voices) if (!v.h) v.h = startAt(v.cue, v.k, T - v.at);
  if (music) {
    const want = T >= music.at && T < (music.to ?? 1e9);
    if (!want) { music.h?.stop(0.2); music.h = null; }
    else {
      const len = cueLen(music.cue);
      if (music.h) { const playing = music.h.offset + (now - music.h.started), should = T - music.at; if (Math.abs(playing - should) > 0.1) { music.h.stop(0.02); music.h = null; } }   // drifted (a pause, a hitch, a hidden tab): back in sync
      if (!music.h && len > 0 && T - music.at < len) music.h = startAt(music.cue, 0, T - music.at);
    }
  }
  for (const l of loops) {
    const a = l.at, b = l.to!, k = Math.min(1, Math.max(0, (T - a) / (l.fin || 0.01)), Math.max(0, (b + (l.fout || 0) - T) / (l.fout || 0.01)));
    if (k <= 0 || T < a) { l.h?.stop(0.1); l.h = null; continue; }
    if (!l.h) l.h = startAt(l.cue, 0, T - a, k); else setTimedVol(l.h, k);
  }
}

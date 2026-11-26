// Selfies (fan-service step 5, #92; decisions 2026-11-20: no Gallery, the photo opens in a window beside the phone).
// One in three of her texts after midnight (the waking meter's "are you coming to bed?") carries a photo: a mirror
// selfie in your jersey, or under the duvet. In her chat it's a crop with a gold ring and its 60 s; tap it and the whole
// photo opens beside the phone (hands busy), Goodwill +5 the first time. Not opened in 60 s: "Babe unsent a photo."
// Face-down or a dead phone, you miss it. She wears her top gift in the mirror one.
import { T } from '../config/tuning';
import { S, N, type ChatLine } from '../core/state';
import { chance, pick } from '../core/rng';
import { herSay } from './messages';
import { addGoodwill } from './goodwill';
import { sfx } from '../ui/audio';

/** With her text: maybe a photo. */
export function maybeSelfie(): boolean {
  if (!chance(T.SELFIE_CHANCE)) return false;
  sendSelfie();
  return true;
}
export function sendSelfie(key?: string) {
  const n = N(), top = n.wear.top;
  const k = key ?? pick(['jersey', 'duvet']);
  herSay('photo', k === 'jersey' && top ? `jersey:${top}` : k);   // in her gift (#91), if she has one on tonight
  const t = S.g.herThread!; t[t.length - 1].at = n.threat;
}
/** The photo lines still waiting to be opened, and how long each has. */
export const photoLeft = (l: ChatLine) => l.s === 'photo' && !l.seen && l.night === S.g.nightsPlayed ? Math.max(0, T.SELFIE_SEC - (N().threat - (l.at ?? 0))) : null;

/** Tap the crop: the whole photo beside the phone. idx: its line in her thread. */
export function openPhoto(idx: number) {
  const n = N(), l = S.g.herThread?.[idx];
  if (!l || l.s !== 'photo') return;
  const first = !l.seen;
  l.seen = true;
  n.photo = { key: l.text, first, clock: l.clock, t: 0 };
  if (first) addGoodwill(T.SELFIE_GOODWILL, 'her photo');
  sfx.click();
}
export function closePhoto() { const n = N(); if (n.photo) { n.photo = null; sfx.click(); } }

/** Every frame: unopened photos go after 60 s (and at a night's end, any left from it). */
export function updateSelfies(dt: number) {
  const n = N(), th = S.g.herThread;
  if (n.photo) n.photo.t += dt;
  if (!th) return;
  for (let i = 0; i < th.length; i++) {
    const l = th[i];
    if (l.s !== 'photo' || l.seen) continue;
    if (l.night !== S.g.nightsPlayed || n.threat - (l.at ?? 0) >= T.SELFIE_SEC) th[i] = { ...l, s: 'sys', text: 'Babe unsent a photo.' };
  }
}

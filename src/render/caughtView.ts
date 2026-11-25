// Caught (V7, #72; grid doc 7e): the full-frame scare and the screen held after it. The renderer draws it
// (PK.caught); this file says which rung, what the catch cost (from the rules in systems/visits.ts and the numbers in
// tuning.ts, so the line can't drift from what happened) and how long it stays. Real time, not the night's clock: the
// scare must play at its speed whatever the time scale.
import { S } from '../core/state';
import { T } from '../config/tuning';

/** The line under WE NEED TO TALK.: the rung and everything this catch cost (Mood is on her panel). */
export function caughtLine(catches: number): string {
  const k = Math.min(catches, 3), parts: string[] = [];
  parts.push(k === 1 ? `Caught 1 of 3 tonight` : k === 2 ? `Caught 2 of 3` : `Caught ${catches}`);
  if (k === 3) parts.push(`she turns your monitor off for ${T.MONITOR_OFF_SEC} s`);
  if (k !== 2) parts.push('Flow reset');
  parts.push(`Guilt: the party deals ${Math.round(T.GUILT_DMG * 100)}% less for ${T.GUILT_SEC} s`);
  return parts.join(' · ');
}

let shownNight: unknown = null, seen = 0, at = -1e9, rung = 1, line = '';
/** Called every frame: notices a new catch (the count went up while the scare runs). */
export function caughtTick(now: number) {
  const n = S.g.night;
  if (!n) return;
  if (shownNight !== n) { shownNight = n; seen = n.catches; at = -1e9; }
  if (n.catches > seen) { seen = n.catches; if (n.scare > 0) { at = now; rung = Math.min(n.catches, 3); line = caughtLine(n.catches); } }
}
/** Seconds since the catch, while the caught screen is up; -1 when it is not. */
export function caughtT(now: number): number {
  const t = (now - at) / 1000;
  return S.g.screen === 'night' && t >= 0 && t < T.SCARE_SEC + T.CAUGHT_HOLD_SEC ? t : -1;
}
/** A click or a key after the scare puts the screen away (the blinking ▼ asks for one, as in a dating sim). */
export function caughtEnd(now: number): boolean {
  if (caughtT(now) < T.SCARE_SEC) return false;
  at = -1e9; return true;
}
export const caughtShot = () => ({ rung, line });

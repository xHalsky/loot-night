import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { clamp } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');   // feed tag (#49)

// Goodwill (docs/design/synergy.md, #29): a 0-100 bank of good moments with her. No decay within a night,
// half carries over to the next. Spent on the Raid pass (a pre-emptive action) and, automatically, on
// Forgiveness (once a night: a catch that does not count). Catches cost Goodwill.

export function addGoodwill(v: number, why: string) {
  const before = S.g.goodwill;
  S.g.goodwill = clamp(S.g.goodwill + v, 0, T.GOODWILL_MAX);
  const d = Math.round(S.g.goodwill - before);
  if (d > 0) toast(`Goodwill +${d} (${why})`, '#ff9ab8');
  else if (d < 0) toast(`Goodwill ${d} (${why})`, '#ffb07a');
}

/** A catch is about to happen: Forgiveness takes it if the bank is full enough (once a night). */
export function tryForgive(): boolean {
  const n = N();
  if (n.forgiven || S.g.goodwill < T.GOODWILL_FORGIVE) return false;
  n.forgiven = true;
  S.g.goodwill -= T.GOODWILL_FORGIVE;
  return true;
}

/** A new night: half the bank carries over. */
export function carryGoodwill() { S.g.goodwill = Math.floor(S.g.goodwill * T.GOODWILL_CARRY); }

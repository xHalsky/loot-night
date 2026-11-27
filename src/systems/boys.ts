import { T } from '../config/tuning';
import { S, type Night, type Item } from '../core/state';
import { pick, rand } from '../core/rng';
import { maxHp, heroPower } from './stats';
import { BOYS_LINES, BOYS_ONCE, type BoysTrigger } from '../data/boys';
import { on } from './week';

// The boys' chat between the calls (#109; data/boys.ts): a game moment posts one of its lines in The Boys' chat, quiet
// (no banner, no sound, no effect on play), kept until the next call or 20:00 chat replaces the thread. Spaced so the
// thread reads like a chat: BOYS_GAP_SEC between any two posts, BOYS_SAME_GAP_SEC between two of the same moment, some
// moments once a night; and now and then, in the dungeon, a line with no moment of its own.
type Pace = { night: Night; last: number; byTrigger: Partial<Record<BoysTrigger, number>>; once: Set<BoysTrigger>; nextRandom: number; downRun: unknown };
let pace: Pace | null = null;
function P(): Pace | null {
  const n = S.g.night;
  if (!n) return null;
  if (pace?.night !== n) pace = { night: n, last: -1e9, byTrigger: {}, once: new Set(), nextRandom: rand(...T.BOYS_RANDOM_SEC), downRun: null };
  return pace;
}
const clockNow = () => S.g.night?.threat ?? 0;

/** A moment in the night: maybe a line (or an exchange) in The Boys' chat. */
export function boysSay(trigger: BoysTrigger): boolean {
  const p = P(), n = S.g.night;
  if (!p || !n || S.g.screen !== 'night') return false;
  const t = clockNow();
  if (t - p.last < T.BOYS_GAP_SEC) return false;
  if (BOYS_ONCE.includes(trigger) ? p.once.has(trigger) : t - (p.byTrigger[trigger] ?? -1e9) < T.BOYS_SAME_GAP_SEC) return false;
  let pool = BOYS_LINES[trigger];
  if (trigger === 'invite' && n.clock > 20 * 60 + 20) pool = pool.filter(x => !x.some(([, s]) => s === "it's 20:15"));   // only while it is about 20:15
  const lines = pick(pool);
  const th = (S.g.boysThread ??= []), now = { night: S.g.nightsPlayed, day: S.g.day ?? S.g.nightsPlayed, clock: Math.floor(n.clock) };
  for (const [who, text] of lines) th.push({ s: 'l', text: `${who}: ${text}`, ...now });
  if (th.length > T.BOYS_THREAD_MAX) th.splice(0, th.length - T.BOYS_THREAD_MAX);
  p.last = t; p.byTrigger[trigger] = t; p.once.add(trigger);
  return true;
}
/** An item that would raise someone's power (the bag's upgrade arrow). */
export function isUpgradeForSomeone(it: Item): boolean { return it.identified && S.g.heroes.some(h => heroPower(h, { [it.slot]: it }) > heroPower(h)); }
/** A hero went down this run: a banked run is not a clean one. */
export function boysNoteDown() { const p = P(); if (p) p.downRun = S.g.night?.run ?? null; }
/** The run is banked: a clean one (nobody went down) gets Lance's line. */
export function boysRunBanked() { const p = P(), r = S.g.night?.run; if (p && r && p.downRun !== r) boysSay('cleanRun'); }

/** Each frame: the moments that are states (the party low, Raid night? open) and the odd line in the dungeon. */
export function updateBoys(dt: number) {
  const p = P(), n = S.g.night, g = S.g;
  if (!p || !n || g.screen !== 'night' || g.paused) return;
  if (n.location === 'dungeon' && n.phase === 'battle') {
    const hp = g.heroes.reduce((a, h) => a + (h.downed ? 0 : h.hp), 0) / g.heroes.reduce((a, h) => a + maxHp(h), 0);
    if (hp < T.AUTOPILOT_FLASH_HP) boysSay('partyLow');
  }
  if (g.goodwill >= T.GOODWILL_RAID && on('messages')) boysSay('raidUnlock');   // Raid night? is open
  if (n.location === 'dungeon') {
    p.nextRandom -= dt;
    if (p.nextRandom <= 0) { boysSay('random'); p.nextRandom = rand(...T.BOYS_RANDOM_SEC); }
  }
}

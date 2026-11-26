import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { COACH, type CoachId } from '../data/tips';

// Coach marks (#42): the first footsteps, her first time in the doorway, the first phone, the first loot and the
// first boss wind-up. A callout points at the thing and the game crawls (`COACH_SLOW`, applied in loop.ts) until
// the player does it, the moment passes, `COACH_MAX_SEC` (real seconds) runs out, or they close it. Once per save.

/** Her comes first: a loot hint must never hide "she is at your door". */
const PRIORITY: Record<CoachId, number> = { steps: 5, tell: 4.5, door: 4, phone: 3, windup: 2, loot: 1, headset: 0, lean: -1, leanview: -1 };   // lean in (#77): her tell right after the footsteps; the other two last

export function coach(id: CoachId) {
  const g = S.g;
  const n = g.night;
  if (!n || g.tipsSeen.includes(`coach:${id}`)) return;
  if (n.coach) {
    if (PRIORITY[n.coach.id] >= PRIORITY[id]) return;               // the one up now matters more: this one waits for next time
    g.tipsSeen = g.tipsSeen.filter(t => t !== `coach:${n.coach!.id}`);   // bumped: it shows again the next time its moment comes
  }
  g.tipsSeen.push(`coach:${id}`);
  n.coach = { id, t: 0, mark: mark(id) };
}

/** A number taken when the coach mark starts, to see later whether the player acted. */
function mark(id: CoachId): number {
  const g = S.g;
  if (id === 'loot') return g.heroes.reduce((a, h) => a + Object.keys(h.gear).length, 0);
  if (id === 'door') return g.night!.visit.chat?.asked ?? 0;
  return 0;
}

function done(id: CoachId, m: number): boolean {
  const n = N();
  const v = n.visit;
  switch (id) {
    case 'steps': return n.monitor === 'excel' || !!n.switching || v.stage === 'idle' || v.stage === 'in';
    case 'door': return v.stage !== 'in' || (v.chat?.asked ?? 0) > m || ['snackOk', 'snackFail', 'cuddling', 'cuddleGood', 'cuddleMeh', 'refused'].includes(v.result);
    case 'phone': return n.game?.kind === 'phone' || n.interrupts.length === 0;
    case 'loot': return S.g.heroes.reduce((a, h) => a + Object.keys(h.gear).length, 0) > m;
    case 'windup': return !n.enemies.some(e => (e.wind ?? 0) > 0) || S.g.heroes.some(h => h.queued !== null);
    case 'headset': return n.headset || v.stage !== 'idle';
    case 'lean': return !!n.lean || n.peeking || n.apt.activity !== 'yoga' || v.stage !== 'idle';   // holding the door ends the crawl
    case 'leanview': return !n.lean || Math.abs(n.lean.u - n.lean.u0) > 0.2;
    case 'tell': return !n.lean;
  }
}

/** Real-time update (called from the frame loop, not the game step, so it is not slowed by itself). */
export function updateCoach(realDt: number) {
  const n = S.g.night;
  if (!n?.coach || S.g.paused || S.g.howto) return;
  n.coach.t += realDt;
  if (done(n.coach.id, n.coach.mark) || n.coach.t >= T.COACH_MAX_SEC) n.coach = null;
}
export const closeCoach = () => { if (S.g.night) S.g.night.coach = null; };
/** How fast the game runs right now (the crawl while a coach mark is up). */
export const coachScale = () => (S.g.night?.coach ? T.COACH_SLOW : 1);
export const coachDef = (id: CoachId) => COACH[id];

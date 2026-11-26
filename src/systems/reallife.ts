import { T } from '../config/tuning';
import { N } from '../core/state';

// One demand at a time from real life (#54, 3.2): the phone and the dog wait for each other and for her. A new
// phone event or the dog's arrival needs nothing else asking for you, REAL_LIFE_GAP_SEC since the last thing did,
// and none of the moments where it would be unfair: her footsteps, her at the door or in the room, her shower, a
// boss wind-up, a calm you earned (tea, the Raid pass, Text her). Scripted events wait for it; they never drop.

/** Something from real life has your attention right now. */
export function demandActive(): boolean {
  const n = N();
  return n.interrupts.length > 0 || !!n.game || !!n.pre || n.dog.stage !== 'away' || n.visit.stage !== 'idle' || !!n.herAsk;   // her towel or wine (#93, #88) too
}
/** A new demand may start now. */
export function realLifeFree(windupOk = false): boolean {
  const n = N();
  if (demandActive() || n.threat - n.lastDemand < T.REAL_LIFE_GAP_SEC) return false;
  if (n.apt.activity === 'shower' || n.apt.calm > 0) return false;   // the shower is your break; her weekend bath is not (#88): the phone and the dog go on
  return windupOk || !n.enemies.some(e => (e.wind ?? 0) > 0);   // windupOk: her tease aims for the worst moments (#85)
}
/** Every frame: while anything asks for you, the gap keeps restarting. */
export function updateRealLife() {
  const n = N();
  if (demandActive()) n.lastDemand = n.threat;
}

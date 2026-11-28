// The fallen (#154, Paweł 2026-11-28): an enemy at 0 HP no longer just vanishes. It crumbles to the ground where it
// stood, leaves a pile of iron bones of its own kind (the bosses and the Abbot their own, bigger), and the pile fades
// after a while. Visual and sound only: no rule reads it, no random draw (the sims stay byte for byte). The look is the
// renderer's (render/page/corpses.js); this keeps the list: who fell where, how old, how far the walk has carried it.
import { N, type Enemy } from '../core/state';
import { T } from '../config/tuning';
import { sfx } from '../ui/audio';
import { DIE_CUE } from '../data/sounds';

const list = () => (N().corpses ??= []);
const bodies = (e: Enemy) => (e.per ? Math.max(0, Math.ceil(e.hp / e.per - 1e-6)) : e.hp > 0 ? 1 : 0);   // battle.ts bodies (no import cycle)
/** Lays a fallen enemy down (from the battle, as it is removed). One that ran (the boss is down) leaves nothing. A
 *  swarm lays each body it had left. */
export function layFallen(e: Enemy) {
  if (!e.per) { layCorpse(e); return; }
  for (let k = Math.max(1, e.bodiesSeen ?? 1) - 1; k >= 0; k--) layCorpse(e, k);
}
function layCorpse(e: Enemy, body?: number) {
  const cue = e.defId === 'bat' ? (e.look === 'vigil' ? 'die_vigil' : 'die_ironwing') : DIE_CUE[e.defId];
  if (cue) sfx.die(cue, e.uid * 8 + (body ?? 7), e.boss || e.defId === 'troll');   // its own fall (#155)
  list().push({ uid: e.uid * 8 + (body ?? 7), defId: e.defId, ...(e.look ? { look: e.look } : {}), slot: e.slot, boss: e.boss, dx: 0, t: 0, ...(body != null ? { body } : {}) });
}
/** Every frame in the dungeon: the corpses age; a swarm that lost a body lays that body's wreck; old ones go. */
export function updateCorpses(dt: number) {
  const n = N(), cs = list();
  for (const e of n.enemies) {
    if (!e.per || e.maxHp <= 0) continue;
    const b = bodies(e);
    if (e.bodiesSeen == null) { e.bodiesSeen = b; continue; }
    for (let k = e.bodiesSeen - 1; k >= Math.max(b, 1); k--) layCorpse(e, k);   // the last body falls with the swarm (layCorpse at death)
    e.bodiesSeen = b;
  }
  for (const c of cs) c.t += dt;
  n.corpses = cs.filter(c => c.t < T.CORPSE_SEC + T.CORPSE_FADE_SEC && c.dx < 700);
}
/** The walk carried the corridor dx grid px: the corpses go with the floor. */
export function walkCorpses(dx: number) { for (const c of list()) c.dx += dx; }
/** A new floor, the town, a wipe: the corridor is somewhere else. */
export function clearCorpses() { N().corpses = []; }

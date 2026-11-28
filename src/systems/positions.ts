// Marching order (#52, 1.6; docs/design/dungeon.md): the party walks and fights in one line, position 1 at the front.
// A hero's position is his place in S.g.heroes (index + 1), so everything that lists the party lists it in order.
// Home positions, auras, swaps, and the enemies that break the line (Hook, Shove). Rules only; no drawing.
import { T } from '../config/tuning';
import { S, N, newHero, type Hero, type HeroId } from '../core/state';
import { HOME_POSITIONS, AURAS, DEFAULT_ORDER, HERO_NAME, HERO_CLASS, HERO_BASE, heroLabel } from '../data/heroes';
import { toastAs, floatText } from '../core/fx';
import { POS_X } from '../core/arena';
import { sfx } from '../ui/audio';
import { fx } from './tree';
const toast = toastAs('PARTY');

export const positionOf = (h: Hero) => S.g.heroes.indexOf(h) + 1;
export const heroById = (id: HeroId) => S.g.heroes.find(h => h.id === id);
/** Outside his home positions: deals and heals OUT_OF_POSITION_MULT. */
export function outOfPosition(h: Hero): boolean { const r = positionOf(h), [a, b] = HOME_POSITIONS[h.id]; return r < a || r > b; }
export const positionMult = (h: Hero) => (outOfPosition(h) ? T.OUT_OF_POSITION_MULT : 1);

/** Who gives this hero an aura: the living neighbour in front (if his aura goes back) and behind (if it goes forward). */
export function aurasOn(h: Hero): HeroId[] {
  const i = S.g.heroes.indexOf(h), out: HeroId[] = [];
  const front = S.g.heroes[i - 1], back = S.g.heroes[i + 1];
  if (front && !front.downed && AURAS[front.id].back) out.push(front.id);
  if (back && !back.downed && AURAS[back.id].front) out.push(back.id);
  return out;
}
const has = (h: Hero, giver: HeroId) => aurasOn(h).includes(giver);
/** A giver's aura value: the tree's last stat on the way to his ultimate raises it (Shield Brother, Sly, Mentor, Halo). */
const auraVal = (giver: HeroId, base: number) => fx(giver, 'aura') || base;
/** Damage a hero takes, x this (the Knight's shield wall on the hero behind him). */
export const auraTaken = (h: Hero) => (has(h, 'knight') ? 1 - auraVal('knight', T.AURA_KNIGHT_TAKEN) : 1);
/** Extra crit (the rogue's keen eye on the hero in front of him). */
export const auraCrit = (h: Hero) => (has(h, 'rogue') ? auraVal('rogue', T.AURA_ROGUE_CRIT) : 0);
/** Cooldowns x this (the mage's haste on the hero in front of him). */
export const auraCd = (h: Hero) => (has(h, 'mage') ? 1 - auraVal('mage', T.AURA_MAGE_CD) : 1);
/** The priest's blessing: his neighbours regenerate in the dungeon. */
export function auraRegen(dt: number, maxHp: (h: Hero) => number) {
  for (const h of S.g.heroes) if (!h.downed && has(h, 'healer')) h.hp = Math.min(maxHp(h), h.hp + maxHp(h) * auraVal('healer', T.AURA_PRIEST_REGEN) * dt);
}

/** Moves heroes into a new order. In the dungeon, everyone whose position changed walks there for SWAP_SEC and doesn't act. */
function reorder(next: Hero[]) {
  const n = S.g.night, inDungeon = n?.location === 'dungeon';
  const tabHero = n ? S.g.heroes[n.heroTab] : undefined;
  const before = new Map(S.g.heroes.map((h, i) => [h, i]));
  S.g.heroes = next;
  if (n && tabHero) n.heroTab = Math.max(0, next.indexOf(tabHero));
  if (!inDungeon) return;
  next.forEach((h, i) => { const was = before.get(h)!; if (was !== i) { h.from = was; h.moving = T.SWAP_SEC; } });
}
/** The player swaps two heroes (drag a portrait or a sprite onto another). In town it costs nothing. */
export function swapHeroes(a: number, b: number) {
  const hs = [...S.g.heroes];
  if (a === b || !hs[a] || !hs[b]) return;
  if (hs[a].moving || hs[b].moving) { sfx.refuse(); return; }
  [hs[a], hs[b]] = [hs[b], hs[a]];
  reorder(hs);
  sfx.aoj('swap');
  if (S.g.night?.location !== 'dungeon') return;
  floatText(Math.round((POS_X[a] + POS_X[b]) / 2), 104, 'swap', '#e2d6c0');
  for (const h of [hs[a], hs[b]]) if (outOfPosition(h)) floatOut(h);
}
/** Hook: the hero in the last position is dragged to the front; the others step back one. */
export function hookLine() {
  const hs = [...S.g.heroes], last = hs.pop()!;
  reorder([last, ...hs]);
  toast(`${last.name} is hooked to the front!`, '#ff8a80');
  if (outOfPosition(last)) floatOut(last);
}
/** Shove: position 1 is knocked back, swapping with position 2. */
export function shoveLine() {
  const hs = [...S.g.heroes];
  if (hs.length < 2) return;
  [hs[0], hs[1]] = [hs[1], hs[0]];
  reorder(hs);
  toast(`${hs[1].name} is shoved back!`, '#ff8a80');
  for (const h of hs.slice(0, 2)) if (outOfPosition(h)) floatOut(h);
}
/** "out of position" floats up over a hero who landed outside his home positions. */
function floatOut(h: Hero) { floatText(POS_X[S.g.heroes.indexOf(h)] ?? POS_X[0], 108, 'out of position', '#ff5a5a'); }
/** Ticks the walk between positions. */
export function updatePositions(dt: number) { for (const h of S.g.heroes) if (h.moving) { h.moving = Math.max(0, h.moving - dt); if (!h.moving) { h.moving = undefined; h.from = undefined; } } }

/** At the start of a night: a save from before the rogue was in the party from night 1 (#96) gets him, second in line; a
 *  save that never had a marching order gets the default one. */
export function ensureParty() {
  const g = S.g;
  if (!heroById('rogue')) {
    const lv = Math.max(1, Math.min(...g.heroes.map(h => h.level)));
    const r = newHero('rogue', HERO_NAME.rogue, HERO_CLASS.rogue, HERO_BASE.rogue.hp);
    r.level = lv;
    g.heroes.push(r);
    g.orderSet = false;
    toast(`${heroLabel('rogue')} joined the party. He walks second.`, '#e8b07a');
  }
  if (!g.orderSet) {
    const want = DEFAULT_ORDER[g.heroes.length >= 4 ? 1 : 0];
    g.heroes = want.map(id => heroById(id)).filter((h): h is Hero => !!h).concat(g.heroes.filter(h => !want.includes(h.id)));
    g.orderSet = true;
  }
  void N;
}

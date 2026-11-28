import { S, N, type Item } from '../core/state';
import { removeEntry, entryName, swapDrop , isLocked } from './loot';
import { useFeather } from './dungeon';
import { maxHp } from './stats';
import { toastAs } from '../core/fx';
import { heroLabel, HERO_CLASS } from '../data/heroes';
import { canWear } from './gear';
import { T } from '../config/tuning';
const toast = toastAs('LOOT');   // feed tag (#49)
import { sfx } from '../ui/audio';

/** Clicking a bag slot: swap target while the full-bag popup is open, else select it. */
export function clickBagSlot(id: string) {
  const n = N();
  if (n.dropPopup) { swapDrop(id); return; }
  n.selected = n.selected === id ? null : id;
  sfx.click();
}

export function closeSelection() { N().selected = null; }

export function equipOn(heroIdx: number) { const n = N(); if (n.selected) equipItemOn(n.selected, heroIdx); }

/** Equip a bag item on a hero (drag and drop, right-click, or the Equip buttons). False when it didn't go on: the
 *  wrong class shakes the item in its square (#113), the wrong slot says which one. */
export function equipItemOn(itemId: string, heroIdx: number, wantSlot?: string): boolean {
  const n = N();
  const i = S.g.bag.findIndex(e => e.id === itemId);
  const e = S.g.bag[i];
  const h = S.g.heroes[heroIdx];
  if (!e || e.kind !== 'item' || !h) { if (e && e.kind === 'feather') useFeather(e.id); return false; }
  if (!canWear(h, e.item)) {
    n.reject = { id: e.id, t: T.WRONG_CLASS_SHAKE_SEC, glow: T.RIGHT_CLASS_GLOW_SEC };   // shakes; whose it is glows (#121)
    toast(`${HERO_CLASS[e.item.cls!]} only: ${heroLabel(h.id)} can't use it.`, '#ff8a80'); sfx.bad(); return false;
  }
  if (wantSlot && e.item.slot !== wantSlot) { toast(`That goes in the ${e.item.slot} slot.`, '#a999bd'); sfx.bad(); return false; }
  if (!e.item.identified) { toast('Identify it at the Appraiser in town first.', '#b98cff'); sfx.bad(); return false; }
  const ratio = h.hp / maxHp(h);
  const old: Item | undefined = h.gear[e.item.slot];
  h.gear[e.item.slot] = e.item;
  if (old) S.g.bag[i] = { kind: 'item', id: old.id, item: old };
  else S.g.bag.splice(i, 1);
  if (!h.downed) h.hp = Math.max(1, Math.round(maxHp(h) * ratio));
  n.selected = null;
  n.heroTab = heroIdx;
  toast(`${heroLabel(h.id)} equipped ${e.item.name}`, '#f2e9d8'); sfx.good();
  return true;
}

export function dropSelected() {
  const n = N();
  if (!n.selected) return;
  if (isLocked(n.selected)) { toast('Locked. Unlock it first (L).', '#f2c46b'); sfx.bad(); return; }
  const e = removeEntry(n.selected);
  if (e) { toast(`Dropped ${entryName(e)}`, '#a999bd'); sfx.click(); }
}

export function useSelected() {
  const n = N();
  const e = S.g.bag.find(x => x.id === n.selected);
  if (e && e.kind === 'feather') useFeather(e.id);
}

export function setHeroTab(i: number) { N().heroTab = i; sfx.click(); }

/** Drag a worn item back to the bag. False when it stays on (a full bag). */
export function unequip(heroIdx: number, slot: string): boolean {
  const h = S.g.heroes[heroIdx];
  const it = h?.gear[slot as Item['slot']];
  if (!it) return false;
  if (S.g.bag.length >= S.g.bagSize) { toast('Bag is full.', '#ff8a80'); sfx.bad(); return false; }
  const ratio = h.hp / maxHp(h);
  delete h.gear[slot as Item['slot']];
  S.g.bag.push({ kind: 'item', id: it.id, item: it });
  if (!h.downed) h.hp = Math.max(1, Math.min(maxHp(h), Math.round(maxHp(h) * ratio)));
  sfx.click();
  return true;
}

/** The trash can (#148, loot.md): an item dragged onto it is gone for good, no question asked and nothing back (Salvage
 *  is the paid way out). A bag entry, or a piece a hero wears (his HP keeps its share, as unequip). A locked item stays:
 *  the lock is the player's own "keep this". True when it went. */
export function trashItem(from: { bag: string } | { hero: number; slot: string }): boolean {
  if ('bag' in from) {
    const e = S.g.bag.find(x => x.id === from.bag);
    if (!e) return false;
    if (e.kind === 'item' && e.item.locked) { toast('Locked. Unlock it first (L).', '#f2c46b'); sfx.bad(); return false; }
    removeEntry(e.id);
    const n = N(); n.fresh = n.fresh.filter(f => f.id !== e.id);
    toast(`Destroyed ${entryName(e)}.`, '#c9a46a');
  } else {
    const h = S.g.heroes[from.hero], it = h?.gear[from.slot as Item['slot']];
    if (!it) return false;
    if (it.locked) { toast('Locked. Unlock it first (L).', '#f2c46b'); sfx.bad(); return false; }
    const ratio = h.hp / maxHp(h);
    delete h.gear[from.slot as Item['slot']];
    if (!h.downed) h.hp = Math.max(1, Math.min(maxHp(h), Math.round(maxHp(h) * ratio)));
    toast(`Destroyed ${it.identified ? it.name : 'an unidentified item'}.`, '#c9a46a');
  }
  sfx.trash();
  return true;
}

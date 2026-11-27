import { S, initialState, type GameState } from '../core/state';
import { applyCity } from './town';
import { HERO_NAME, HERO_CLASS } from '../data/heroes';
import { itemName, nameIsCurrent } from './loot';
import { isClassSlot } from '../data/items';
import { LEGEND_BY_ID, SET_BY_ID } from '../data/legendaries';
import type { HeroId, Item } from '../core/state';

// localStorage save of persistent progress only (not a night in progress).
// v2 (#52, 0.51): the RPG's data changed a lot. v3 (#58, 0.80, the playtest build): every tester starts fresh on
// Monday, also one who played a build from the redesign (before the week, Q4, the battery). Older keys are removed.
const KEY = 'lootnight.save.v3';
const OLD_KEYS = ['lootnight.save.v1', 'lootnight.save.v2'];
try { OLD_KEYS.forEach(k => localStorage.removeItem(k)); } catch { /* no storage: nothing to clear */ }
const PERSIST: (keyof GameState)[] = ['heroes', 'bag', 'bagSize', 'gold', 'mats', 'zl', 'furniture', 'sleepDebt', 'monsters', 'q4', 'owned', 'bestStars', 'record', 'nightsPlayed', 'day', 'mapPath', 'tipsSeen', 'pendingListings', 'pity', 'uid', 'autoSalvage', 'seen', 'curiosSeen', 'goodwill', 'floorCans', 'checkpoints', 'startFloor', 'drops', 'legendaryFound', 'orderSet', 'trees', 'autocast', 'carry', 'herThread', 'boysThread', 'herSeen', 'giftNew', 'giftWorn'];

export function save() {
  try {
    const g = S.g as unknown as Record<string, unknown>;
    const data: Record<string, unknown> = { v: 1 };
    PERSIST.forEach(k => { data[k] = g[k]; });
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* storage unavailable: play on without saving */ }
}

/** The saved day (the week, #56) without loading the save: what the title's Continue says. */
export function savedDay(): number {
  try { const d = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return d.day ?? d.nightsPlayed ?? 0; } catch { return 0; }
}

export function hasSave(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function load(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.v !== 1) return false;
    const fresh = initialState() as unknown as Record<string, unknown>;
    PERSIST.forEach(k => { if (k in data) fresh[k] = data[k]; });
    if (!('day' in data)) fresh.day = data.nightsPlayed ?? 0;   // a save from before the week (#56): one night a day
    S.g = fresh as unknown as GameState;
    S.g.heroes.forEach(h => { h.downed = false; h.queued = null; h.cd = [0, 0, 0, 0]; h.ult = 0; h.name = HERO_NAME[h.id] ?? h.name; h.role = HERO_CLASS[h.id] ?? h.role; });   // old saves get the current names and classes (#44)
    classGear();
    // Items named before the RPG content pass (#44) get a name from the current lists, once.
    const items = [...S.g.bag.flatMap(e => e.kind === 'item' ? [e.item] : []), ...S.g.heroes.flatMap(h => Object.values(h.gear))];
    items.forEach(it => { if (it && !nameIsCurrent(it)) it.name = itemName(it.slot, it.rarity, it.special, it.cls); });
    applyCity();
    return true;
  } catch { return false; }
}

/** Weapons, helms and armor from before class gear (#113) get a class, once: what a hero wears is his (renamed to
 *  his class's words when it isn't one of them); a legendary or a set piece is its own hero's (worn by someone else, it
 *  goes back to the bag if there is room); a bag item goes by its word (an old Spear or Hammer to the knight). */
const OLD_WORD: Record<string, HeroId> = {
  Sword: 'knight', Axe: 'knight', Spear: 'knight', Hammer: 'knight', Helm: 'knight', Breastplate: 'knight', Chainmail: 'knight', Plate: 'knight',
  Dagger: 'rogue', Hood: 'rogue', Tunic: 'rogue', Leathers: 'rogue', Staff: 'mage', Circlet: 'mage', Robe: 'mage', Mace: 'healer', Crown: 'healer', Vestments: 'healer',
};
export function classGear() {
  const own = (it: Item) => it.legend ? LEGEND_BY_ID[it.legend].hero : it.set ? SET_BY_ID[it.set].hero : undefined;
  for (const h of S.g.heroes) for (const it of Object.values(h.gear)) {
    if (!it || !isClassSlot(it.slot) || it.cls) continue;
    it.cls = own(it) ?? h.id;
    if (it.cls !== h.id && S.g.bag.length < S.g.bagSize) { delete h.gear[it.slot]; S.g.bag.push({ kind: 'item', id: it.id, item: it }); }
  }
  const ids = S.g.heroes.map(h => h.id);
  for (const e of S.g.bag) {
    if (e.kind !== 'item' || !isClassSlot(e.item.slot) || e.item.cls) continue;
    const it = e.item, word = it.name.split(' ').find(w => OLD_WORD[w]);
    it.cls = own(it) ?? (word ? OLD_WORD[word] : ids[[...it.id].reduce((a, c) => a + c.charCodeAt(0), 0) % ids.length]);
  }
}

export function wipeSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

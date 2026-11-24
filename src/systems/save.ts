import { S, initialState, type GameState } from '../core/state';
import { applyCity } from './town';
import { HERO_NAME } from '../data/heroes';
import { itemName, nameIsCurrent } from './loot';

// localStorage save of persistent progress only (not a night in progress).
const KEY = 'lootnight.save.v2';   // v2 (#52): the RPG's data changes a lot; old saves start fresh
const PERSIST: (keyof GameState)[] = ['heroes', 'bag', 'bagSize', 'gold', 'mats', 'zl', 'furniture', 'sleepDebt', 'monsters', 'bestStars', 'record', 'nightsPlayed', 'mapPath', 'tipsSeen', 'pendingListings', 'pity', 'uid', 'autoSalvage', 'seen', 'curiosSeen', 'goodwill', 'floorCans', 'checkpoints', 'startFloor', 'drops', 'legendaryFound', 'orderSet'];

export function save() {
  try {
    const g = S.g as unknown as Record<string, unknown>;
    const data: Record<string, unknown> = { v: 1 };
    PERSIST.forEach(k => { data[k] = g[k]; });
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* storage unavailable: play on without saving */ }
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
    S.g = fresh as unknown as GameState;
    S.g.heroes.forEach(h => { h.downed = false; h.queued = null; h.cd = [0, 0, 0, 0]; h.ult = 0; h.name = HERO_NAME[h.id] ?? h.name; });   // old saves get the current names (#44)
    // Items named before the RPG content pass (#44) get a name from the current lists, once.
    const items = [...S.g.bag.flatMap(e => e.kind === 'item' ? [e.item] : []), ...S.g.heroes.flatMap(h => Object.values(h.gear))];
    items.forEach(it => { if (it && !nameIsCurrent(it)) it.name = itemName(it.slot, it.rarity, it.special); });
    applyCity();
    return true;
  } catch { return false; }
}

export function wipeSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

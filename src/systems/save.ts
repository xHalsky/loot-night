import { S, initialState, type GameState } from '../core/state';
import { applyCity } from './town';
import { HERO_NAME } from '../data/heroes';
import { itemName, nameIsCurrent } from './loot';

// localStorage save of persistent progress only (not a night in progress).
// v2 (#52, 0.51): the RPG's data changed a lot. v3 (#58, 0.80, the playtest build): every tester starts fresh on
// Monday, also one who played a build from the redesign (before the week, Q4, the battery). Older keys are removed.
const KEY = 'lootnight.save.v3';
const OLD_KEYS = ['lootnight.save.v1', 'lootnight.save.v2'];
try { OLD_KEYS.forEach(k => localStorage.removeItem(k)); } catch { /* no storage: nothing to clear */ }
const PERSIST: (keyof GameState)[] = ['heroes', 'bag', 'bagSize', 'gold', 'mats', 'zl', 'furniture', 'sleepDebt', 'monsters', 'q4', 'owned', 'bestStars', 'record', 'nightsPlayed', 'day', 'mapPath', 'tipsSeen', 'pendingListings', 'pity', 'uid', 'autoSalvage', 'seen', 'curiosSeen', 'goodwill', 'floorCans', 'checkpoints', 'startFloor', 'drops', 'legendaryFound', 'orderSet', 'trees', 'autocast', 'carry', 'herThread', 'boysThread', 'herSeen', 'giftNew', 'giftWorn', 'noteOff'];

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
    S.g.heroes.forEach(h => { h.downed = false; h.queued = null; h.cd = [0, 0, 0, 0]; h.ult = 0; h.name = HERO_NAME[h.id] ?? h.name; });   // old saves get the current names (#44)
    // Items named before the RPG content pass (#44) get a name from the current lists, once.
    const items = [...S.g.bag.flatMap(e => e.kind === 'item' ? [e.item] : []), ...S.g.heroes.flatMap(h => Object.values(h.gear))];
    items.forEach(it => { if (it && !nameIsCurrent(it)) it.name = itemName(it.slot, it.rarity, it.special); });
    applyCity();
    return true;
  } catch { return false; }
}

export function wipeSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

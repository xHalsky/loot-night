import { S, initialState, type GameState } from '../core/state';
import { applyCity } from './town';

// localStorage save of persistent progress only (not a night in progress).
const KEY = 'lootnight.save.v1';
const PERSIST: (keyof GameState)[] = ['heroes', 'bag', 'bagSize', 'gold', 'mats', 'zl', 'furniture', 'sleepDebt', 'monsters', 'bestStars', 'record', 'nightsPlayed', 'tipsSeen', 'pendingListings', 'pity', 'uid', 'autoSalvage', 'seen', 'curiosSeen', 'goodwill'];

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
    const names: Record<string, string> = { knight: 'Paweł', mage: 'Rafał', healer: 'Jacek' };
    S.g.heroes.forEach(h => { h.downed = false; h.queued = null; h.cd = [0, 0, 0, 0, 0]; h.name = names[h.id] ?? h.name; });
    applyCity();
    return true;
  } catch { return false; }
}

export function wipeSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }

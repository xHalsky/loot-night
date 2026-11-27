import type { ServiceSpot, BagEntry } from '../core/state';
import { T } from '../config/tuning';
import { S, N, RARITIES } from '../core/state';
import { removeEntry, entryName } from './loot';
import { toastAs } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { isLocked } from './loot';
import { CITY, CITY_BY_ID, BAG_PLUS, type CityId } from '../data/city';
import { maxHp } from './stats';
import { save } from './save';
import { boysSay, isUpgradeForSomeone } from './boys';

const inTown = () => N().location === 'town';
function selectedItemEntry() {
  const n = N();
  const e = S.g.bag.find(x => x.id === n.selected);
  return e;
}

export function identify() {
  const n = N();
  const e = selectedItemEntry();
  if (!inTown() || !e || e.kind !== 'item' || e.item.identified) return;
  const cost = e.item.rarity === 'legendary' ? T.IDENTIFY_COST.legendary : T.IDENTIFY_COST.epic;
  if (S.g.gold < cost) { toast(`Identify costs ${cost} gold.`, '#ff8a80'); sfx.bad(); return; }
  S.g.gold -= cost;
  n.clock += T.COST_IDENTIFY_MIN;
  e.item.identified = true;
  n.reveal = { name: e.item.name, t: 2.5 };
  if (!isUpgradeForSomeone(e.item)) boysSay('badDrop');   // the boys' chat (#109)
  sfx.loot(RARITIES.indexOf(e.item.rarity));
  toast(`Identified: ${e.item.name} (10 min)`, '#b98cff');
}

export function vendorValue(id: string): number {
  const e = S.g.bag.find(x => x.id === id);
  if (!e) return 0;
  if (e.kind !== 'item') return 15;
  return Math.round(e.item.value * (e.item.identified ? 1 : T.UNIDENTIFIED_VENDOR_MULT));
}

export function vendor() {
  const n = N();
  if (!inTown() || !n.selected) return;
  if (isLocked(n.selected)) { toast('Locked. Unlock it first (L).', '#f2c46b'); sfx.bad(); return; }
  const v = vendorValue(n.selected);
  const e = removeEntry(n.selected);
  if (!e) return;
  S.g.gold += v;
  toast(`Sold ${entryName(e)} for ${v} gold`, '#f2b84b'); sfx.good();
}

export function salvageYield(id: string): number {
  const e = S.g.bag.find(x => x.id === id);
  if (!e || e.kind !== 'item') return 0;
  return T.SALVAGE_YIELD[RARITIES.indexOf(e.item.rarity)];
}
export function salvage() {
  const n = N();
  if (!inTown() || !n.selected) return;
  if (isLocked(n.selected)) { toast('Locked. Unlock it first (L).', '#f2c46b'); sfx.bad(); return; }
  const y = salvageYield(n.selected);
  if (!y) return;
  const e = removeEntry(n.selected);
  if (!e) return;
  S.g.mats += y;
  toast(`Salvaged ${entryName(e)}: +${y} Souls`, '#c9a46a'); sfx.good();
}

export function listValue(id: string): number {
  const e = S.g.bag.find(x => x.id === id);
  if (!e || e.kind !== 'item') return 0;
  return Math.max(1, Math.round(e.item.value * T.ZL_PER_VALUE * N().market));
}
export function list() {
  const n = N();
  if (!inTown() || !n.selected) return;
  if (isLocked(n.selected)) { toast('Locked. Unlock it first (L).', '#f2c46b'); sfx.bad(); return; }
  const zl = listValue(n.selected);
  if (!zl) return;
  const e = removeEntry(n.selected);
  if (!e) return;
  S.g.pendingListings.push({ name: entryName(e), zl });
  if (e.kind === 'item' && (e.item.rarity === 'common' || e.item.rarity === 'uncommon')) boysSay('cheap');   // the boys' chat (#109)
  n.clock += T.COST_LIST_MIN;
  toast(`Listed ${entryName(e)} for ~$${zl}. Pays tomorrow morning. (5 min)`, '#6fcf7f'); sfx.good();
}

export function buildCity(id: CityId) {
  const n = N();
  if (!inTown()) return;
  const f = CITY_BY_ID[id];
  const lvl = S.g.furniture[id] ?? 0;
  if (lvl >= 3) return;
  const gold = f.gold[lvl], mats = f.mats[lvl];
  if (S.g.gold < gold || S.g.mats < mats) { toast(`Need ${gold} gold and ${mats} Souls.`, '#ff8a80'); sfx.bad(); return; }
  const hpRatios = S.g.heroes.map(h => h.hp / maxHp(h));
  S.g.gold -= gold; S.g.mats -= mats;
  S.g.furniture[id] = lvl + 1;
  applyCity();
  S.g.heroes.forEach((h, i) => { if (!h.downed) h.hp = Math.round(maxHp(h) * hpRatios[i]); });
  n.clock += T.COST_FURNITURE_MIN;
  toast(`${f.name} ${lvl ? `upgraded to level ${lvl + 1}` : 'built'}! ${f.effect[lvl]} (15 min)`, '#f2b84b'); sfx.level();
  save();
}

/** Derived values from city buildings (bag size). Call after load and after building. */
export function applyCity() {
  const f = S.g.furniture as Record<string, number>;
  // Migrate old saves (Training Dummy / Bed).
  if (f.dummy !== undefined) { f.training = Math.max(f.training ?? 0, f.dummy); delete f.dummy; }
  if (f.bed !== undefined) { f.inn = Math.max(f.inn ?? 0, f.bed); delete f.bed; }
  for (const k of ['training', 'inn', 'library', 'treasury']) f[k] = f[k] ?? 0;
  S.g.bagSize = T.BAG_SIZE + BAG_PLUS[f.treasury];
}


// ---- services in the side panel (grid doc §6b): pick items in the bag grid, then one gold button acts on all of them
/** Does the item apply here? Locked, unknown and maps never do; at the Appraiser only the unknown ones. */
export function serviceApplies(svc: ServiceSpot, e: BagEntry): boolean {
  if (e.kind !== 'item' || e.item.locked) return false;
  return svc === 'appraiser' ? !e.item.identified : e.item.identified;
}
export function openService(svc: ServiceSpot | null) { const n = N(); n.svc = svc; n.svcPick = []; n.appraised = null; n.townTab = 'town'; n.plotHot = null; sfx.click(); }
export function servicePick(id: string) {
  const n = N(), e = S.g.bag.find(x => x.id === id);
  if (!n.svc || !e || !serviceApplies(n.svc, e)) { sfx.bad(); return; }
  const p = (n.svcPick ??= []);
  if (n.svc === 'appraiser') { n.svcPick = p.includes(id) ? [] : [id]; sfx.click(); return; }   // one at a time: the reveal
  if (p.includes(id)) p.splice(p.indexOf(id), 1); else p.push(id);
  sfx.click();
}
/** The picked items' total: Souls at the forge, gold at the Merchant and the Appraiser (a cost), dollars at the auction. */
export function serviceSum(svc: ServiceSpot, ids: string[]): number {
  return ids.reduce((a, id) => a + (svc === 'forge' ? salvageYield(id) : svc === 'merchant' ? vendorValue(id) : svc === 'auction' ? listValue(id) : identifyCost(id)), 0);
}
export function identifyCost(id: string): number { const e = S.g.bag.find(x => x.id === id); return e?.kind === 'item' && e.item.rarity === 'legendary' ? T.IDENTIFY_COST.legendary : T.IDENTIFY_COST.epic; }
export function serviceRun() {
  const n = N(), svc = n.svc, ids = [...(n.svcPick ?? [])];
  if (!svc || !ids.length) return;
  for (const id of ids) serviceAction(svc === 'forge' ? 'salvage' : svc === 'merchant' ? 'vendor' : svc === 'auction' ? 'list' : 'identify', id);
  if (svc === 'appraiser' && S.g.bag.find(x => x.id === ids[0] && x.kind === 'item' && x.item.identified)) n.appraised = { id: ids[0], t: 0 };
  n.svcPick = [];
}

/** Actions from the service windows take the item id directly. */
export function serviceAction(kind: 'identify' | 'vendor' | 'salvage' | 'list', id: string) {
  N().selected = id;
  if (kind === 'identify') identify(); else if (kind === 'vendor') vendor(); else if (kind === 'salvage') salvage(); else list();
  N().selected = null;
}

/** The cheapest next city build and whether tonight's bag pays for it: salvage the cheapest items until the
 *  scraps are there, sell the rest (docs/design/city.md; results screen and the F1 line, #2). */
export function cityOutlook() {
  const next = CITY.filter(c => (S.g.furniture[c.id] ?? 0) < 3).map(c => ({ c, lvl: S.g.furniture[c.id] ?? 0 }))
    .map(x => ({ name: x.c.name, upgrade: x.lvl > 0, gold: x.c.gold[x.lvl], mats: x.c.mats[x.lvl] })).sort((a, b) => a.gold - b.gold)[0];
  const loose = S.g.bag.filter(e => e.kind === 'item' && !e.item.locked)
    .map(e => e.kind === 'item' ? { sell: Math.round(e.item.value * (e.item.identified ? 1 : T.UNIDENTIFIED_VENDOR_MULT)), scraps: T.SALVAGE_YIELD[RARITIES.indexOf(e.item.rarity)] } : { sell: 0, scraps: 0 })
    .sort((a, b) => a.sell - b.sell);
  const bagGold = loose.reduce((a, x) => a + x.sell, 0), bagScraps = loose.reduce((a, x) => a + x.scraps, 0);
  let gold = S.g.gold, mats = S.g.mats;
  for (const x of loose) { if (next && mats < next.mats) mats += x.scraps; else gold += x.sell; }
  const now = !!next && S.g.gold >= next.gold && S.g.mats >= next.mats;
  const withBag = !!next && gold >= next.gold && mats >= next.mats;
  return { next, bagGold, bagScraps, now, withBag, short: next ? { gold: Math.max(0, next.gold - gold), mats: Math.max(0, next.mats - mats) } : null };
}

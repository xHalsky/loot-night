// What she wears (fan-service steps 3 and 4, #90, #91; docs/design/her.md, How she looks). Her outfit comes from what
// she was doing (ui/her.ts OUTFIT_BY_ACTIVITY), with rules on top: home from work on a weekday before 21:00 she is
// still in her work blouse; getting ready for bed (in the bedroom after 23:30) her pajama shorts; the towel and your
// hoodie stay as they are. Her gifts (the Shop's For her) take a slot each, feet and top: one gift per slot a night,
// the newest the night after you buy it, then one at random; the first time she wears one, Goodwill +20. What's on
// her feet changes her footsteps (visits.ts): slippers are heard 2 s earlier and louder, socks 2 s later and quieter,
// the fluffy socks not at all (only the handle).
import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { OUTFIT_BY_ACTIVITY, type Outfit, type Item, type Feet } from '../ui/her';
import { pick } from '../core/rng';
import { addGoodwill } from './goodwill';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');

export type GiftId = 'fluffy' | 'knee' | 'fury' | 'pjset' | 'cathoodie';
export const GIFTS: Record<GiftId, { slot: 'feet' | 'top'; name: string; outfit?: Outfit; feet?: Feet }> = {
  fluffy: { slot: 'feet', name: 'the fluffy socks', feet: 'fluffy' },
  knee: { slot: 'feet', name: 'the knee socks', feet: 'knee' },
  fury: { slot: 'top', name: 'the Goblin Fury tee', outfit: 'fury' },
  pjset: { slot: 'top', name: 'the pajama set', outfit: 'pjset' },
  cathoodie: { slot: 'top', name: 'the cat-ear hoodie', outfit: 'cathoodie' },
};
export const isGift = (id: string): id is GiftId => id in GIFTS;

/** You bought her something: she wears it the night after. */
export function giftBought(id: GiftId) { (S.g.giftNew ??= []).push(id); }

/** At the start of a night: what she wears tonight, one per slot; the first time, Goodwill. */
export function chooseWear() {
  const n = N(), owned = S.g.owned.filter(isGift), fresh = (S.g.giftNew ?? []).filter(isGift);
  n.wear = { top: null, feet: null };
  for (const slot of ['feet', 'top'] as const) {
    const mine = owned.filter(g => GIFTS[g].slot === slot);
    if (!mine.length) continue;
    const newest = fresh.filter(g => GIFTS[g].slot === slot).pop();
    n.wear[slot] = newest ?? pick(mine);
  }
  S.g.giftNew = fresh.filter(g => n.wear.top !== g && n.wear.feet !== g);
  for (const g of [n.wear.top, n.wear.feet]) if (g && !(S.g.giftWorn ??= []).includes(g)) {
    S.g.giftWorn.push(g);
    n.giftFirst = [...(n.giftFirst ?? []), g];
  }
}
/** The first time she wears a gift: said when the night starts (the feed and Goodwill). */
export function giftFirstNote() {
  const n = N();
  for (const g of n.giftFirst ?? []) { addGoodwill(T.GIFT_GOODWILL, 'she loves it'); toast(`She's wearing ${GIFTS[g as GiftId].name} you got her.`, '#ff9ab8'); }
  n.giftFirst = [];
}
export const wearing = (g: GiftId) => { const w = N()?.wear; return !!w && (w.top === g || w.feet === g); };

/** Her look tonight for what she was doing ('night' = your hoodie: the walk-by, come to bed). */
export function herLook(from: string): { outfit: Outfit; item: Item; feet: Feet } {
  const n = N(), base = OUTFIT_BY_ACTIVITY[from] ?? OUTFIT_BY_ACTIVITY.tv;
  let outfit = base.outfit, feet: Feet = base.feet ?? 'bare';
  const water = outfit === 'towel', yours = from === 'night';
  if (!water && !yours && workClothes()) { outfit = 'blouse'; feet = 'socks'; }   // home from work
  if (from === 'phone' && n && n.clock >= T.BED_CLOTHES_FROM) outfit = 'pajama';   // getting ready for bed
  const w = n?.wear;
  if (w?.top && !water && !yours) outfit = GIFTS[w.top as GiftId].outfit!;
  if (w?.feet && !water) feet = GIFTS[w.feet as GiftId].feet!;
  return { outfit, item: base.item, feet };
}
/** Monday to Friday before WORK_CLOTHES_UNTIL she is still in her work blouse (week two too: she works weekdays). */
export const workClothes = () => { const n = N(); return !!n && S.g.day % 7 < 5 && n.clock < T.WORK_CLOTHES_UNTIL; };

/** Her footsteps by what's on her feet: how loud, and from which stage of the walk you hear them. */
export function stepsFor(feet: Feet): { vol: number; from: 'far' | 'hall' | 'never'; early: number } {
  if (feet === 'fluffy') return { vol: 0, from: 'never', early: 0 };
  if (feet === 'socks' || feet === 'knee') return { vol: T.SOCKS_STEP_VOL, from: 'hall', early: 0 };   // heard SOCKS_LATE_SEC later: the far stage is silent
  if (feet === 'slippers') return { vol: T.SLIPPERS_STEP_VOL, from: 'far', early: T.SLIPPERS_EARLY_SEC };
  return { vol: 1, from: 'far', early: 0 };
}

import { T } from '../config/tuning';
import { on } from './week';
import { S, N } from '../core/state';
import { SHOP_ITEMS, type ShopId } from '../data/shop';
import { addGoodwill } from './goodwill';
import { isGift, giftBought } from './wardrobe';
import { tip } from './tips';
import { sfx } from '../ui/audio';
import { toastAs } from '../core/fx';
const toast = toastAs('SHOP');

// The Shop app (step 4.6, #55; docs/design/desk.md, the Shop): real-life upgrades for zl. Buying is instant; the
// phone is in your hand (hands busy) while you shop. What lasts is saved in S.g.owned; one-use things once a night.

export type ShopState = 'buy' | 'dear' | 'owned' | 'tonight' | 'soon' | 'full' | 'inhome';
export const owns = (id: string) => S.g.owned.includes(id);
export function shopState(id: ShopId): ShopState {
  const it = SHOP_ITEMS.find(i => i.id === id)!, n = N();
  if (it.needs && !on(it.needs)) return 'soon';   // not in yet (#56): the view leaves it out
  if (it.kind === 'soon') return 'soon';
  if (it.kind === 'inhome') return 'inhome';
  if (it.kind === 'own' && owns(id)) return 'owned';
  if (it.kind === 'night' && n.shopTonight.includes(id)) return 'tonight';
  if (id === 'fuel' && S.g.monsters >= T.MONSTER_DRAWER) return 'full';
  return S.g.zl >= T.SHOP_ZL[id] ? 'buy' : 'dear';
}
export function shopBuy(id: ShopId): boolean {
  if (shopState(id) !== 'buy') return false;
  const n = N(), it = SHOP_ITEMS.find(i => i.id === id)!;
  S.g.zl -= T.SHOP_ZL[id];
  if (it.kind === 'own') S.g.owned.push(id);
  if (it.kind === 'night') n.shopTonight.push(id);
  if (id === 'fuel') { const got = Math.min(T.SHOP_FUEL_CANS, T.MONSTER_DRAWER - S.g.monsters); S.g.monsters += got; toast(`Goblin Fuel: +${got} cans in the drawer.`, '#9fe08a'); }
  else if (id === 'chew') { if (n.dog.stage === 'away') n.dog.next += T.SHOP_CHEW_SEC; else n.dogChew = true; toast('A chew for the dog. His next visit comes later.', '#f2c46b'); }
  else if (id === 'flowers') { toast('Flowers for her. She will find them on the table.', '#ff9ab8'); addGoodwill(T.SHOP_FLOWERS_GOODWILL, 'flowers'); }
  else if (id === 'mirror') { toast('The hall mirror is up. Lean past 3 to look round the corner.', '#9fe08a'); tip('mirror'); }
  else if (it.tab === 'home') toast(`${it.name}: installed. It's in the Home app.`, '#9fe08a');
  else if (isGift(id)) { giftBought(id); toast(`${it.name} for her. She'll wear them tomorrow.`.replace('wear them', /socks/.test(it.name) ? 'wear them' : 'wear it'), '#ff9ab8'); }
  else toast(`${it.name}: yours.`, '#9fe08a');
  sfx.coin();
  return true;
}
/** The dog chew, bought while he was up: his next visit after this one comes later. */
export function chewDelay(): number { const n = N(); if (!n.dogChew) return 0; n.dogChew = false; return T.SHOP_CHEW_SEC; }

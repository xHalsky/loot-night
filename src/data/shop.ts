// The Shop app (step 4.6, #55; grid doc 7i): real-life things only, paid in zl. Prices and effects' numbers are in
// tuning.ts. kind: 'repeat' (buy any time, as long as there is room), 'night' (one use: once a night), 'own' (lasts,
// saved), 'soon' (listed, not sold yet). Her gifts beyond the flowers come with the fan-service pass (#59); the Home
// tab with the smart home (step 6, #57).
import { T } from '../config/tuning';

export type ShopId = 'fuel' | 'chew' | 'keys' | 'fridge' | 'chair' | 'phone' | 'flowers';
export interface ShopItem { id: ShopId; tab: 'you' | 'her'; g: string; name: string; fx: string; kind: 'repeat' | 'night' | 'own' | 'soon' }
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'fuel', tab: 'you', g: 'can', name: 'Goblin Fuel', fx: `${T.SHOP_FUEL_CANS} cans for the drawer (it holds ${T.MONSTER_DRAWER}).`, kind: 'repeat' },
  { id: 'chew', tab: 'you', g: 'chew', name: 'Dog chew', fx: `His next visit comes ${T.SHOP_CHEW_SEC / 60} min later. One use.`, kind: 'night' },
  { id: 'keys', tab: 'you', g: 'keys', name: 'Silent keys', fx: 'Q4 makes half the Noise.', kind: 'own' },
  { id: 'fridge', tab: 'you', g: 'fridge', name: 'Mini fridge', fx: 'A cold can already waits on the desk.', kind: 'own' },
  { id: 'chair', tab: 'you', g: 'chair', name: 'Ergo chair', fx: `Tiredness builds ${Math.round((1 - T.SHOP_CHAIR_TIRED) * 100)}% slower.`, kind: 'own' },
  { id: 'phone', tab: 'you', g: 'phone', name: 'New phone', fx: 'The battery drains 40% slower (soon).', kind: 'soon' },
  { id: 'flowers', tab: 'her', g: 'flowers', name: 'Flowers', fx: `+${T.SHOP_FLOWERS_GOODWILL} Goodwill at once. One use.`, kind: 'night' },
];

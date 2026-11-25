// The Shop app (step 4.6, #55; grid doc 7i): real-life things only, paid in zl. Prices and effects' numbers are in
// tuning.ts. kind: 'repeat' (buy any time, as long as there is room), 'night' (one use: once a night), 'own' (lasts,
// saved), 'soon' (listed, not sold yet). Her gifts beyond the flowers come with the fan-service pass (#59); the Home
// tab (devices for the Home app) with the smart home (step 6, #57). needs: the week's thing it belongs to (#56): it is listed from that night.
import { T } from '../config/tuning';

export type ShopId = 'fuel' | 'chew' | 'keys' | 'fridge' | 'chair' | 'phone' | 'flowers' | 'vacuum' | 'speaker' | 'tv' | 'seal' | 'tea';
export interface ShopItem { id: ShopId; tab: 'you' | 'her' | 'home'; g: string; name: string; fx: string; kind: 'repeat' | 'night' | 'own' | 'soon' | 'inhome'; needs?: string }   // inhome: ordered in the Home app, listed here
export const SHOP_ITEMS: ShopItem[] = [
  { id: 'fuel', tab: 'you', g: 'can', name: 'Goblin Fuel', fx: `${T.SHOP_FUEL_CANS} cans for the drawer (it holds ${T.MONSTER_DRAWER}).`, kind: 'repeat', needs: 'fuel' },
  { id: 'chew', tab: 'you', g: 'chew', name: 'Dog chew', fx: `His next visit comes ${T.SHOP_CHEW_SEC / 60} min later. One use.`, kind: 'night', needs: 'dog' },
  { id: 'keys', tab: 'you', g: 'keys', name: 'Silent keys', fx: 'Q4 makes half the Noise.', kind: 'own' },
  { id: 'fridge', tab: 'you', g: 'fridge', name: 'Mini fridge', fx: 'A cold can already waits on the desk.', kind: 'own', needs: 'fuel' },
  { id: 'chair', tab: 'you', g: 'chair', name: 'Ergo chair', fx: `Tiredness builds ${Math.round((1 - T.SHOP_CHAIR_TIRED) * 100)}% slower.`, kind: 'own', needs: 'tired' },
  { id: 'phone', tab: 'you', g: 'phone', name: 'New phone', fx: `The battery drains ${Math.round((1 - T.NEW_PHONE_DRAIN) * 100)}% slower.`, kind: 'own', needs: 'home' },
  // the Home tab (step 6, #57): the devices for the Home app; the bubble tea is ordered there
  { id: 'vacuum', tab: 'home', g: 'vac', name: 'Robot vacuum', fx: `Sends her to stop it. Next visit +${T.VACUUM_CALM} s.`, kind: 'own', needs: 'home' },
  { id: 'speaker', tab: 'home', g: 'spk', name: 'Speakers', fx: `A pair: kitchen and bath. A timer, +${T.SPEAKER_CALM} s.`, kind: 'own', needs: 'home' },
  { id: 'tv', tab: 'home', g: 'tv', name: 'TV cast', fx: 'At the credits: one more episode.', kind: 'own', needs: 'home' },
  { id: 'seal', tab: 'home', g: 'door', name: 'Door seal', fx: 'Quieter, but no light under your door.', kind: 'own', needs: 'home' },
  { id: 'tea', tab: 'home', g: 'cup', name: 'Bubble tea', fx: `An order, in the Home app. ${T.TEA_MAX === 2 ? 'Twice' : T.TEA_MAX + ' times'} a night.`, kind: 'inhome', needs: 'home' },
  { id: 'flowers', tab: 'her', g: 'flowers', name: 'Flowers', fx: `+${T.SHOP_FLOWERS_GOODWILL} Goodwill at once. One use.`, kind: 'night' },
];

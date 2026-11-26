// Selfies (fan-service step 5, #92): one in three of her texts after midnight carries a photo; in her chat it's a crop
// with 60 s to tap it; open, the whole photo beside the phone (hands busy), Goodwill +5 the first time; not opened in
// 60 s, "Babe unsent a photo."; she wears her top gift in the mirror one. Only from Friday (she goes to bed).
// Run: npx tsx test/selfies.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { on } from '../src/systems/week';
import { sendSelfie, openPhoto, closePhoto, updateSelfies } from '../src/systems/selfies';
import { updateApartment } from '../src/systems/apartment';
import { herUnread } from '../src/systems/messages';
import { chatItems } from '../src/render/phoneView';
import { abilitiesLocked } from '../src/systems/battle';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
const night = (day = 4) => {
  S.g = initialState(); S.g.day = day; startNight(); S.g.howto = false;
  const n = N(); n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.location = 'dungeon'; n.phase = 'battle'; n.enemies = [{ hp: 9 } as never];
  return n;
};
const photos = () => (S.g.herThread ?? []).filter(l => l.s === 'photo');

// --- when ---
let n = night(3); ok(!on('selfies'), 'Thursday: no selfies');
n = night(4); ok(on('selfies'), 'Friday: her texts after midnight can carry a photo');
let got = 0;
for (let i = 0; i < 300; i++) {
  n = night(4); n.apt.asleep = true; n.apt.activity = 'sleep'; n.apt.wake = T.WAKE_TEXT + 1; n.apt.textSent = false; n.clock = 24 * 60 + 30;
  updateApartment(1 / 60); if (photos().length) got++;
}
ok(got > 70 && got < 130, `one in three of her bed texts (${got} of 300)`);

// --- in her chat ---
n = night(4); n.clock = 24 * 60 + 41; sendSelfie('jersey');
const it = chatItems(S.g.herThread!).find(m => m[0] === 'photo') as ['photo', string, { left?: number; ring?: boolean; tap?: number }];
ok(!!it && it[1] === 'jersey' && it[2].left === T.SELFIE_SEC && it[2].ring && it[2].tap === S.g.herThread!.length - 1, 'in her chat: the crop, a gold ring, 60 s');
ok(herUnread() === 1, 'it counts as unread');
// open it
const g0 = S.g.goodwill; openPhoto(it[2].tap!);
ok(!!n.photo && n.photo.key === 'jersey' && n.photo.first && Math.round(S.g.goodwill - g0) === T.SELFIE_GOODWILL, `tap it: the photo beside the phone, Goodwill +${T.SELFIE_GOODWILL}`);
ok(abilitiesLocked() === 'Hands busy', 'hands busy while it is open');
closePhoto(); openPhoto(it[2].tap!); ok(!!n.photo && !n.photo.first && Math.round(S.g.goodwill - g0) === T.SELFIE_GOODWILL, 'again: no more Goodwill');
closePhoto(); ok(!n.photo && !abilitiesLocked(), 'closed');
n.threat += 120; updateSelfies(0.1); ok(photos().length === 1, 'opened: it stays');

// --- not opened ---
n = night(4); sendSelfie('duvet'); n.threat += T.SELFIE_SEC - 1; updateSelfies(0.1); ok(photos().length === 1, '59 s: still there');
n.threat += 1.5; updateSelfies(0.1); ok(!photos().length && S.g.herThread!.some(l => l.s === 'sys' && l.text === 'Babe unsent a photo.'), '60 s: "Babe unsent a photo."');

// --- her gift in it ---
n = night(4); n.wear.top = 'cathoodie'; sendSelfie('jersey'); ok(photos()[0].text === 'jersey:cathoodie', 'in her cat-ear hoodie (her gift tonight)');
console.log(fails ? `${fails} FAILED` : 'PASS');

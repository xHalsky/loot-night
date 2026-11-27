// First-night onboarding (#28): the how-to card holds the night; her opening line comes once per save, through the door
// (#139); no tips in the feed (#141); tips seen survive a save, a new game starts them over. Run: npx tsx test/tips.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
(globalThis as any).performance ??= { now: () => Date.now() };
import { howtoOpens } from '../src/systems/week';
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { startNight } from '../src/systems/night';
import { step } from '../src/core/loop';
import { tip } from '../src/systems/tips';
import { save, load } from '../src/systems/save';

let fails = 0;
const ok = (c: boolean, msg: string) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fails++; };
S.g = initialState(); startNight();
ok(S.g.howto, 'the first night opens with the how-to-hide card');
const t0 = N().threat; for (let i = 0; i < 120; i++) step(1 / 60);
ok(N().threat === t0, 'the night waits while the card is open');
S.g.howto = false; N().phoneScript = []; N().friendsLeft = 0;
for (let i = 0; i < 60 * (T.TIP_HER_AT + 1); i++) step(1 / 60);
ok(S.g.tipsSeen.includes('her_show') && N().say?.[0]?.text.startsWith("I'm watching my show"), `her opening line after ${T.TIP_HER_AT} s: said through the door (#139)`);
ok(!N().log.some(l => l.text.includes("watching my show")), 'her words are not in the feed');
const before = N().say!.length; tip('her_show'); ok(N().say!.length === before, 'once per save');
ok(!N().log.some(l => /^\[|HUDZOR|ARKBISHOP/.test(l.tag ?? '') || /excel has to be up|wants pets|hover a node|space = autosum/i.test(l.text)), 'no tips in the feed (#141)');
save();
S.g = initialState(); load();
ok(S.g.tipsSeen.includes('her_show'), 'tips seen survive a save');
startNight();
ok(S.g.howto, 'Monday again (same save): the card shows');
S.g.day = 1; startNight(); ok(S.g.howto, 'Tuesday: the card again, the headset new (#56)');
S.g.day = 2; startNight(); ok(!howtoOpens() && !!S.g.voice, 'Wednesday, nothing new to hide from: the boys\' chat, no card');
S.g = initialState();
ok(S.g.tipsSeen.length === 0, 'a new game starts the tips over');
console.log(fails ? `${fails} FAILED` : 'PASS');

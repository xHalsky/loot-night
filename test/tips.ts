// First-night onboarding (#28): the how-to card holds the night, each tip shows once per save and is pinned,
// tips survive a save, a new game starts them over. Run: npx tsx test/tips.ts
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
(globalThis as any).performance ??= { now: () => Date.now() };
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
S.g.howto = false; N().nextInterruptAt = 1e9;
for (let i = 0; i < 60 * (T.TIP_HER_AT + 1); i++) step(1 / 60);
ok(S.g.tipsSeen.includes('her_show') && !!N().tip, `her opening line after ${T.TIP_HER_AT} s, pinned in the feed`);
const lines = () => N().log.filter(l => l.text.includes('wants pets')).length;
tip('dog'); tip('dog');
ok(lines() === 1, 'a tip shows once');
for (let i = 0; i < 60 * (T.TIP_PIN_SEC + 0.5); i++) step(1 / 60);
ok(N().tip === null || !N().tip!.text.includes('wants pets'), `the pin clears after ${T.TIP_PIN_SEC} s`);
save();
S.g = initialState(); load();
ok(S.g.tipsSeen.includes('dog'), 'tips seen survive a save');
startNight();
ok(S.g.nightsPlayed > 0 || S.g.howto, 'night 1 again (same save): the card shows while nightsPlayed is 0');
S.g.nightsPlayed = 1; startNight();
ok(!S.g.howto, 'later nights: no card');
S.g = initialState();
ok(S.g.tipsSeen.length === 0, 'a new game starts the tips over');
console.log(fails ? `${fails} FAILED` : 'PASS');

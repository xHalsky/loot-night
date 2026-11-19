// Goblin Fuel drink (#61), headless: how much goes down for different ways of playing it.
// A careless player (holds Space) should spill below the half mark; a careful one (taps, watching his mouth)
// should reach the full 85%. Run: npx tsx test/pour.ts
import { T } from '../src/config/tuning';
import { newPour, stepPour, canFor, share, MOUTH, inAir, type Pour } from '../src/systems/fuelPhysics';

type Ctl = (p: Pour, t: number, mem: Record<string, number>) => boolean;
const CTL: Record<string, Ctl> = {
  hold: () => true,                                                          // hold Space the whole time
  greedy: p => p.mouth < T.MONSTER_MOUTH_CAP - 2,                            // tilt until his mouth is nearly full
  watch: p => p.mouth < T.MONSTER_MOUTH_CAP * 0.35 && inAir(p) < 3,          // react to his mouth filling
  steady: (_p, t) => (t % 0.5) < 0.33,                                       // feather Space: a slow, steady tilt
};
function run(name: string, seed: number, err = 0) {
  const p = newPour(), mem: Record<string, number> = {};
  let t = 0, coughs = 0, rnd = seed;
  const r = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647 - 0.5; };
  while (t < 40 && !p.done) {
    const a = Math.max(p.a, 0.5);
    const [tx, ty] = canFor(MOUTH.x + r() * err, MOUTH.y + r() * err, a);
    stepPour(p, 1 / 60, { held: t > 0.3, tx, ty, tilt: t > 0.6 && CTL[name](p, t, mem) }, { cough: () => coughs++ });
    t += 1 / 60;
  }
  return { pct: Math.round(share(p) * 100), t: Math.round(t * 10) / 10, coughs, done: p.done };
}
const out: Record<string, unknown> = {};
for (const n of Object.keys(CTL)) {
  const runs = [1, 2, 3].map(s => run(n, s * 7919, 6));
  out[n] = runs.map(x => `${x.pct}% in ${x.t}s, ${x.coughs} cough${x.done ? '' : ', NOT DONE'}`);
}
const avg = (n: string) => [1, 2, 3].map(s => run(n, s * 7919, 6).pct).reduce((a, b) => a + b, 0) / 3;
const ok = avg('hold') < T.MONSTER_DRINK_HALF * 100 && avg('steady') >= T.MONSTER_DRINK_FULL * 100;
console.log(JSON.stringify({ full: T.MONSTER_DRINK_FULL, half: T.MONSTER_DRINK_HALF, swallow: T.MONSTER_SWALLOW, cap: T.MONSTER_MOUTH_CAP, ...out, pass: ok }, null, 1));
if (!ok) process.exit(1);

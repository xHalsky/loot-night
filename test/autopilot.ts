// Acceptance test for being away (#15; since #52 away means no manual skills or ultimates, auto attacks only).
// A bot plays (casting skills, no threats) until a target fight starts, then the same moment is replayed
// for 40 s three times: smart (answers the boss wind-up), spam (skills on cooldown) and away (on Excel).
// Reports the LOWEST party HP during the fight (a boss kill levels the party up and heals it).
// 'close calls' = survived but dipped under 25%.
// Done when: 40 s away during a boss usually wipes; 40 s away on a normal floor leaves the party hurt but alive.
// The bot gears up on the way (gearUp), as a player must since #49.
// Run: npx tsx test/autopilot.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, choosePath, isBossBattle } from '../src/systems/dungeon';
import { queueAbility, moveOf, abilityUnlocked } from '../src/systems/battle';
import { maxHp, heroStats } from '../src/systems/stats';
import { equipItemOn } from '../src/systems/bag';
import { skipDrop } from '../src/systems/loot';

/** The bot gears up on the way, as a player must since #49: every upgrade goes on the hero it helps most. */
const score = (st: any) => st.atk * 3 + st.hp * 0.3 + st.armor * 2 + st.speed * 3 + st.crit;
function gearUp() {
  for (const e of [...S.g.bag]) {
    if (e.kind !== 'item' || !e.item.identified) continue;
    let best = -1, gain = 0;
    S.g.heroes.forEach((h, i) => { const d = score(heroStats(h, { [e.item.slot]: e.item })) - score(heroStats(h)); if (d > gain) { gain = d; best = i; } });
    if (best >= 0) equipItemOn(e.id, best);
  }
  if (N().dropPopup) skipDrop();
}

const DT = 1 / 60;
function calm() {
  const n = N();
  n.interrupts = []; n.phoneScript = []; n.friendsLeft = 0; n.dog.next = 1e9; n.dog.stage = 'away';
  n.apt.lastVisitEnd = n.threat; n.visit.stage = 'idle'; n.tired = 0; n.mood = 0;
  S.g.night!.dropPopup = null; n.selected = null;
}
/** A careful player: Bash saved for the wind-up on bosses (else Taunt, else Ward), Frost first so Bash shatters and
 *  Fire hits Staggered enemies, Mend when hurt; ultimates (slot 3) when charged: Last Stand and Cataclysm at once,
 *  Miracle when someone is down or nearly. */
function castSmart() {
  const n = N();
  if (n.phase !== 'battle' || !n.enemies.some(e => e.hp > 0)) return;
  const by = (id: string) => S.g.heroes.find(x => x.id === id)!, at = (id: string) => S.g.heroes.findIndex(x => x.id === id);
  const k = by('knight'), m = by('mage'), h = by('healer');
  const ok = (hero: typeof k, s: number) => !hero.downed && hero.cd[s] <= 0 && abilityUnlocked(hero, s) && (s !== 3 || hero.ult >= 1);
  const K = (s: number) => queueAbility(at('knight'), s), M = (s: number) => queueAbility(at('mage'), s), H = (s: number) => queueAbility(at('healer'), s);
  const wind = n.enemies.find(e => e.hp > 0 && (e.wind ?? 0) > 0);
  const move = wind ? moveOf(wind) : undefined;
  const boss = n.enemies.some(e => e.boss && e.hp > 0 && moveOf(e) === 'slam');   // only SMASH needs Bash saved
  if (move === 'slam') { if (ok(k, 2) && !wind!.braced) K(2); else if (ok(k, 1)) K(1); else if (ok(h, 2)) H(2); }
  if (move === 'evict') { if (ok(k, 1)) K(1); else if (ok(h, 2)) H(2); }
  const alive = n.enemies.filter(e => e.hp > 0);
  if (ok(k, 3)) K(3);
  if (ok(m, 2)) M(2);
  if (!boss && ok(k, 2)) K(2);
  if (ok(m, 1) && (!boss || alive.some(e => (e.marks?.stagger ?? 0) > 0))) M(1);
  if (ok(m, 3)) M(3);
  const hp = S.g.heroes.reduce((a, x) => a + x.hp, 0) / S.g.heroes.reduce((a, x) => a + maxHp(x), 0);
  if (hp < 0.8 && ok(h, 1)) H(1);
  if (ok(h, 3) && S.g.heroes.some(x => x.downed || x.hp < maxHp(x) * 0.35)) H(3);
  if (!boss && ok(k, 1)) K(1);
}
function castReady() {
  const n = N();
  S.g.heroes.forEach((h, i) => [1, 2, 3].forEach(s => {
    if (n.phase === 'battle' && !h.downed && h.cd[s] <= 0 && abilityUnlocked(h, s) && (s !== 3 || h.ult >= 1) && n.enemies.some(e => e.hp > 0)) queueAbility(i, s);
  }));
}
/** Plays present until a fight of the wanted kind starts on floor >= minFloor. Returns a snapshot or null. */
function reach(boss: boolean, minFloor: number): string | null {
  S.g = initialState();
  // a party some nights in (#53): skill 2 and the ultimate bought in every tree
  S.g.trees = Object.fromEntries(S.g.heroes.map(h => [h.id, ['g1', 'g2', 's2', 'm1', 'm2', 'm3', 'ult']]));
  startNight(); S.g.howto = false; /* the bot reads the how-to card (#28) */ travelToDungeon();
  for (let i = 0; i < 60 * 60 * 40; i++) {
    calm();
    const n = N();
    if (n.phase === 'mapChoice') choosePath(N().safest);
    if (n.phase === 'battle' && n.floor >= minFloor && isBossBattle() === boss && n.phaseT < 0.05) return JSON.stringify(S.g);
    if (n.phase === 'walk') gearUp();
    castReady();
    step(DT);
    if (S.g.screen !== 'night') return null;
    if (n.location === 'town') travelToDungeon(Math.max(...S.g.checkpoints));   // a wipe: the next run from the deepest checkpoint
  }
  return null;
}
function play(snap: string, mode: 'smart' | 'spam' | 'away'): { wiped: boolean; hpPct: number; won: boolean; secs: number } {
  const away = mode === 'away';
  S.g = JSON.parse(snap);
  const n = N();
  n.monitor = away ? 'excel' : 'rpg';
  const boss0 = isBossBattle();
  const LONG = Number(process.env.LONG ?? 70);
  let wiped = false, won = false, minHp = 1, secs = away ? 40 : LONG;
  const partyHp = () => S.g.heroes.reduce((a, h) => a + (h.downed ? 0 : h.hp), 0) / S.g.heroes.reduce((a, h) => a + maxHp(h), 0);
  for (let i = 0; i < 60 * (away ? 40 : LONG); i++) {
    if (n.phase === 'battle') minHp = Math.min(minHp, partyHp());
    if (won && secs === LONG) secs = Math.round(i / 60);
    calm();
    if (mode === 'spam') castReady(); if (mode === 'smart') castSmart();
    if (n.phase === 'mapChoice') { won = true; break; }
    const idx = n.battleIdx;
    step(DT);
    if (n.location === 'town') { wiped = true; break; }   // #52, 1.4: a wipe ends the run in town
    if (boss0 && n.battleIdx > idx) won = true;
  }
  return { wiped, hpPct: Math.round(minHp * 100), won, secs };
}
const TRIALS = Number(process.argv[2] ?? 30);
const ONLY = process.argv[3];   // e.g. "15" runs only that floor
for (const [label, boss, floor] of ([['boss floor 5', true, 5], ['boss floor 10', true, 10], ['boss floor 15', true, 15], ['normal floor 3', false, 3], ['normal floor 8', false, 8]] as const).filter(x => !ONLY || String(x[2]) === ONLY)) {
  const res = { smart: { wipe: 0, hp: 0, n: 0, low: 0, s: 0 }, spam: { wipe: 0, hp: 0, n: 0, low: 0, s: 0 }, away: { wipe: 0, hp: 0, n: 0, low: 0, s: 0 } };
  for (let k = 0; k < TRIALS; k++) {
    const snap = reach(boss, floor);
    if (!snap) continue;
    for (const mode of ['smart', 'spam', 'away'] as const) {
      const r = play(snap, mode);
      res[mode].n++; if (r.wiped) res[mode].wipe++; res[mode].hp += r.hpPct; res[mode].s += r.secs; if (!r.wiped && r.hpPct < 25) res[mode].low++;
    }
  }
  const f = (m: { wipe: number; hp: number; n: number; low: number; s: number }) => `wipes ${String(m.wipe).padStart(2)}/${m.n} lowest HP ${String(Math.round(m.hp / Math.max(1, m.n))).padStart(3)}% close calls ${String(m.low).padStart(2)} ${Math.round(m.s / Math.max(1, m.n))}s`;
  console.log(`${label.padEnd(15)} smart: ${f(res.smart)} | spam: ${f(res.spam)} | away: ${f(res.away)}`);
}

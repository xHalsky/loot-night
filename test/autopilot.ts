// Acceptance test for the reckless autopilot (#15).
// A bot plays (casting skills, no threats) until a target fight starts, then the same moment is replayed
// for 40 s three times: smart (answers the boss wind-up), spam (skills on cooldown) and away (on Excel).
// Reports the LOWEST party HP during the fight (a boss kill levels the party up and heals it).
// 'close calls' = survived but dipped under 25%.
// Done when: 40 s away during a boss usually wipes; 40 s away on a normal floor leaves the party hurt but alive.
// Run: npx tsx test/autopilot.ts
(globalThis as any).localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
(globalThis as any).performance ??= { now: () => Date.now() };
import { T } from '../src/config/tuning';
import { S, N, initialState } from '../src/core/state';
import { step } from '../src/core/loop';
import { startNight } from '../src/systems/night';
import { travelToDungeon, chooseNextFloor, isBossBattle } from '../src/systems/dungeon';
import { queueAbility } from '../src/systems/battle';
import { maxHp } from '../src/systems/stats';

const DT = 1 / 60;
function calm() {
  const n = N();
  n.interrupts = []; n.nextInterruptAt = 1e9; n.dog.next = 1e9; n.dog.stage = 'away';
  n.apt.lastVisitEnd = n.threat; n.visit.stage = 'idle'; n.tired = 0; n.mood = 0;
  S.g.night!.dropPopup = null; n.selected = null;
}
/** A careful player: Bash saved for the wind-up on bosses (else Taunt, else Ward), Rally and Frost first so Bash
 *  shatters and Fire hits Staggered enemies, Mend when hurt, Revive when someone is down or nearly. */
function castSmart() {
  const n = N();
  if (n.phase !== 'battle' || !n.enemies.some(e => e.hp > 0)) return;
  const [k, m, h] = S.g.heroes;
  const ok = (hero: typeof k, s: number) => !hero.downed && hero.cd[s] <= 0 && hero.level >= T.ABILITY_UNLOCK[s];
  const winding = n.enemies.some(e => e.hp > 0 && (e.wind ?? 0) > 0);
  const boss = n.enemies.some(e => e.boss && e.hp > 0);
  const braced = n.enemies.some(e => e.hp > 0 && (e.wind ?? 0) > 0 && e.braced);
  if (winding) { if (ok(k, 2) && !braced) queueAbility(0, 2); else if (ok(k, 1)) queueAbility(0, 1); else if (ok(h, 2)) queueAbility(2, 2); }
  const alive = n.enemies.filter(e => e.hp > 0);
  if (ok(k, 3)) queueAbility(0, 3);
  if (ok(m, 2)) queueAbility(1, 2);
  if (!boss && ok(k, 2)) queueAbility(0, 2);
  if (ok(m, 1) && (!boss || alive.some(e => (e.marks?.stagger ?? 0) > 0))) queueAbility(1, 1);
  if (ok(m, 3)) queueAbility(1, 3);
  const hp = S.g.heroes.reduce((a, x) => a + x.hp, 0) / S.g.heroes.reduce((a, x) => a + maxHp(x), 0);
  if (hp < 0.8 && ok(h, 1)) queueAbility(2, 1);
  if (ok(h, 3) && S.g.heroes.some(x => x.downed || x.hp < maxHp(x) * 0.35)) queueAbility(2, 3);
  if (!boss && ok(k, 1)) queueAbility(0, 1);
}
function castReady() {
  const n = N();
  S.g.heroes.forEach((h, i) => [1, 2, 3, 4].forEach(s => {
    if (n.phase === 'battle' && !h.downed && h.cd[s] <= 0 && h.level >= T.ABILITY_UNLOCK[s] && n.enemies.some(e => e.hp > 0)) queueAbility(i, s);
  }));
}
/** Plays present until a fight of the wanted kind starts on floor >= minFloor. Returns a snapshot or null. */
function reach(boss: boolean, minFloor: number): string | null {
  S.g = initialState();
  startNight(); travelToDungeon();
  for (let i = 0; i < 60 * 60 * 40; i++) {
    calm();
    const n = N();
    if (n.phase === 'mapChoice') chooseNextFloor(null);
    if (n.phase === 'battle' && n.floor >= minFloor && isBossBattle() === boss && n.phaseT < 0.05) return JSON.stringify(S.g);
    castReady();
    step(DT);
    if (S.g.screen !== 'night') return null;
  }
  return null;
}
function play(snap: string, mode: 'smart' | 'spam' | 'away'): { wiped: boolean; hpPct: number; won: boolean; secs: number } {
  const away = mode === 'away';
  S.g = JSON.parse(snap);
  const n = N();
  n.monitor = away ? 'excel' : 'rpg';
  const floor0 = n.floor;
  let wiped = false, won = false, minHp = 1, secs = away ? 40 : 70;
  const partyHp = () => S.g.heroes.reduce((a, h) => a + (h.downed ? 0 : h.hp), 0) / S.g.heroes.reduce((a, h) => a + maxHp(h), 0);
  for (let i = 0; i < 60 * (away ? 40 : 70); i++) {
    if (n.phase === 'battle') minHp = Math.min(minHp, partyHp());
    if (won && secs >= 40) secs = Math.round(i / 60);
    calm();
    if (mode === 'spam') castReady(); if (mode === 'smart') castSmart();
    if (n.phase === 'mapChoice') { won = true; break; }
    step(DT);
    if (n.floor !== floor0 || n.corpse.length) { wiped = n.corpse.length > 0 || n.floor < floor0; if (wiped) break; }
    if (n.phase === 'loot' && isBossBattle()) won = true;
  }
  return { wiped, hpPct: Math.round(minHp * 100), won, secs };
}
const TRIALS = Number(process.argv[2] ?? 30);
for (const [label, boss, floor] of [['boss floor 5', true, 5], ['boss floor 10', true, 10], ['normal floor 3', false, 3], ['normal floor 8', false, 8]] as const) {
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

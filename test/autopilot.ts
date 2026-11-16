// Acceptance test for the reckless autopilot (#15).
// A bot plays (casting skills, no threats) until a target fight starts, then the same moment is replayed
// for 40 s twice: present (casting skills) and away (on Excel).
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
function play(snap: string, away: boolean): { wiped: boolean; hpPct: number; won: boolean } {
  S.g = JSON.parse(snap);
  const n = N();
  n.monitor = away ? 'excel' : 'rpg';
  const floor0 = n.floor;
  let wiped = false, won = false;
  for (let i = 0; i < 60 * 40; i++) {
    calm();
    if (!away) castReady();
    if (n.phase === 'mapChoice') { won = true; break; }
    step(DT);
    if (n.floor !== floor0 || n.corpse.length) { wiped = n.corpse.length > 0 || n.floor < floor0; if (wiped) break; }
    if (n.phase === 'loot' && isBossBattle()) won = true;
  }
  const hp = S.g.heroes.reduce((a, h) => a + (h.downed ? 0 : h.hp), 0) / S.g.heroes.reduce((a, h) => a + maxHp(h), 0);
  return { wiped, hpPct: Math.round(hp * 100), won };
}
const TRIALS = Number(process.argv[2] ?? 30);
for (const [label, boss, floor] of [['boss floor 5', true, 5], ['boss floor 10', true, 10], ['normal floor 3', false, 3], ['normal floor 8', false, 8]] as const) {
  const res = { present: { wipe: 0, hp: 0, n: 0 }, away: { wipe: 0, hp: 0, n: 0 } };
  for (let k = 0; k < TRIALS; k++) {
    const snap = reach(boss, floor);
    if (!snap) continue;
    for (const mode of ['present', 'away'] as const) {
      const r = play(snap, mode === 'away');
      res[mode].n++; if (r.wiped) res[mode].wipe++; res[mode].hp += r.hpPct;
    }
  }
  const f = (m: { wipe: number; hp: number; n: number }) => `wipes ${m.wipe}/${m.n}, avg party HP ${Math.round(m.hp / Math.max(1, m.n))}%`;
  console.log(`${label.padEnd(15)} present: ${f(res.present)}  |  away 40 s: ${f(res.away)}`);
}

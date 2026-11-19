// Goblin Fuel throw (#61), headless: a sweep of slingshot pulls (where they land), then a pile-up check:
// misses lie on the floor and stay; the next throw lands among them and moves them. Run: npx tsx test/toss.ts
import { newToss, launch, stepToss, tossPoses, tossStyle, FLOOR, CR, PULL_MAX, inBinAt } from '../src/systems/fuelPhysics';

function throwOnce(poses: { x: number; y: number; a: number }[], px: number, py: number) {
  const s = newToss(poses); launch(s, px, py);
  let t = 0, clanks = 0;
  while (!s.settled && t < 10) { stepToss(s, 1 / 60, { clank: () => clanks++ }); t += 1 / 60; }
  const b = s.thrown!;
  return { s, t: Math.round(t * 10) / 10, at: [Math.round(b.x), Math.round(b.y)], inBin: s.inBin, style: tossStyle(s), clanks, poses: tossPoses(s) };
}
// 1. the sweep: pull back-left and down (the slingshot), at strengths and angles
const grid: string[] = []; let hits = 0, total = 0, bad = 0;
for (const ang of [0.35, 0.55, 0.75, 0.95]) for (let k = 0.4; k <= 1.001; k += 0.1) {
  const L = PULL_MAX * k, r = throwOnce([], -Math.cos(ang) * L, Math.sin(ang) * L);
  total++; if (r.inBin) hits++;
  const b = r.s.thrown!;
  if (!r.inBin && (b.y > FLOOR - CR + 2 || !b.asleep)) bad++;                   // sunk into the floor, or never settled
  grid.push(`${ang.toFixed(2)}/${k.toFixed(1)}: ${r.inBin ? 'IN ' + r.style : 'miss @' + r.at[0]}`);
}
console.log(grid.join('\n'));
// 2. the mess: three misses in a row stay; a fourth lands among them
let poses: { x: number; y: number; a: number }[] = [];
const pulls: [number, number][] = [[-34, 28], [-40, 30], [-31, 24], [-36, 28]];
const log: string[] = [];
for (const [px, py] of pulls) {
  const r = throwOnce(poses, px, py);
  const moved = poses.filter((p, i) => Math.hypot(r.s.bodies[i].x - p.x, r.s.bodies[i].y - p.y) > 1).length;
  poses = [...r.poses.bin, ...r.poses.floor];
  log.push(`throw (${px},${py}): ${r.inBin ? 'in' : 'miss'} at ${r.at}, ${poses.length} cans, ${moved} old ones moved, clanks ${r.clanks}, ${r.t}s`);
}
console.log(log.join('\n'));
const sunk = poses.filter(p => p.y > FLOOR - CR + 2).length, stacked = poses.filter(p => !inBinAt(p.x, p.y) && p.y < FLOOR - CR - 30 && p.x > 160).length;
console.log(JSON.stringify({ hits: `${hits}/${total}`, unsettled_or_sunk: bad, mess_sunk: sunk, mess_stacked: stacked }));
if (hits === 0 || hits === total || bad > 0 || sunk > 0) process.exit(1);

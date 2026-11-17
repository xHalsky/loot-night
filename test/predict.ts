// Does her activity predict the visit type? Prints the share of each kind per activity (green mood and not green).
import { pickKind } from '../src/systems/visits';
const N = 20000;
for (const green of [true, false]) {
  console.log(green ? '\nMood green' : '\nMood not green');
  for (const from of ['tv', 'tea', 'toilet', 'phone', 'shower']) {
    const c: Record<string, number> = {};
    for (let i = 0; i < N; i++) { const k = pickKind(from, false, green); c[k] = (c[k] ?? 0) + 1; }
    console.log(from.padEnd(7), Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(100 * v / N).toFixed(0)}%`).join('  '));
  }
}

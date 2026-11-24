import { S } from './state';

/** A feed line. `tag` says whose it is (YOU, LOOT, HER, PHONE, GAME...); a leading "[Name] " in the text wins. */
export function toast(text: string, color = '#f2e9d8', tag = '') {
  const n = S.g.night;
  if (!n) return;
  const p = parseTag(text);
  if (p.tag) { tag = p.tag; text = p.text; }
  n.toasts.unshift({ text, color, t: 4 });
  if (n.toasts.length > 5) n.toasts.length = 5;
  if (n.log[n.log.length - 1]?.text === text) return;
  n.log.push({ text, color, time: fmtClock(n.clock), tag: tag.toUpperCase() });
  if (n.log.length > 60) n.log.splice(0, n.log.length - 60);
}

/** Big numbers (#52, 1.2): 950, 1.2K, 34.5K, 1.2M, 3.4B. */
export function fmtNum(v: number): string {
  const a = Math.abs(v), sign = v < 0 ? '-' : '';
  if (a < 1000) return sign + Math.round(a);
  for (const [d, u] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as const) if (a >= d) { const x = a / d; return sign + (x < 100 ? x.toFixed(1).replace(/\.0$/, '') : Math.round(x)) + u; }
  return sign + Math.round(a);
}
export function floatText(x: number, y: number, text: string, color: string) {
  const n = S.g.night;
  if (!n) return;
  n.fx.push({ x, y, text, color, t: 1 });
}

export function fmtClock(min: number): string {
  const m = Math.floor(min) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** "[Magoo] text" -> tag Magoo, text. */
export function parseTag(text: string): { tag: string; text: string } {
  const m = /^\[([^\]]+)\] ([\s\S]*)$/.exec(text);
  return m ? { tag: m[1], text: m[2] } : { tag: '', text };
}
/** A module's own toast with its default feed tag. */
export const toastAs = (tag: string) => (text: string, color?: string) => toast(text, color, tag);

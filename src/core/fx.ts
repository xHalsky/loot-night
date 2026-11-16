import { S } from './state';

export function toast(text: string, color = '#f2e9d8') {
  const n = S.g.night;
  if (!n) return;
  n.toasts.unshift({ text, color, t: 4 });
  if (n.toasts.length > 5) n.toasts.length = 5;
  if (n.log[n.log.length - 1]?.text === text) return;
  n.log.push({ text, color, time: fmtClock(n.clock) });
  if (n.log.length > 60) n.log.splice(0, n.log.length - 60);
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

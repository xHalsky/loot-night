import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { toast } from '../core/fx';
import { TIPS, type TipId } from '../data/tips';

// First-time tips (#28): once per save, the first time each thing happens. The line goes to the feed and stays
// pinned at its top for TIP_PIN_SEC so combat lines cannot bury it.
export function tip(id: TipId) {
  const g = S.g;
  if (!g.night || g.tipsSeen.includes(id)) return;
  g.tipsSeen.push(id);
  const t = TIPS[id];
  const text = t.who === 'her' ? `[Her] "${t.text}"` : `[Guild] ${t.who}: ${t.text}`;
  const color = t.who === 'her' ? '#ff9ab8' : '#7ee08a';
  toast(text, color);
  g.night.tip = { text, color, t: T.TIP_PIN_SEC };
}

/** Timed tips on a fresh save, and the pinned line's timer. */
export function updateTips(dt: number) {
  const n = N();
  if (n.tip) { n.tip.t -= dt; if (n.tip.t <= 0) n.tip = null; }
  if (n.threat >= T.TIP_HER_AT) tip('her_show');
  if (n.threat >= T.TIP_PLAN_AT) tip('plan');
}

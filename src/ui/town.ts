// The run end card over the city (#52, 1.4). Ravenhold, its services and the side panel are drawn by the renderer
// (src/render/, V2); this is the one piece of the old DOM layer left over the town.
import { S } from '../core/state';
import { BLESSINGS, type BlessingId } from '../data/blessings';

/** The run end card: what the run banked or lost, for a moment over the city. */
function runCardHtml(n: NonNullable<typeof S.g.night>): string {
  const c = n.runCard;
  if (!c || c.t <= 0) return '';
  return `<div class="run-card ${c.banked ? 'ok' : 'lost'}"><b>${c.banked ? 'Run banked' : 'PARTY WIPE'}</b>
    <span>Deepest floor ${c.deepest}</span>
    <span>${c.banked ? `Banked ${c.items} items · ${c.gold} gold` : `Lost ${c.items} items · ${c.gold} gold`}</span>
    <span>${c.banked ? '' : 'Kept '}${c.souls} Souls</span>
    ${c.blessings.length ? `<span class="dim">Blessings: ${[...new Set(c.blessings)].map(id => BLESSINGS[id as BlessingId].name).join(', ')}</span>` : ''}</div>`;
}
/** Over the renderer's town: only the run end card. */
export function monUiLiveHtml(): string {
  const n = S.g.night;
  if (!n || n.location !== 'town' || n.monitor === 'excel' || n.monitorOff > 0 || n.switching) return '';
  return runCardHtml(n);
}

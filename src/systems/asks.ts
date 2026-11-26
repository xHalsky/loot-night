// Her requests from the bathroom (fan-service steps 8 and 13, #93, #88): "Babe, towel!" as she gets out of her shower
// or bath, "Babe, bring my wine?" partway into her bath. Worth taking either way: bring it (away from the PC, the
// empty chair) for Goodwill, or ignore it and she gets it herself, in a towel, dripping, by way of your door (a normal
// visit: she checks the screen) with Mood +10. One demand at a time: she asks only when nothing else is on.
import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { toastAs } from '../core/fx';
const toast = toastAs('HER');
import { sfx } from '../ui/audio';
import { addMood } from './meters';
import { addGoodwill } from './goodwill';
import { startVisit } from './visits';
import { demandActive } from './reallife';

export type AskKind = 'towel' | 'wine';
const AWAY: Record<AskKind, number> = { towel: T.TOWEL_AWAY_SEC, wine: T.WINE_AWAY_SEC };
export const askAwaySec = (k: AskKind) => AWAY[k];

/** Nothing else asks for you right now (her at the door, the phone, the dog's minigame, your hands). */
export function askFree(): boolean {
  const n = N();
  return !demandActive() && !n.lap && !n.unplugged && !S.g.realLifeOff;
}

export function startAsk(kind: AskKind) {
  const n = N();
  n.herAsk = { kind, t: T.ASK_SEC, max: T.ASK_SEC };
  sfx.babe(kind === 'towel' ? 2 : 3, 'bathroom');
  n.apt.heard = 'bathroom'; n.apt.heardWhat = kind === 'towel' ? 'BABE, TOWEL!' : 'BABE, WINE?'; n.apt.heardAt = n.threat;
}

/** Bring it to her: you leave the desk for a few seconds (the away card says why). */
export function takeAsk() {
  const n = N(), k = n.herAsk;
  if (!k || n.pre || n.game || n.switching) return;
  n.herAsk = null;
  const sec = AWAY[k.kind];
  n.pre = { id: k.kind, stage: 'doing', t: sec, max: sec, away: true, withHer: true, mult: 1, outcome: 'ok' };
  n.action = 'pre';
  sfx.click();
  toast(k.kind === 'towel' ? 'You grab a towel from the hallway. The party is on its own.' : 'You fetch her glass from the kitchen. The party is on its own.', '#ff9ab8');
}

/** You're back from the bathroom door. */
export function askLanded(kind: AskKind) {
  const n = N();
  n.pre = null; if (n.action === 'pre') n.action = 'none';
  addGoodwill(T.ASK_GOODWILL, kind === 'towel' ? 'her towel' : 'her wine');
  n.herThanks = { kind, t: T.ASK_THANKS_SEC };
  sfx.kiss();
}

/** Ignored (or you came back without it): she gets it herself, by way of your door. */
export function askIgnored(kind: AskKind) {
  const n = N(), a = n.apt;
  n.herAsk = null;
  addMood(T.ASK_IGNORE_MOOD);
  toast(`"Fine. I'll get it myself." Mood +${T.ASK_IGNORE_MOOD}.`, '#ffb07a');
  a.t = 0; a.cued = true; a.wineAt = -1; a.towelAsk = false;   // she's out of the water
  startVisit(false, 'peek');
  n.visit.ask = kind;
}

/** Every frame: her window's seconds, the thank-you line. */
export function updateAsks(dt: number) {
  const n = N();
  if (n.herThanks && (n.herThanks.t -= dt) <= 0) n.herThanks = null;
  const k = n.herAsk;
  if (!k) return;
  if (n.visit.stage !== 'idle' && n.visit.stage !== 'passing') { n.herAsk = null; return; }   // can't happen (one at a time); never two at once
  k.t -= dt;
  if (k.t <= 0) askIgnored(k.kind);
}

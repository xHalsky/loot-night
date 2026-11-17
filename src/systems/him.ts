import { T } from '../config/tuning';
import { N } from '../core/state';
import { ROOM_LOOK } from '../data/apartment';
import type { HisFace } from '../ui/him';

// His face in the webcam view (docs/design/screen.md, #37 reactions, #38 status). Rules only; door.ts draws it.
// Reactions to her and the loot win over his status (tired, Zone, Monster). The headset hides his reactions
// to sounds: with it on he does not hear her, and his eyes stay on the screen.

let lastHeard = '';
let flickT = 0, flickLook = 0, reliefT = 0, lastStage = 'idle';

export function updateHim(dt: number) {
  const n = N();
  n.grin = Math.max(0, n.grin - dt);
  flickT = Math.max(0, flickT - dt);
  reliefT = Math.max(0, reliefT - dt);
  const a = n.apt;
  const key = `${a.heardWhat}@${a.heard}`;
  if (key !== lastHeard) {   // a new sound: his eyes flick toward its side
    lastHeard = key;
    if (!n.headset && a.heard && n.threat - a.heardAt < 0.5) { flickT = T.HIS_FLICK_SEC; flickLook = ROOM_LOOK[a.heard]; }
  }
  const v = n.visit;
  if (lastStage === 'in' && v.stage !== 'in' && ['pass', 'chatGood', 'snackOk', 'cuddleGood', 'forgiven', 'look', 'night'].includes(v.result)) reliefT = T.HIS_RELIEF_SEC;
  lastStage = v.stage;
}

/** What she did at the door, on his face. */
function visitFace(): HisFace | null {
  const v = N().visit;
  if (v.stage !== 'in') return null;
  if (v.result === 'chat' && v.chat) return v.chat.last === 0 ? 'grin' : v.chat.last === 1 ? 'meh' : v.chat.last === 2 ? 'rude' : 'guilty';
  const by: Record<string, HisFace> = {
    caught: 'panic', pass: 'relief', look: 'blush', ask: 'blush', cuddling: 'blush', cuddleGood: 'blush', night: 'blush',
    chatGood: 'grin', chatMeh: 'meh', chatBad: 'rude', offer: 'grin', snackOk: 'grin', snackFail: 'guilty', deaf: 'guilty',
    cuddleMeh: 'guilty', refused: 'guilty', forgiven: 'relief',
  };
  return by[v.result] ?? 'guilty';   // she just came in: he freezes, guilty smile
}

export interface HisLook { face: HisFace; look: number; jitter: number; nod: number; glow: number }
export function hisLook(): HisLook {
  const n = N();
  const stat: HisFace = n.blink.state !== 'open' && n.blink.lid > 0.2 ? 'asleep'   // nodding off: seen while the lids close (closed, the screen goes dark)
    : n.yawn > 0 ? 'yawn'
    : n.zone >= 1 ? 'focused'
    : n.tired >= T.TIRED_YAWN ? 'tired'
    : 'neutral';
  const face = n.scare > 0 ? 'panic' : visitFace() ?? (n.grin > 0 ? 'grin' : reliefT > 0 ? 'relief' : stat);
  return {
    face,
    look: n.visit.stage === 'in' ? 1 : flickT > 0 ? flickLook : 0,            // she is in: he looks at her (the door is to his right)
    jitter: n.boost > 0 ? (Math.random() < 0.5 ? -1 : 1) : 0,                  // the Monster: jittery
    nod: stat === 'asleep' && face === 'asleep' ? 6 : 0,                       // nodding off: his head drops
    glow: n.zone >= 1 ? 1 : 0,                                                 // full Zone: the purple glow
  };
}

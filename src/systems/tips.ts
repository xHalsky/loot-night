import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { toast } from '../core/fx';
import { TIPS, type TipId } from '../data/tips';

// Her opening line on a fresh save (#28): once per save, said through the door (her tag: the feed hands her words to
// the door's speech bubble, #139). No tips in the feed any more (#141).
export function tip(id: TipId) {
  const g = S.g;
  if (!g.night || g.tipsSeen.includes(id)) return;
  g.tipsSeen.push(id);
  toast(`[Her] "${TIPS[id].text}"`, '#ff9ab8');
}

/** Her opening line, a little into the first night. */
export function updateTips(_dt: number) {
  if (N().threat >= T.TIP_HER_AT) tip('her_show');
}

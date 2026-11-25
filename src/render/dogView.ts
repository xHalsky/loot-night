// The dog on the desk (V6, #71; grid doc 7d): which of the redesign's moments he is in, read from the game's dog
// (systems/pets.ts). The rules move him between away, up and happy; the moments around those moves (he jumps up, he is
// done, the good boy with his sock, offended, the slam) are timed here, from the frame the rules moved him. No rules.
import { S, N } from '../core/state';

const LEN: Record<string, number> = { jump: 0.7, done: 3.4, goodboy: 6.4, offended: 4, slam: 3.2 };
let prev = 'away', anim: { kind: string; t0: number } | null = null, upAt = 0, lastPet = -99, petSweet = false, hx2 = 224, flinchAt = -99;
/** A stroke over his head (main.ts): on his favourite spot or not, and where the hand is (his head leans to it). */
export function dogStroked(sweet: boolean, x: number) { lastPet = performance.now() / 1000; petSweet = sweet; hx2 = x; }
/** His favourite spots from his head's centre (grid px): left ear, right ear, chin (n.dog.sweet picks one). */
export const DOG_SPOTS: [number, number][] = [[-22, -24], [22, -24], [0, 22]];

/** What the desk draws (render/page/dog.js, dogView 'game'), or null when he is away and nothing of his is on the desk. */
export function dogDesk() {
  const n = N(), d = n.dog, now = performance.now() / 1000;
  if (d.stage !== prev) {
    if (d.stage === 'up') { anim = { kind: 'jump', t0: now }; upAt = now; }
    else if (prev === 'up' && d.stage === 'happy') { anim = { kind: n.goodDog > 0 ? 'goodboy' : 'done', t0: now }; if (!S.g.tipsSeen.includes('dogPetted')) S.g.tipsSeen.push('dogPetted'); }
    else if (prev === 'up' && d.stage === 'away') anim = { kind: n.unplugged ? 'slam' : 'offended', t0: now };
    prev = d.stage;
  }
  if (anim && now - anim.t0 > LEN[anim.kind]) anim = null;
  if (d.flinch > 0 && now - flinchAt > 0.6) flinchAt = now;   // a flinch shows for 0.6 s (the rules' lasts less)
  const sock = n.goodDog > 0;   // the lucky sock stays on the desk while his luck lasts
  if (anim) return { kind: anim.kind, T: now - anim.t0, sock };
  if (d.stage === 'up') {
    const first = !S.g.tipsSeen.includes('dogPetted');
    return {
      kind: 'live', T: now - upAt - 0.7, h: Math.min(1, d.pet), pet: now - lastPet < 0.4 ? (petSweet ? 'sweet' : 'pet') : null, flinch: now - flinchAt < 0.6, hx2,
      card: first && d.pet <= 0.001 ? 'stroke his head, gently' : null, sock,
    };
  }
  return sock ? { kind: 'done', T: 3.3, sock } : null;   // gone, his sock still on the desk
}

// Her questions: she leans into your face from the right (#65), over the whole stage on its own canvas (drawLapFx),
// and the DOM part of it (her line and three answers). Rules live in systems/lap.ts. (The dog and the cable fix moved
// to the renderer in V6, #71: render/page/dog.js and cables.js, render/dogView.ts.)
import { S } from '../core/state';
import { LAP_QS } from '../systems/lap';
import { drawHerPeek, OUTFIT_BY_ACTIVITY } from './her';

// ---------- her questions: she leans into your face from the right (#65) ----------
// Over the whole stage (the webcam, the monitor, the desk), her body running off the bottom right. She slides in
// along her lean and out the same way. Hotkeys keep working underneath (#9).
const PEEK_X = 780, PEEK_Y = 140;   // the top of her head, stage px
export function drawLapFx() {
  const cv = document.getElementById('lapFx') as HTMLCanvasElement | null;
  if (!cv) return;
  const c = cv.getContext('2d')!;
  c.clearRect(0, 0, cv.width, cv.height);
  const l = S.g.night?.lap;
  if (!l) return;
  const t = performance.now() / 1000;
  const look = OUTFIT_BY_ACTIVITY[l.outfit] ?? OUTFIT_BY_ACTIVITY.tv;
  const k = l.stage === 'arrive' ? Math.max(0, l.t / 1.2) : l.stage === 'leave' ? 1 - Math.max(0, l.t / 1.4) : 0;
  const ease = k * k;
  const breathe = Math.sin(t * 1.6) > 0 ? 3 : 0;
  c.fillStyle = `rgba(12,6,12,${0.6 * (1 - k)})`; c.fillRect(0, 0, cv.width, cv.height);
  const g = c.createRadialGradient(PEEK_X + 120, PEEK_Y + 90, 20, PEEK_X + 120, PEEK_Y + 90, 420);
  g.addColorStop(0, `rgba(255,170,190,${0.16 * (1 - k)})`); g.addColorStop(1, 'rgba(255,170,190,0)');
  c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
  drawHerPeek(c, { outfit: look.outfit, face: l.face, blink: (t % 4.1) < 0.13 }, Math.min(2, l.sweet),
    PEEK_X + Math.round(ease * 600 / 3) * 3, PEEK_Y + Math.round((ease * 360 + breathe) / 3) * 3, 1);
}

/** DOM part of the lap scene: her line and the three answers. */
export function lapUiHtml(): string {
  const l = S.g.night?.lap;
  if (!l) return '';
  const bubble = `<div class="lap-bubble">${l.line}</div>`;
  if (l.stage !== 'ask') return bubble;
  const q = LAP_QS[l.q];
  return `${bubble}<div class="lap-answers">${l.order.map(k => `<button class="lap-ans" data-act="lapAns" data-arg="${k}">${q.a[k]}</button>`).join('')}
    <div class="lap-timer"><i style="width:${Math.max(0, Math.round(l.t / 7 * 20) * 5)}%"></i></div></div>`;
}

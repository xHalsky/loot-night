// The redesign's frame as the mockup page draws it (V1, #66), shown over the game from the debug panel (F1). It is
// the check that the renderer runs in the build: the same 640 x 360 frame as design/redesign/stills, crisp at the
// stage's whole-number scale. It goes once the parts are wired to the game (V2 onward).
import { PK } from 'virtual:pagekit';

export type PreviewScene = 'dungeon' | 'battle' | 'map' | 'town' | 'excel';
let scene: PreviewScene | null = null;
let ready = false, starting = false, t0 = 0;

export function previewScene(): PreviewScene | null { return scene; }
export function setPreview(s: PreviewScene | null) {
  scene = s; t0 = performance.now();
  if (s && !ready && !starting) { starting = true; PK.init().then(() => { ready = true; }); }
}
/** Draws the frame into the 640 x 360 canvas (shown at x2 in the stage), or hides it. */
export function drawPreview(cv: HTMLCanvasElement) {
  cv.style.display = scene ? 'block' : 'none';
  if (!scene || !ready) return;
  const t = (performance.now() - t0) / 1000;
  cv.getContext('2d')!.drawImage(PK.drawFrame(scene, t + 8.2, t, 'calm', 'chat', {}), 0, 0);
}

// Pixel-art pipeline: draw vector art into a small canvas, snap alpha to hard edges, add a 1px dark outline,
// then blit it up with nearest-neighbour scaling. Characters (her, the guy, the dog) all go through this,
// so the prototype already reads as pixel anime art until hand-made sprites replace it.
const cache = new Map<string, HTMLCanvasElement>();

export function pixelSprite(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, opts: { redraw?: boolean; outline?: string } = {}): HTMLCanvasElement {
  let cv = cache.get(key);
  if (cv && !opts.redraw && cv.width === w && cv.height === h) return cv;
  if (!cv || cv.width !== w || cv.height !== h) { cv = document.createElement('canvas'); cv.width = w; cv.height = h; }
  const c = cv.getContext('2d', { willReadFrequently: true })!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  c.imageSmoothingEnabled = true;
  draw(c);
  c.setTransform(1, 0, 0, 1, 0, 0);
  const im = c.getImageData(0, 0, w, h), d = im.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] >= 110) { d[i * 4 + 3] = 255; solid[i] = 1; } else d[i * 4 + 3] = 0; }
  const ol = opts.outline ?? '#2e161c';
  if (ol !== 'none') {
    const r = parseInt(ol.slice(1, 3), 16), g = parseInt(ol.slice(3, 5), 16), b = parseInt(ol.slice(5, 7), 16);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255;
      }
    }
  }
  c.putImageData(im, 0, 0);
  cache.set(key, cv);
  if (cache.size > 160) { const first = cache.keys().next().value; if (first) cache.delete(first); }
  return cv;
}

export function blit(c: CanvasRenderingContext2D, sp: HTMLCanvasElement, x: number, y: number, px: number, alpha = 1) {
  const prev = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  c.globalAlpha = alpha;
  c.drawImage(sp, Math.round(x), Math.round(y), sp.width * px, sp.height * px);
  c.globalAlpha = 1;
  c.imageSmoothingEnabled = prev;
}

// ---------- vector helpers shared by the character drawings ----------
export type Pt = [number, number] | [number, number, number];

/** Closed smooth curve through the points (Catmull-Rom). A third value of 1 marks a sharp corner. */
export function smooth(pts: Pt[]): Path2D {
  const q: [number, number][] = [];
  for (const p of pts) { q.push([p[0], p[1]]); if (p[2]) q.push([p[0], p[1]]); }
  const n = q.length, path = new Path2D();
  path.moveTo(q[0][0], q[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n], p1 = q[i], p2 = q[(i + 1) % n], p3 = q[(i + 2) % n];
    path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  path.closePath();
  return path;
}
export function poly(pts: number[][]): Path2D { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; }
export const mirror = (pts: Pt[]): Pt[] => pts.map(p => [-p[0], p[1], p[2] ?? 0] as Pt).reverse();
export const rows = (y0: number, y1: number) => [[-999, y0], [999, y0], [999, y1], [-999, y1]];

/** Cel shading: shade colour, then the base shifted up-left inside the shape (shadow falls bottom-right). */
export function cel(c: CanvasRenderingContext2D, path: Path2D, base: string, shade: string, k = 1, line?: { color: string; w: number }) {
  c.fillStyle = shade; c.fill(path);
  c.save(); c.clip(path); c.translate(-1.7 * k, -1.3 * k); c.fillStyle = base; c.fill(path); c.restore();
  if (line) { c.strokeStyle = line.color; c.lineWidth = line.w; c.lineJoin = 'round'; c.stroke(path); }
}

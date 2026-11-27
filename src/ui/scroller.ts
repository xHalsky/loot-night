// Scrolling a chat back (#140, Paweł): the game chat on the desk and the phone's threads. Grab with the left button and
// drag, like a smartphone (the content follows the pointer, pixel by pixel), or turn the wheel (a message at a time).
// off is how far back from the newest, in the chat's own pixels. The renderer lays the chat out and reports how far
// it can go (max), where its messages' edges are (stops, from the newest), and its height (total); at rest the
// chat sits on an edge, so no message is cut (#45). A new message while you read back doesn't move what you read.
export interface ScrollMeta { max: number; stops: number[]; total: number }

export class Scroller {
  off = 0;
  drag: { y: number; off0: number; moved: boolean } | null = null;
  private max = 0;
  private stops: number[] = [0];
  private total = -1;

  /** What the renderer laid out this frame. */
  meta(m: ScrollMeta) {
    if (this.total >= 0 && this.off > 0 && m.total > this.total) this.off += m.total - this.total;   // keep your place
    this.total = m.total; this.max = m.max; this.stops = m.stops.length ? m.stops : [0];
    this.off = Math.max(0, Math.min(this.max, this.off));
    if (!this.drag) this.off = this.snap(this.off);
  }
  /** The wheel: older (+1) or newer (-1), one message. */
  wheel(dir: number) {
    if (this.drag) return;
    const s = this.stops;
    if (dir > 0) this.off = s.find(v => v > this.off + 0.5) ?? this.max;
    else this.off = [...s].reverse().find(v => v < this.off - 0.5) ?? 0;
  }
  /** The pointer goes down at y (the chat's pixels). */
  start(y: number) { this.drag = { y, off0: this.off, moved: false }; }
  /** The pointer moves to y: dragging down brings older messages in. */
  move(y: number) {
    const d = this.drag; if (!d) return;
    if (Math.abs(y - d.y) > 2) d.moved = true;
    this.off = Math.max(0, Math.min(this.max, d.off0 + (y - d.y)));
  }
  /** Let go: on the nearest edge. True when it was a drag (not a click). */
  end(): boolean {
    const d = this.drag; this.drag = null;
    if (!d) return false;
    this.off = this.snap(this.off);
    return d.moved;
  }
  /** Back to the newest (the chip, a new chat). */
  reset() { this.off = 0; this.drag = null; this.total = -1; }
  private snap(v: number) {
    if (v <= 0) return 0;
    let best = 0;
    for (const s of this.stops) if (Math.abs(s - v) < Math.abs(best - v)) best = s;
    return Math.abs(this.max - v) < Math.abs(best - v) ? this.max : best;
  }
}

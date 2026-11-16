import { T } from '../config/tuning';
import { S, N, type ExcelPiece, type ExcelState } from '../core/state';
import { randi, rand } from '../core/rng';
import { sfx } from '../ui/audio';
import { toast } from '../core/fx';

// Excel cover screen: a slow spreadsheet Tetris (design doc section 5).
// Having Excel open raises Busy (she sees you working). Placing blocks adds a bit,
// filling whole rows adds more and pays overtime gold: honest work is rewarded, never required.

export const PIECES: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0], [3, 0]],   // I
  [[0, 0], [1, 0], [0, 1], [1, 1]],   // O
  [[0, 0], [1, 0], [2, 0], [1, 1]],   // T
  [[0, 0], [0, 1], [1, 1], [2, 1]],   // J
  [[2, 0], [0, 1], [1, 1], [2, 1]],   // L
  [[1, 0], [2, 0], [0, 1], [1, 1]],   // S
  [[0, 0], [1, 0], [1, 1], [2, 1]],   // Z
];

export function newExcel(): ExcelState {
  return { board: Array.from({ length: T.EXCEL_ROWS }, () => Array(T.EXCEL_COLS).fill(0)), piece: null, next: randi(0, 6), fallT: T.EXCEL_FALL_SEC, rows: 0, pay: 0, clearFx: 0, crashFx: 0 };
}

/** Alt-tab is not instant: the screen goes through an old-Windows mode switch for a random 1.0-2.5 s.
 *  Until it finishes you are still on the screen you switched FROM (that is what she sees), and input is blocked. */
export function altTab() {
  const n = N();
  if (n.switching) return;
  const lag = rand(...T.ALT_TAB_LAG_SEC);
  n.switching = { to: n.monitor === 'rpg' ? 'excel' : 'rpg', t: lag, max: lag };
  sfx.monClick();
}

export function updateSwitch(dt: number) {
  const n = N();
  const sw = n.switching;
  if (!sw) return;
  sw.t -= dt;
  if (sw.t <= 0) { n.monitor = sw.to; n.switching = null; sfx.monClick(); }
}


function fits(ex: ExcelState, cells: [number, number][], x: number, y: number): boolean {
  return cells.every(([cx, cy]) => {
    const bx = x + cx, by = y + cy;
    return bx >= 0 && bx < T.EXCEL_COLS && by < T.EXCEL_ROWS && (by < 0 || ex.board[by][bx] === 0);
  });
}

function spawn(ex: ExcelState) {
  const k = ex.next;
  ex.next = randi(0, 6);
  const cells = PIECES[k].map(c => [c[0], c[1]] as [number, number]);
  const piece: ExcelPiece = { k, cells, x: 2, y: -1 };
  if (!fits(ex, cells, piece.x, piece.y + 1)) {
    // Stack reached the top: the sheet "crashes", the board resets.
    const n = N();
    ex.board = newExcel().board; ex.crashFx = 1.5;
    n.busy = Math.max(0, n.busy + T.EXCEL_CRASH_BUSY);
    toast('#REF! The spreadsheet crashed. Busy -20.', '#ff8a80'); sfx.bad();
  }
  ex.piece = piece;
}

function lock(ex: ExcelState) {
  const n = N();
  const p = ex.piece!;
  for (const [cx, cy] of p.cells) { const by = p.y + cy; if (by >= 0) ex.board[by][p.x + cx] = p.k + 1; }
  ex.piece = null;
  n.busy = Math.min(100, n.busy + T.EXCEL_PIECE_BUSY);
  sfx.key();
  const full = ex.board.map((r, i) => (r.every(v => v > 0) ? i : -1)).filter(i => i >= 0);
  if (full.length) {
    ex.board = ex.board.filter((_, i) => !full.includes(i));
    while (ex.board.length < T.EXCEL_ROWS) ex.board.unshift(Array(T.EXCEL_COLS).fill(0));
    const gold = Math.round(T.EXCEL_ROW_GOLD * full.length * T.EXCEL_MULTI[Math.min(4, full.length)]);
    S.g.gold += gold; ex.pay += gold; ex.rows += full.length; ex.clearFx = 0.6;
    n.busy = Math.min(100, n.busy + T.EXCEL_ROW_BUSY * full.length);
    toast(`${full.length > 1 ? `${full.length} rows! ` : ''}Overtime pay +${gold} gold`, '#6fcf7f'); sfx.good();
  }
}

export function updateExcel(dt: number) {
  const n = N();
  const ex = n.excel;
  ex.clearFx = Math.max(0, ex.clearFx - dt); ex.crashFx = Math.max(0, ex.crashFx - dt);
  if (n.monitor !== 'excel' || n.game || n.monitorOff > 0) return;   // board waits while you are away
  n.busy = Math.min(100, n.busy + T.EXCEL_PASSIVE_BUSY * dt);
  if (!ex.piece) spawn(ex);
  ex.fallT -= dt;
  if (ex.fallT <= 0) {
    ex.fallT = T.EXCEL_FALL_SEC;
    const p = ex.piece!;
    if (fits(ex, p.cells, p.x, p.y + 1)) p.y++; else lock(ex);
  }
}

/** Controls: left, right, rotate, down, drop. */
export function excelInput(cmd: 'left' | 'right' | 'rotate' | 'down' | 'drop') {
  const n = N();
  if (n.monitor !== 'excel' || n.game) return;
  const ex = n.excel;
  if (!ex.piece) spawn(ex);
  const p = ex.piece!;
  if (cmd === 'left' && fits(ex, p.cells, p.x - 1, p.y)) p.x--;
  else if (cmd === 'right' && fits(ex, p.cells, p.x + 1, p.y)) p.x++;
  else if (cmd === 'down') { if (fits(ex, p.cells, p.x, p.y + 1)) { p.y++; ex.fallT = T.EXCEL_FALL_SEC; } else lock(ex); }
  else if (cmd === 'drop') { while (fits(ex, p.cells, p.x, p.y + 1)) p.y++; lock(ex); ex.fallT = T.EXCEL_FALL_SEC; }
  else if (cmd === 'rotate' && p.k !== 1) {
    const rot = p.cells.map(([x, y]) => [-y, x] as [number, number]);
    const minX = Math.min(...rot.map(c => c[0])), minY = Math.min(...rot.map(c => c[1]));
    const norm = rot.map(([x, y]) => [x - minX, y - minY] as [number, number]);
    for (const kick of [0, -1, 1, -2]) if (fits(ex, norm, p.x + kick, p.y)) { p.cells = norm; p.x += kick; break; }
  }
  sfx.key();
}

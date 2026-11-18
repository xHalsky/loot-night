// The city's windows (services, building), the dungeon screen's overlays (corner, skill bar, buffs, curios, the floor
// map). The city itself is drawn in townMap.ts (#50).
import { T } from '../config/tuning';
import { type CurioState, S, N, RARITIES, type BagEntry } from '../core/state';
import { CITY_BY_ID, type CityId } from '../data/city';
import { MAP_INFO } from '../data/items';
import { bossFor, ENEMY_BY_ID } from '../data/enemies';
import { curioDef, curioBlocked, curioText } from '../systems/curios';
import { RARITY_COLOR } from '../data/items';
import { entryName, entryValue } from '../systems/loot';
import { vendorValue, salvageYield, listValue } from '../systems/town';
import { icon, glyph, ABILITY_GLYPHS } from './icons';
import { ABILITIES, HOTKEYS, HERO_COLORS } from '../data/heroes';
import { abilitiesLocked, abilityUnlocked } from '../systems/battle';
import { maxHp } from '../systems/stats';

const FONT = '"Pixelify Sans", monospace';
export type ServiceId = 'appraiser' | 'auction' | 'merchant' | 'salvage';

const lvl = (id: CityId) => S.g.furniture[id] ?? 0;
// DOM overlay helper: a button
const b = (act: string, label: string, arg: string, cls: string, style: string) => `<button class="tbtn ${cls}" data-act="${act}" data-arg="${arg}" style="${style}">${label}</button>`;

/** The city's DOM layer (#50): only windows. The names are signs on the buildings, drawn in townMap.ts. */
export function townOverlayHtml(): string {
  const w = S.g.townWin;
  if (w?.startsWith('build:')) return buildWindowHtml(w.slice(6) as CityId);
  return serviceWindowHtml();
}

/** A plot's window (click it in the city): what it is, what the next level gives, the cost, Build / Upgrade. */
function buildWindowHtml(id: CityId): string {
  const d = CITY_BY_ID[id], L = lvl(id), g = S.g;
  const afford = L < 3 && g.gold >= d.gold[L] && g.mats >= d.mats[L];
  const now = L ? `Level ${L}: ${d.effect[L - 1]}` : 'Empty plot, materials ready.';
  const next = L >= 3 ? '<div class="bw-next">Fully built.</div>'
    : `<div class="bw-next">${L ? 'Next' : 'Built'}: <b>${d.effect[L]}</b></div>${b('build', `${L ? 'Upgrade' : 'Build'} · ${d.gold[L]} g · ${d.mats[L]}<i class="scrap"></i>`, id, `${afford ? 'gold' : 'off'} bw-btn`, '')}`;
  return `<div class="svc-win bld-win"><button class="mg-close" data-act="buildWin" data-arg="" title="Close">\u2715</button>
    <div class="svc-head"><b>${d.name}</b><span>${now}</span></div>
    <div class="bw-body">${next}<div class="svc-foot">Gold ${g.gold} · Scraps ${g.mats}</div></div></div>`;
}

export const SVC_INFO: Record<ServiceId, { title: string; hint: string }> = {
  merchant: { title: 'Merchant', hint: 'Sell items for gold, instantly.' },
  appraiser: { title: 'Appraiser', hint: 'Reveal epic and legendary items. 10 min each.' },
  salvage: { title: 'Salvage Forge', hint: 'Break items into scraps for city buildings.' },
  auction: { title: 'Auction House', hint: 'List items for real money (zł). Paid tomorrow morning. 5 min each.' },
};

function serviceWindowHtml(): string {
  const w = S.g.townWin as ServiceId | null | undefined;
  if (!w) return '';
  const info = SVC_INFO[w];
  const items = S.g.bag.filter(e => (w === 'appraiser' ? e.kind === 'item' && !e.item.identified : w === 'salvage' || w === 'auction' ? e.kind === 'item' : true));
  const row = (e: BagEntry) => {
    const col = e.kind === 'item' ? RARITY_COLOR[e.item.rarity] : '#c9b08a';
    const ico = e.kind === 'item' ? icon(e.item.slot, '#f2e9d8', 20, !e.item.identified) : icon(e.kind === 'map' ? 'map' : 'feather', col, 20);
    let action = '';
    if (w === 'merchant') action = b('svc', `Sell +${vendorValue(e.id)} g`, `vendor:${e.id}`, 'row', '');
    if (w === 'salvage') action = b('svc', `+${salvageYield(e.id)} scraps`, `salvage:${e.id}`, 'row', '');
    if (w === 'auction') action = b('svc', `List ~${listValue(e.id)} zł`, `list:${e.id}`, 'row green', '');
    if (w === 'appraiser' && e.kind === 'item') {
      const cost = e.item.rarity === 'legendary' ? T.IDENTIFY_COST.legendary : T.IDENTIFY_COST.epic;
      action = b('svc', `Identify ${cost} g`, `identify:${e.id}`, 'row ' + (S.g.gold >= cost ? 'gold' : 'off'), '');
    }
    const r = e.kind === 'item' ? RARITIES.indexOf(e.item.rarity) : -1;
    return `<div class="svc-row"><span class="svc-ico" style="border-color:${col}">${ico}</span><span class="svc-name" style="color:${col}">${entryName(e)}${r >= 0 ? `<small>${e.kind === 'item' ? e.item.rarity : ''} · value ${entryValue(e)}</small>` : ''}</span>${action}</div>`;
  };
  return `<div class="svc-win">
    <button class="mg-close" data-act="townWin" data-arg="" title="Close">\u2715</button>
    <div class="svc-head"><b>${info.title}</b><span>${info.hint}</span></div>
    <div class="svc-list">${items.length ? items.map(row).join('') : '<div class="svc-empty">Nothing to do here. Bring loot from the dungeon.</div>'}</div>
    <div class="svc-foot">Gold ${S.g.gold} · Scraps ${S.g.mats} · zł ${S.g.zl}</div>
  </div>`;
}

// ---------- Floor node map (Slay the Spire style), shown on the monitor when a floor ends ----------
type NodeKind = 'plain' | 'boss' | 'elite' | 'shrine' | 'vault' | 'cursed' | 'goblin' | 'unknown';
const NODE_COL: Record<NodeKind, string> = { plain: '#c9b08a', boss: '#e0524a', elite: '#f2b84b', shrine: '#6fcf7f', vault: '#ff9a4d', cursed: '#c77dff', goblin: '#9fe05a', unknown: '#6a5a4a' };
function nodeGlyph(k: NodeKind, col: string): string {
  const s = `stroke="${col}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  switch (k) {
    case 'plain': return `<path d="M-9 9 L7 -7 M3 -9 L9 -9 L9 -3 M9 9 L-7 -7 M-3 -9 L-9 -9 L-9 -3" ${s}/>`;
    case 'boss': return `<path d="M-11 6 L-11 -6 L-5 0 L0 -9 L5 0 L11 -6 L11 6 Z" fill="${col}" stroke="#2a1a10" stroke-width="1.5"/>`;
    case 'elite': return `<path d="M-8 -2 a8 8 0 0 1 16 0 v4 h-4 v5 h-8 v-5 h-4 z" fill="${col}"/><circle cx="-3.5" cy="-1" r="2.2" fill="#2a1a10"/><circle cx="3.5" cy="-1" r="2.2" fill="#2a1a10"/>`;
    case 'shrine': return `<path d="M0 -10 V10 M-9 0 H9" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
    case 'vault': return `<rect x="-10" y="-5" width="20" height="13" rx="2" fill="${col}"/><path d="M-10 -1 H10" stroke="#2a1a10" stroke-width="2"/><rect x="-2" y="-3" width="4" height="5" fill="#2a1a10"/>`;
    case 'cursed': return `<path d="M-8 4 a8 8 0 1 1 16 0 v4 h-16 z" fill="${col}"/><path d="M-4 -1 l2 2 M-2 -1 l-2 2 M2 -1 l2 2 M4 -1 l-2 2" stroke="#2a1a10" stroke-width="1.5"/><path d="M-3 5 h6" stroke="#2a1a10" stroke-width="1.5"/>`;
    case 'goblin': return `<path d="M-11 -4 L-6 -1 M11 -4 L6 -1" stroke="${col}" stroke-width="3" stroke-linecap="round"/><circle r="7" fill="${col}"/><circle cx="-2.5" cy="-1" r="1.5" fill="#2a1a10"/><circle cx="2.5" cy="-1" r="1.5" fill="#2a1a10"/><path d="M-3 3 h6" stroke="#2a1a10" stroke-width="1.5"/>`;
    default: return `<text x="0" y="6" text-anchor="middle" font-size="16" fill="${col}" font-family="Pixelify Sans, monospace">?</text>`;
  }
}

// ---------- The dungeon map (#48): your whole descent, drawn on old parchment, read top to bottom ----------
// One row per level: five floors, the boss room at the end, then a staircase down to the next level. Rows run
// left to right, then right to left (a serpentine), and every room sits a little lower than the last.
const MAP_COLS = 5, MAP_ROWS = 4;
const ROOM_X = [104, 208, 312, 416, 520], ROW_Y0 = 66, ROW_DY = 56, ROOM_STEP = 3;
const INK = '#5b4630', INK_RED = '#8a2e1c', PENCIL = '#8a7658';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
type RoomState = 'done' | 'here' | 'old' | 'next' | 'later';
const kindAt = (f: number): NodeKind => (S.g.mapPath[f] as NodeKind | null | undefined) ?? (f % T.CHECKPOINT_EVERY === 0 ? 'boss' : 'plain');
function roomAt(f: number, firstRow: number) {
  const i = f - 1, r = Math.floor(i / MAP_COLS), c = i % MAP_COLS;
  return { x: ROOM_X[r % 2 === 0 ? c : MAP_COLS - 1 - c], y: ROW_Y0 + (r - firstRow) * ROW_DY + c * ROOM_STEP, row: r };
}
const roomSize = (k: NodeKind) => k === 'boss' ? [46, 30] : [38, 24];
/** A staircase on the map: two rails and a rung every few pixels, from one room's edge to the next. */
function stairs(x1: number, y1: number, x2: number, y2: number, cls: string): string {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 3) return '';
  const ux = dx / L, uy = dy / L, nx = -uy * 3.6, ny = ux * 3.6;
  let d = `M${(x1 + nx).toFixed(1)} ${(y1 + ny).toFixed(1)}L${(x2 + nx).toFixed(1)} ${(y2 + ny).toFixed(1)}M${(x1 - nx).toFixed(1)} ${(y1 - ny).toFixed(1)}L${(x2 - nx).toFixed(1)} ${(y2 - ny).toFixed(1)}`;
  for (let t = 3; t < L - 2; t += 4.5) { const px = x1 + ux * t, py = y1 + uy * t; d += `M${(px + nx).toFixed(1)} ${(py + ny).toFixed(1)}L${(px - nx).toFixed(1)} ${(py - ny).toFixed(1)}`; }
  return `<path class="${cls}" d="${d}"/>`;
}
function roomSvg(f: number, x: number, y: number, k: NodeKind, st: RoomState, inner = ''): string {
  const [w, h] = roomSize(k), boss = k === 'boss', pencil = st === 'next' || st === 'later';
  const col = pencil ? PENCIL : boss ? INK_RED : INK;
  const box = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="1.5" class="nm-room ${st}" stroke="${col}"/>`
    + (boss && !pencil ? `<rect x="${-w / 2 + 3}" y="${-h / 2 + 3}" width="${w - 6}" height="${h - 6}" rx="1" fill="none" stroke="${col}" stroke-width=".8"/>` : '');
  const glyphG = inner || (st === 'later' && !boss ? `<text y="5" text-anchor="middle" class="nm-q">?</text>` : `<g transform="scale(${boss ? .72 : .6})">${nodeGlyph(k, col)}</g>`);
  return `<g transform="translate(${x} ${y})" class="nm-r ${st}">${box}${glyphG}<text x="${-w / 2}" y="${-h / 2 - 3}" class="nm-fn">${f}</text></g>`;
}

function nodeMapHtml(): string {
  const n = N();
  const next = n.floor + 1, after = n.floor + 2;
  const bossNext = next % T.CHECKPOINT_EVERY === 0;
  const opts: { kind: NodeKind; id: string; name: string; desc: string }[] = [
    { kind: bossNext ? 'boss' : 'plain', id: '', name: bossNext ? `Floor ${next}: ${bossFor(next, T.CHECKPOINT_EVERY).name}` : `Floor ${next}`, desc: bossNext ? '3 battles, the boss at the end. Checkpoint after.' : '3 battles, normal loot' },
  ];
  const seen = new Set<string>();
  for (const e of S.g.bag) if (e.kind === 'map' && !seen.has(e.map)) {
    seen.add(e.map);
    const count = S.g.bag.filter(x => x.kind === 'map' && x.map === e.map).length;
    opts.push({ kind: e.map, id: e.id, name: MAP_INFO[e.map].name + (count > 1 ? ` ×${count}` : ''), desc: MAP_INFO[e.map].desc + ' · uses the map' });
  }
  // which floors and rows to draw: from floor 1 to the deepest you have seen (or the floor after next)
  const record = Math.max(S.g.record, n.deepest);
  const maxF = Math.max(after, record);
  const lastRow = Math.floor((maxF - 1) / MAP_COLS), firstRow = Math.max(0, lastRow - (MAP_ROWS - 1));
  const firstF = firstRow * MAP_COLS + 1;
  const stateOf = (f: number): RoomState => f < n.floor ? 'done' : f === n.floor ? 'here' : f === next ? 'next' : f <= record ? 'old' : 'later';
  let ink = '', rooms = '', marks = '';
  for (let r = firstRow; r <= lastRow; r++) ink += `<text x="40" y="${ROW_Y0 + (r - firstRow) * ROW_DY + 10}" class="nm-lv">${ROMAN[r] ?? r + 1}</text>`;
  if (firstRow > 0) {   // older levels are above the sheet: a staircase leads up off the top
    const a = roomAt(firstF, firstRow);
    ink += stairs(a.x, 14, a.x, a.y - 12, 'nm-st done') + `<text x="28" y="26" class="nm-note">\u25b2 floors 1 to ${firstF - 1} above</text>`;
  }
  for (let f = Math.max(2, firstF); f <= maxF; f++) {
    const a = roomAt(f - 1, firstRow), b = roomAt(f, firstRow), [aw, ah] = roomSize(kindAt(f - 1)), [bw, bh] = roomSize(f === next ? opts[0].kind : kindAt(f));
    const cls = f <= n.floor ? 'done' : f === next ? 'next' : f <= record ? 'old' : 'later';
    ink += a.row === b.row
      ? stairs(a.x + Math.sign(b.x - a.x) * aw / 2, a.y, b.x - Math.sign(b.x - a.x) * bw / 2, b.y, `nm-st ${cls}`)
      : stairs(a.x, a.y + ah / 2, b.x, b.y - bh / 2, `nm-st ${cls}`);
  }
  for (let f = firstF; f <= maxF; f++) {
    const p = roomAt(f, firstRow), st = stateOf(f);
    if (st === 'next') {   // the choice: shows the default room, or the option you hover below
      const inner = opts.map((o, i) => `<g class="ns ns-${i} ${i === 0 ? 'def' : ''}"><g transform="scale(${o.kind === 'boss' ? .72 : .6})">${nodeGlyph(o.kind, o.kind === 'boss' ? INK_RED : INK)}</g></g>`).join('');
      rooms += roomSvg(f, p.x, p.y, opts[0].kind, st, inner);
    } else rooms += roomSvg(f, p.x, p.y, st === 'later' ? (f % T.CHECKPOINT_EVERY === 0 ? 'boss' : 'unknown') : kindAt(f), st);
  }
  // you are here, the checkpoint flag, your corpse
  const here = roomAt(n.floor, firstRow), [hw, hh] = roomSize(kindAt(n.floor));
  marks += `<ellipse cx="${here.x}" cy="${here.y}" rx="${hw / 2 + 9}" ry="${hh / 2 + 8}" class="nm-here"/><text x="${here.x}" y="${here.y + hh / 2 + 19}" class="nm-you">you are here</text>`;
  if (n.checkpoint >= firstF && n.checkpoint <= maxF) {
    const c = roomAt(n.checkpoint, firstRow), [cw, ch] = roomSize(kindAt(n.checkpoint));
    marks += `<g transform="translate(${c.x + cw / 2 - 2} ${c.y - ch / 2 + 1})" class="nm-flag"><path d="M0 0 V-13 M0 -13 L9 -10 L0 -7"/></g>`;
  }
  if (n.corpse.length && n.corpseFloor >= firstF && n.corpseFloor <= maxF) {
    const c = roomAt(n.corpseFloor, firstRow);
    marks += `<g transform="translate(${c.x + 20} ${c.y + 13})" class="nm-x"><path d="M-5 -5 L5 5 M5 -5 L-5 5"/></g><text x="${c.x + 28}" y="${c.y + 25}" class="nm-note red">your corpse</text>`;
  }
  const buttons = opts.map((o, i) => `<button class="nm-opt" data-act="nextFloor" data-arg="${o.id}" data-i="${i}" style="--nc:${NODE_COL[o.kind]}">
      <svg viewBox="-14 -14 28 28" width="26" height="26">${nodeGlyph(o.kind, NODE_COL[o.kind])}</svg><b>${o.name}</b><i class="nm-desc">${o.desc}</i></button>`).join('');
  const sheet = `<defs>
      <filter id="nmRag" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="10"/></filter>
      <filter id="nmInk"><feTurbulence type="fractalNoise" baseFrequency=".08" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2"/></filter>
      <filter id="nmGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .33 0 0 0 0 .23 0 0 0 0 .1 0 0 0 .5 -.1"/></filter>
      <radialGradient id="nmSheet" cx="50%" cy="45%" r="68%"><stop offset="0" stop-color="#e6d6ad"/><stop offset=".62" stop-color="#d4bd8b"/><stop offset="1" stop-color="#a8885a"/></radialGradient>
      <clipPath id="nmClip"><rect x="12" y="8" width="592" height="336" rx="8"/></clipPath>
    </defs>
    <rect x="12" y="8" width="592" height="336" rx="8" fill="url(#nmSheet)" filter="url(#nmRag)"/>
    <g clip-path="url(#nmClip)"><rect width="616" height="352" filter="url(#nmGrain)"/>
      <ellipse cx="470" cy="70" rx="70" ry="34" fill="#7a5426" opacity=".07"/><ellipse cx="120" cy="250" rx="90" ry="40" fill="#6a4a20" opacity=".06"/><ellipse cx="560" cy="300" rx="40" ry="26" fill="#5a3a18" opacity=".08"/>
      <path d="M12 120 Q308 112 604 126 M300 8 Q296 176 306 344" stroke="#8a6a3a" stroke-width="1" opacity=".18" fill="none"/></g>`;
  return `<div class="nodemap parchment"><div class="nm-box">
    <svg class="nm-svg" viewBox="0 0 616 352" width="616" height="352">${sheet}
      <g filter="url(#nmInk)">${ink}${rooms}${marks}
        <text x="308" y="30" class="nm-title-ink">Shadow Crypt</text></g></svg>
    <div class="nm-sub">Floor ${n.floor} cleared · choose the stairs down</div>
    <div class="nm-opts">${buttons}</div>
    <button class="tbtn tportal" data-act="toTown">Town portal <small>15 min · back to floor ${n.checkpoint}</small></button>
    <div class="nm-foot">Maps from loot add paths. The clock runs at 25% while you choose.</div>
  </div></div>`;
}

/** A curio in the corridor (#30): two choices, each with its real-life cost on the button. Escapable. */
function curioHtml(c: CurioState): string {
  const d = curioDef(c);
  if (!d) return '';
  const pct = Math.max(0, Math.min(100, (c.t / c.max) * 100));
  const head = `<button class="mg-close" data-act="curioLeave" title="Walk past" style="right:6px;top:6px;width:22px;height:22px;font-size:13px">\u2715</button>
    <div class="cu-name">${d.name}</div><div class="cu-line">${d.line}</div>`;
  if (c.stage === 'ask') {
    const btns = d.choices.map(ch => {
      const why = curioBlocked(ch.id);
      return `<button class="cu-btn ${why ? 'off' : ''}" data-act="curio" data-arg="${ch.id}"><b>${curioText(ch.label)}</b><small>${why || curioText(ch.cost)}</small></button>`;
    }).join('');
    return `<div class="curio">${head}<div class="cu-row">${btns}</div>
      <div class="cu-timer" title="The party walks on when this runs out"><i style="width:${pct}%"></i></div></div>`;
  }
  const what = c.stage === 'pick' ? 'Picking the lock. Quiet, but the clock runs.' : 'Sneaking. Stay on this screen: alt-tab and he wakes up.';
  return `<div class="curio">${head}<div class="cu-prog">${what} <b>${Math.ceil(c.t)} s</b></div>
    <div class="cu-timer work"><i style="width:${100 - pct}%"></i></div></div>`;
}

export function monUiHtml(): string {
  const n = S.g.night;
  if (!n || n.monitor === 'excel' || n.monitorOff > 0 || n.switching) return '';
  return cornerHtml(n) + buffsHtml(n) + monUiInner(n);
}
let flowStep = 0, flowGlowUntil = 0;
/** No top bar (#49): where you are and the Flow multiplier, small and quiet in the battle's top-left corner.
 *  Each time Flow passes a step (FLOW_GLOW_STEP) the text glows for a moment. */
function cornerHtml(n: NonNullable<typeof S.g.night>): string {
  if (n.location === 'town') return '<div class="corner"><div>Ravenhold · town</div></div>';
  if (n.phase === 'mapChoice') return '';
  const step = Math.floor((n.flow + 1e-6) / T.FLOW_GLOW_STEP);
  const now = performance.now();
  if (step > flowStep && n.flow > T.FLOW_MIN + 0.01) flowGlowUntil = now + T.FLOW_GLOW_SEC * 1000;
  flowStep = step;
  const map = n.floorMap === 'plain' ? '' : ` · ${MAP_INFO[n.floorMap].name}`;
  const boss = n.floor % T.CHECKPOINT_EVERY === 0 ? ' · boss floor' : '';
  const pct = Math.round(((n.flow - T.FLOW_MIN) / (T.FLOW_MAX - T.FLOW_MIN)) * 100);
  return `<div class="corner"><div>Shadow Crypt · floor ${n.floor} · battle ${Math.min(n.battleIdx + 1, T.BATTLES_PER_FLOOR)}/${T.BATTLES_PER_FLOOR}${map}${boss}</div>
    <div class="cn-flow ${now < flowGlowUntil ? 'step' : ''}"><span>Flow x${n.flow.toFixed(1)}</span><i><b style="width:${pct}%"></b></i></div></div>`;
}
function monUiInner(n: NonNullable<typeof S.g.night>): string {
  if (n.location === 'town') return townOverlayHtml();
  if (n.phase === 'mapChoice') return nodeMapHtml();
  const ok = n.phase !== 'battle';
  const portal = `<button class="tbtn tportal ${ok ? '' : 'off'}" data-act="toTown">Town portal <small>${ok ? '15 min' : 'after battle'}</small></button>`;
  return portal + (n.phase === 'curio' && n.curio ? curioHtml(n.curio) : '') + skillBarHtml();
}

/** Skills that answer the boss's wind-up pulse red: SMASH = Taunt, Bash (unless braced), Ward;
 *  EXECUTE = Taunt, Ward; SUMMON = Fire and Storm for the friend that is coming. */
function answersMove(e: { defId: string; braced?: boolean }, id: string, si: number): boolean {
  const move = ENEMY_BY_ID[e.defId]?.move;
  if (move === 'slam') return (id === 'knight' && (si === 1 || (si === 2 && !e.braced))) || (id === 'healer' && si === 2);
  if (move === 'evict') return (id === 'knight' && si === 1) || (id === 'healer' && si === 2);
  if (move === 'loan') return id === 'mage' && (si === 1 || si === 3);
  return false;
}

/** A mark on the field that this skill cashes in: the button glows gold (docs/design/dungeon.md, ability marks). */
function comboReady(id: string, si: number): string {
  const alive = N().enemies.filter(e => e.hp > 0);
  const has = (e: { marks?: Record<string, number | undefined> } | undefined, m: string) => !!e && (e.marks?.[m] ?? 0) > 0;
  if (id === 'mage' && si === 1 && alive.some(e => has(e, 'stagger'))) return `x${T.MARK_STAGGER_FIRE}`;
  if (id === 'knight' && si === 2 && has(alive.find(e => (e.wind ?? 0) > 0) ?? alive.find(e => e.shield) ?? alive[0], 'chill')) return `x${T.MARK_CHILL_BASH}`;
  if (id === 'healer' && si === 2 && alive.some(e => has(e, 'taunted'))) return '\u21a9';
  return '';
}

// ---------- Infinity Engine style action bar on the dungeon screen: portrait + 5 skills per hero ----------
function skillBarHtml(): string {
  const n = N();
  const lock = abilitiesLocked();
  const groups = S.g.heroes.map((h, hi) => {
    const mx = maxHp(h), hp = h.downed ? 0 : h.hp / mx;
    const por = `<button class="ie-por ${n.heroTab === hi ? 'sel' : ''} ${h.downed ? 'down' : ''}" data-act="heroTab" data-arg="${hi}" data-tip="hero:${hi}" style="--hc:${HERO_COLORS[h.id]}">
      <span class="ie-face">${portrait(h.id)}</span><span class="ie-hp"><i style="height:${Math.round(hp * 100)}%;background:${hp > 0.5 ? '#4fbf5f' : hp > 0 ? '#d9a33a' : '#a33'}"></i></span></button>`;   // no name here: the party cards carry it (#49)
    const sk = ABILITIES[h.id].map((a, si) => {
      if (si === 0) return '';                    // auto attack is always on: no button
      const unlocked = si === 0 || abilityUnlocked(h, si);
      const cd = h.cd[si];
      const [gname, gcol] = ABILITY_GLYPHS[h.id][si];
      let cls = 'ie-sk', over = '';
      if (si === 0) cls += ' auto';
      else if (!unlocked) { cls += ' locked'; over = `<b class="ie-tag">${si <= 3 ? `Lv${T.ABILITY_UNLOCK[si]}` : '--'}</b>`; }
      else if (cd > 0) { cls += ' cd'; over = `<i class="ie-sweep" style="--p:${Math.round((cd / ABILITIES[h.id][si].cd) * 36) * 10}deg"></i><b class="ie-cd">${Math.ceil(cd)}</b>`; }
      else cls += ' ready';
      if (h.queued === si) cls += ' queued';
      if (lock && si > 0) cls += ' blocked';
      const wind = n.enemies.find(e => e.hp > 0 && (e.wind ?? 0) > 0);
      if (wind && unlocked && cd <= 0 && answersMove(wind, h.id, si)) cls += ' answer';
      else if (unlocked && cd <= 0 && !h.downed && comboReady(h.id, si)) { cls += ' combo'; over += `<b class="ie-combo">${comboReady(h.id, si)}</b>`; }
      return `<button class="${cls}" data-act="ability" data-arg="${hi},${si}" data-tip="skill:${hi}:${si}">${glyph(gname, unlocked ? gcol : '#4a4440', 20)}${over}<span class="ie-key">${HOTKEYS[h.id][si].toUpperCase()}</span></button>`;
    }).join('');
    return `<div class="ie-grp ${h.downed ? 'downed' : ''}">${por}<div class="ie-sks">${sk}</div></div>`;
  }).join('');
  return `<div class="ie-bar ${lock ? 'locked' : ''}">${groups}${lock ? `<div class="ie-lock">${lock}</div>` : ''}</div>`;
}

/** Tiny pixel portrait per class (CSS-drawn placeholder until real portraits exist). */
function portrait(id: string): string {
  const hair = id === 'knight' ? '#6a4a2a' : id === 'mage' ? '#2a2a3a' : '#c9a46a';
  const hat = id === 'knight' ? '<rect x="3" y="1" width="10" height="5" fill="#8a96a8"/><rect x="3" y="5" width="10" height="1" fill="#5a6678"/>' : id === 'mage' ? '<path d="M3 6 L8 0 L13 6 Z" fill="#6a3ab8"/>' : `<rect x="3" y="2" width="10" height="4" fill="${hair}"/>`;
  return `<svg viewBox="0 0 16 18" width="34" height="38" shape-rendering="crispEdges"><rect width="16" height="18" fill="#1a1410"/>
    <rect x="4" y="4" width="8" height="8" fill="#e8b98a"/>${hat}<rect x="5" y="8" width="2" height="1" fill="#1d2330"/><rect x="9" y="8" width="2" height="1" fill="#1d2330"/>
    <rect x="2" y="13" width="12" height="5" fill="${HERO_COLORS[id as keyof typeof HERO_COLORS]}"/><rect x="7" y="11" width="2" height="1" fill="#b05a5a"/></svg>`;
}

// ---------- Buffs and debuffs on you (WoW style: icon squares, timer under each) ----------
const BI: Record<string, string> = {
  blessing: '<path d="M11 2 C15 7, 18 10, 15 16 C13 20, 8 20, 6 16 C4 12, 8 10, 9 6 C10 9, 12 10, 11 2 Z" fill="#3ad03a"/><path d="M11 10 C13 13, 13 16, 11 18 C9 16, 9 13, 11 10 Z" fill="#b0ff9a"/>',
  curse: '<circle cx="11" cy="9" r="7" fill="#c9b8e8"/><rect x="7" y="14" width="8" height="5" rx="1" fill="#c9b8e8"/><circle cx="8.5" cy="9" r="2" fill="#3a1f5a"/><circle cx="13.5" cy="9" r="2" fill="#3a1f5a"/><path d="M9 16 V19 M11 16 V19 M13 16 V19" stroke="#3a1f5a" stroke-width="1"/>',
  raid: '<path d="M4 15 C4 6, 18 6, 18 15" stroke="#8fd0ff" stroke-width="2.2" fill="none"/><rect x="2" y="13" width="5" height="7" rx="2" fill="#5a9ad8"/><rect x="15" y="13" width="5" height="7" rx="2" fill="#5a9ad8"/><path d="M7 4 L15 12 M15 4 L7 12" stroke="#f2d24b" stroke-width="2"/>',
  loved: '<path d="M11 19 C4 13, 2 9, 5 6 C7.5 3.5, 10 5, 11 7 C12 5, 14.5 3.5, 17 6 C20 9, 18 13, 11 19 Z" fill="#ff7ab8"/><path d="M7 8 C7.5 7, 8.5 6.5, 9.5 7" stroke="#ffd6e8" stroke-width="1.4" fill="none"/>',
  dog: '<ellipse cx="11" cy="13" rx="7" ry="6" fill="#c8964e"/><ellipse cx="5" cy="9" rx="2.5" ry="4.5" fill="#8a5a2a"/><ellipse cx="17" cy="9" rx="2.5" ry="4.5" fill="#8a5a2a"/><circle cx="8.5" cy="12" r="1.1" fill="#2a1a10"/><circle cx="13.5" cy="12" r="1.1" fill="#2a1a10"/><ellipse cx="11" cy="15" rx="1.6" ry="1.1" fill="#2a1a10"/>',
  sulk: '<circle cx="11" cy="11" r="8" fill="#8a6ad8"/><circle cx="8" cy="9" r="1.2" fill="#1a1028"/><circle cx="14" cy="9" r="1.2" fill="#1a1028"/><path d="M7.5 15.5 Q11 12.5 14.5 15.5" stroke="#1a1028" stroke-width="1.5" fill="none"/>',
  monster: '<rect x="6" y="2" width="10" height="18" rx="2" fill="#111"/><ellipse cx="11" cy="3" rx="5" ry="1.4" fill="#c9ced6"/><path d="M8.5 6 L9.5 14 M11 5.5 L11 15 M13.5 6 L12.5 14" stroke="#6fe08a" stroke-width="1.6"/>',
  crash: '<rect x="6" y="5" width="10" height="15" rx="2" fill="#333"/><path d="M11 1 V9 M7.5 6 L11 10 L14.5 6" stroke="#ff8a80" stroke-width="2" fill="none"/>',
  zone: '<path d="M4 14 C4 4, 18 4, 18 14" stroke="#c9a8ff" stroke-width="2.4" fill="none"/><rect x="2" y="12" width="5" height="8" rx="2" fill="#9a7aff"/><rect x="15" y="12" width="5" height="8" rx="2" fill="#9a7aff"/>',
  flow: '<path d="M11 2 C15 7, 18 10, 15 16 C13 20, 8 20, 6 16 C4 12, 8 10, 9 6 C10 9, 12 10, 11 2 Z" fill="#ff9a4d"/><path d="M11 10 C13 13, 13 16, 11 18 C9 16, 9 13, 11 10 Z" fill="#ffe08a"/>',
  guilt: '<path d="M11 19 L3 10 C0 6, 5 1, 9 5 L11 7 L13 5 C17 1, 22 6, 19 10 Z" fill="#e05a7a"/><path d="M11 7 L9 11 L12 13 L10 18" stroke="#14101a" stroke-width="1.6" fill="none"/>',
  tired: '<text x="3" y="12" font-size="9" font-weight="700" fill="#8fa8d9" font-family="Inter">Z</text><text x="9" y="17" font-size="7" font-weight="700" fill="#8fa8d9" font-family="Inter">z</text><text x="14" y="21" font-size="5" font-weight="700" fill="#8fa8d9" font-family="Inter">z</text>',
  taunt: '<path d="M11 2 L19 5 V11 C19 16, 15 19, 11 21 C7 19, 3 16, 3 11 V5 Z" fill="#6aa8ff"/><path d="M8 9 L14 15 M14 9 L8 15" stroke="#14101a" stroke-width="2"/>',
  ward: '<circle cx="11" cy="11" r="8" fill="none" stroke="#6fcf7f" stroke-width="2.4"/><circle cx="11" cy="11" r="3" fill="#6fcf7f"/>',
};
/** Flow, Zone and Tired are not here (#49): they have their own place (the corner, the YOU card). */
function buffsHtml(n: NonNullable<typeof S.g.night>): string {
  type B = { k: string; name: string; de?: boolean; left?: number; max?: number; label?: string };
  const list: B[] = [];
  if (n.boost > 0) list.push({ k: 'monster', name: 'Monster: party acts 30% faster', left: n.boost, max: T.MONSTER_BOOST_SEC });
  if (n.crash > 0) list.push({ k: 'crash', name: 'Sugar crash: party slower', de: true, left: n.crash, max: T.MONSTER_CRASH_SEC });
  if (n.taunt > 0) list.push({ k: 'taunt', name: 'Taunt: enemies hit the knight', left: n.taunt, max: 5 });
  if (n.ward > 0) list.push({ k: 'ward', name: 'Ward: party protected', left: n.ward, max: 6 });
  for (const b of n.partyBuffs) list.push(b.fights !== undefined
    ? { k: b.icon, name: `${b.name}: party +${Math.round(b.dmg * 100)}% damage${b.crit ? `, +${b.crit}% crit` : ''} for the next fight`, label: 'next' }
    : b.floor
    ? { k: b.icon, de: b.dmg < 0, name: `${b.name}: party ${Math.round(b.dmg * 100)}% damage until the next floor`, label: 'floor' }
    : { k: b.icon, de: b.dmg < 0, name: `${b.name}: party ${b.dmg >= 0 ? '+' : ''}${Math.round(b.dmg * 100)}% damage${b.speed ? `, +${Math.round(b.speed * 100)}% speed` : ''}`, left: b.t, max: b.max });
  if (n.goodDog > 0) list.push({ k: 'dog', name: `Good Boy: loot goblins x${T.GOOD_BOY_GOBLIN}`, left: n.goodDog, max: T.GOOD_BOY_SEC });
  if (n.sulk > 0) list.push({ k: 'sulk', de: true, name: `Magoo sulks about the guild bank: mage -${Math.round(T.CURIO_SULK_DMG * 100)}% damage`, left: n.sulk, max: T.CURIO_SULK_SEC });
  if (n.guilt > 0) list.push({ k: 'guilt', name: 'Guilt: party -10% damage', de: true, left: n.guilt, max: T.GUILT_SEC });
  if (!list.length) return '';
  return `<div class="buffs">${list.map(b => {
    const pct = b.left !== undefined && b.max ? Math.round((1 - b.left / b.max) * 36) * 10 : 0;
    const label = b.label ?? `${Math.ceil(b.left ?? 0)}s`;
    return `<div class="buff ${b.de ? 'de' : ''} ${b.left !== undefined && b.left < 5 ? 'low' : ''}" title="${b.name}"><div class="bi"><svg viewBox="0 0 22 22" width="22" height="22">${BI[b.k]}</svg>${pct ? `<i class="sweep" style="--p:${pct}deg"></i>` : ''}</div><span class="bt">${label}</span></div>`;
  }).join('')}</div>`;
}

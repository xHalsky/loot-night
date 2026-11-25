import { VERSION } from '../config/version';
// HTML renderers for the DOM parts of the screen. Every clickable element carries
// data-act (+ data-arg); main.ts dispatches them on pointerdown.
import { T } from '../config/tuning';
import { soundCues, soundStatus } from './audio';
import {  S, N, type BagEntry, type Item, type Hero } from '../core/state';
import { ABILITIES, HOTKEYS, HERO_COLORS, heroRole, HOME_RANKS, AURAS, HERO_NAME, ULT_SLOT } from '../data/heroes';
import { autocastBought, autocastOn } from '../systems/tree';
import { rankOf, outOfRank, aurasOn } from '../systems/ranks';
import { LEGEND_BY_ID, SET_BY_ID } from '../data/legendaries';
import { legendOn, setPieces } from '../systems/gear';
import { pacingLine } from '../systems/pacing';
import { liveMs } from '../render/liveRpg';
import { markText } from '../data/marks';
import { specialText } from '../systems/affixes';
import {  COACH } from '../data/tips';
import { cityOutlook } from '../systems/town';
import {  PRE_BY_ID, type PreId } from '../data/preemptive';
import { phoneAction } from '../systems/interrupts';
import { planSvg } from './plan';
import { RARITY_COLOR, STAT_LABEL, MAP_INFO, FEATHER } from '../data/items';
import { cuddleDot, CUDDLE_W, CUDDLE_H } from '../systems/cuddle';
import { heroStats, itemPower, heroPower } from '../systems/stats';
import {  abilityUnlocked } from '../systems/battle';
import { entryName, entryColor, cap } from '../systems/loot';
import { icon } from './icons';
import { fmtClock } from '../core/fx';
import type { MorningScene } from './her';
import { hasSave } from '../systems/save';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const btn = (act: string, label: string, arg = '', cls = '') => `<button class="btn ${cls}" data-act="${act}" data-arg="${esc(arg)}">${label}</button>`;




export function preText(s: string): string {
  return s.replace('{text}', String(T.PRE_TEXT_SEC)).replace('{textCalm}', String(T.PRE_TEXT_CALM)).replace('{textMood}', String(T.PRE_TEXT_MOOD))
    .replace('{tea}', String(T.PRE_TEA_SEC)).replace('{teaMood}', String(T.PRE_TEA_MOOD)).replace('{teaCalm}', String(T.PRE_TEA_CALM))
    .replace(/\{raidCost\}/g, String(T.GOODWILL_RAID)).replace('{raidSec}', String(T.RAID_CALM_SEC))
    .replace('{raidSec}', String(T.RAID_CALM_SEC)).replace('{teaCalm}', String(T.PRE_TEA_CALM)).replace('{textCalm}', String(T.PRE_TEXT_CALM))
    .replace('{towel}', String(T.PRE_TOWEL_SEC)).replace('{towelNoise}', String(Math.round(T.PRE_TOWEL_NOISE * 100))).replace('{towelSlow}', String(Math.round(T.PRE_TOWEL_SLOW * 100)));
}
function preTip(id: PreId): string {
  const d = PRE_BY_ID[id];
  return `<div class="tt-name" style="color:#ff9ab8">${d.name}</div><div class="tt-sub">Costs ${preText(d.cost)}</div><div>${preText(d.tip)}</div>`;
}
/** Your desk chair, nobody in it (placeholder art until #26). */
const EMPTY_CHAIR = `<svg class="empty-chair" viewBox="0 0 160 220" width="160" height="220"><rect x="30" y="4" width="100" height="112" rx="22" fill="#2b2230" stroke="#120c16" stroke-width="3"/><rect x="42" y="16" width="76" height="88" rx="16" fill="#352a3c"/><rect x="72" y="114" width="16" height="16" fill="#1c1620"/><rect x="16" y="128" width="128" height="24" rx="10" fill="#3a2f42" stroke="#120c16" stroke-width="3"/><rect x="74" y="150" width="12" height="42" fill="#1c1620"/><path d="M28 206 L80 190 L132 206" stroke="#1c1620" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="28" cy="210" r="7" fill="#120c16"/><circle cx="132" cy="210" r="7" fill="#120c16"/><circle cx="80" cy="206" r="7" fill="#120c16"/></svg>`;
/** Busy with an action: a small card; away from the desk: the empty chair over everything. */
export function preBusyHtml(): string {
  const n = N();
  const p = n.pre;
  if (!p || phoneAction()) return '';   // phone actions play out in the phone itself (#63)
  const d = PRE_BY_ID[p.id as PreId];
  const pct = Math.round((1 - p.t / p.max) * 100);
  const what = p.id === 'text' ? 'Typing...' : p.id === 'towel' ? (n.towel ? 'Pulling the towel away...' : 'Pushing a towel under the door...')
    : p.stage === 'ask' ? '"Stay for one episode?"' : p.stage === 'episode' ? 'Watching one episode with her...' : p.outcome === 'kitchen' ? 'Stuck in a kitchen hug...' : 'Making her tea...';
  const btns = p.stage === 'ask'
    ? `<div class="pa-btns"><button class="her-btn big" data-act="episode" data-arg="1">Stay (+${T.PRE_EPISODE_SEC} s away, a long calm)</button><button class="her-btn" data-act="episode" data-arg="0">Back to the PC</button></div>` : '';
  const card = `<div class="pre-card"><button class="mg-close" data-act="preCancel" title="${p.stage === 'ask' ? 'Back to the PC' : 'Stop and go back'}" style="right:-9px;top:-9px;width:22px;height:22px;font-size:12px">\u2715</button>
    <small>${d.name}</small><b>${what}</b><span>${Math.ceil(p.t)} s${p.away ? ' · the party is on autopilot' : ''}</span>${btns}<div class="pa-bar"><i style="width:${pct}%"></i></div></div>`;
  return p.away ? `<div class="away-layer">${EMPTY_CHAIR}${card}</div>` : `<div class="busy-wrap">${card}</div>`;
}


export function planHtml(): string {
  return `<div class="plan-back"><div class="plan-sheet"><button class="mg-close" title="Back (Esc)">\u2715</button>
    <div class="plan-title">The plan <small>who hears you, what the crack shows</small></div>
    ${planSvg(340)}
    <div class="plan-foot">Your room is at the end of the hallway. Next to it: the kitchen and the living room (through the
    walls) and the hallway. She hears you best there. The bathroom is further down, the bedroom at the far end.
    Through the crack: 1 the kitchen, 2 the bathroom door, 3 the far end only when the door is wide.</div></div></div>`;
}


const PHONE_NOTE: Record<string, [string, string]> = {
  mom: ['MOM', 'calling...'], boss: ['BOSS', '"you there?"'], text: ['BABE', 'coming to bed?'], courier: ['COURIER', 'calling...'], friends: ['THE BOYS', 'group call'],
};
void PHONE_NOTE;

// ---------------- Morning vignette by how the night ended (#22) ----------------
export function morningScene(): MorningScene {
  const r = S.g.results;
  if (!r) return 'green';
  if (r.ending === 'unplugged') return 'unplugged';
  return r.mood < T.MOOD_GREEN ? 'green' : r.mood < T.MOOD_RED ? 'yellow' : 'red';
}
const MORNING_CAPTION: Record<MorningScene, string> = {
  green: 'She fell asleep in your shirt again, hugging your pillow.',
  yellow: 'Back turned. Her phone is still lit.',
  red: 'She fell asleep on the couch. The TV is still on.',
  unplugged: 'An empty bed. A note on your pillow: "Hope the loot was worth it."',
};





export function windowHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  if (!n.game) return '';   // the phone in your hand is the renderer's (V8, #73: render/phoneView.ts, main.ts drawPhone)
  // grey circle with a red X just outside the top-right corner: always a way out
  // windows sit over the battle area (#49), each with the close button just outside its top-right corner
  if (n.game.kind === 'cuddle') return cuddleHtml() + '<button class="mg-close" data-act="cuddleQuit" title="Back to the game (she will not like it)" style="left:532px;top:66px">\u2715</button>';
  return '';   // the phone and the energy break are the renderer's (V8, V5: main.ts drawPhone, drawEnergyBreak)
}

/** Cuddle window: follow her slow breathing (the dot). Static frame; the dot and warmth move in updateWindowDynamics. */
function cuddleHtml(): string {
  const pts = Array.from({ length: 61 }, (_, i) => cuddleDot(i / 60).map(v => v.toFixed(1)).join(',')).join(' ');
  return `<div class="cuddle-win" id="cuddleBox" style="width:${CUDDLE_W}px">
    <div class="cd-head">Cuddle break <small>stay on her breathing, slowly</small></div>
    <svg width="${CUDDLE_W}" height="${CUDDLE_H}" viewBox="0 0 ${CUDDLE_W} ${CUDDLE_H}"><polyline points="${pts}" fill="none" stroke="rgba(255,170,200,.35)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <circle id="cdDot" r="${T.CUDDLE_RADIUS}" fill="rgba(255,140,180,.18)" stroke="rgba(255,190,215,.7)" stroke-width="2"/><circle id="cdCore" r="7" fill="#ffd2e2"/></svg>
    <div class="cd-foot"><span>warmth</span><div class="cd-bar"><i id="cdWarm"></i><em style="left:${T.CUDDLE_PASS * 100}%"></em></div><span id="cdTime"></span></div>
  </div>`;
}

/** Per-frame updates inside the open window (drag positions, hold rings, markers), without re-rendering. */
export function updateWindowDynamics() {
  const n = S.g.night;
  if (!n || !n.game) return;
  const g = n.game;
  if (g.kind === 'cuddle') {
    const [x, y] = cuddleDot(1 - g.t / g.max);
    for (const id of ['cdDot', 'cdCore']) { const e = document.getElementById(id); if (e) { e.setAttribute('cx', x.toFixed(1)); e.setAttribute('cy', y.toFixed(1)); } }
    const w = document.getElementById('cdWarm'); if (w) { w.style.width = `${g.warmth * 100}%`; w.style.background = g.jerk > 0 ? '#e0524a' : g.warmth >= T.CUDDLE_PASS ? '#ff8ab0' : '#c9a0b4'; }
    const tt = document.getElementById('cdTime'); if (tt) tt.textContent = g.jerk > 0 ? 'too fast!' : `${Math.ceil(g.t)} s`;
    return;
  }
  // the phone in your hand is the renderer's now (V8): nothing to move here
}

// ---------------- UI panel ----------------
export function entryIcon(e: BagEntry, size: number): string {
  if (e.kind === 'item') return icon(e.item.slot, '#f2e9d8', size, !e.item.identified);
  if (e.kind === 'map') return icon('map', MAP_INFO[e.map].color, size);
  return icon('feather', FEATHER.color, size);
}

// ---------------- Tooltip (hover, like an MMO) ----------------
export const hover = { key: '', x: 0, y: 0 };

function statLines(it: Item): string {
  return it.affixes.map(a => `<div style="color:${a.amount >= 0 ? '#6fcf7f' : '#ff8a80'}">${a.amount >= 0 ? '+' : ''}${a.amount} ${STAT_LABEL[a.stat]}</div>`).join('') + specialLine(it) + ruleLines(it);
}
/** A legendary's rule and a set's bonuses (#52, 1.8): they work only on their own hero; a set counts his pieces. */
function ruleLines(it: Item): string {
  if (!it.identified) return '';
  if (it.legend) {
    const L = LEGEND_BY_ID[it.legend], on = legendOn(it.legend);
    return `<div class="tt-special" style="color:${RARITY_COLOR.legendary};${on ? '' : 'opacity:.75'}"><b>${HERO_NAME[L.hero].split(' ')[0]}'s:</b> ${L.rule}${on ? '' : ` <span class="dim">(only on ${HERO_NAME[L.hero].split(' ')[0]})</span>`}</div>`;
  }
  if (it.set) {
    const St = SET_BY_ID[it.set], h = S.g.heroes.find(x => x.id === St.hero), k = h ? setPieces(h, it.set) : 0;
    const row = (need: number, txt: string) => `<div style="color:${k >= need ? '#6fcf7f' : '#8e8a99'}">${need} pieces: ${txt}.</div>`;
    return `<div class="tt-special" style="color:${RARITY_COLOR.epic}"><b>${St.name} set</b> · ${HERO_NAME[St.hero].split(' ')[0]} wears ${k}/3</div>${row(2, St.two)}${row(3, St.three)}`;
  }
  return '';
}
/** A special affix: real life in pink (changes a rule), cross-system in teal (a stat while something is true). */
function specialLine(it: Item): string {
  const sp = specialText(it);
  if (!sp) return '';
  const col = sp.life ? '#ff7ab8' : '#6fe0d0';
  return `<div class="tt-special" style="color:${col};${sp.active ? '' : 'opacity:.6'}"><b>${sp.life ? 'Real life' : sp.active ? 'Active' : 'Inactive'}:</b> ${sp.text}</div>`;
}

export function tooltipHtml(): string {
  const n = S.g.night;
  if (!n || !hover.key) return '';
  const parts = hover.key.split(':');
  let body = '';
  if (parts[0] === 'text') {   // a plain line from the live battle area (V2)
    const left = Math.min(hover.x + 16, 1280 - 270), top = Math.max(8, Math.min(hover.y - 40, 720 - 60));
    return `<div class="tooltip" style="left:${left}px;top:${top}px"><div>${esc(hover.key.slice(5))}</div></div>`;
  }
  if (parts[0] === 'autosalvage') return `<div class="tooltip" style="left:${Math.min(hover.x - 120, 1280 - 250)}px;top:${hover.y + 14}px"><div class="tt-name">Auto-salvage</div><div>Common and uncommon drops turn straight into Souls.</div></div>`;
  if (parts[0] === 'pre') return `<div class="tooltip" style="left:${Math.min(hover.x + 16, 1280 - 270)}px;bottom:${Math.max(8, 720 - hover.y + 14)}px">${preTip(parts[1] as PreId)}</div>`;   // low on screen: open upwards
  else if (parts[0] === 'skill' || parts[0] === 'hero') {
    const h = S.g.heroes[Number(parts[1])];
    if (!h) return '';
    const st = heroStats(h);
    if (parts[0] === 'hero') {
      const r = heroRole(h.id, S.g.heroes.some(x => x.id === 'rogue')), [a0, b0] = HOME_RANKS[h.id], out = outOfRank(h);
      const gives = aurasOn(h).map(g => `${HERO_NAME[g].split(' ')[0]}'s ${AURAS[g].name.toLowerCase()}: ${AURAS[g].gives}.`).join(' ');
      body = `<div class="tt-name" style="color:${HERO_COLORS[h.id]}">${h.name} · rank ${rankOf(h)}</div><div>${r.role}</div>
        <div class="tt-sub" ${out ? 'style="color:#ff8a80"' : ''}>${out ? `Out of position: ${h.id === 'healer' ? 'heals' : 'hits'} at ${Math.round(T.OUT_OF_RANK_MULT * 100)}%. ` : ''}Home ranks ${a0} to ${b0}. Drag to swap.</div>${gives ? `<div class="tt-sub" style="color:#9fe08a">${gives}</div>` : ''}`;
    } else {
      const si = Number(parts[2]); const a = ABILITIES[h.id][si];
      const unlocked = abilityUnlocked(h, si);
      const desc = markText((a.tip ?? a.desc).replace('{dmg}', `<b>${Math.round(st.atk * (a.power ?? 1))}</b> damage`).replace('{heal}', `<b>${Math.round(st.atk * (a.power ?? 0) + (a.flat ?? 0))}</b> HP`)
        .replace(/\{pct\}/g, String(Math.round((a.power ?? 0) * 100))).replace('{dur}', String(a.dur ?? 0)).replace('{hits}', String(a.hits ?? 1))
        .replace('{stagger}', String(T.MARK_STAGGER_FIRE)).replace('{backstab}', String(T.MARK_STAGGER_BACKSTAB)).replace('{shatter}', String(T.MARK_CHILL_BASH)).replace('{reflect}', String(Math.round(T.MARK_TAUNT_REFLECT * 100))));
      body = `<div class="tt-name" style="color:${HERO_COLORS[h.id]}">${a.name} <span class="dim">· ${HOTKEYS[h.id][si].toUpperCase()}</span></div>
        <div>${desc}</div>
        ${!unlocked ? `<div class="tt-hint" style="color:#f2c46b">${si === ULT_SLOT ? `Buy it in ${h.name.split(' ')[0]}'s skill tree in town (needs ${T.TREE_ULT_NEEDS} nodes).` : `Unlock it in ${h.name.split(' ')[0]}'s skill tree in town.`}</div>` : autocastBought(h.id, si) ? `<div class="tt-hint" style="color:#9fe08a">Autocast ${autocastOn(h.id, si) ? 'on' : 'off'}: right-click to switch.</div>` : a.ult ? `<div class="tt-hint" style="color:#f2c46b">Charge ${Math.floor(h.ult * 100)}%: fills during fights in ${T.ULT_CHARGE_SEC} s.</div>` : ''}`;
    }
    const left = Math.min(hover.x + 16, 1280 - 270), top = Math.max(8, Math.min(hover.y - 150, 720 - 200));
    return `<div class="tooltip" style="left:${left}px;top:${top}px">${body}</div>`;
  }
  if (parts[0] === 'pre') { /* body set above */ }
  else if (parts[0] === 'bag') {
    const e = S.g.bag.find(x => x.id === parts[1]);
    if (!e) return '';
    if (e.kind === 'item') {
      const it = e.item;
      const h = S.g.heroes[n.heroTab];
      body = `<div class="tt-name" style="color:${RARITY_COLOR[it.rarity]}">${esc(entryName(e))}</div>
        <div class="tt-sub">${cap(it.rarity)} ${cap(it.slot)} · <b style="color:#ffd27a">\u25c6 ${it.identified ? itemPower(it) : '?'}</b>${it.locked ? ' · <b style="color:#f2c46b">locked</b>' : ''}</div>
        ${it.identified ? statLines(it) + `<div class="tt-cmp">${powerCompare(h, it)}</div>` : '<div class="dim">Unidentified: identify it at the Appraiser.</div>'}`;
    } else if (e.kind === 'map') {
      body = `<div class="tt-name" style="color:${MAP_INFO[e.map].color}">${entryName(e)}</div><div>${MAP_INFO[e.map].desc}</div>`;
    } else {
      body = `<div class="tt-name" style="color:${FEATHER.color}">${FEATHER.name}</div><div>${FEATHER.desc}</div>`;
    }
  } else if (parts[0] === 'gear') {
    const h = S.g.heroes[Number(parts[1])];
    const it = h?.gear[parts[2] as Item['slot']];
    if (!it) return '';
    body = `<div class="tt-name" style="color:${RARITY_COLOR[it.rarity]}">${esc(it.name)}</div>
      <div class="tt-sub">${cap(it.rarity)} ${cap(it.slot)} · <b style="color:#ffd27a">\u25c6 ${itemPower(it)}</b></div>${statLines(it)}`;
  } else return '';
  const left = Math.min(hover.x + 16, 1280 - 250), top = Math.min(hover.y + 12, 720 - 200);
  return `<div class="tooltip" style="left:${left}px;top:${top}px">${body}</div>`;
}

function affixLines(item: Item): string {
  if (!item.identified) return `<div class="dim">Unidentified: stats hidden. Identify at the Appraiser in town.</div>`;
  return item.affixes.map(a => `<div style="color:${a.amount >= 0 ? '#6fcf7f' : '#ff8a80'}">${a.amount >= 0 ? '+' : ''}${a.amount} ${STAT_LABEL[a.stat]}</div>`).join('');
}

function powerCompare(h: Hero, item: Item): string {
  const d = heroPower(h, { [item.slot]: item }) - heroPower(h);
  return d > 0 ? `<span style="color:#6fcf7f">\u25b2 +${d} power for ${h.name}</span>` : d < 0 ? `<span style="color:#ff8a80">\u25bc ${d} power for ${h.name}</span>` : `<span class="dim">Same power for ${h.name}</span>`;
}


/** The item window (#49): over the party and gear block of the side panel, so the bag below stays clickable and
 *  the battle stays in view. One Equip button per hero with the power change. */
function detailHtml(e: BagEntry): string {
  const town = N().location === 'town';
  const close = '<button class="mg-close" data-act="closeSel" title="Close">\u2715</button>';
  let body = '';
  if (e.kind === 'item') {
    const it = e.item;
    const eq = it.identified ? `<div class="pop-eq">${S.g.heroes.map((h, i) => {
      const d = heroPower(h, { [it.slot]: it }) - heroPower(h);
      return `<button class="pop-eq-btn" data-act="equip" data-arg="${i}"><b>${h.name}</b><em class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? `\u25b2 +${d}` : d < 0 ? `\u25bc ${d}` : '='}</em></button>`;
    }).join('')}</div>` : '<div class="dim">Unidentified: the Appraiser in town reveals it.</div>';
    body = `<div class="d-name" style="color:${RARITY_COLOR[it.rarity]}">${esc(entryName(e))}</div>
      <div class="pop-sub">${cap(it.rarity)} ${it.slot}${it.identified && (it.legend || it.set) ? ` · ${HERO_NAME[(it.legend ? LEGEND_BY_ID[it.legend] : SET_BY_ID[it.set!]).hero].split(' ')[0]}` : ''} · item level ${it.ilvl}${it.identified ? ` · \u25c6 ${itemPower(it)}` : ''}</div>
      ${it.identified ? `<div class="pop-aff">${affixLines(it)}</div>${specialLine(it)}${ruleLines(it)}` : ''}${eq}
      ${town ? '<div class="dim">Sell, identify, salvage or list it at the services above.</div>' : ''}`;
  } else if (e.kind === 'map') {
    body = `<div class="d-name" style="color:${MAP_INFO[e.map].color}">${entryName(e)}</div><div>${MAP_INFO[e.map].desc}</div><div class="dim">Pick it when a floor ends.</div>`;
  } else {
    body = `<div class="d-name" style="color:${FEATHER.color}">${FEATHER.name}</div><div>${FEATHER.desc}</div><div class="pop-eq">${btn('useSel', 'Use now', '', 'sm green')}</div>`;
  }
  return `<div class="sp-pop">${close}${body}<div class="d-foot">${btn('dropSel', 'Drop', '', 'sm red')}</div></div>`;
}

/** A new drop with a full bag: click a bag item to swap it, or leave it (the drop waits DROP_WAIT_SEC). */
function dropPopupHtml(): string {
  const n = N();
  const p = n.dropPopup!;
  const e = p.entry;
  return `<div class="sp-pop full">
    <div class="pop-kick">Bag full: new drop</div>
    <div class="d-name" style="color:${entryColor(e)}">${esc(entryName(e))}</div>
    ${e.kind === 'item' && e.item.identified ? `<div class="pop-aff">${affixLines(e.item)}</div>` : ''}
    <div>Click a bag item below to swap it for this one.</div>
    <div class="timebar"><div style="width:${(p.t / T.DROP_WAIT_SEC) * 100}%"></div></div>
    <div class="d-foot">${btn('skipDrop', `Leave it (${Math.ceil(p.t)} s)`, '', 'sm')}</div></div>`;
}

/** The side panel inside the game screen (#49): the party, the selected hero's gear and stats, the bag and the
 *  Treasury row; in town the city menu (build, services) and the bag. No HP here (the battle and the skill bar
 *  show it), no instruction text in the headers. Hidden with the rest of the game (Excel, monitor off, switching). */
export function uiPopHtml(): string { return itemPopHtml(); }
/** The item window or the bag-full popup, if one is open (drawn over the side panel's top block). */
function itemPopHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  if (n.dropPopup) return dropPopupHtml();
  if (!n.selected) return '';
  const e = S.g.bag.find(x => x.id === n.selected);
  return e ? detailHtml(e) : '';
}



// ---------------- Full-screen screens ----------------
export function screenHtml(): string {
  const g = S.g;
  if (g.screen === 'title') {
    return `<div class="screen"><div class="card">
      <div class="kicker">PROTOTYPE v${VERSION} · NIGHT 1 · MONDAY</div>
      <h1>Loot Night</h1>
      <p>Raid night. Your guild needs you, the loot is dropping, and your girlfriend thinks you are doing spreadsheets.</p>
      <p class="dim">The RPG plays itself. Your job: listen, hide, and keep her, your mom, your boss and the dog happy until dawn.</p>
      <div class="row">${hasSave() ? btn('continue', `Continue · night ${g.nightsPlayed + 1}`, '', 'wide gold') + btn('newGame', 'New game', '', 'wide') : btn('newGame', 'Start Monday night', '', 'wide gold')}</div>
      <p class="dim">Turn the sound on: her footsteps are your early warning. <kbd>Esc</kbd> pause.</p>
    </div></div>`;
  }
  if (g.screen === 'results' && g.results) {
    const r = g.results;
    const STAR: [keyof typeof r.goals, string, string][] = [['deep', 'Deep', `floor ${r.goals.target}`], ['unseen', 'Unseen', 'never caught'], ['sweet', 'Sweet', 'she ended happy']];
    const stars = STAR.map(([k, name, why]) => `<span class="star-n ${r.goals[k] ? 'on' : ''}"><span class="star">★</span><b>${name}</b><small>${why}</small></span>`).join('');
    const endTxt = r.ending === 'sleep' ? `Logged off at ${fmtClock(r.endClock)}` : r.ending === 'dawn' ? 'Dawn. The sun is up and so are you.' : 'Unplugged. She pulled the plug. Half the bag is gone.';
    return `<div class="screen"><div class="card">
      <div class="kicker">MONDAY · RESULTS</div>
      <div class="stars">${stars}</div>
      <h2>${endTxt}</h2>
      <div class="grid2">
        <div><span class="dim">Deepest floor</span><b>${r.depth}</b></div>
        <div><span class="dim">Previous record</span><b>${r.prevRecord}</b></div>
        <div><span class="dim">Mood at the end</span><b>${r.mood}</b></div>
        <div><span class="dim">Sleep debt</span><b>${r.debtBefore} → ${r.debtAfter}</b></div>
      </div>
      <div class="stars-key dim">Each star pays in the morning: Deep a chest, Unseen her trust, Sweet breakfast.</div>
      ${r.nearMisses.length ? `<div class="near"><div class="kicker">SO CLOSE</div>${r.nearMisses.map(m => `<div>${esc(m)}</div>`).join('')}</div>` : ''}
      ${r.unidentified ? `<div class="near"><div class="kicker" style="color:#b98cff">WAITING AT THE APPRAISER</div><div>${r.unidentified} unidentified item${r.unidentified > 1 ? 's' : ''} in your bag: ${'<span class="sil">???</span>'.repeat(Math.min(6, r.unidentified))}</div></div>` : ''}
      <div class="row">${btn('morning', 'Next morning →', '', 'wide gold')}</div>
    </div></div>`;
  }
  if (g.screen === 'morning' && g.morning) {
    const m = g.morning;
    const debt = g.sleepDebt;
    return `<div class="screen"><div class="card morning">
      <div class="m-grid">
        <div class="m-art"><canvas id="morningArt" width="480" height="240"></canvas><div class="dim m-cap">${MORNING_CAPTION[morningScene()]}</div></div>
        <div class="m-info">
          <div class="kicker">MORNING SUMMARY</div>
          <h3>${m.listings ? `Auction house sold ${m.listings} item${m.listings > 1 ? 's' : ''}: +${m.paid} zł` : 'Nothing sold overnight.'}</h3>
          ${m.chest || m.trust || m.breakfast ? `<div class="m-rewards">
            ${m.chest ? `<div><b>★ Deep: a chest.</b> <span style="color:${RARITY_COLOR[m.chest.rarity]}">${esc(m.chest.identified ? m.chest.name : '??? (' + m.chest.rarity + ')')}</span>${m.chestWaits ? ' <span class="dim">(bag full: it waits for tonight)</span>' : ''}</div>` : ''}
            ${m.trust ? `<div><b>★ Unseen: Trust.</b> Tonight starts with Goodwill +${T.STAR_UNSEEN_GOODWILL}.</div>` : ''}
            ${m.breakfast ? `<div><b>★ Sweet: Breakfast.</b> She made breakfast: sleep debt -${T.STAR_SWEET_DEBT}.</div>` : ''}</div>` : `<div class="m-rewards dim">No stars, no rewards. Tonight's note has three.</div>`}
          <div class="grid2">
            <div><span class="dim">Wallet</span><b>${g.zl} zł</b></div>
            <div><span class="dim">Sleep debt</span><b>${debt}</b></div>
            <div><span class="dim">Gold</span><b>${g.gold}</b></div>
            <div><span class="dim">Best stars</span><b>${g.bestStars} / 3</b></div>
          </div>
          <div class="m-note">${debt > 0 ? `Sleep debt ${debt}: tonight starts at Tiredness ${Math.min(100, T.TIRED_BASE + debt * T.TIRED_PER_DEBT)}.` : 'No sleep debt: tonight starts fresh.'} Party, gear, gold and city carry over.</div>
        </div>
      </div>
      <div class="row">${btn('startNight', 'Start Monday night', '', 'wide gold')}</div>
    </div></div>`;
  }
  return '';
}

export function pauseHtml(): string {
  if (S.g.howto && S.g.screen === 'night') return howtoHtml();
  return S.g.paused && S.g.screen === 'night' ? `<div class="screen dark"><div class="card"><h1>Paused</h1><p class="dim">The screen is blacked out so pausing can't be used to peek.</p><div class="row">${btn('resume', 'Resume', '', 'wide gold')}${btn('howtoOpen', 'How to hide', '', 'wide')}</div></div></div>` : '';
}

/** The one-screen how-to-hide card (#28): opens the first night, and from the pause menu. The night waits. */
const HOWTO: [string, string, string][] = [
  ['Listen', 'Her TV, kettle, shower, steps. The line under your door says what you heard last. Hold the door to peek.',
    '<rect x="14" y="6" width="22" height="34" rx="2" fill="#4a4a54"/><rect x="14" y="40" width="22" height="3" fill="#ffcf7a"/><path d="M40 16q5 7 0 14M44 12q8 11 0 22" stroke="#ff9ab8" stroke-width="2.4" fill="none"/>'],
  ['Tab to Excel', 'Footsteps? Press <kbd>Tab</kbd> now. Switching takes a second or two, so never wait for the handle.',
    '<rect x="4" y="16" width="20" height="16" rx="3" fill="#3a3a44"/><text x="14" y="28" font-size="9" fill="#fff" text-anchor="middle" font-family="Inter">Tab</text><path d="M26 24h6" stroke="#fff" stroke-width="2"/><rect x="34" y="12" width="20" height="24" rx="3" fill="#1d7a44"/><text x="44" y="29" font-size="13" fill="#fff" text-anchor="middle" font-weight="700" font-family="Inter">X</text>'],
  ['Answer her', 'Each visit wants something else. Plates clinking: hide your cans. Humming: talk to her. Slow steps: a cuddle.',
    '<rect x="8" y="8" width="42" height="28" rx="6" fill="#fff4f2"/><path d="M18 36l-4 8 10-8" fill="#fff4f2"/><text x="29" y="27" font-size="16" fill="#e8657f" text-anchor="middle" font-family="Patrick Hand">?!</text>'],
  ['Headset (H)', 'Click your head or press H. After 30 s you are in the Zone: faster Flow, more loot. But you cannot hear her coming.',
    '<path d="M14 30a15 15 0 0 1 30 0" stroke="#6a6a78" stroke-width="5" fill="none"/><rect x="9" y="27" width="9" height="15" rx="3" fill="#55555f"/><rect x="40" y="27" width="9" height="15" rx="3" fill="#55555f"/><rect x="10" y="30" width="2" height="9" fill="#9a6bff"/><rect x="46" y="30" width="2" height="9" fill="#9a6bff"/>'],
];
export function howtoHtml(): string {
  const tiles = HOWTO.map(([h, p, svg], i) => `<div class="ht-tile"><svg viewBox="0 0 58 48" width="58" height="48">${svg}</svg><b><i>${i + 1}</i> ${h}</b><p>${p}</p></div>`).join('');
  return `<div class="screen howto"><div class="card"><div class="kicker">MONDAY, 20:00 · HOW TO HIDE</div>
    <div class="ht-grid">${tiles}</div>
    <p class="dim">The party fights by itself. Fire skills and pick floors when you like. Every catch costs her patience (the hearts); when they run out she pulls the plug.</p>
    <div class="row">${btn('howtoClose', 'Got it', '', 'wide gold')}</div></div></div>`;
}

export function debugHtml(): string {
  const g = S.g;
  if (!g.debug) return '';
  const n = g.night;
  return `<div class="debug">
    <div><b>DEBUG</b> · speed x${g.timeScale} · ${btn('dbgLife', g.realLifeOff ? 'Real life: OFF' : 'Real life: on', '', 'sm')}</div>
    ${n ? `<div class="dim">${pacingLine()}${liveMs() ? ` · render ${liveMs().toFixed(1)} ms` : ''}</div>` : ''}
    ${n ? (() => { const c = cityOutlook(); return `<div class="dim">income tonight ${S.g.gold - n.goldStart >= 0 ? '+' : ''}${S.g.gold - n.goldStart} g · bag ${c.bagGold} g / ${c.bagScraps} scraps · next ${c.next ? `${c.next.name} ${c.next.gold} g + ${c.next.mats}` : 'none'} ${c.now ? '(now)' : c.withBag ? '(with the bag)' : '(short)'}</div>`; })() : ''}
    ${n ? `<div class="dim">threat ${n.threat.toFixed(1)}s · visit ${n.visit.stage} ${n.visit.t.toFixed(1)} · phone ${n.phoneScript.filter(x => !x.done).map(x => x.kind + ' ' + fmtClock(x.at)).join(', ') || 'done'}${n.friendsLeft ? ` · boys ${n.friendsLeft}` : ''} · gap ${Math.max(0, T.REAL_LIFE_GAP_SEC - (n.threat - n.lastDemand)).toFixed(0)}s · phase ${n.phase}</div>` : ''}
    <div class="row">${[1, 4, 10].map(s => btn('dbgSpeed', `x${s}`, String(s), 'sm')).join('')}</div>
    <div class="row">${btn('dbgVisit', 'Visit', '', 'sm')}${btn('dbgVisit', 'Snack', 'snack', 'sm')}${btn('dbgVisit', 'Chat', 'chat', 'sm')}${btn('dbgVisit', 'Cuddle', 'cuddle', 'sm')}${btn('dbgMom', 'Mom', '', 'sm')}${btn('dbgBoss', 'Boss', '', 'sm')}${btn('dbgCall', 'Courier', 'courier', 'sm')}${btn('dbgCall', 'Boys', 'friends', 'sm')}${btn('dbgGoblin', 'Goblin', '', 'sm')}${btn('dbgCalm', 'Calm +30s', '', 'sm')}</div>
    <div class="row">${btn('dbgEpic', 'Epic', '', 'sm')}${btn('dbgLeg', 'Legend', '', 'sm')}${btn('dbgMap', 'Map', '', 'sm')}${btn('dbgGold', '+1k g', '', 'sm')}</div>
    <div class="row">${btn('dbgMood', 'Mood+20', '', 'sm')}${btn('dbgClock', '+1h', '', 'sm')}${btn('dbgDebt', 'Tired+20', '', 'sm')}${btn('dbgFloor', 'End floor', '', 'sm')}</div><div class="row">${btn('dbgRogue', 'Garrote', '', 'sm')}${btn('dbgHook', 'Hook', '', 'sm')}${btn('dbgShove', 'Shove', '', 'sm')}</div><div class="row">${btn('dbgDog', 'Dog', '', 'sm')}${btn('dbgUnplug', 'Unplug', '', 'sm')}${btn('dbgLap', 'Lap', '', 'sm')}</div>
    <div class="dim">Redesign frame (V1): the mockup's renderer in the build</div>
    <div class="row">${(['dungeon', 'battle', 'map', 'town', 'excel'] as const).map(k => btn('dbgFrame', k === 'excel' ? 'Q4' : k[0].toUpperCase() + k.slice(1), k, 'sm')).join('')}${btn('dbgFrame', 'Off', '', 'sm')}</div>
    <div class="dim">Sounds (${soundStatus().loaded}/${soundStatus().files} loaded${soundStatus().failed ? `, ${soundStatus().failed} failed` : ''}; loops toggle)</div>
    <div class="row sfx-board">${soundCues().map(c => btn('dbgSfx', c, c, 'sm')).join('')}</div>
  </div>`;
}

export function toastsHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  return (n.reveal ? `<div class="reveal"><div class="kicker">APPRAISER</div><b>${esc(n.reveal.name)}</b></div>` : '');
}

/** Tonight (#42): a sticky note on his desk with the three stars, live. What a good night looks like, while you
 *  play it (the results screen used to be the first place that said so). Always on screen, in both RPG and Excel. */

/** Coach mark (#42): a callout next to the thing, while the game crawls. Positioned by main.ts. */
export function coachHtml(): string {
  const c = S.g.night?.coach;
  if (!c) return '';
  const d = COACH[c.id];
  return `<div class="coach ${d.side}" data-coach="${c.id}"><button class="mg-close" data-act="coachClose" title="Got it">\u2715</button>
    <b>${d.title}</b><p>${d.text}</p><small>The game is slowed down until you do it.</small></div><div class="coach-ring"></div>`;
}

import { VERSION } from '../config/version';
import { dayName } from '../systems/week';
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
import { RARITY_COLOR, STAT_LABEL, MAP_INFO, FEATHER } from '../data/items';
import { heroStats, itemPower, heroPower } from '../systems/stats';
import {  abilityUnlocked } from '../systems/battle';
import { entryName, entryColor, cap } from '../systems/loot';
import { icon } from './icons';
import { fmtClock } from '../core/fx';
import { hasSave, savedDay } from '../systems/save';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const btn = (act: string, label: string, arg = '', cls = '') => `<button class="btn ${cls}" data-act="${act}" data-arg="${esc(arg)}">${label}</button>`;




export function preText(s: string): string {
  return s.replace(/\{text\}/g, String(T.PRE_TEXT_SEC)).replace(/\{textCalm\}/g, String(T.PRE_TEXT_CALM)).replace('{textMood}', String(T.PRE_TEXT_MOOD))
    .replace(/\{raidCost\}/g, String(T.GOODWILL_RAID)).replace(/\{raidSec\}/g, String(T.RAID_CALM_SEC))
    .replace(/\{charge\}/g, String(T.CHARGE_SEC)).replace(/\{chargeAdd\}/g, String(T.CHARGE_ADD));
}
function preTip(id: PreId): string {
  const d = PRE_BY_ID[id];
  return `<div class="tt-name" style="color:#ff9ab8">${d.name}</div><div class="tt-sub">Costs ${preText(d.cost)}</div><div>${preText(d.tip)}</div>`;
}

const PHONE_NOTE: Record<string, [string, string]> = {
  mom: ['MOM', 'calling...'], boss: ['BOSS', '"you there?"'], text: ['BABE', 'coming to bed?'], courier: ['COURIER', 'calling...'], friends: ['THE BOYS', 'group call'],
};
void PHONE_NOTE;

// ---------------- UI panel ----------------
export function entryIcon(e: BagEntry, size: number): string {
  if (e.kind === 'item') return icon(e.item.slot, '#f2e9d8', size, !e.item.identified);
  if (e.kind === 'map') return icon('map', MAP_INFO[e.map].color, size);
  return icon('feather', FEATHER.color, size);
}

// ---------------- Tooltip (hover, like an MMO) ----------------
/** What the pointer is over: its tooltip key, where (stage px), and since V11 whose look the tooltip takes (src: desk, her,
 *  eb (a window over the right screen), cud (her cuddle window), rpg (the game screen; ax, ay in its area, area ba or sp)). */
export const hover = { key: '', x: 0, y: 0, src: '', ax: 0, ay: 0, area: '' };

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
      <div class="kicker">PLAYTEST BUILD v${VERSION} · ${(hasSave() ? dayName(savedDay()) : 'Monday').toUpperCase()}</div>
      <h1>Loot Night</h1>
      <p>Raid night. Your guild needs you, the loot is dropping, and your girlfriend thinks you are doing spreadsheets.</p>
      <p class="dim">The RPG plays itself. Your job: listen, hide, and keep her happy, one night at a time, Monday to Sunday.</p>
      <div class="row">${hasSave() ? btn('continue', `Continue · ${dayName(savedDay())}${savedDay() >= 7 ? `, week ${Math.floor(savedDay() / 7) + 1}` : ''}`, '', 'wide gold') + btn('newGame', 'New game', '', 'wide') : btn('newGame', 'Start Monday night', '', 'wide gold')}</div>
      <p class="dim">Turn the sound on: her footsteps are your early warning. <kbd>Esc</kbd> pause.</p>
    </div></div>`;
  }
  if (g.screen === 'results' && g.results) {
    const r = g.results;
    const STAR: [keyof typeof r.goals, string, string][] = [['deep', 'Deep', `floor ${r.goals.target}`], ['unseen', 'Unseen', 'never caught'], ['sweet', 'Sweet', 'she ended happy']];
    const stars = STAR.map(([k, name, why]) => `<span class="star-n ${r.goals[k] ? 'on' : ''}"><span class="star">★</span><b>${name}</b><small>${why}</small></span>`).join('');
    const endTxt = r.ending === 'sleep' ? (r.bedtime ? `${fmtClock(r.endClock)}: bedtime. You log off.` : `Logged off at ${fmtClock(r.endClock)}`) : r.ending === 'dawn' ? 'Dawn. The sun is up and so are you.' : `Unplugged. She pulled the plug. Half the bag is gone. ${dayName(r.day)}, again.`;
    return `<div class="screen"><div class="card">
      <div class="kicker">${dayName(r.day ?? 0).toUpperCase()} · RESULTS</div>
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
  return '';
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
    <div class="row">${[1, 4, 10].map(s => btn('dbgSpeed', `x${s}`, String(s), 'sm')).join('')} · night: ${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => btn('dbgDay', d, String(i), (g.day ?? 0) % 7 === i ? 'sm gold' : 'sm')).join('')}</div>
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


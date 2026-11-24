import { VERSION } from '../config/version';
// HTML renderers for the DOM parts of the screen. Every clickable element carries
// data-act (+ data-arg); main.ts dispatches them on pointerdown.
import { T } from '../config/tuning';
import { soundCues, soundStatus } from './audio';
import { isCall, S, N, type BagEntry, type Item, type Hero, type PhoneGame, type MonsterGame } from '../core/state';
import { ABILITIES, HOTKEYS, HERO_COLORS, heroRole, HOME_RANKS, AURAS, HERO_NAME, ULT_SLOT } from '../data/heroes';
import { autocastBought, autocastOn } from '../systems/tree';
import { rankOf, outOfRank, aurasOn } from '../systems/ranks';
import { LEGEND_BY_ID, SET_BY_ID } from '../data/legendaries';
import { legendOn, setPieces } from '../systems/gear';
import { pacingLine } from '../systems/pacing';
import { liveMs } from '../render/liveRpg';
import { markText } from '../data/marks';
import { specialText, hasLife } from '../systems/affixes';
import { END_HINT, COACH } from '../data/tips';
import { cityOutlook } from '../systems/town';
import { PRE_ACTIONS, PRE_BY_ID, type PreId } from '../data/preemptive';
import { preBlocked, nextMult } from '../systems/preemptive';
import { phoneAction } from '../systems/interrupts';
import { planSvg } from './plan';
import { RARITY_COLOR, STAT_LABEL, MAP_INFO, FEATHER } from '../data/items';
import { MOM_REPLIES } from '../data/content';
import { SW, SH } from './monsterScene';
import { isAway } from '../systems/autopilot';
import { cuddleDot, CUDDLE_W, CUDDLE_H } from '../systems/cuddle';
import { CHAT_QS, VISIT_CUE } from '../data/content';
import { heroStats, maxHp, itemPower, heroPower } from '../systems/stats';
import {  abilityUnlocked } from '../systems/battle';
import { entryName, entryColor, cap } from '../systems/loot';
import { icon } from './icons';
import { moodZone } from '../systems/meters';
import { fmtClock, parseTag } from '../core/fx';
import type { MorningScene } from './her';
import { hasSave } from '../systems/save';
import { canSleep } from '../systems/night';
import {  ROOM_NAME } from '../data/apartment';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const btn = (act: string, label: string, arg = '', cls = '') => `<button class="btn ${cls}" data-act="${act}" data-arg="${esc(arg)}">${label}</button>`;

// ---------------- Girlfriend panel (her world: warm, handwritten, hearts) ----------------
export function herHeadHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const zone = moodZone(n.mood);
  const word = n.apt.asleep ? 'asleep' : zone === 'green' ? 'happy' : zone === 'yellow' ? 'a bit annoyed' : 'furious';
  return `<span class="her-name">&#9829; Babe</span><span class="her-mood m-${zone}">${word}</span>`;
}

function hearts(patience: number): string {
  const full = Math.ceil(patience / 20);
  return Array.from({ length: 5 }, (_, i) => `<span class="heart ${i < full ? 'on' : ''}">&#9829;</span>`).join('');
}

export function doorInfoHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const v = n.visit;
  let kicker = 'her', txt = n.headset ? 'In the zone. She could be anywhere.' : 'She is busy with her own thing.', cls = 'calm';
  if (v.stage === 'idle' && n.apt.asleep) { kicker = 'bedroom'; txt = 'She is asleep. Shh, keep it quiet.'; }
  if (v.stage === 'idle' && S.g.nightsPlayed === 0 && n.apt.cued && !n.headset && END_HINT[n.apt.activity]) { kicker = 'listen'; txt = END_HINT[n.apt.activity]; cls = 'warn'; }   // first night: name the tell
  if (v.stage === 'far' && !n.headset) { kicker = 'footsteps'; txt = 'Footsteps... is she coming?'; cls = 'warn'; }
  if (v.stage === 'hall') { kicker = 'at the door'; txt = S.g.nightsPlayed === 0 ? VISIT_CUE[v.kind] : 'Her shadow is at the door.'; cls = 'alarm'; }
  if (v.stage === 'handle') { kicker = 'door'; txt = 'The handle is turning!'; cls = 'alarm'; }
  if (v.stage === 'passing') { kicker = 'footsteps'; txt = 'She walked past. Phew.'; cls = 'warn'; }
  if (v.stage === 'in') { kicker = 'she is in'; txt = v.result === 'caught' ? 'Caught.' : v.result === 'look' ? '"Nothing. Just looking at you."' : v.checked ? 'She bought it.' : '"Still working, babe?"'; cls = v.result === 'caught' ? 'alarm' : 'warn';
    const btn = (act: string, arg: string | number, label: string, extra = '') => `<button class="her-btn ${extra}" data-act="${act}" data-arg="${arg}">${label}</button>`;
    if (v.result === 'offer') { kicker = 'snack'; txt = `"I made you a sandwich."<div class="her-btns">${btn('takePlate', 0, 'Take the plate', 'big')}</div>`; cls = 'warn'; }
    if (v.result === 'snackFail') { kicker = 'snack'; txt = '"Another one?!" She takes a can.'; cls = 'alarm'; }
    if (v.result === 'snackOk') { kicker = 'snack'; txt = 'Sandwich. She ruffles your hair.'; cls = 'calm'; }
    if (v.result === 'deaf') { kicker = 'chat'; txt = '"Are you even listening?" (headset)'; cls = 'alarm'; }
    if (v.result === 'chat' && v.chat) {
      const q = CHAT_QS[v.chat.order[v.chat.asked]];
      const shuffle = [0, 1, 2].sort((a, b) => ((v.chat!.order[0] * 7 + a * 5 + v.chat!.asked) % 3) - ((v.chat!.order[0] * 7 + b * 5 + v.chat!.asked) % 3));
      kicker = `chat ${v.chat.asked + 1}/${T.CHAT_QUESTIONS} · keep Excel up`; cls = 'warn';
      txt = `${v.chat.line}<div class="her-btns">${shuffle.map(k => btn('chatAnswer', k, q.a[k])).join('')}</div>`;
    }
    if (v.result === 'chatGood') { kicker = 'chat'; txt = '"Okay, back to your spreadsheets, cutie."'; cls = 'calm'; }
    if (v.result === 'chatBad') { kicker = 'chat'; txt = '"Wow. Okay."'; cls = 'alarm'; }
    if (v.result === 'chatMeh') { kicker = 'chat'; txt = '"Mhm. Talk later."'; }
    if (v.result === 'ask') { kicker = 'cuddle'; txt = `"Come cuddle for a bit?"<div class="her-btns">${btn('cuddle', 1, 'Come here', 'big')}${btn('cuddle', 0, 'One sec, babe')}</div>`; cls = 'warn'; }
    if (v.result === 'cuddling') { kicker = 'cuddle'; txt = 'Warm. The party fights on without you.'; cls = 'calm'; }
    if (v.result === 'cuddleGood') { kicker = 'cuddle'; txt = '"Okay, go play. Love you."'; cls = 'calm'; }
    if (v.result === 'cuddleMeh') { kicker = 'cuddle'; txt = '"You are so restless."'; }
    if (v.result === 'refused') { kicker = 'cuddle'; txt = 'She sighs and leaves.'; cls = 'alarm'; }
    if (v.result === 'night') { kicker = 'good night'; txt = '"Night, babe." Your hoodie, sleeves past her hands.'; cls = 'calm'; }
    if (v.result === 'forgiven') { kicker = 'forgiven'; txt = '"I know, I know. Raid night." She lets it go.'; cls = 'warn'; }
  }
  const patience = 100 - n.mood;
  const tired = n.tired;
  const caught = [0, 1, 2].map(i => `<span class="bheart ${i < n.catches ? 'on' : ''}">&#9829;</span>`).join('');
  const tiredFx = [tired >= T.TIRED_YAWN && 'yawning', tired >= T.TIRED_MICROSLEEP && (n.boost > 0 ? 'Goblin Fuel holds you up' : 'eyes closing'), tired >= T.TIRED_SLUGGISH && 'sluggish'].filter(Boolean).join(' · ');
  const wakeRow = n.clock >= T.BED_FROM
    ? `<div class="her-row"><span>Waking up</span><div class="pill"><i style="width:${n.apt.asleep ? n.apt.wake : 100}%;background:#b58bd9"></i><em style="left:${T.WAKE_TEXT}%"></em></div><b>${n.apt.asleep ? Math.round(n.apt.wake) : 'awake'}</b></div>` : '';
  void tiredFx; void tired;
  // Fixed slots (#46): the last-heard line, her note, the pre-emptive row and the stats never move. A slot that has
  // nothing to show keeps its space; a tall note (a chat question with replies) grows into the empty pre-row slot.
  const idle = v.stage === 'idle';
  return `<div class="di-heard">${heardHtml()}</div>
  <div class="di-note ${idle ? '' : 'wide'}"><div class="her-note ${cls}"><small>${kicker}</small><div>${txt}</div></div></div>
  <div class="di-pre">${idle ? preRowHtml() : ''}</div>
  <div class="her-stats">
    <div class="her-row pc" title="Patience ${Math.round(patience)} · caught ${n.catches}/3"><span>Patience</span><div class="hearts">${hearts(patience)}</div><span class="sm">Caught</span><div class="bhearts">${caught}</div></div>
    <div class="her-row gw" title="Goodwill: earned with her. ${T.GOODWILL_RAID} buys a Raid night, ${T.GOODWILL_FORGIVE} forgives a catch."><span>Goodwill</span><div class="gwbar"><i style="width:${S.g.goodwill}%"></i><em style="left:${T.GOODWILL_RAID}%"></em><em style="left:${T.GOODWILL_FORGIVE}%"></em></div><b>${Math.floor(S.g.goodwill)}</b></div>
    <div class="her-row nz" title="Your Noise.${n.apt.asleep ? ` Above ${T.WAKE_NOISE_FLOOR} it wakes her.` : ' How much reaches her depends on where she is.'}"><span>Noise</span><div class="pill nzbar"><i style="width:${Math.round(n.noise)}%"></i>${n.apt.asleep ? `<em style="left:${T.WAKE_NOISE_FLOOR}%"></em>` : ''}</div><b>${Math.round(n.noise)}</b></div>
    ${wakeRow}
  </div>`;
}

// ---------------- Pre-emptive actions (#19) ----------------
/** Button text: cost, and how strong the next use is (2nd = half, 3rd = she gets suspicious). */
function preUseNote(id: PreId): string {
  const used = N().preUses[id] ?? 0;
  if (PRE_BY_ID[id].toggle || PRE_BY_ID[id].goodwill || !used) return '';
  const m = nextMult(id);
  return m === 0 ? '<em class="sus">suspicious next</em>' : '<em>next: half</em>';
}
function preBtn(id: PreId, cls = ''): string {
  const d = PRE_BY_ID[id], why = preBlocked(id);
  const name = id === 'towel' ? (N().towel ? 'Towel out' : 'Towel under door') : d.name;
  return `<button class="pre-btn ${cls} ${why ? 'off' : ''}" data-act="pre" data-arg="${id}" data-tip="pre:${id}"><b>${name}</b><span>${why || preText(d.cost)}</span>${preUseNote(id)}</button>`;
}
function preRowHtml(): string {
  const n = N();
  void n;
  return `<div class="pre-row"><div class="pre-btns">${PRE_ACTIONS.filter(a => a.where === 'door').map(a => preBtn(a.id)).join('')}</div></div>`;
}
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

/** The last sound you heard of her: what, where, how long ago. Never where she is now (docs/design/her.md). */
export function heardHtml(): string {
  const n = N();
  const a = n.apt;
  if (n.visit.stage === 'in') return '';   // she is in the doorway: you see her, the last sound does not matter
  const ago = n.threat - a.heardAt;
  const earplugs = n.headset && a.heardWhat === 'STEPS' && ago < 3 && hasLife('earplugs');
  if (n.headset && !earplugs) return '<div class="heard muffled">Headset on. You hear nothing. (H)</div>';
  const when = a.heardWhat === 'ZZZ' ? '' : ` · ${ago < 1.5 ? 'now' : `${Math.floor(ago)} s ago`}`;
  if (!a.heard) return '<div class="heard stale"><b>?</b> Nothing yet. Listen.</div>';
  const what = `${esc(a.heardWhat)} · ${ROOM_NAME[a.heard].toLowerCase()}${when}`;
  return ago > T.APT_STALE_SEC && a.heardWhat !== 'ZZZ'
    ? `<div class="heard stale"><b>?</b> ${what}</div>`
    : `<div class="heard"><i>&#9835;</i> ${what}</div>`;
}

export function planHtml(): string {
  return `<div class="plan-back"><div class="plan-sheet"><button class="mg-close" title="Back (Esc)">\u2715</button>
    <div class="plan-title">The plan <small>who hears you, what the crack shows</small></div>
    ${planSvg(340)}
    <div class="plan-foot">Your room is at the end of the hallway. Next to it: the kitchen and the living room (through the
    walls) and the hallway. She hears you best there. The bathroom is further down, the bedroom at the far end.
    Through the crack: 1 the kitchen, 2 the bathroom door, 3 the far end only when the door is wide.</div></div></div>`;
}

/** The feed card (#49): newest line on top, older ones fading; a tag says whose line it is. No header, no tabs. */
const TAG_COLOR: Record<string, string> = { YOU: '#a08cff', HER: '#ff9ab8', PHONE: '#6aa8ff', GAME: '#f2c46b', DOG: '#e48f3e', EXCEL: '#4fbf7a',
  NIGHT: '#c77dff', PARTY: '#8fd0ff', GUILD: '#6fe08a', MAGOO: '#b59bff', HEALERO: '#6fcfa0', KNIGHTENSTEIN: '#8fb3ff' };
export function feedHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const line = (time: string, tag: string, text: string, color: string, i: number, cls = '') =>
    `<div class="fl ${cls}" style="opacity:${Math.max(0.35, 1 - i * 0.13).toFixed(2)}"><i>${time}</i>${tag ? `<b style="color:${tag === 'LOOT' ? color : TAG_COLOR[tag] ?? '#c9c0d8'}">${esc(tag)}</b>` : ''}<span style="color:${color}">${esc(text)}</span></div>`;
  const pin = n.tip ? parseTag(n.tip.text) : null;
  const rows = n.log.filter(l => !pin || l.text !== pin.text).slice(-6).reverse();
  const out = (pin ? [line(fmtClock(n.clock), pin.tag.toUpperCase(), pin.text, n.tip!.color, 0, 'tip')] : [])
    .concat(rows.map((l, i) => line(l.time, l.tag ?? '', l.text, l.color, i + (pin ? 1 : 0))));
  return out.slice(0, 6).join('') || '<div class="fl dim">Welcome to Loot Night. Have fun, don\'t get caught.</div>';
}

// ---------------- Desk objects ----------------
function ring(t: number, max: number) {
  // Quantized to whole seconds so the desk DOM only re-renders once a second.
  const deg = Math.max(0, Math.min(360, (Math.ceil(t) / Math.ceil(max)) * 360));
  return `<div class="ring" style="background:conic-gradient(#f2b84b ${deg}deg,#3a2f47 0)"><span>${Math.ceil(t)}</span></div>`;
}
const PHONE_NOTE: Record<string, [string, string]> = {
  mom: ['MOM', 'calling...'], boss: ['BOSS', '"you there?"'], text: ['BABE', 'coming to bed?'], courier: ['COURIER', 'calling...'], friends: ['THE BOYS', 'group call'],
};
void PHONE_NOTE;
/** Who is calling: name and the line under it on the incoming-call screen. */
const CALLER: Record<string, [string, string]> = { mom: ['Mom', 'mobile'], courier: ['Courier', '+48 22 555 0199'], friends: ['The Boys (3)', 'group call'] };
// The desk phone: a 3D card you grab and swipe sideways to flip. iOS look: the screen is off until something
// arrives; messages wake it with stacked lock-screen banners (one per buzz), a call shows the incoming-call screen.
const APP: Record<string, [string, string, string]> = { boss: ['Work', 'Boss', '#2f6fed'], text: ['Messages', 'Babe \u2665', '#34c759'] };
function phoneObjHtml(): string {
  const n = N();
  const it = n.interrupts[0];
  const inPhone = n.game?.kind === 'phone' || n.preMenu === 'phone' || phoneAction();   // in your hand (#63)
  const down = n.phoneDown > 0;
  let screen = '<div class="ios off"></div>';
  // picked up: the phone leaves the desk until the minigame ends or its window is closed
  if (inPhone) return '';   // picked up: it is in your hand (the window over the monitor)
  else if (it && isCall(it.kind)) {
    // same incoming-call screen as in your hand: tap red to decline at once, tap anywhere else to pick up
    screen = `<div class="ios call"><div class="ios-di"></div><div class="ios-cname">${CALLER[it.kind][0]}</div><div class="ios-csub">${CALLER[it.kind][1]}</div>
      <div class="ios-mrow"><span>\u23F0<br>Remind</span><span>\u2709<br>Message</span></div>
      <div class="ios-mslide"><i>&#9742;</i><span>slide to answer</span></div>
      <div class="ios-cbtn red" data-decline="1"><span>&#9742;</span></div><div class="ios-clab">Decline</div></div>`;
  } else if (it && it.msgs.length) {
    const [app, who, col] = APP[it.kind];
    const banners = it.msgs.slice(-3).reverse().map((m, i) => `<div class="ios-ban ${i === 0 && it.max - it.t - it.pingAt < 0.4 ? 'new' : ''}"><i style="background:${col}"></i><div><b>${who}</b><small>${app}</small><span>${esc(m)}</span></div></div>`).join('');
    screen = `<div class="ios lock"><div class="ios-di"></div><div class="ios-time">${fmtClock(n.clock)}</div>${banners}${it.msgs.length > 3 ? `<div class="ios-more">+${it.msgs.length - 3} more</div>` : ''}</div>`;
  } else if (it) screen = '<div class="ios off"></div>';
  else if (n.herReply && n.herReply.wait <= 0) screen = `<div class="ios lock"><div class="ios-di"></div><div class="ios-time">${fmtClock(n.clock)}</div><div class="ios-ban new"><i style="background:#34c759"></i><div><b>Babe \u2665</b><small>Messages</small><span>${esc(n.herReply.msg)}</span></div></div></div>`;
  return `<div class="phone-zoom"><div class="phone-wrap"><i class="ph-glow"></i>
    <div class="phone3d ${down ? 'down' : ''} ${it ? 'active' : ''}" data-phone="1">
      <div class="pface front">${screen}</div>
      <div class="pface back"><i class="cam"></i><i class="logo"></i></div>
    </div>${it && !down ? ring(it.t, it.max) : ''}</div></div>`;
}
export function deskHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  // No headset, cans or fridge on the desk (#49): he wears the headset (click his head, or H), and Monster is the
  // button on the YOU card (M). The desk keeps the phone; the Zone lights the monitor's edge in the headset's cyan.
  const z = Math.round(n.zone * 20) / 20;
  return `${n.headset ? `<div class="zone-glow ${n.zone >= 1 ? 'full' : ''}" style="--z:${z}"></div>` : ''}
  ${phoneObjHtml()}
`;
}

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

// ---------------- Mini-game windows (phone and Monster) ----------------
function statusBar(): string {
  const n = N();
  return `<div class="ph-status"><span>${fmtClock(n.clock)}</span><i class="ph-di"></i><span>\u25CF\u25CF\u25CF 5G \u25AE 41%</span></div>`;
}
/** The phone in your hand (iOS look). Every stage can be left: "Put down" on the lock / call screens,
 *  the back chevron in chats, or the home bar at the bottom. Leaving counts as ignoring it. */
function phoneHtml(g: PhoneGame): string {
  let body = '';
  const quit = (label: string) => `<button class="ios-quit" data-act="closeGame">${label}</button>`;
  if (g.stage === 'ringing') {
    body = `<div class="ios-incoming"><div class="ios-cname big">${CALLER[g.app][0]}</div><div class="ios-csub">${CALLER[g.app][1]}</div></div>
      <div class="ios-row2"><div class="ios-mini"><span>\u23F0</span>Remind Me</div><div class="ios-mini"><span>\u2709</span>Message</div></div>
      <div class="ph-slide"><div id="dragEl" class="ph-knob" data-drag="answer" data-axis="x" data-dir="1" data-dist="${T.SLIDE_DIST}">&#9742;</div><span>slide to answer</span></div>
      <button class="ios-endbtn" data-act="closeGame"><span>&#9742;</span></button><div class="ios-sub2">Decline</div>`;
  } else if (g.stage === 'locked') {
    const [app, who, col] = APP[g.app];
    body = `<div class="ph-lock-date">${['Monday', 'Tuesday'][0]}</div><div class="ph-lock-time">${fmtClock(N().clock)}</div>
      <div class="ph-bans">${g.msgs.slice(-2).reverse().map(m => `<div class="ios-ban big"><i style="background:${col}"></i><div><b>${who}</b><small>${app} · now</small><span>${esc(m)}</span></div></div>`).join('')}
</div>${g.msgs.length > 2 ? `<div class="ios-more">+${g.msgs.length - 2} more from ${who}</div>` : ''}
      <div class="ph-face" data-hold="unlock"><div class="ph-face-ring"><div id="holdFill"></div></div><span class="faceid">\u{1F642}</span></div>
      <div class="ph-hint">Face ID: hold to unlock</div>
      ${quit('Put down')}`;
  } else if (g.stage === 'talk') {
    const st = g.app === 'friends' ? `misses ${g.misses}/${T.FRIENDS_MAX_MISSES}${N().headset ? ' \u00B7 headset' : ' \u00B7 ON SPEAKER'}` : 'one wrong word: he leaves';
    body = `<div class="ios-incall"><b>${CALLER[g.app][0]}</b><span>${st}</span></div>
      <div class="ph-bubble in">${esc(g.line)}</div>
      <div class="timebar"><div id="phBar" style="width:${Math.max(0, g.t / g.max) * 100}%"></div></div>
      <div class="ph-hint">${g.app === 'courier' ? 'Get it left with a neighbour.' : 'Say no, nicely. Quickly.'}</div>
      <div class="ph-chips ios-replies talk">${(g.opts ?? []).map((o, i) => btn('talk', esc(o), String(i), 'chip')).join('')}</div>
      <div class="feedback">${esc(g.feedback)}</div>`;   // leave with the X or the home bar (hanging up = failing)
  } else if (g.stage === 'call') {
    const reading = g.read > 0;
    const mark = ['...', '?', '!'][g.need];
    body = `<div class="ios-incall"><b>Mom</b><span>beat ${g.beat + 1}/${T.MOM_BEATS} \u00B7 misses ${g.misses}/${T.MOM_MAX_MISSES}</span></div>
      <div class="ph-bubble in mom-line">${esc(g.line)}<span class="mark m${g.need}">${mark}</span></div>
      <div class="track ${reading ? 'reading' : ''}"><div class="zone" style="left:${g.zone * 100}%;width:${T.MOM_ZONE * 100}%"></div><div id="momMarker" class="marker"></div></div>
      <div class="ph-chips mom-replies">${MOM_REPLIES.map((r, i) => btn('mom', `<small>${['...', '?', '!'][i]}</small> ${r}`, String(i), `chip c${i}`)).join('')}</div>
      <div class="feedback">${esc(g.feedback)}</div>
      <button class="ios-endbtn small" data-act="closeGame"><span>&#9742;</span></button>`;
  } else {
    const [, who, col] = APP[g.app];
    const history = g.msgs.map(m => `<div class="ph-bubble in">${esc(m)}</div>`).join('');
    let reply = '', ask = '';
    if (g.app === 'boss') {
      const r = g.rows[Math.min(g.row, g.rows.length - 1)];
      ask = `<div class="ph-bubble in">row ${g.row + 1}/${g.rows.length}: <b>${r.a} + ${r.b}</b> = ?</div>`;
      reply = r.options.map((o, i) => btn('boss', `<small>${i + 1}</small> ${o}`, String(o), 'chip')).join('');
    } else reply = btn('textReply', 'Five more minutes, love \u2665', '', 'chip');
    body = `<div class="ios-nav"><button class="ios-back" data-act="closeGame">\u2039</button><div class="ios-who"><i style="background:${col}">${who[0]}</i><b>${who}</b></div><span id="phTime">${Math.ceil(g.t)} s</span></div>
      <div class="ios-thread">${history}${ask}</div>
      <div class="timebar"><div id="phBar"></div></div>
      <div class="feedback">${esc(g.feedback)}</div>
      <div class="ph-chips ios-replies">${reply}</div>`;
  }
  const timer = g.stage === 'ringing' || g.stage === 'locked' ? `<div class="ph-ring">${Math.ceil(g.t)} s</div>` : '';
  return `<div class="phone-win">${statusBar()}<div class="ph-screen ${g.stage}">${body}</div>${timer}<button class="ph-home" data-act="closeGame" title="Swipe home: put the phone down"></button></div>`;
}


const M_STEPS: [MonsterGame['stage'], string, string][] = [
  ['drawer', 'Drawer', 'Grab the drawer handle and pull.'],
  ['grab', 'Grab', 'Drag a can to its spot on the desk.'],
  ['open', 'Open', 'Pull the tab up.'],
  ['drink', 'Drink', 'Click the can: it follows your mouse. Hold Space to tilt it, let go to tilt back. 85% for the full boost.'],
  ['toss', 'Toss', 'One throw. A miss stays on the floor.'],
];

function monsterHtml(g: MonsterGame): string {
  const si = M_STEPS.findIndex(s => s[0] === g.stage);
  const steps = M_STEPS.map((s, i) => `<span class="${i < si ? 'done' : i === si ? 'now' : ''}"><b>${i + 1}</b>${s[1]}</span>`).join('');
  const scene = `<canvas id="mcv" width="${SW}" height="${SH}"></canvas>`;
  return `<div class="monster-win">
    <div class="m-head"><span class="m-title">Energy break</span><span class="m-sub">Hands busy: abilities paused</span>${btn('cancelMonster', '×', '', 'x')}</div>
    <div class="m-steps">${steps}</div>
    <div class="m-instr">${M_STEPS[si][2]}${g.feedback ? `<em>${esc(g.feedback)}</em>` : ''}</div>
    <div class="m-scene">${scene}</div>
  </div>`;
}

/** The idle phone, picked up (#63): Messages. Its chats are the phone's own actions (Text her, Raid night?). */
function messagesHtml(): string {
  const rows = PRE_ACTIONS.filter(a => a.where === 'phone').map(a => {
    const why = preBlocked(a.id);
    const [who, col] = a.id === 'text' ? ['Babe \u2665', '#34c759'] : ['The Boys (3)', '#5856d6'];
    return `<button class="ios-chatrow ${why ? 'off' : ''}" data-act="pre" data-arg="${a.id}" data-tip="pre:${a.id}"><i style="background:${col}">${who[0]}</i>
      <span><b>${who}</b><em>${a.name}</em><small>${why || preText(a.cost)}</small>${preUseNote(a.id)}</span><u>\u203A</u></button>`;
  }).join('');
  return `<div class="ios-nav"><button class="ios-back" data-act="preMenu">\u2039</button><div class="ios-who"><b class="big">Messages</b></div><span></span></div>
    <div class="ios-chatlist">${rows}</div>`;
}
/** Sending: the message types itself into the chat, then shows Delivered (#63). Hands are busy meanwhile. */
const PHONE_SEND: Record<string, [string, string, string]> = { text: ['Babe \u2665', '#34c759', 'what are you up to? \u2665'], raid: ['The Boys (3)', '#5856d6', 'raid night? need a carry'] };
function phoneSendHtml(): string {
  const p = N().pre!;
  const [who, col, msg] = PHONE_SEND[p.id] ?? PHONE_SEND.text;
  const k = 1 - p.t / p.max, typed = Math.min(1, k * 1.3);
  const bubble = typed < 1 ? `<div class="ph-bubble out">${esc(msg.slice(0, Math.max(1, Math.ceil(msg.length * typed))))}<i class="caret"></i></div>`
    : `<div class="ph-bubble out">${esc(msg)}</div><div class="ios-delivered">Delivered</div>`;
  return `<div class="ios-nav"><button class="ios-back" data-act="preCancel">\u2039</button><div class="ios-who"><i style="background:${col}">${who[0]}</i><b>${who}</b></div><span id="phTime">${Math.ceil(p.t)} s</span></div>
    <div class="ios-thread">${bubble}</div>
    <div class="timebar"><div style="width:${Math.round(k * 100)}%"></div></div>
    <div class="ph-hint">Hands busy: typing.</div>`;
}
const phoneShell = (inner: string, close: string) => `<div class="phone-win">${statusBar()}<div class="ph-screen chat">${inner}</div><button class="ph-home" data-act="${close}" title="Swipe home: put the phone down"></button></div>
  <button class="mg-close" data-act="${close}" title="Put the phone down" style="left:415px;top:22px">\u2715</button>`;

export function windowHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  if (!n.game) {   // the phone in your hand without a call: sending a message, or Messages
    if (phoneAction()) return phoneShell(phoneSendHtml(), 'preCancel');
    if (n.preMenu === 'phone') return phoneShell(messagesHtml(), 'preMenu');
    return '';
  }
  // grey circle with a red X just outside the top-right corner: always a way out
  // windows sit over the battle area (#49), each with the close button just outside its top-right corner
  if (n.game.kind === 'cuddle') return cuddleHtml() + '<button class="mg-close" data-act="cuddleQuit" title="Back to the game (she will not like it)" style="left:532px;top:66px">\u2715</button>';
  const close = n.game.kind === 'phone'
    ? '<button class="mg-close" data-act="closeGame" title="Put the phone down" style="left:415px;top:22px">\u2715</button>'
    : '<button class="mg-close" data-act="cancelMonster" title="Stop" style="left:622px;top:0px">\u2715</button>';
  return (n.game.kind === 'phone' ? phoneHtml(n.game) : monsterHtml(n.game)) + close;
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
  const d = document.getElementById('dragEl');
  if (d && g.kind === 'phone') {
    const dist = Number(d.dataset.dist || 0), dir = Number(d.dataset.dir || 1);
    if (d.dataset.drag === 'door') (d.parentElement as HTMLElement).style.transform = `perspective(500px) rotateY(${g.drag * 75}deg)`;
    else d.style.transform = d.dataset.axis === 'x' ? `translateX(${g.drag * dist * dir}px)` : `translateY(${g.drag * dist * dir}px)`;
  }
  const f = document.getElementById('holdFill');
  if (f && g.kind === 'phone') f.style.height = `${g.unlock * 100}%`;
  if (g.kind === 'phone') {
    const m = document.getElementById('momMarker');
    if (m) m.style.left = `${Math.min(100, g.sweep * 100)}%`;
    const b = document.getElementById('phBar');
    if (b && g.max > 0) b.style.width = `${(g.t / g.max) * 100}%`;
    const t = document.getElementById('phTime');
    if (t) t.textContent = `${Math.ceil(g.t)} s`;
  }
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

/** Real life, bottom right of the desk (#49): Tired and Zone, and the Monster button (key M). */
export function youHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const g = S.g;
  const coming = n.visit.stage !== 'idle' && n.visit.stage !== 'passing' && n.visit.stage !== 'in';
  const hide = coming && g.monsters > 0 && !n.cansHidden;
  const canDrink = g.monsters > 0 && !n.game && !n.pre;
  const tired = n.tired >= T.TIRED_YAWN && canDrink && n.boost <= 0 && !hide;   // time to top up: the button glows
  let label = `\u00d7${g.monsters}`, sub = 'Drink · M', cls = '', act = 'openMonster';
  if (hide) { label = 'Hide'; sub = 'the cans · M'; cls = 'hide'; act = 'hideCans'; }
  else if (n.cansHidden && n.visit.stage !== 'idle') { label = 'Hidden'; sub = 'under the desk'; cls = 'off'; act = ''; }
  else if (!canDrink) cls = 'off';
  if (tired) cls += ' tired';
  const row = (name: string, cls2: string, v: number, mark?: number) =>
    `<div class="yc-row ${cls2}"><span>${name}</span><i class="yc-bar"><i style="width:${Math.round(Math.max(0, Math.min(100, v)))}%"></i>${mark !== undefined ? `<em style="left:${mark}%"></em>` : ''}</i><b>${Math.round(v)}</b></div>`;
  return `<div class="yc-rows">${row('Tired', 'yc-tired', n.tired, T.TIRED_YAWN)}${row('Zone', 'yc-zone', n.headset ? n.zone * 100 : 0)}</div>
    <button class="yc-can ${cls}" ${act ? `data-act="${act}"` : ''} aria-label="Goblin Fuel: drink one (M), or hide the cans while she is coming">
      <svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true"><rect x="2" y="2" width="12" height="19" rx="2.5" fill="#4f9a26" stroke="#9aa0ac"/><rect x="3.5" y=".8" width="9" height="2.2" rx="1" fill="#c9ced6"/><path d="M3.2 8 L6.6 9.8 L6 12.2 Z M12.8 8 L9.4 9.8 L10 12.2 Z" fill="#1a1424"/><circle cx="8" cy="11" r="2.8" fill="#1a1424"/><rect x="6.3" y="10.1" width="1.3" height="1" fill="#ffd23a"/><rect x="8.4" y="10.1" width="1.3" height="1" fill="#ffd23a"/></svg>
      <span><b>${label}</b><small>${sub}</small></span></button>`;
}

// ---------------- OS taskbar (real life) ----------------
export function taskbarHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const late = n.clock >= T.BEDTIME;
  // Windows-style attention flash: the game wants you back (party in trouble while you are away).
  const hp = S.g.heroes.reduce((a, h) => a + (h.downed ? 0 : h.hp), 0) / S.g.heroes.reduce((a, h) => a + maxHp(h), 0);
  const flash = n.monitor !== 'rpg' && isAway() && (S.g.heroes.some(h => h.downed) || hp < T.AUTOPILOT_FLASH_HP);
  return `<div class="tb-start">⊞</div>
    <button class="tb-app ${n.monitor === 'rpg' ? 'on' : ''} ${flash ? 'flash' : ''}" data-act="showRpg"><span class="tb-ico game">⚔</span>Loot Night</button>
    <button class="tb-app ${n.monitor === 'excel' ? 'on' : ''}" data-act="showExcel"><span class="tb-ico xl">X</span>Excel</button>
    <span class="tb-hint">Tab = switch</span>
    <span class="tb-tray">
      <span class="tb-wallet">${S.g.zl} zł</span>
      <span class="tb-clock ${late ? 'late witching' : ''}" title="${late ? 'Witching Hour: better drops, more sleep debt.' : ''}"><b>${fmtClock(n.clock)}</b>${late ? '<small>witching hour</small>' : ''}</span>
      <button class="tb-power ${canSleep() ? '' : 'off'}" data-act="sleep" title="Log off and sleep">⏻ ${n.clock < T.EARLIEST_SLEEP ? 'Sleep (23:00+)' : 'Sleep'}</button>
    </span>`;
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
    const stars = [0, 1, 2].map(i => `<span class="star ${i < r.stars ? 'on' : ''}">★</span>`).join('');
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
      <div class="stars-key dim">★ survive · ★★ end in green or yellow Mood · ★★★ never caught</div>
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
    ${n ? `<div class="dim">threat ${n.threat.toFixed(1)}s · visit ${n.visit.stage} ${n.visit.t.toFixed(1)} · next int ${(n.nextInterruptAt - n.threat).toFixed(1)}s · phase ${n.phase}</div>` : ''}
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

export function scareHtml(): string {
  const n = S.g.night;
  if (!n || n.scare <= 0) return '';
  // Comedic jumpscare when caught: a big generic pixel face.
  const px: [number, number, number, number, string][] = [[3,0,10,3,'#2a1810'],[2,2,12,2,'#2a1810'],[3,4,10,9,'#e8b98a'],[2,3,2,8,'#2a1810'],[12,3,2,8,'#2a1810'],[5,6,2,2,'#14101a'],[9,6,2,2,'#14101a'],[4,5,4,1,'#2a1810'],[8,5,4,1,'#2a1810'],[6,10,4,2,'#7a1f2b'],[4,13,8,3,'#5b3aa8']];
  const rects = px.map(([x, y, w, h, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('');
  return `<div class="scare"><svg viewBox="0 0 16 16" width="420" height="420" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg><div>WE NEED TO TALK.</div></div>`;
}

export function toastsHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  return (n.reveal ? `<div class="reveal"><div class="kicker">APPRAISER</div><b>${esc(n.reveal.name)}</b></div>` : '');
}

/** Tonight (#42): a sticky note on his desk with the three stars, live. What a good night looks like, while you
 *  play it (the results screen used to be the first place that said so). Always on screen, in both RPG and Excel. */
export function tonightHtml(): string {
  const n = S.g.night;
  if (!n) return '';
  const zone = moodZone(n.mood);
  const mark = (s: 'ok' | 'risk' | 'lost') => `<b class="${s}">${s === 'ok' ? '✓' : s === 'risk' ? '!' : '✗'}</b>`;
  return `<div class="sticky" title="Your stars, counted when you log off.">
    <div class="st-h">Tonight <small>⏻ ${n.clock >= T.EARLIEST_SLEEP ? 'sleep any time' : '23:00+'}</small></div>
    <div>★ plug stays in ${mark(zone === 'red' ? 'risk' : 'ok')}</div>
    <div>★★ she's happy ${mark(zone === 'red' ? 'risk' : 'ok')}</div>
    <div>★★★ not caught ${mark(n.everCaught ? 'lost' : 'ok')}</div>
    <div class="st-f">deeper = better loot</div></div>`;
}

/** Coach mark (#42): a callout next to the thing, while the game crawls. Positioned by main.ts. */
export function coachHtml(): string {
  const c = S.g.night?.coach;
  if (!c) return '';
  const d = COACH[c.id];
  return `<div class="coach ${d.side}" data-coach="${c.id}"><button class="mg-close" data-act="coachClose" title="Got it">\u2715</button>
    <b>${d.title}</b><p>${d.text}</p><small>The game is slowed down until you do it.</small></div><div class="coach-ring"></div>`;
}

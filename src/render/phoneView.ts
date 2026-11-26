// The phone in your hand (V8, #73; grid doc 7f) as a view model for the renderer's live phone (phone.js, LIVE).
import { photoLeft } from '../systems/selfies';
import { on, dayName } from '../systems/week';
import { battOn, battery, phoneDead, battCost, deviceState, deviceBlocked, teaDue } from '../systems/home';
import { DEVICES, DEVICE_BY_ID, HOME_ROOMS, type DeviceId } from '../data/home';
import { owns } from '../systems/shop';
// The rules stay in systems/interrupts.ts, preemptive.ts and messages.ts; this only reads them.
import { SHOP_ITEMS } from '../data/shop';
import { shopState } from '../systems/shop';
import { T } from '../config/tuning';
import { S, N, type ChatLine, type PhoneGame } from '../core/state';
import { fmtClock } from '../core/fx';
import { phoneAction } from '../systems/interrupts';
import { preBlocked } from '../systems/preemptive';
import { herUnread } from '../systems/messages';

const unquote = (s: string) => s.replace(/"/g, '');

/** The phone is up in your hand: a call or a text, the idle phone's apps, or a message typing itself. */
export function phoneShown(): boolean {
  const n = S.g.night;
  return !!n && S.g.screen === 'night' && (voiceUp() || n.game?.kind === 'phone' || n.preMenu === 'phone' || phoneAction());
}

type Item = ['date' | 'sys' | 'l' | 'r', string] | ['photo', string, { left?: number; ring?: boolean; tap?: number }];
/** A chat's lines with a grey separator between sittings: the day for an earlier night, "Today 23:12" for the first
 *  of tonight, the time after a gap of half an hour. */
export function chatItems(lines: ChatLine[], extra: Item[] = []): Item[] {
  const out: Item[] = [];
  let prev: ChatLine | null = null;
  for (const l of lines) {
    if (!prev || prev.night !== l.night) out.push(['date', l.night === S.g.nightsPlayed ? `Today ${fmtClock(l.clock)}` : dayName(l.day ?? l.night)]);
    else if (l.clock - prev.clock >= 30) out.push(['date', fmtClock(l.clock)]);
    if (l.s === 'photo') { const left = photoLeft(l), i = lines.indexOf(l); out.push(['photo', l.text, left != null ? { left, ring: true, tap: i } : { tap: i }]); }   // her photo (#92): tap it
    else out.push([l.s, l.text]);
    prev = l;
  }
  if (extra.length && (!prev || prev.night !== S.g.nightsPlayed)) out.push(['date', `Today ${fmtClock(N().clock)}`]);
  return [...out, ...extra];
}

const CALLER: Record<string, 'mom' | 'courier' | 'boys'> = { mom: 'mom', courier: 'courier', friends: 'boys' };

function gameView(g: PhoneGame, base: Record<string, unknown>) {
  const n = N(), loud = !!g.speaker && !n.headset;
  if (g.stage === 'ringing') return { ...base, screen: 'ring', who: CALLER[g.app], left: g.t, total: g.max, drag: g.drag };
  if (g.stage === 'locked') {
    const who = g.app === 'boss' ? 'Boss' : 'Babe', app = g.app === 'boss' ? 'work' : 'msg';
    return { ...base, screen: 'lock', banners: g.msgs.map(m => ({ app, who, what: m })), hold: Math.min(1, g.unlock) };
  }
  if (g.stage === 'chat' && g.app === 'boss') {
    const r = g.rows[Math.min(g.row, g.rows.length - 1)];
    return { ...base, screen: 'boss', msgs: g.msgs, left: g.t, total: g.max, row: g.row, rows: g.rows.length, a: r.a, b: r.b, options: r.options, feedback: g.feedback };
  }
  if (g.stage === 'chat') return { ...base, screen: 'her', items: chatItems(S.g.herThread ?? [], g.msgs.map(m => ['l', m] as Item)), left: g.t, total: g.max };
  if (g.stage === 'call') return { ...base, screen: 'mom', line: g.line, beat: g.beat, beats: T.MOM_BEATS, sweep: Math.min(1, g.sweep), zone: g.zone, zoneW: T.MOM_ZONE, reading: g.read > 0, misses: g.misses, max: T.MOM_MAX_MISSES, feedback: g.feedback, bad: /Wrong|Off|slow/i.test(g.feedback), speaker: !!g.speaker, loud };
  // the courier and the boys
  const boys = g.app === 'friends';
  return { ...base, screen: 'talk', who: CALLER[g.app], speaker: !!g.speaker, loud, line: unquote(g.line), opts: g.opts ?? [], left: g.t, total: g.max,
    goal: boys ? 'Say no, nicely. Quickly.' : 'Get it left with a neighbour.', goal2: boys ? '' : 'One wrong word: he leaves.',
    misses: g.misses, max: boys ? T.FRIENDS_MAX_MISSES : 0, feedback: g.feedback && g.feedback !== 'On speaker!' ? g.feedback : '' };
}

/** A pre-emptive action from a chat: ready (gold) or why not (dim, with a lock). */
function chatAction(id: 'text' | 'raid') {
  if (!on('messages')) return null;   // Text her and Raid night? come in on Wednesday (#56)
  const why = preBlocked(id);
  return id === 'text'
    ? { ok: !why, label: 'Text her', act: 'pre', arg: 'text', sub: `${T.PRE_TEXT_SEC} s, hands busy`, why }
    : { ok: !why, label: 'Raid night?', act: 'pre', arg: 'raid', sub: `Goodwill -${T.GOODWILL_RAID}: no visits ${T.RAID_CALM_SEC} s`, why };
}

/** The row that was just bought flashes moss (main.ts sets it). */
let shopFlash: { id: string; at: number } | null = null;
export function shopFlashed(id: string) { shopFlash = { id, at: performance.now() }; }

/** Danny's 20:00 voice note is up (the week, #56): the phone is in your hand while the night waits. */
export const voiceUp = () => !!S.g.voice && S.g.howto && !S.g.paused;
let voiceOf: unknown = null, voiceAt = 0;

export function phoneView() {
  const n = N(), g = S.g;
  const base = { time: fmtClock(n.clock), date: `${dayName()} night`, batt: battOn() ? battery() : undefined };
  if (voiceUp()) {   // its time played runs from when it came up
    if (voiceOf !== g.voice) { voiceOf = g.voice; voiceAt = performance.now(); n.phUp = voiceAt; }   // it rises into your hand
    return { ...base, screen: 'voice', lines: g.voice!.lines, date: g.voice!.date, tt: (performance.now() - voiceAt) / 1000 };
  }
  if (n.game?.kind === 'phone') return gameView(n.game, base);
  const p = n.pre;
  if (p && phoneAction()) {   // a message typing itself into the chat
    const boys = p.id === 'raid';
    return { ...base, screen: 'texting', who: boys ? 'boys' : 'babe', msg: boys ? 'raid night? need a carry' : 'what are you up to? ♥', k: 1 - p.t / p.max,
      items: chatItems(boys ? g.boysThread ?? [] : g.herThread ?? []) };
  }
  const app = n.phApp ?? 'home';
  if (app === 'messages') {
    const her = g.herThread ?? [], boys = g.boysThread ?? [], lh = her[her.length - 1], lb = boys[boys.length - 1];
    return { ...base, screen: 'messages', rows: [
      { id: 'babe', who: 'Babe', av: 'babe', her: true, last: lh ? (lh.s === 'r' ? 'You: ' : '') + lh.text.replace(' ♥', '') : 'No messages yet', time: lh ? fmtClock(lh.clock) : '', unread: herUnread() },
      { id: 'boys', who: 'The Boys (3)', av: 'boys', last: lb ? (lb.s === 'r' ? 'You: ' : '') + lb.text : 'No messages yet', time: lb ? fmtClock(lb.clock) : '', unread: 0 },
    ] };
  }
  if (app === 'babe') return { ...base, screen: 'babe', items: chatItems(g.herThread ?? []), scroll: n.phScroll ?? 0, action: chatAction('text') };
  if (app === 'boys') return { ...base, screen: 'boys', items: chatItems(g.boysThread ?? []), action: chatAction('raid') };
  if (!n.game && phoneDead()) return { ...base, screen: 'dead', chargeOff: preBlocked('charge') ? 'x' : '' };   // dead (#57): only Charge it
  if (app === 'homeapp') return { ...base, ...homeAppView() };
  if (app === 'shop') {   // the Shop app (step 4.6, #55)
    const tab = n.shopTab ?? 'you';
    return { ...base, screen: 'shop', tab, tabs: on('home') ? ['you', 'her', 'home'] : ['you', 'her'], wallet: Math.floor(g.zl), flash: shopFlash && performance.now() - shopFlash.at < 900 ? shopFlash.id : '',
      items: SHOP_ITEMS.filter(i => i.tab === tab && (!i.needs || on(i.needs))).map(i => ({ id: i.id, g: i.g, name: i.name, zl: T.SHOP_ZL[i.id], fx: i.fx, state: shopState(i.id) })) };
  }
  if (battOn()) {   // from Thursday (#57): the battery widget and the Home app
    const why = preBlocked('charge'), owned = DEVICES.filter(d => owns(d.id)).length;
    return { ...base, screen: 'home6', unread: herUnread(), chargeOff: why ? (battery() >= 100 ? 'Full' : why) : '', chargeLabel: `Charge · ${T.CHARGE_SEC} s away`,
      devices: owned ? `${owned} device${owned > 1 ? 's' : ''}` : 'Shop: Home' };
  }
  return { ...base, screen: 'home', unread: herUnread() };
}

const mmss = (s: number) => { const c = Math.ceil(s); return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, '0')}`; };
/** The Home app (step 6.2, #57): the plan with what is installed and its state, the bubble tea card, a device's sheet. */
function homeAppView() {
  const n = N(), h = n.home, owned = DEVICES.filter(d => owns(d.id)).map(d => d.id as string);
  const dev: Record<string, unknown> = {}, coolText: Record<string, string> = {};
  for (const id of owned) { const st = deviceState(id as DeviceId); dev[id] = st; if (typeof st === 'number') coolText[id] = mmss(h.rest[id]); }
  const due = teaDue(), teaUses = h.uses.tea ?? 0, teaWhy = due ? '' : deviceBlocked('tea');
  let sheet: Record<string, unknown> | null = null;
  if (h.pick) {
    const d = DEVICE_BY_ID[h.pick], why = deviceBlocked(h.pick);
    const rooms = h.pick === 'vacuum' ? HOME_ROOMS : null;
    sheet = { kind: h.pick, at: h.pick === 'speaker' ? h.pickRoom : null, name: h.pick === 'speaker' ? `Speaker: ${h.pickRoom === 'kitchen' ? 'kitchen' : 'bath'}` : d.name,
      what: d.what, note: d.note(h.uses[h.pick] ?? 0), rooms: rooms ? rooms.map(r => r[1]) : undefined, roomIds: rooms ? rooms.map(r => r[0]) : undefined,
      room: rooms ? (rooms.find(r => r[0] === h.pickRoom) ?? rooms[0])[1] : undefined, cost: battCost(T.HOME_BATT[h.pick]),
      go: h.pick === 'seal' && n.seal ? 'Unseal the door' : d.go, why: why === 'Resting' ? `Resting ${mmss(h.rest[h.pick] ?? 0)}` : why,
      y0: h.pick === 'vacuum' ? 84 : h.pick === 'seal' ? 102 : 108 };
  }
  return { screen: 'homeapp', owned, dev, coolText, runRoom: h.vac ? ({ living: 'living', kitchen: 'kitchen', bathroom: 'bath', bedroom: 'bedroom', hallway: 'hallway' } as Record<string, string>)[h.vac.room] : undefined,
    tea: due ? mmss(due) : null, teaOf: `${teaUses} of ${T.TEA_MAX}`, teaWhy, teaZl: T.SHOP_ZL.tea, teaCost: battCost(T.HOME_BATT.tea),
    sub: owned.length ? 'Tap a device to use it.' : 'Nothing installed yet: the Shop, Home.', foot: n.seal ? 'Sealed: quieter, no light under it.' : 'Gold ring: ready to use.', sheet };
}

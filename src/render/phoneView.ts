// The phone in your hand (V8, #73; grid doc 7f) as a view model for the renderer's live phone (phone.js, LIVE).
// The rules stay in systems/interrupts.ts, preemptive.ts and messages.ts; this only reads them.
import { SHOP_ITEMS } from '../data/shop';
import { shopState } from '../systems/shop';
import { T } from '../config/tuning';
import { S, N, type ChatLine, type PhoneGame } from '../core/state';
import { fmtClock } from '../core/fx';
import { phoneAction } from '../systems/interrupts';
import { preBlocked } from '../systems/preemptive';
import { herUnread } from '../systems/messages';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const unquote = (s: string) => s.replace(/"/g, '');

/** The phone is up in your hand: a call or a text, the idle phone's apps, or a message typing itself. */
export function phoneShown(): boolean {
  const n = S.g.night;
  return !!n && S.g.screen === 'night' && (n.game?.kind === 'phone' || n.preMenu === 'phone' || phoneAction());
}

type Item = ['date' | 'sys' | 'l' | 'r', string];
/** A chat's lines with a grey separator between sittings: the day for an earlier night, "Today 23:12" for the first
 *  of tonight, the time after a gap of half an hour. */
export function chatItems(lines: ChatLine[], extra: Item[] = []): Item[] {
  const out: Item[] = [];
  let prev: ChatLine | null = null;
  for (const l of lines) {
    if (!prev || prev.night !== l.night) out.push(['date', l.night === S.g.nightsPlayed ? `Today ${fmtClock(l.clock)}` : DAYS[((l.night % 7) + 7) % 7]]);
    else if (l.clock - prev.clock >= 30) out.push(['date', fmtClock(l.clock)]);
    out.push([l.s, l.text]);
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
  const why = preBlocked(id);
  return id === 'text'
    ? { ok: !why, label: 'Text her', act: 'pre', arg: 'text', sub: `${T.PRE_TEXT_SEC} s, hands busy`, why }
    : { ok: !why, label: 'Raid night?', act: 'pre', arg: 'raid', sub: `Goodwill -${T.GOODWILL_RAID}: no visits ${T.RAID_CALM_SEC} s`, why };
}

/** The row that was just bought flashes moss (main.ts sets it). */
let shopFlash: { id: string; at: number } | null = null;
export function shopFlashed(id: string) { shopFlash = { id, at: performance.now() }; }

export function phoneView() {
  const n = N(), g = S.g;
  const base = { time: fmtClock(n.clock), date: `${DAYS[((g.nightsPlayed % 7) + 7) % 7]} night` };
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
  if (app === 'shop') {   // the Shop app (step 4.6, #55)
    const tab = n.shopTab ?? 'you';
    return { ...base, screen: 'shop', tab, wallet: Math.floor(g.zl), flash: shopFlash && performance.now() - shopFlash.at < 900 ? shopFlash.id : '',
      items: SHOP_ITEMS.filter(i => i.tab === tab).map(i => ({ id: i.id, g: i.g, name: i.name, zl: T.SHOP_ZL[i.id], fx: i.fx, state: shopState(i.id) })) };
  }
  return { ...base, screen: 'home', unread: herUnread() };
}

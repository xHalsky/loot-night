// The right screen around the monitor (V3, #68; grid doc §7) as a view model for the renderer's live desk
import { on } from '../systems/week';
import { battOn, battery } from '../systems/home';
import { isWitching } from '../systems/affixes';
// (desk.js drawDeskLive): the taskbar, the Tonight note, the keyboard's lights, the phone lying on the desk, the YOU
// card and the feed. Rules stay in systems/; this only reads them.
import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { fmtClock } from '../core/fx';
import { maxHp } from '../systems/stats';
import { isAway } from '../systems/autopilot';
import { dogDesk } from './dogView';
import { RARITY_COLOR } from '../data/items';

// the feed's colours: the game logs hex, the desk speaks palette slots (grid doc §7: LOOT is its rarity)
const RARITY_SLOT: Record<string, string> = { [RARITY_COLOR.common]: 'u6', [RARITY_COLOR.uncommon]: 'g6', [RARITY_COLOR.rare]: 's6', [RARITY_COLOR.epic]: 'arcane', [RARITY_COLOR.legendary]: 'copper' };
const CALLER: Record<string, string> = { mom: 'mom', courier: 'courier', friends: 'boys' };
const CALLS = new Set(['mom', 'courier', 'friends']);

function feedRows(): [string, string, string, string?][] {
  const n = N();
  const pin = n.tip ? n.tip.text.match(/^\[([^\]]+)\]\s*(.*)$/) : null;
  const rows: [string, string, string, string?][] = [];
  if (n.tip) rows.push([fmtClock(n.clock), (pin?.[1] ?? 'TIP').toUpperCase(), pin?.[2] ?? n.tip.text]);
  for (const l of n.log.slice(-8).reverse()) {
    if (pin && l.text === pin[2]) continue;
    const tag = (l.tag ?? '').toUpperCase();
    rows.push([l.time, tag, l.text, tag === 'LOOT' ? RARITY_SLOT[l.color] ?? 'u6' : undefined]);
  }
  return rows.length ? rows.slice(0, 6) : [[fmtClock(n.clock), 'GAME', "Welcome to Loot Night. Have fun, don't get caught."]];
}

/** What the phone lying on the desk shows (phone.js deskScreen): a call, banners, face down, or in your hand. */
function deskPhone() {
  const n = N(), it = n.interrupts[0], h = n.home;
  const batt = battOn() ? { batt: battery() } : {};   // the battery on its lock screen (#57)
  return { ...deskPhone0(n, it, h), ...batt };
}
function deskPhone0(n: ReturnType<typeof N>, it: ReturnType<typeof N>['interrupts'][number] | undefined, h: ReturnType<typeof N>['home']) {
  if (battOn() && h.deadShow > 0 && !(S.g.voice && S.g.howto) && n.game?.kind !== 'phone' && n.preMenu !== 'phone') return { phone: 'dead' };   // it died: the empty battery for a moment
  if (battOn() && h.lowShow > 0 && !it && n.preMenu !== 'phone' && n.game?.kind !== 'phone') return { phone: 'lowbat' };   // 20% and 10%: a crimson block
  if ((S.g.voice && S.g.howto) || n.game?.kind === 'phone' || n.preMenu === 'phone' || (n.pre && (n.pre.id === 'text' || n.pre.id === 'raid'))) return { phone: 'hand' };   // Danny's voice note too (#56)
  if (n.phoneDown > 0) return it ? { phone: 'downGlow', glowKind: CALLS.has(it.kind) ? 'call' : 'msg' } : { phone: 'down' };
  if (it && CALLS.has(it.kind)) return { phone: 'call', caller: CALLER[it.kind], ringLeft: it.t };
  if (it) return { phone: 'lock', banners: it.msgs.map(m => ({ app: it.kind === 'boss' ? 'work' : 'msg', who: it.kind === 'boss' ? 'Boss' : 'Babe', what: m })) };
  return { phone: 'off' };
}

export function deskView(phoneHover = false) {
  const n = N(), g = S.g;
  // Windows-style attention flash: the game wants you back (the party in trouble while you are away)
  const hp = g.heroes.reduce((a, h) => a + (h.downed ? 0 : h.hp), 0) / g.heroes.reduce((a, h) => a + maxHp(h), 0);
  const flash = n.monitor !== 'rpg' && isAway() && (g.heroes.some(h => h.downed) || hp < T.AUTOPILOT_FLASH_HP);
  // the Drink button: drink, or hide the cans while her footsteps come (#62)
  const coming = n.visit.stage !== 'idle' && n.visit.stage !== 'passing' && n.visit.stage !== 'in';
  const fuel = on('fuel'), hideCans = fuel && coming && g.monsters > 0 && !n.cansHidden;
  const cansHidden = n.cansHidden && n.visit.stage !== 'idle';
  const canDrink = fuel && g.monsters > 0 && !n.game && !n.pre;
  const red = n.mood >= T.MOOD_RED;
  const ph = deskPhone();
  return {
    screen: n.monitor === 'excel' ? 'excel' : 'rpg',
    clock: fmtClock(n.clock), zl: Math.floor(g.zl), witching: isWitching(), sleepOk: n.clock >= T.EARLIEST_SLEEP, flash,
    you: { tired: on('tired'), zone: on('headset'), fuel },   // the YOU card shows what is in tonight (#56)
    tired: Math.round(n.tired), yawn: T.TIRED_YAWN, zone: n.headset ? Math.round(n.zone * 30) : 0, headset: n.headset,
    cans: g.monsters, hideCans, cansHidden: cansHidden && !hideCans, drinkAct: hideCans ? 'hideCans' : canDrink && !cansHidden ? 'openMonster' : '',
    note: [n.deepest >= n.deepTarget ? 'y' : '!', n.everCaught ? 'x' : 'y', red ? '!' : 'y'], floorGoal: n.deepTarget,
    feed: feedRows(),
    dog: dogDesk(),   // V6 (#71): the dog on the desk (render/dogView.ts)
    ...ph, hover: phoneHover && ph.phone === 'off' ? true : undefined,
  };
}

/** Hover text for what the desk shows (main.ts sets it as the tooltip's key, 'text:...'). */
export function deskTip(key: string): string {
  const n = N();
  switch (key) {
    case 'tonight': return "Tonight's three stars, counted when you log off. Each pays a reward in the morning.";
    case 'tired': return `Tired ${Math.round(n.tired)}: from ${T.TIRED_YAWN} you yawn and nod off. Goblin Fuel or Sleep bring it down.`;
    case 'zone': return n.headset ? 'Zone fills while the headset is on: Flow and loot luck up, but you hear nothing.' : 'Zone: put the headset on (H). It empties the moment you take it off.';
    case 'drink': return S.g.monsters ? 'Goblin Fuel: drink one (G). While she is coming: hide the cans.' : 'No cans left. The Shop has more.';
    case 'decline': return 'Decline. Mom calls back once, the others give up.';
    case 'phone': return 'Your phone: click to pick it up. Swipe it over: face down, Do Not Disturb.';
    case 'tab:rpg': return 'Loot Night (Tab)';
    case 'tab:excel': return 'Excel (Tab): it looks like work.';
    case 'sleep': return n.clock >= T.EARLIEST_SLEEP ? 'Log off and sleep: banks the run.' : 'Sleep opens at 23:00.';
    case 'witching': return 'Witching Hour: better drops, more sleep debt.';
    default: return '';
  }
}

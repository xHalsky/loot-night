import { bankRun } from './run';
import { resetPacing } from './pacing';
import { T } from '../config/tuning';
import { carryGoodwill } from './goodwill';
import { S, N, type Night, type Results } from '../core/state';
import { rand } from '../core/rng';
import { maxHp } from './stats';
import { entryValue, removeEntry } from './loot';
import { initVisits } from './visits';
import { newExcel } from './excel';
import { startTired } from './tired';
import { scheduleInterrupt } from './interrupts';
import { moodZone } from './meters';
import { save } from './save';
import { toastAs } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { sfx, setHeadset, stopAmbience } from '../ui/audio';
import { cityOutlook } from './town';

export function newNight(): Night {
  return {
    clock: T.NIGHT_START, threat: 0, location: 'town', phase: 'walk', phaseT: 0,
    floor: 1, battleIdx: 0, floorMap: 'plain', checkpoint: Math.max(1, ...S.g.checkpoints), deepest: 0,
    enemies: [], mood: T.MOOD_START, noise: 0, catches: 0, bossQuiet: 0, bossCallback: 0, flow: T.FLOW_MIN,
    monitor: 'rpg', action: 'none', dropQueue: [], floorLoot: [], fresh: [], lootFly: [], dropPopup: null, reserve: [], run: null, runCard: null, paths: null, safest: 0, mapAway: 0, feature: null, cond: null,
    visit: { stage: 'idle', t: 0, nextAt: 0, fake: false, checked: false, result: '', kind: 'peek' },
    apt: { room: 'living', activity: 'tv', t: 0, moving: 0, soundT: 0, heard: null, heardWhat: '', heardAt: 0, showerUsed: false, lastVisitEnd: 0, forceDoor: false, asleep: false, wake: 0, textSent: false, cued: false, calm: 0, forceKind: null },
    headset: false, scare: 0, zone: 0, tired: 0, blink: { state: 'open', lid: 0, nextIn: 40 }, boost: 0, crash: 0, cans: 0, bin: [], log: [], peeking: false, peek: 0, peekSus: 0, declineHold: false, decline: 0, phoneDown: 0, flipFx: 0, momCallback: 0, switching: null, dog: { stage: 'away', t: 0, next: T.DOG_FIRST_SEC, ignores: 0, limit: 2, pet: 0, sweet: 0, flinch: 0 }, unplugged: null, lap: null, cansHidden: false,
    interrupts: [], nextInterruptAt: 0, game: null,
    excel: newExcel(),
    taunt: 0, ward: 0, lastStand: 0, goodBoy: 0, excused: false, goodDog: 0, forgiven: false, witchingSaid: false, walkby: false,
    callsTonight: {}, pre: null, preUses: {}, preMenu: null, towel: false, herReply: null,
    curio: null, curioPlan: [], curioFight: false, partyBuffs: [], sulk: 0, bankNotice: 0, bankItem: '', guilt: 0, monitorOff: 0, yawn: 0, nextYawn: T.YAWN_EVERY_SEC, grin: 0, tip: null, goldStart: S.g.gold, coach: null,
    moodDrift: 0, selected: null, heroTab: 0, everCaught: false, unidentifiedFound: 0,
    goblin: null, fx: [], vfx: [], beams: [], toasts: [], walkScroll: 0,
    market: Math.round(rand(...T.MARKET_RANGE) * 100) / 100, reveal: null,
  };
}

export function startNight() {
  resetPacing();
  carryGoodwill();
  S.g.night = newNight();
  S.g.heroes.forEach(h => { h.downed = false; h.hp = maxHp(h); h.queued = null; h.cd = [0, 0, 0, 0]; h.ult = 0; h.atb = Math.random() * 50; });
  initVisits();
  S.g.night.tired = startTired();
  S.g.monsters = Math.max(S.g.monsters ?? 0, T.MONSTER_PER_NIGHT);
  setHeadset(false); stopAmbience();
  scheduleInterrupt(true);
  S.g.screen = 'night';
  S.g.paused = false;
  S.g.howto = S.g.nightsPlayed === 0;   // the first night opens with the how-to-hide card (#28)
  toast('Monday, 20:00. Town is quiet. Hit the Dungeon Gate.', '#8fb3ff');
}

/** Checks the three ways a night ends (docs/design/night.md). */
export function checkNightEnd() {
  const n = N();
  if (n.mood >= T.MOOD_MAX) endNight('unplugged');
  else if (n.clock >= T.DAWN) endNight('dawn');
}

export function canSleep() { const n = N(); return n.clock >= T.EARLIEST_SLEEP && (n.location === 'town' || n.phase !== 'battle'); }

export function endNight(ending: Results['ending']) {
  stopAmbience();
  const n = N();
  if (ending === 'sleep' && !canSleep()) { toast(n.clock < T.EARLIEST_SLEEP ? 'Too early to sleep. Play until at least 23:00.' : 'Finish the battle first.', '#a999bd'); return; }
  // Pending drops land in the bag where possible.
  n.dropQueue.push(...n.floorLoot.map(l => l.entry)); n.floorLoot = [];
  n.dropQueue.forEach(e => { if (S.g.bag.length < S.g.bagSize) S.g.bag.push(e); });
  if (n.dropPopup && S.g.bag.length < S.g.bagSize) S.g.bag.push(n.dropPopup.entry);
  if (n.run) bankRun();   // logging off ends the run safely (#52, 1.4; docs/design/dungeon.md)
  if (ending === 'unplugged') {
    const sorted = [...S.g.bag].sort((a, b) => entryValue(b) - entryValue(a));
    sorted.slice(Math.ceil(sorted.length / 2)).forEach(e => removeEntry(e.id));
  }
  const debtBefore = S.g.sleepDebt;
  const endClock = ending === 'dawn' ? T.DAWN : Math.floor(n.clock);
  if (ending === 'dawn') S.g.sleepDebt = Math.min(T.SLEEP_DEBT_MAX, S.g.sleepDebt + T.SLEEP_DEBT_MAX);
  else if (endClock > T.BEDTIME) S.g.sleepDebt = Math.min(T.SLEEP_DEBT_MAX, S.g.sleepDebt + Math.ceil((endClock - T.BEDTIME) / T.SLEEP_DEBT_STEP_MIN));
  else S.g.sleepDebt = Math.max(0, S.g.sleepDebt - Math.floor((T.BEDTIME - endClock) / T.SLEEP_DEBT_STEP_MIN));

  const survived = ending !== 'unplugged';
  const twoStar = survived && n.mood < T.MOOD_RED;
  const threeStar = !n.everCaught;
  const stars = (survived ? 1 : 0) + (twoStar ? 1 : 0) + (threeStar && survived ? 1 : 0);

  const prevRecord = S.g.record;
  const depth = n.deepest;
  const near: string[] = [];
  if (depth < prevRecord) near.push(`${prevRecord - depth} floor${prevRecord - depth > 1 ? 's' : ''} short of your record (${prevRecord}).`);
  if (depth > prevRecord && prevRecord > 0) near.push(`New depth record: floor ${depth}!`);
  if (survived && !twoStar) near.push(`2nd star missed by ${Math.ceil(n.mood - T.MOOD_RED + 1)} Mood.`);
  if (n.everCaught) near.push(`3rd star needs a night with no catches (caught ${n.catches}x).`);
  const city = cityOutlook();   // counts what your bag sells and salvages for, like you would in the city
  if (city.next) {
    const what = `${city.next.name} ${city.next.upgrade ? 'upgrade' : ''}`.trim();
    if (city.now) near.push(`You can afford the ${what} in the city (${city.next.gold} gold, ${city.next.mats} Souls).`);
    else if (city.withBag) near.push(`Sell and salvage your bag in the city: it pays for the ${what}.`);
    else if (city.short) near.push(`${what}: ${city.short.gold ? city.short.gold + ' gold' : ''}${city.short.gold && city.short.mats ? ' and ' : ''}${city.short.mats ? city.short.mats + ' Souls' : ''} short, even selling your bag.`);
  }
  const unidentified = S.g.bag.filter(e => e.kind === 'item' && !e.item.identified).length;

  S.g.record = Math.max(S.g.record, depth);
  S.g.bestStars = Math.max(S.g.bestStars, stars);
  S.g.nightsPlayed++;
  S.g.results = { ending, endClock, stars, depth, prevRecord, debtBefore, debtAfter: S.g.sleepDebt, mood: Math.round(n.mood), caught: n.everCaught, unidentified, nearMisses: near };
  S.g.screen = 'results';
  sfx.level();
  save();
}

export function toMorning() {
  const paid = S.g.pendingListings.reduce((s, l) => s + l.zl, 0);
  const listings = S.g.pendingListings.length;
  S.g.zl += paid;
  S.g.pendingListings = [];
  S.g.morning = { paid, listings };
  S.g.screen = 'morning';
  save();
}

export const moodLabel = (m: number) => moodZone(m);

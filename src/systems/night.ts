import { ensureParty } from './ranks';
import { chooseWear, giftFirstNote, wearing } from './wardrobe';
import { bankRun, loseRun, unbanked } from './run';
import { resetPacing } from './pacing';
import { T } from '../config/tuning';
import { carryGoodwill, addGoodwill } from './goodwill';
import { S, N, type Night, type Results, type Item, type BagEntry } from '../core/state';
import { rand, randi } from '../core/rng';
import { maxHp } from './stats';
import { entryValue, removeEntry, sweepFloorLoot, genItem, itemEntry } from './loot';
import { initVisits } from './visits';
import { newQ4Night } from './q4';
import { newHomeNight } from './home';
import { startTired } from './tired';
import { planPhone } from './interrupts';
import { moodZone } from './meters';
import { save } from './save';
import { toastAs } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { sfx, setHeadset, stopAmbience } from '../ui/audio';
import { cityOutlook } from './town';
import { rules, on, dayName, howtoOpens, voiceNote } from './week';

export function newNight(): Night {
  return {
    clock: T.NIGHT_START, threat: 0, location: 'town', phase: 'walk', phaseT: 0,
    floor: 1, battleIdx: 0, floorMap: 'plain', checkpoint: Math.max(1, ...S.g.checkpoints), deepest: 0, deepTarget: Math.max(T.STAR_DEEP_MIN, S.g.record + T.STAR_DEEP_OFFSET),
    enemies: [], mood: T.MOOD_START, noise: 0, catches: 0, phoneScript: [], friendsLeft: 0, friendsFloor: 0, lastDemand: 0, flow: T.FLOW_MIN,
    monitor: 'rpg', action: 'none', dropQueue: [], floorLoot: [], fresh: [], lootFly: [], dropPopup: null, reserve: [], run: null, runCard: null, paths: null, safest: 0, mapAway: 0, feature: null, cond: null,
    visit: { stage: 'idle', t: 0, nextAt: 0, fake: false, checked: false, result: '', kind: 'peek' },
    apt: { room: 'living', activity: 'tv', t: 0, moving: 0, soundT: 0, heard: null, heardWhat: '', heardAt: 0, showerUsed: false, lastVisitEnd: 0, forceDoor: false, asleep: false, wake: 0, textSent: false, cued: false, calm: 0, forceKind: null },
    headset: false, scare: 0, zone: 0, tired: 0, blink: { state: 'open', lid: 0, nextIn: 40 }, boost: 0, crash: 0, cans: 0, bin: [], log: [], peeking: false, peek: 0, peekSus: 0, phoneDown: 0, flipFx: 0, momCallback: 0, switching: null, dog: { stage: 'away', t: 0, next: rules().dog?.[0] ?? Infinity, ignores: 0, limit: 2, pet: 0, sweet: 0, flinch: 0 }, unplugged: null, lap: null, cansHidden: false,
    interrupts: [], game: null,
    q4: newQ4Night(), shopTonight: [],
    taunt: 0, ward: 0, lastStand: 0, smoke: 0, heist: 0, goodBoy: 0, excused: false, goodDog: 0, forgiven: false, witchingSaid: false, walkby: false,
    pre: null, preUses: {}, preMenu: null, herAsk: null, herThanks: null, lapMouse: 0, lapSay: null, wear: { top: null, feet: null }, photo: null, lean: null, leanHold: 0, leanFog: 0, leanSpotted: null, seal: false, home: newHomeNight(), looking: false, tease: { left: randi(...rules().teases), next: rand(...T.TEASE_FIRST_SEC), bedAt: rand(...T.BED_TEASE_AT), bedDone: false }, herReply: null,
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
  ensureParty();   // an old save gets the rogue and the marching order (#52, 1.6; #96)
  S.g.heroes.forEach(h => { h.moving = undefined; h.from = undefined; });
  S.g.heroes.forEach(h => { h.downed = false; h.hp = maxHp(h); h.queued = null; h.cd = [0, 0, 0, 0]; h.ult = 0; h.atb = Math.random() * 50; });
  initVisits();
  chooseWear(); if (wearing('cathoodie')) S.g.night.tease.left += T.GIFT_CAT_TEASES;   // her gifts tonight (#91)
  giftFirstNote();
  // last morning's rewards (#54, 3.1): Trust's Goodwill on top of what carried over; a chest that found the bag full
  if (S.g.carry) { addGoodwill(S.g.carry.goodwill, 'Trust: she never caught you last night'); S.g.night.dropQueue.push(...S.g.carry.drops); S.g.carry = undefined; }
  S.g.night.tired = startTired();
  if (on('fuel')) S.g.monsters = Math.max(S.g.monsters ?? 0, T.MONSTER_PER_NIGHT);   // the Goblin Fuel comes in on Thursday (#56)
  setHeadset(false); stopAmbience();
  planPhone();   // tonight's phone events (#54, 3.2)
  S.g.screen = 'night';
  S.g.paused = false;
  // before the night (#28, #56): the boys' chat on the phone, then How to hide on the first Monday and a night with a new tile
  S.g.voice = voiceNote();
  S.g.howto = howtoOpens() || !!S.g.voice;
  toast(`${dayName()}, 20:00. Town is quiet. Hit the Dungeon Gate.`, '#8fb3ff');
}

/** Checks the three ways a night ends (docs/design/night.md). */
export function checkNightEnd() {
  const n = N();
  warnRun();
  if (n.mood >= T.MOOD_MAX) endNight('unplugged');
  else if (rules().end && n.clock >= rules().end) endNight('sleep', true);   // Monday: bedtime ends the night, as a Sleep (#56)
  else if (n.clock >= T.DAWN) endNight('dawn');
}

/** A forced end (dawn, unplugged) loses the run, so the feed warns once of each while a run is going. */
function warnRun() {
  const n = N(), w = (n.runWarned ??= {});
  const end = rules().end;
  if (end && !w.bed && n.clock >= end - T.BEDTIME_WARN_MIN) { w.bed = true; toast(`Bedtime at ${String(Math.floor(end / 60) % 24).padStart(2, '0')}:00 tonight: the night ends then, your run banked.`, '#8fb3ff'); }
  if (!n.run) return;
  if (!w.dawn && n.clock >= T.DAWN - T.RUN_WARN_DAWN_MIN) { w.dawn = true; toast(`Dawn in ${T.RUN_WARN_DAWN_MIN} minutes. Take the portal, or the run is lost.`, '#ff8a80'); }
  if (!w.plug && n.mood >= T.MOOD_RED) { w.plug = true; toast("She's close to pulling the plug. This run isn't banked.", '#ff8a80'); }
}

export function canSleep() { const n = N(); return n.clock >= T.EARLIEST_SLEEP && (n.location === 'town' || n.phase !== 'battle'); }

export function endNight(ending: Results['ending'], bedtime = false, coming = false) {
  stopAmbience();
  const n = N();
  if (ending === 'sleep' && !bedtime && !canSleep()) { toast(n.clock < T.EARLIEST_SLEEP ? 'Too early to sleep. Play until at least 23:00.' : 'Finish the battle first.', '#a999bd'); return; }
  // A run still going: Sleep (your choice) banks it; a forced end (dawn, unplugged) loses it like a wipe, Souls
  // kept (#52, 1.4; decided 2026-11-24: going deeper always carries a risk). What lies on the floor goes with it.
  const bank = ending === 'sleep';
  if (n.run) { if (bank) sweepFloorLoot(); else n.floorLoot = []; }
  // Pending drops land in the bag where possible.
  n.dropQueue.push(...n.floorLoot.map(l => l.entry)); n.floorLoot = [];
  n.dropQueue.forEach(e => { if (S.g.bag.length < S.g.bagSize) S.g.bag.push(e); });
  if (n.dropPopup && S.g.bag.length < S.g.bagSize) S.g.bag.push(n.dropPopup.entry);
  const run = n.run ? { ...unbanked(), deepest: n.run.deepest } : null;
  if (n.run) { if (bank) bankRun(); else loseRun(); }
  if (ending === 'unplugged') {   // on top of the run: the cheaper half of the bag (handoff 3.1, unchanged)
    const sorted = [...S.g.bag].sort((a, b) => entryValue(b) - entryValue(a));
    sorted.slice(Math.ceil(sorted.length / 2)).forEach(e => removeEntry(e.id));
  }
  const debtBefore = S.g.sleepDebt;
  const endClock = ending === 'dawn' ? T.DAWN : Math.floor(n.clock);
  if (ending === 'dawn') S.g.sleepDebt = Math.min(T.SLEEP_DEBT_MAX, S.g.sleepDebt + T.SLEEP_DEBT_MAX);
  else if (endClock > T.BEDTIME) S.g.sleepDebt = Math.min(T.SLEEP_DEBT_MAX, S.g.sleepDebt + Math.ceil((endClock - T.BEDTIME) / T.SLEEP_DEBT_STEP_MIN));
  else S.g.sleepDebt = Math.max(0, S.g.sleepDebt - Math.floor((T.BEDTIME - endClock) / T.SLEEP_DEBT_STEP_MIN));

  // Three goals, each a star (#54, 3.1): Deep (any run reached tonight's floor), Unseen (never caught; a forgiven
  // catch or an excuse she bought doesn't count), Sweet (her Mood ends under red). Unplugged: none.
  const survived = ending !== 'unplugged';
  const depth = n.deepest, target = n.deepTarget;
  const goals = { deep: survived && depth >= target, unseen: survived && !n.everCaught, sweet: survived && n.mood < T.MOOD_RED, target };
  const stars = +goals.deep + +goals.unseen + +goals.sweet;

  const prevRecord = S.g.record;
  const near: string[] = [];
  if (run && (run.items || run.gold)) near.push(bank ? `Run banked on the way to bed: ${run.items} items, ${run.gold} gold.`
    : `${ending === 'dawn' ? 'Dawn' : 'The plug'} ended the run on floor ${run.deepest}: ${run.items} items and ${run.gold} gold lost.`);
  if (survived && !goals.deep) near.push(`Deep: ${target - depth} floor${target - depth > 1 ? 's' : ''} short of tonight's target (floor ${target}).`);
  if (depth > prevRecord && prevRecord > 0) near.push(`New depth record: floor ${depth}!`);
  if (survived && !goals.sweet) near.push(`Sweet: missed by ${Math.ceil(n.mood - T.MOOD_RED + 1)} Mood.`);
  if (survived && n.everCaught) near.push(`Unseen: caught ${n.catches}x tonight.`);
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
  const day = S.g.day ?? 0;
  if (ending !== 'unplugged') S.g.day = day + 1;   // the week (#56): unplugged, you play the same night again
  S.g.results = { ending, bedtime: bedtime || undefined, coming: coming || undefined, day, endClock, stars, depth, prevRecord, debtBefore, debtAfter: S.g.sleepDebt, mood: Math.round(n.mood), caught: n.everCaught, unidentified, nearMisses: near, goals, q4: Math.round(n.q4.tonight) };
  S.g.screen = 'results';
  sfx.level();
  save();
}

export function toMorning() {
  const paid = S.g.pendingListings.reduce((s, l) => s + l.zl, 0);
  const listings = S.g.pendingListings.length;
  S.g.zl += paid;
  S.g.pendingListings = [];
  // A reward per star (#54, 3.1). Loot only comes from the game, so only Deep pays in loot: a chest with one item
  // from the normal drop table at tonight's deepest floor. Unseen: Trust, Goodwill for the next night. Sweet:
  // Breakfast, sleep debt down.
  const goals = S.g.results?.goals, depth = S.g.results?.depth ?? 1;
  let chest: Item | null = null, chestWaits = false;
  const carry = { goodwill: 0, drops: [] as BagEntry[] };
  if (goals?.deep) {
    chest = genItem(Math.max(1, depth));
    if (S.g.bag.length < S.g.bagSize) S.g.bag.push(itemEntry(chest)); else { carry.drops.push(itemEntry(chest)); chestWaits = true; }   // a full bag: it waits as tonight's first drop
  }
  if (goals?.unseen) carry.goodwill = T.STAR_UNSEEN_GOODWILL;
  if (goals?.sweet) S.g.sleepDebt = Math.max(0, S.g.sleepDebt - T.STAR_SWEET_DEBT);
  if (carry.goodwill || carry.drops.length) S.g.carry = carry;
  S.g.morning = { paid, listings, chest, chestWaits, trust: !!goals?.unseen, breakfast: !!goals?.sweet };
  S.g.screen = 'morning';
  save();
}

export const moodLabel = (m: number) => moodZone(m);

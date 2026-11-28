import { T } from '../config/tuning';
import { S, N, type MapKind } from '../core/state';
import { spawnBattle, updateBattle, reviveHero, tickCooldowns } from './battle';
import { rollBattleDrops, rollBattleExtras, removeEntry, entryName, moveFloorLoot, sweepFloorLoot, looterIndex } from './loot';
import { ENEMY_SLOTS, MID_SLOT, POS_X, LOOTER_REACH } from '../core/arena';
import { gainGold, gainSouls, startRun, bankRun, loseRun, blessCount } from './run';
import { maxHp } from './stats';
import { toastAs } from '../core/fx';
import { heroLabel } from '../data/heroes';
const toast = toastAs('GAME');   // feed tag (#49)
import { chance, pick } from '../core/rng';
import { sfx } from '../ui/audio';
import { MAP_INFO } from '../data/items';
import { isAway } from './autopilot';
import { auraRegen } from './positions';
import { planCurios, approachCurio, walkCurio, updateCurio, curioFloorEnd, battleEnded } from './curios';
import { FEATURES, CONDITIONS, type PathCard, type FeatureId, type ConditionId } from '../data/routes';
import { triggerDog } from './pets';
import { boysSay } from './boys';

export const isBossBattle = () => { const n = N(); return !n.curioFight && n.floor % T.CHECKPOINT_EVERY === 0 && n.battleIdx === T.BATTLES_PER_FLOOR - 1; };

export function enterDungeon(floor: number) {
  const n = N();
  n.location = 'dungeon';
  n.floor = floor;
  startFloor('plain');
}

function startFloor(map: MapKind | 'plain', card?: PathCard) {
  const n = N();
  n.feature = card?.feat ?? null; n.cond = card?.cond ?? null;
  if (n.feature && FEATURES[n.feature].map) map = FEATURES[n.feature].map!;   // Elite Pack, Goblin Den
  if (n.cond && CONDITIONS[n.cond].map) map = CONDITIONS[n.cond].map!;          // Cursed
  n.floorMap = map; n.battleIdx = 0; n.enemies = []; n.pack = null; n.phaseT = 0;
  n.curio = null; n.curioAt = null; n.curioFight = false; n.curioPlan = []; curioFloorEnd();
  n.deepest = Math.max(n.deepest, n.floor);
  S.g.mapPath[n.floor] = map === 'plain' ? (n.floor % T.CHECKPOINT_EVERY === 0 ? 'boss' : 'plain') : map;   // the dungeon map (#48)
  if (n.run) n.run.deepest = Math.max(n.run.deepest, n.floor);
  if (map === 'shrine') {
    S.g.heroes.forEach(h => { reviveHero(h, 1); h.hp = maxHp(h); });
    toast('Shrine: party healed and revived', '#6fcf7f'); sfx.heal();
    floorEnd(); return;
  }
  if (map === 'vault') {   // no fights: the drops, the walk to pick them up, the floor end
    rollBattleDrops(n.floor, { count: T.VAULT_DROPS });
    n.noise += T.NOISE_VAULT;
    toast('Treasure Vault!', '#ff9a4d');
    n.phase = 'walk'; n.phaseT = 0; n.battleIdx = T.BATTLES_PER_FLOOR; return;
  }
  planCurios();
  if (map === 'cursed') toast('Cursed Floor: your heals do half, every drop is one rarity better.', '#c77dff');
  if (map === 'goblin') toast('Goblin Den: a goblin after every battle.', '#9fe05a');
  n.phase = 'walk';
}

function floorEnd() {
  const n = N();
  S.g.heroes.forEach(h => reviveHero(h, T.DOWNED_REVIVE_PCT));
  sweepFloorLoot();
  const pay = T.FLOOR_GOLD_BASE + T.FLOOR_GOLD_PER * n.floor;   // floor bounty: depth pays, not only lucky drops
  const souls = T.SOULS_PER_FLOOR_BASE + n.floor;              // #52, 1.4
  gainGold(pay); gainSouls(souls);
  toast(`Floor ${n.floor} cleared: +${pay} gold, +${souls} Souls.`, '#f2b84b');
  n.phase = 'mapChoice'; n.phaseT = 0; n.enemies = []; n.pack = null;
  makePaths();
}

/** The route choice (#52, 1.5): 2 or 3 path cards for the next floor (one before a boss), each with at most one
 *  feature and one condition; a map item in the bag adds its own card. The safest one is marked: away too long, it
 *  is taken for you (never a map). */
function makePaths() {
  const n = N(), next = n.floor + 1, boss = next % T.CHECKPOINT_EVERY === 0;
  const feats = Object.keys(FEATURES) as FeatureId[], conds = Object.keys(CONDITIONS) as ConditionId[];
  const cards: PathCard[] = [];
  if (boss) cards.push({ boss: true, ...(chance(T.NODE_CONDITION_CHANCE) ? { cond: pick(conds) } : {}) });
  else {
    // at most PATHS_MAX cards fit the map (grid doc §5b): a map item's card takes a generated one's place, but one
    // generated path always stays
    const maps = S.g.bag.filter(e => e.kind === 'map').slice(0, T.PATHS_MAX - 1);
    const k = Math.max(1, Math.min(next >= T.PATHS_LATE_FROM ? T.PATHS_LATE : T.PATHS_EARLY, T.PATHS_MAX - maps.length));
    for (let i = 0; i < k; i++) cards.push({ ...(chance(T.NODE_FEATURE_CHANCE) ? { feat: pick(feats) } : {}), ...(chance(T.NODE_CONDITION_CHANCE) ? { cond: pick(conds) } : {}) });
    for (const e of maps) if (e.kind === 'map') cards.push({ map: e.id, mapKind: e.map });
  }
  const danger = (c: PathCard) => (c.cond ? 10 + CONDITIONS[c.cond].danger : 0) + Math.random() * 0.5;
  const pool = cards.map((c, i) => ({ c, i })).filter(q => !q.c.map);
  n.paths = cards; n.mapAway = 0;
  n.safest = pool.sort((a, b) => danger(a.c) - danger(b.c))[0]?.i ?? 0;
}
/** Debug (F1, End floor): the floor ends now, with its route choice. */
export function debugEndFloor() { const n = N(); if (n.location === 'dungeon' && n.phase !== 'mapChoice') { n.enemies = []; n.reserve = []; n.pack = null; floorEnd(); } }
/** Off screen while the map waits: after MAP_AWAY_SEC in all the safest path is taken. */
export function updateMapAway(dt: number) {
  const n = N();
  if (n.phase !== 'mapChoice' || !n.paths) return;
  if (!isAway()) return;   // the same 'away' as the autopilot's: Excel, mid alt-tab, at the door, on the phone
  n.mapAway += dt;
  if (n.mapAway >= T.MAP_AWAY_SEC) { toast('[Party] Nobody picked a path. We took the safest way down.', '#a999bd'); choosePath(n.safest); }
}

/** Takes path card k down to the next floor (a map card uses up its map). */
export function choosePath(k: number) {
  const n = N();
  if (n.phase !== 'mapChoice' || !n.paths?.[k]) return;
  const card = n.paths[k];
  let kind: MapKind | 'plain' = 'plain';
  if (card.map) { const e = removeEntry(card.map); if (e && e.kind === 'map') kind = e.map; }
  n.paths = null; n.mapAway = 0;
  n.floor++;
  sfx.click();
  if (kind !== 'plain') toast(`Next floor: ${MAP_INFO[kind].name}`, MAP_INFO[kind].color);
  startFloor(kind, card);
}

/** True while the player is inspecting an item or making a choice: the fight slows down. */

export function updateDungeon(realDt: number) {
  const n = N();
  if (n.location !== 'dungeon') return;
  updateMapAway(realDt);
  const dt = realDt;   // an open item window does not slow the fight: gearing is part of the juggle (#49)
  if (n.goblin) { n.goblin.t -= dt; if (n.goblin.t <= 0) { n.goblin = null; toast('The loot goblin escaped.', '#a999bd'); sfx.goblinLost(); } }
  // the Blood pact (#52, 1.5b): heroes bleed outside fights, never below 1 HP
  const pact = blessCount('altar');
  if (pact && n.phase !== 'battle') S.g.heroes.forEach(h => { if (!h.downed) h.hp = Math.max(1, h.hp - maxHp(h) * T.BLESS_ALTAR_DRAIN * pact * realDt); });
  auraRegen(realDt, maxHp);   // the priest's blessing on his neighbours (#52, 1.6)
  if (n.phase === 'walk' || n.phase === 'curio') tickCooldowns(realDt);   // between fights the cooldowns run too: party skills work there (#122)
  if (n.phase === 'curio') { updateCurio(realDt); return; }   // the party stands at a curio: your time, not the battle's
  n.phaseT += dt;
  if (n.phase === 'walk') {   // the walk picks up the loot (#52, 1.3: no loot pause); it lasts at least WALK_SEC
    if (!n.curioAt && !n.pack && n.curioPlan.includes(n.battleIdx)) approachCurio();   // a curio comes into view (#99)
    const c = n.curioAt, sp = n.floorLoot.length || c?.passed ? T.WALK_HURRY_PACE : n.pack ? T.PACK_PACE : c ? T.CURIO_PACE : T.WALK_PACE;   // hurry over to the loot, and on past a curio
    n.walkScroll += dt * sp;
    moveFloorLoot(dt * sp * 0.7, dt);   // the camera's pace on the grid (render/rpgView.ts): the front hero walks over it (#95)
    walkCurio(dt * sp * 0.7);
    if (n.phase !== 'walk') return;   // the party stopped at the curio
    if (n.pack) { walkPack(dt * sp * 0.7, dt); return; }   // the next pack comes up; the fight starts when it is in position (#118)
    if (n.battleIdx >= T.BATTLES_PER_FLOOR) {   // after the floor's last fight: the walk out, until he has walked over all the loot and the curio is behind
      if (n.phaseT >= T.WALK_SEC && !n.floorLoot.length && !n.curioAt) floorEnd();
      return;
    }
    if (n.phaseT >= T.PACK_PLANT_SEC && packFits()) plantPack();
  } else if (n.phase === 'battle') {
    const r = updateBattle(dt);
    if (r === 'victory') battleEnded(isBossBattle());
    if (r === 'victory' && n.curioFight) {   // the troll: extra loot, then the walk goes on (not one of the floor's battles)
      const x = ENEMY_SLOTS[MID_SLOT].x;
      rollBattleDrops(n.floor, { count: T.CURIO_TROLL_DROPS, minRare: true, at: [x - 20, x, x + 20] });
      toast('The Abbot is down. The tithe is yours.', '#f2b84b');
      n.curioFight = false; n.phase = 'walk'; n.phaseT = T.WALK_SEC * 0.5;
    } else if (r === 'victory') {
      const boss = isBossBattle();
      rollBattleExtras();
      if (boss) {   // a checkpoint for good: runs can start at the next floor (#52, 1.4)
        n.checkpoint = n.floor + 1;
        if (!S.g.checkpoints.includes(n.checkpoint)) S.g.checkpoints.push(n.checkpoint);
        gainSouls(T.SOULS_PER_BOSS);
        toast(`Checkpoint: runs can start at floor ${n.checkpoint}. +${T.SOULS_PER_BOSS} Souls.`, '#8fb3ff');
      }
      if (!n.goblin && (n.floorMap === 'goblin' || chance(T.GOBLIN_CHANCE * (n.goodDog > 0 ? T.GOOD_BOY_GOBLIN : 1)))) { n.goblin = { t: T.GOBLIN_SEC }; toast('A LOOT GOBLIN!', '#f2b84b'); sfx.goblin(); }
      n.battleIdx++;
      n.phase = 'walk'; n.phaseT = 0;
    } else if (r === 'wipe') wipe();
  }
}

/** The next pack is placed in the corridor (#118): just off the right edge, or further if loot still lies ahead (he
 *  picks it all up on the way). It stands still; the walk brings it in. */
function plantPack() {
  const n = N();
  spawnBattle(n.floor, isBossBattle(), n.floorMap === 'elite');
  const front = Math.min(...n.enemies.map(e => ENEMY_SLOTS[e.slot]?.x ?? ENEMY_SLOTS[0].x));
  const loot = n.floorLoot.reduce((m, l) => Math.max(m, l.x), -1e9) - (POS_X[looterIndex()] + LOOTER_REACH) + 4;
  n.pack = { at: Math.max(T.PACK_ENTER_X - front, loot), front, spot: -1 };
}
/** A curio in the corridor would still be on screen when the pack arrives: wait. A passed one is fine if it is off
 *  the left edge by then (they both move with the corridor). */
function packFits(): boolean {
  const c = N().curioAt;
  return !c || (c.passed && c.x < T.CURIO_GONE_X + (T.PACK_ENTER_X - ENEMY_SLOTS[0].x));
}
/** The walk moved the corridor dx grid px: the pack comes up; its front enemy in view, it sees the party ("!"); in
 *  position, the fight starts. */
function walkPack(dx: number, dt: number) {
  const n = N(), p = n.pack!;
  p.at = Math.max(0, p.at - dx);
  if (p.spot >= 0) p.spot += dt;
  else if (p.front + p.at <= T.PACK_SPOT_X) { p.spot = 0; sfx.spotted(); }
  if (p.at <= 0) { n.pack = null; n.phase = 'battle'; n.phaseT = 0; }
}

/** PARTY WIPE (#52, 1.4): the run is lost (its unbanked items and gold), its Souls stay; the party wakes in town at
 *  full HP after the portal's travel time. He still slams the desk. */
function wipe() {
  const n = N();
  sfx.wipe();
  battleEnded();
  n.noise = Math.min(100, n.noise + T.ECHO_SLAM_NOISE);   // echo: he slams the desk, the dog comes to see
  if (n.dog.stage === 'away' && !n.unplugged) triggerDog();
  toast(`[You] You slam the desk. Noise +${T.ECHO_SLAM_NOISE}.`, '#ff8a80');
  const trash = !n.enemies.some(e => e.boss);
  n.floorLoot = []; n.dropQueue = []; n.lootFly = []; n.enemies = []; n.reserve = []; n.pack = null; n.goblin = null; n.curio = null; n.curioAt = null;
  loseRun();
  boysSay(trash ? 'wipeTrash' : 'wipe');   // the boys' chat (#109)
  S.g.heroes.forEach(h => { h.downed = false; h.hp = maxHp(h); h.atb = 0; h.queued = null; });
  n.clock += T.COST_TRAVEL_MIN;
  n.location = 'town'; n.phase = 'walk';
}

export function catchGoblin() {
  const n = N();
  if (!n.goblin) return;
  n.goblin = null;
  const den = n.floorMap === 'goblin';
  rollBattleDrops(n.floor, { count: den ? T.GOBLIN_DEN_DROPS : T.GOBLIN_DROPS, minRare: true });
  if (den) n.noise = Math.min(100, n.noise + T.GOBLIN_DEN_NOISE);
  toast(den ? 'Goblin caught! (it squeals)' : 'Goblin caught!', '#f2b84b'); sfx.goblinCatch();
}

export function useFeather(id: string) {
  const downed = S.g.heroes.find(h => h.downed);
  if (!downed) { toast('Nobody is down.', '#a999bd'); return; }
  removeEntry(id);
  reviveHero(downed, T.FEATHER_REVIVE_PCT);
  toast(`${heroLabel(downed.id)} revived!`, '#ff7ab8'); sfx.heal();
}

export function canLeaveDungeon() { const n = N(); return n.location === 'dungeon' && n.phase !== 'battle' && !n.run?.oath; }

/** The town portal: the run is banked (#52, 1.4). */
export function returnToTown() {
  const n = N();
  if (!canLeaveDungeon()) { toast(n.run?.oath ? "The Pilgrim's oath: no portal until the next boss is dead." : 'Finish the battle first.', '#a999bd'); return; }
  n.clock += T.COST_TRAVEL_MIN;
  sweepFloorLoot();
  bankRun();
  n.location = 'town'; n.enemies = []; n.reserve = []; n.pack = null; n.goblin = null; n.curio = null; n.curioAt = null; n.phase = 'walk';
  toast('Back in town.', '#8fb3ff');
}

/** A run starts at the Dungeon Portal, at floor 1 or an unlocked checkpoint (the town's floor picker). */
export function travelToDungeon(floor = S.g.startFloor) {
  const n = N();
  const start = S.g.checkpoints.includes(floor) ? floor : 1;
  n.clock += T.COST_TRAVEL_MIN;
  startRun(start);
  enterDungeon(start);
  toast(`Dungeon Portal: floor ${start}.`, '#8fb3ff');
}
/** The town's floor picker: floor 1 and every unlocked checkpoint. */
export function pickStartFloor(step: number) {
  const list = [...S.g.checkpoints].sort((a, b) => a - b);
  const i = Math.max(0, list.indexOf(S.g.startFloor));
  S.g.startFloor = list[Math.max(0, Math.min(list.length - 1, i + step))] ?? 1;
}

export { entryName };

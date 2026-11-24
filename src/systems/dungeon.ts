import { T } from '../config/tuning';
import { S, N, type MapKind } from '../core/state';
import { spawnBattle, updateBattle, reviveHero } from './battle';
import { rollBattleDrops, rollBattleExtras, removeEntry, entryName, moveFloorLoot, sweepFloorLoot } from './loot';
import { RANK_X, ENEMY_SLOTS, MID_SLOT, LOOTER_REACH } from '../core/arena';
import { gainGold, gainSouls, startRun, bankRun, loseRun } from './run';
import { maxHp } from './stats';
import { toastAs } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { chance } from '../core/rng';
import { sfx } from '../ui/audio';
import { MAP_INFO } from '../data/items';
import { isAway } from './autopilot';
import { planCurios, curioDue, startCurio, updateCurio, curioFloorEnd, battleEnded } from './curios';
import { triggerDog } from './pets';
import { tip } from './tips';

export const isBossBattle = () => { const n = N(); return !n.curioFight && n.floor % T.CHECKPOINT_EVERY === 0 && n.battleIdx === T.BATTLES_PER_FLOOR - 1; };

export function enterDungeon(floor: number) {
  const n = N();
  n.location = 'dungeon';
  n.floor = floor;
  startFloor('plain');
}

function startFloor(map: MapKind | 'plain') {
  const n = N();
  n.floorMap = map; n.battleIdx = 0; n.enemies = []; n.phaseT = 0;
  n.curio = null; n.curioFight = false; n.curioPlan = []; curioFloorEnd();
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
    toast('Treasure Vault! (loud)', '#ff9a4d');
    n.phase = 'walk'; n.phaseT = 0; n.battleIdx = T.BATTLES_PER_FLOOR; return;
  }
  planCurios();
  if (map === 'cursed') toast('Cursed Floor: your heals do half, every drop is one rarity better.', '#c77dff');
  if (map === 'goblin') toast('Goblin Den: a goblin after every battle. They squeal when caught.', '#9fe05a');
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
  n.phase = 'mapChoice'; n.phaseT = 0; n.enemies = []; tip('map');
}

export function chooseNextFloor(bagId: string | null) {
  const n = N();
  if (n.phase !== 'mapChoice') return;
  let kind: MapKind | 'plain' = 'plain';
  if (bagId) {
    const e = removeEntry(bagId);
    if (e && e.kind === 'map') kind = e.map;
  }
  n.floor++;
  sfx.click();
  if (kind !== 'plain') toast(`Next floor: ${MAP_INFO[kind].name}`, MAP_INFO[kind].color);
  startFloor(kind);
}

/** True while the player is inspecting an item or making a choice: the fight slows down. */

export function updateDungeon(realDt: number) {
  const n = N();
  if (n.location !== 'dungeon') return;
  const dt = realDt;   // an open item window does not slow the fight: gearing is part of the juggle (#49)
  if (n.goblin) { n.goblin.t -= dt; if (n.goblin.t <= 0) { n.goblin = null; toast('The loot goblin escaped.', '#a999bd'); sfx.goblinLost(); } }
  if (n.phase === 'curio') { updateCurio(realDt); return; }   // the party stands at a curio: your time, not the battle's
  n.phaseT += dt;
  if (n.phase === 'walk' && curioDue()) { startCurio(); return; }
  if (n.phase === 'walk') {   // the walk picks up the loot (#52, 1.3: no loot pause); it lasts at least WALK_SEC
    const sp = n.floorLoot.length ? 75 : 40;     // hurry over to the loot
    n.walkScroll += dt * sp;
    moveFloorLoot(dt * sp * 0.7, RANK_X[0] + LOOTER_REACH);   // the camera's pace on the grid (render/rpgView.ts)
    if (n.phaseT >= T.WALK_SEC && !n.floorLoot.length) {
      if (n.battleIdx >= T.BATTLES_PER_FLOOR) { floorEnd(); return; }
      spawnBattle(n.floor, isBossBattle(), n.floorMap === 'elite');
      n.phase = 'battle'; n.phaseT = 0;
    }
  } else if (n.phase === 'battle') {
    const r = updateBattle(dt);
    if (r === 'victory') battleEnded();
    if (r === 'victory' && n.curioFight) {   // the troll: extra loot, then the walk goes on (not one of the floor's battles)
      const x = ENEMY_SLOTS[MID_SLOT].x;
      rollBattleDrops(n.floor, { count: T.CURIO_TROLL_DROPS, minRare: true, at: [x - 20, x, x + 20] });
      toast('The troll is down. His pile is yours.', '#f2b84b');
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
      if (!n.goblin && (n.floorMap === 'goblin' || chance(T.GOBLIN_CHANCE * (n.goodDog > 0 ? T.GOOD_BOY_GOBLIN : 1)))) { n.goblin = { t: T.GOBLIN_SEC }; toast('A LOOT GOBLIN! Click it!', '#f2b84b'); sfx.goblin(); }
      n.battleIdx++;
      n.phase = 'walk'; n.phaseT = 0;
    } else if (r === 'wipe') wipe();
  }
}

/** PARTY WIPE (#52, 1.4): the run is lost (its unbanked items and gold), its Souls stay; the party wakes in town at
 *  full HP after the portal's travel time. He still slams the desk. */
function wipe() {
  const n = N();
  sfx.wipe();
  battleEnded();
  n.noise = Math.min(100, n.noise + T.ECHO_SLAM_NOISE);   // echo: he slams the desk, the dog comes to see
  if (n.dog.stage === 'away' && !n.unplugged) triggerDog();
  toast(`You slam the desk. Noise +${T.ECHO_SLAM_NOISE}.`, '#ff8a80');
  n.floorLoot = []; n.dropQueue = []; n.lootFly = []; n.enemies = []; n.reserve = []; n.goblin = null;
  loseRun();
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
  toast(`${downed.name} revived!`, '#ff7ab8'); sfx.heal();
}

export function canLeaveDungeon() { const n = N(); return n.location === 'dungeon' && n.phase !== 'battle'; }

/** The town portal: the run is banked (#52, 1.4). */
export function returnToTown() {
  const n = N();
  if (!canLeaveDungeon()) { toast('Finish the battle first.', '#a999bd'); return; }
  n.clock += T.COST_TRAVEL_MIN;
  sweepFloorLoot();
  bankRun();
  n.location = 'town'; n.enemies = []; n.reserve = []; n.goblin = null; n.phase = 'walk';
  toast('Back in town (15 min)', '#8fb3ff');
}

/** A run starts at the Dungeon Portal, at floor 1 or an unlocked checkpoint (the town's floor picker). */
export function travelToDungeon(floor = S.g.startFloor) {
  const n = N();
  const start = S.g.checkpoints.includes(floor) ? floor : 1;
  n.clock += T.COST_TRAVEL_MIN;
  startRun(start);
  enterDungeon(start);
  toast(`Dungeon gate: floor ${start} (15 min)`, '#8fb3ff');
}
/** The town's floor picker: floor 1 and every unlocked checkpoint. */
export function pickStartFloor(step: number) {
  const list = [...S.g.checkpoints].sort((a, b) => a - b);
  const i = Math.max(0, list.indexOf(S.g.startFloor));
  S.g.startFloor = list[Math.max(0, Math.min(list.length - 1, i + step))] ?? 1;
}

export { entryName };

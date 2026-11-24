import { T } from '../config/tuning';
import { S, N, type CurioState, type PartyBuff } from '../core/state';
import { CURIOS, CURIO_BY_ID, CURIO_LINES, TROLL, type CurioDef } from '../data/curios';
import { chance, pick, randi, rand } from '../core/rng';
import { toastAs } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { rollBattleDrops } from './loot';
import { spawnCurioFight } from './battle';
import { isAway } from './autopilot';
import { FEATURES } from '../data/routes';
/** Curios that only stand where a path's feature puts them? None yet: every curio can also turn up at random. */
const FEATURE_ONLY = new Set<string>();
import { addBlessing, blessCount } from './run';
import { maxHp } from './stats';
import { BLESSINGS, type BlessingId } from '../data/blessings';

// Curios in the corridor (docs/design/dungeon.md, #30). The party stops at one during a walk; you choose,
// and every choice costs something from real life: Noise, time standing still, a real can, Mood-adjacent trouble.

/** At the start of a battle floor: which walks (before battle 0, 1, 2) get a curio. */
export function planCurios() {
  const n = N();
  n.featureMet = false;
  const count = Math.max(n.feature && FEATURES[n.feature].curio ? 1 : 0, randi(...T.CURIO_PER_FLOOR));
  const idx = [...Array(T.BATTLES_PER_FLOOR).keys()].sort(() => Math.random() - 0.5);
  n.curioPlan = idx.slice(0, count);
}

/** During a walk: is it time to stop at a curio? Halfway through the walk before a planned battle. */
export function curioDue(): boolean {
  const n = N();
  return n.phase === 'walk' && n.curioPlan.includes(n.battleIdx) && n.phaseT >= T.WALK_SEC * 0.5 && !n.floorLoot.length && !n.looterDx;
}

export function startCurio() {
  const n = N();
  n.curioPlan = n.curioPlan.filter(i => i !== n.battleIdx);
  const recent = new Set(S.g.curiosSeen.slice(-3));   // avoid repeats within the last few
  const feat = n.feature ? FEATURES[n.feature].curio : undefined;   // the path's feature stands here (#52, 1.5)
  const def = feat && !n.featureMet ? CURIO_BY_ID[feat] : pick(CURIOS.filter(c => !recent.has(c.id) && !FEATURE_ONLY.has(c.id)));
  if (feat) n.featureMet = true;
  S.g.curiosSeen = [...S.g.curiosSeen, def.id].slice(-6);
  n.curio = { id: def.id, stage: 'ask', t: T.CURIO_WAIT_SEC, max: T.CURIO_WAIT_SEC };
  n.phase = 'curio';
  sfx.click();
  if (isAway()) {   // the reckless autopilot handles it, or walks past
    if (chance(T.CURIO_AWAY_RECKLESS)) { toast(`[Party] ${def.awayLine}`, '#8fd0ff'); chooseCurio(def.reckless); }
    else endCurio();
  }
}

/** Real seconds pass (the curio runs on your time, not the battle's). */
export function updateCurio(realDt: number) {
  const n = N();
  const c = n.curio;
  if (!c) return;
  c.t -= realDt;
  if (c.stage === 'sneak' && (n.monitor !== 'rpg' || n.switching || n.monitorOff > 0)) {   // you looked away: he wakes
    toast('The troll wakes up and roars!', '#ff8a80'); sfx.bad();
    return trollFight();
  }
  if (c.t > 0) return;
  if (c.stage === 'ask') { toast('The party walks past.', '#a999bd'); return endCurio(); }
  if (c.stage === 'pick') { toast('Click. The chest opens.', '#f2b84b'); sfx.good(); rollBattleDrops(n.floor, { count: T.CURIO_BOX_DROPS, minRare: true }); return endCurio(); }
  if (c.stage === 'sneak') { toast('You tiptoe away with an armful. He keeps snoring.', '#6fcf7f'); sfx.good(); rollBattleDrops(n.floor, { count: T.CURIO_TROLL_DROPS, minRare: true }); return endCurio(); }
}

/** Can this choice be taken right now? Returns the reason if not. */
export function curioBlocked(_choice: string): string {
  return '';
}

export function chooseCurio(choice: string) {
  const n = N();
  const c = n.curio;
  if (!c || c.stage !== 'ask' || curioBlocked(choice)) return;
  const noise = (v: number) => { n.noise = Math.min(100, n.noise + v); };
  switch (choice) {
    case 'pick': c.stage = 'pick'; c.t = c.max = T.CURIO_PICK_SEC; sfx.click(); return;
    case 'smash': noise(T.CURIO_SMASH_NOISE); sfx.slam(); toast(`CRASH. The chest gives up. Noise +${T.CURIO_SMASH_NOISE}.`, '#ff9a4d'); rollBattleDrops(n.floor, { count: T.CURIO_BOX_DROPS, minRare: true }); break;
    case 'open': {
      noise(T.CURIO_GROAN_NOISE);
      const r = Math.random(), [g, rare] = T.CURIO_MAIL_ODDS;
      if (r < g) { const gold = T.CURIO_MAIL_GOLD * n.floor; S.g.gold += gold; toast(`Old coins! +${gold} gold.`, '#f2b84b'); sfx.coin(); }
      else if (r < g + rare) { toast('A relic lies inside.', '#f2b84b'); rollBattleDrops(n.floor, { count: 1, minRare: true }); }
      else { addBuff({ name: 'Curse', dmg: -T.CURIO_FEE_DMG, speed: 0, t: 1, max: 1, icon: 'curse', floor: true }); toast(CURIO_LINES.curse.replace('{fee}', String(Math.round(T.CURIO_FEE_DMG * 100))), '#ff8a80'); sfx.bad(); }
      break;
    }
    // run blessings (#52, 1.5b): each lasts until the run ends and has its cost
    case 'shrine': noise(T.BLESS_SHRINE_NOISE); sfx.bad(); bless('shrine'); break;
    case 'pilgrim': n.run && (n.run.oath = true); sfx.good(); bless('pilgrim'); break;
    case 'supply': bless('supply'); S.g.heroes.forEach(h => { h.hp = Math.min(h.hp, maxHp(h)); }); sfx.heal(); break;
    case 'altar': bless('altar'); sfx.bad(); break;
    case 'moonwell': n.flow = T.FLOW_MIN; bless('moonwell'); sfx.heal(); break;
    case 'ritual': bless('ritual'); sfx.windup(); break;
    case 'potion':
      noise(T.CURIO_KICK_NOISE); sfx.slam();
      if (chance(0.5)) bless('potion');
      else { S.g.heroes.forEach(h => { if (!h.downed) h.hp = Math.max(1, Math.round(h.hp - maxHp(h) * T.BLESS_POTION_GLASS)); }); toast(`CRASH. Broken glass: the party loses ${Math.round(T.BLESS_POTION_GLASS * 100)}% HP. Noise +${T.CURIO_KICK_NOISE}.`, '#ff9a4d'); }
      break;
    case 'sneak': c.stage = 'sneak'; c.t = c.max = T.CURIO_SNEAK_SEC; toast('Sneaking. Stay on this screen.', '#8fd0ff'); return;
    case 'fight': return trollFight();
    case 'withdraw': {
      const before = S.g.bag.length;
      rollBattleDrops(n.floor, { count: 1, minRare: true });
      const got = S.g.bag.length > before ? S.g.bag[S.g.bag.length - 1] : null;
      n.bankItem = got?.kind === 'item' ? got.item.name : 'thing';
      n.bankNotice = rand(...T.CURIO_BANK_NOTICE_SEC);
      toast('You take one item. Nobody saw. Probably.', '#f2b84b'); sfx.coin();
      break;
    }
    case 'leave': toast('You leave it alone.', '#a999bd'); break;
  }
  endCurio();
}

/** A run blessing joins the run (it shows in the buffs row with a dashed frame and "run"). */
function bless(id: BlessingId) {
  addBlessing(id);
  const b = BLESSINGS[id], k = blessCount(id);
  toast(`${b.name}${k > 1 ? ` x${k}` : ''}, this run: ${b.got}. ${b.cost}.`, '#6ef06e');
}

function trollFight() {
  const n = N();
  n.noise = Math.min(100, n.noise + T.CURIO_ROAR_NOISE);
  n.curio = null; n.curioFight = true;
  spawnCurioFight(TROLL);
  n.phase = 'battle'; n.phaseT = 0;
  sfx.windup();
}

/** Walk on (the walk resumes halfway, as it was). */
export function endCurio() {
  const n = N();
  n.curio = null;
  if (n.phase === 'curio') n.phase = 'walk';
}

/** Adds a party buff (replaces one with the same name). Also used by the friends' raid buff. */
export function addBuff(b: PartyBuff) {
  const n = N();
  n.partyBuffs = [...n.partyBuffs.filter(x => x.name !== b.name), b];
}

/** Every frame: buffs tick, the bank log gets read. */
export function updateCurioTimers(dt: number) {
  const n = N();
  n.partyBuffs = n.partyBuffs.filter(b => b.floor || b.night || b.untilBoss || b.fights !== undefined || (b.t -= dt) > 0);
  n.sulk = Math.max(0, n.sulk - dt);
  if (n.bankNotice > 0) {
    n.bankNotice -= dt;
    if (n.bankNotice <= 0) {
      n.bankNotice = 0; n.sulk = T.CURIO_SULK_SEC;
      toast(pick(CURIO_LINES.bankNotice).replace('{item}', n.bankItem), '#8fd0ff');
      toast(`Magoo sulks: mage -${Math.round(T.CURIO_SULK_DMG * 100)}% damage for ${T.CURIO_SULK_SEC} s.`, '#ff8a80');
    }
  }
}
/** A new floor: "until the next floor" buffs (the curse) end. */
export function curioFloorEnd() { const n = N(); n.partyBuffs = n.partyBuffs.filter(b => !b.floor); }

/** A battle ended: "next fight" buffs (Loved) are used up. */
export function battleEnded(boss = false) { const n = N(); n.partyBuffs = n.partyBuffs.filter(b => !(boss && b.untilBoss) && (b.fights === undefined || --b.fights > 0)); }   // the Raid buff lasts until a boss is down
/** Cooldowns from real-life buffs (the courier's gaming mouse, #54). */
export const partyCdMult = () => N().partyBuffs.reduce((m, b) => m * (1 - (b.cd ?? 0)), 1);
export const partyCrit = () => N().partyBuffs.reduce((s, b) => s + (b.crit ?? 0), 0) + T.BLESS_ALTAR_CRIT * blessCount('altar');
export const curioDmgMult = () => N().partyBuffs.reduce((m, b) => m * (1 + b.dmg), 1);
export const curioSpeedMult = () => N().partyBuffs.reduce((m, b) => m * (1 + b.speed), 1);
export const curioDef = (c: CurioState | null): CurioDef | undefined => c ? CURIO_BY_ID[c.id] : undefined;

/** Button text with the numbers filled in. */
export function curioText(s: string): string {
  return s.replace('{pick}', String(T.CURIO_PICK_SEC)).replace('{smash}', String(T.CURIO_SMASH_NOISE)).replace('{groan}', String(T.CURIO_GROAN_NOISE))
    .replace('{bell}', String(T.BLESS_SHRINE_NOISE)).replace('{sneak}', String(T.CURIO_SNEAK_SEC)).replace('{roar}', String(T.CURIO_ROAR_NOISE))
    .replace('{kick}', String(T.CURIO_KICK_NOISE));
}

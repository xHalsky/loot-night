import { T } from '../config/tuning';
import { S, N, type CurioState } from '../core/state';
import { CURIOS, CURIO_BY_ID, CURIO_LINES, TROLL, type CurioDef } from '../data/curios';
import { chance, pick, randi, rand } from '../core/rng';
import { toast } from '../core/fx';
import { sfx } from '../ui/audio';
import { rollBattleDrops } from './loot';
import { spawnCurioFight, healParty } from './battle';
import { isAway } from './autopilot';

// Curios in the corridor (docs/design/dungeon.md, #30). The party stops at one during a walk; you choose,
// and every choice costs something from real life: Noise, time standing still, a real can, Mood-adjacent trouble.

/** At the start of a battle floor: which walks (before battle 0, 1, 2) get a curio. */
export function planCurios() {
  const n = N();
  const count = randi(...T.CURIO_PER_FLOOR);
  const idx = [...Array(T.BATTLES_PER_FLOOR).keys()].sort(() => Math.random() - 0.5);
  n.curioPlan = idx.slice(0, count);
}

/** During a walk: is it time to stop at a curio? Halfway through the walk before a planned battle. */
export function curioDue(): boolean {
  const n = N();
  return n.phase === 'walk' && n.curioPlan.includes(n.battleIdx) && n.phaseT >= T.WALK_SEC * 0.5 && !n.floorLoot.length;
}

export function startCurio() {
  const n = N();
  n.curioPlan = n.curioPlan.filter(i => i !== n.battleIdx);
  const recent = new Set(S.g.curiosSeen.slice(-3));   // avoid repeats within the last few
  const def = pick(CURIOS.filter(c => !recent.has(c.id)));
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
    toast('The troll wakes up! "WHO TOUCHED MY PILE?"', '#ff8a80'); sfx.bad();
    return trollFight();
  }
  if (c.t > 0) return;
  if (c.stage === 'ask') { toast('The party walks past.', '#a999bd'); return endCurio(); }
  if (c.stage === 'pick') { toast('Click. The strongbox opens.', '#f2b84b'); sfx.good(); rollBattleDrops(n.floor, { count: T.CURIO_BOX_DROPS, minRare: true }); return endCurio(); }
  if (c.stage === 'sneak') { toast('You tiptoe away with an armful. He keeps snoring.', '#6fcf7f'); sfx.good(); rollBattleDrops(n.floor, { count: T.CURIO_TROLL_DROPS, minRare: true }); return endCurio(); }
}

/** Can this choice be taken right now? Returns the reason if not. */
export function curioBlocked(choice: string): string {
  if (choice === 'offer' && S.g.monsters <= 0) return 'No cans on the desk';
  if (choice === 'pay' && S.g.gold < vendCost()) return 'Not enough gold';
  return '';
}
export const vendCost = () => T.CURIO_VEND_GOLD * N().floor;

export function chooseCurio(choice: string) {
  const n = N();
  const c = n.curio;
  if (!c || c.stage !== 'ask' || curioBlocked(choice)) return;
  const noise = (v: number) => { n.noise = Math.min(100, n.noise + v); };
  switch (choice) {
    case 'pick': c.stage = 'pick'; c.t = c.max = T.CURIO_PICK_SEC; sfx.click(); return;
    case 'smash': noise(T.CURIO_SMASH_NOISE); sfx.slam(); toast(`CRASH. The strongbox gives up. Noise +${T.CURIO_SMASH_NOISE}.`, '#ff9a4d'); rollBattleDrops(n.floor, { count: T.CURIO_BOX_DROPS, minRare: true }); break;
    case 'open': {
      noise(T.CURIO_GROAN_NOISE);
      const r = Math.random(), [g, rare] = T.CURIO_MAIL_ODDS;
      if (r < g) { const gold = T.CURIO_MAIL_GOLD * n.floor; S.g.gold += gold; toast(`A refund cheque! +${gold} gold.`, '#f2b84b'); sfx.coin(); }
      else if (r < g + rare) { toast('A parcel. With your name on it.', '#f2b84b'); rollBattleDrops(n.floor, { count: 1, minRare: true }); }
      else { addBuff({ name: 'Late fee', dmg: -T.CURIO_FEE_DMG, speed: 0, t: 1, floor: true }); toast(CURIO_LINES.lateFee.replace('{fee}', String(Math.round(T.CURIO_FEE_DMG * 100))), '#ff8a80'); sfx.bad(); }
      break;
    }
    case 'offer':
      S.g.monsters--;
      addBuff({ name: 'Monster blessing', dmg: T.CURIO_CAN_DMG, speed: T.CURIO_CAN_SPD, t: T.CURIO_CAN_SEC });
      toast(`You give up a real can. The shrine glows. Party +${Math.round(T.CURIO_CAN_DMG * 100)}% damage, +${Math.round(T.CURIO_CAN_SPD * 100)}% speed.`, '#6ef06e'); sfx.heal();
      break;
    case 'pray':
      if (chance(0.5)) { addBuff({ name: 'Small blessing', dmg: T.CURIO_PRAY_DMG, speed: 0, t: T.CURIO_PRAY_SEC }); toast(`A small blessing. Party +${Math.round(T.CURIO_PRAY_DMG * 100)}% damage.`, '#6ef06e'); sfx.heal(); }
      else { noise(T.CURIO_BURP_NOISE); toast(`The shrine burps. Loudly. Noise +${T.CURIO_BURP_NOISE}.`, '#ff9a4d'); sfx.bad(); }
      break;
    case 'sneak': c.stage = 'sneak'; c.t = c.max = T.CURIO_SNEAK_SEC; toast('Sneaking. Stay on this screen.', '#8fd0ff'); return;
    case 'fight': return trollFight();
    case 'withdraw': {
      const before = S.g.bag.length;
      rollBattleDrops(n.floor, { count: 1, minRare: true });
      const got = S.g.bag.length > before ? S.g.bag[S.g.bag.length - 1] : null;
      n.bankItem = got?.kind === 'item' ? got.item.name : 'thing';
      n.bankNotice = rand(...T.CURIO_BANK_NOTICE_SEC);
      toast('You take just one thing. Nobody saw. Probably.', '#f2b84b'); sfx.coin();
      break;
    }
    case 'pay': S.g.gold -= vendCost(); healParty(T.CURIO_VEND_HEAL); toast(`Crisps for everyone. Party heals ${Math.round(T.CURIO_VEND_HEAL * 100)}%.`, '#6fcf7f'); sfx.coin(); break;
    case 'kick':
      noise(T.CURIO_KICK_NOISE);
      if (chance(0.5)) { healParty(T.CURIO_VEND_HEAL); toast(`THUNK. Snacks fall out. Party heals. Noise +${T.CURIO_KICK_NOISE}.`, '#6fcf7f'); sfx.slam(); }
      else { toast(`THUNK. Nothing. Your foot hurts. Noise +${T.CURIO_KICK_NOISE}.`, '#ff9a4d'); sfx.slam(); }
      break;
    case 'leave': toast('You leave it alone.', '#a999bd'); break;
  }
  endCurio();
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

function addBuff(b: { name: string; dmg: number; speed: number; t: number; floor?: boolean }) {
  const n = N();
  n.curioBuffs = [...n.curioBuffs.filter(x => x.name !== b.name), b];
}

/** Every frame: buffs tick, the bank log gets read. */
export function updateCurioTimers(dt: number) {
  const n = N();
  n.curioBuffs = n.curioBuffs.filter(b => b.floor || (b.t -= dt) > 0);
  n.sulk = Math.max(0, n.sulk - dt);
  if (n.bankNotice > 0) {
    n.bankNotice -= dt;
    if (n.bankNotice <= 0) {
      n.bankNotice = 0; n.sulk = T.CURIO_SULK_SEC;
      toast(pick(CURIO_LINES.bankNotice).replace('{item}', n.bankItem), '#8fd0ff');
      toast(`Rafał sulks: mage -${Math.round(T.CURIO_SULK_DMG * 100)}% damage for ${T.CURIO_SULK_SEC} s.`, '#ff8a80');
    }
  }
}
/** A new floor: "until the next floor" buffs (the late fee) end. */
export function curioFloorEnd() { const n = N(); n.curioBuffs = n.curioBuffs.filter(b => !b.floor); }

export const curioDmgMult = () => N().curioBuffs.reduce((m, b) => m * (1 + b.dmg), 1);
export const curioSpeedMult = () => N().curioBuffs.reduce((m, b) => m * (1 + b.speed), 1);
export const curioDef = (c: CurioState | null): CurioDef | undefined => c ? CURIO_BY_ID[c.id] : undefined;

/** Button text with the numbers filled in. */
export function curioText(s: string): string {
  return s.replace('{pick}', String(T.CURIO_PICK_SEC)).replace('{smash}', String(T.CURIO_SMASH_NOISE)).replace('{groan}', String(T.CURIO_GROAN_NOISE))
    .replace('{canDmg}', String(Math.round(T.CURIO_CAN_DMG * 100))).replace('{canSpd}', String(Math.round(T.CURIO_CAN_SPD * 100))).replace('{canSec}', String(T.CURIO_CAN_SEC))
    .replace('{burp}', String(T.CURIO_BURP_NOISE)).replace('{sneak}', String(T.CURIO_SNEAK_SEC)).replace('{roar}', String(T.CURIO_ROAR_NOISE))
    .replace('{vendGold}', String(vendCost())).replace('{vendHeal}', String(Math.round(T.CURIO_VEND_HEAL * 100))).replace('{kick}', String(T.CURIO_KICK_NOISE));
}

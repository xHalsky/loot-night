import { T } from '../config/tuning';
import { S, N, type Enemy, type Hero, type VfxKind, type MarkId } from '../core/state';
import { ENEMIES, BOSSES, ENEMY_BY_ID, bossFor, type EnemyDef } from '../data/enemies';
import { ABILITIES } from '../data/heroes';
import { pick, randi, rand, chance } from '../core/rng';
import { heroStats, maxHp, xpNeeded } from './stats';
import { floatText, toastAs } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { speedMult } from './tired';
import { CD_PCT } from '../data/city';
import { isAway, autopilotPull, autopilotHurt } from './autopilot';
import { MARKS } from '../data/marks';
import { overtimeGold } from './affixes';
import { curioDmgMult, curioSpeedMult, partyCrit } from './curios';
import { coach } from './coach';

export const HERO_X = [208, 124, 40];   // knight in front (right), healer at the back
export const ENEMY_X = [380, 457, 534];
export const UNIT_Y = 212;
let enemyUid = 1;
// A multi-hit skill (Storm, Rally) is one noisy moment: its crits add Noise once, its extra actions don't clack.
let loudOnce = false, critHeard = false;

// Visual effects on the monitor (docs/design/dungeon.md: every action must be visible).
export const heroCenter = (i: number) => ({ x: HERO_X[i] + 30, y: UNIT_Y + 40 });
export function enemyCenter(e: Enemy) { const i = N().enemies.indexOf(e); return e.boss ? { x: 542, y: UNIT_Y + 24 } : { x: ENEMY_X[Math.max(0, i)] + 30, y: UNIT_Y + 40 }; }
function vfx(kind: VfxKind, at: { x: number; y: number }, from?: { x: number; y: number }, dur = 0.4) {
  N().vfx.push({ kind, x: at.x, y: at.y, x2: from?.x ?? at.x, y2: from?.y ?? at.y, t: 0, dur, seed: Math.random() });
}

function makeEnemy(def: EnemyDef, floor: number, elite: boolean): Enemy {
  const hpM = (1 + T.ENEMY_HP_PER_FLOOR * (floor - 1)) * (elite ? T.ELITE_MULT : 1);
  const atkM = (1 + T.ENEMY_ATK_PER_FLOOR * (floor - 1)) * (elite ? T.ELITE_MULT : 1);
  const hp = Math.round(def.hp * hpM);
  const e: Enemy = { uid: enemyUid++, defId: def.id, name: def.name, hp, maxHp: hp, atk: def.atk * atkM, armor: def.armor * (1 + 0.1 * floor), speed: def.speed, atb: rand(0, 40), turnsAlive: 0, stunned: 0, boss: !!def.boss, flash: 0 };
  if (def.role === 'shield') e.shield = true;
  if (def.role === 'swarm') e.per = hp / def.stacks!;
  meet(def);
  return e;
}
/** The first time you meet an enemy type, a line says what it wants from you. */
function meet(def: EnemyDef) {
  if (!def.meet || S.g.seen.includes(def.id)) return;
  S.g.seen.push(def.id);
  toast(def.meet, def.boss ? '#f2b84b' : '#ffd9a0');
}
export const roleOf = (e: Enemy) => ENEMY_BY_ID[e.defId]?.role;
export const moveOf = (e: Enemy) => ENEMY_BY_ID[e.defId]?.move;
/** Swarm bodies left (imps). */
export const bodies = (e: Enemy) => e.per ? Math.max(0, Math.ceil(e.hp / e.per - 1e-6)) : e.hp > 0 ? 1 : 0;

export function spawnBattle(floor: number, boss: boolean, elite: boolean) {
  const n = N();
  const pool = ENEMIES.filter(d => (d.from ?? 1) <= floor);
  if (boss) n.enemies = [makeEnemy(pick(pool), floor, elite), makeEnemy(bossFor(floor, T.CHECKPOINT_EVERY), floor, elite)];
  else {
    const count = randi(2, 3);
    n.enemies = Array.from({ length: count }, () => makeEnemy(pick(pool), floor, elite));
  }
  if (isAway()) { n.enemies.forEach(e => { e.atb = rand(...T.AUTOPILOT_AMBUSH_ATB); }); autopilotPull(); }
}
export { BOSSES };

/** A curio's fight (the troll): one mini-boss, scaled like the floor. */
export function spawnCurioFight(def: EnemyDef) {
  const n = N();
  n.enemies = [makeEnemy(def, n.floor, n.floorMap === 'elite')];
  if (isAway()) { n.enemies[0].atb = rand(...T.AUTOPILOT_AMBUSH_ATB); autopilotPull(); }
}
/** Heals every living hero for a share of their max HP. */
export function healParty(pct: number) { aliveHeroes().forEach(h => healHero(h, maxHp(h) * pct)); }

export const aliveHeroes = () => S.g.heroes.filter(h => !h.downed);
export const abilityUnlocked = (h: Hero, slot: number) => slot <= 3 && h.level >= T.ABILITY_UNLOCK[slot];

export function abilitiesLocked(): string | null {
  const n = S.g.night;
  if (!n) return 'No night';
  if (n.location !== 'dungeon') return 'In town';
  if (n.action !== 'none') return 'Hands busy';
  if (n.switching) return 'Switching window';
  if (n.monitor === 'excel') return 'Excel is up';
  if (n.monitorOff > 0) return 'Monitor off';
  return null;
}

export function queueAbility(heroIdx: number, slot: number) {
  const h = S.g.heroes[heroIdx];
  if (!h || slot === 0 || h.downed) return;
  if (abilitiesLocked()) { sfx.bad(); return; }
  if (!abilityUnlocked(h, slot) || h.cd[slot] > 0) { sfx.bad(); return; }
  const n = N();
  if (n.phase !== 'battle' || !n.enemies.some(e => e.hp > 0)) { toast('No enemies in reach.', '#a999bd'); sfx.bad(); return; }
  // Cast right now: no waiting for the hero's turn, no global cooldown.
  h.lunge = 0.3;
  castAbility(h, slot);
}

function castAbility(h: Hero, slot: number) {
  const n = N();
  const me = heroCenter(S.g.heroes.indexOf(h));
  const st = heroStats(h);
  const mult = heroDamageMult(h);
  h.queued = null;
  h.cd[slot] = ABILITIES[h.id][slot].cd * (1 - CD_PCT[S.g.furniture.library ?? 0]);
  n.noise = Math.min(100, n.noise + T.NOISE_ABILITY);
  sfx.ability();
  const A = ABILITIES[h.id][slot];
  if (h.id === 'knight' && slot === 1) {
    n.taunt = A.dur!; vfx('taunt', me, undefined, 0.7); toast(`${h.name}: TAUNT`, '#6aa8ff');
    n.enemies.filter(e => e.hp > 0).forEach(e => mark(e, 'taunted', A.dur!));
    return;
  }
  if (h.id === 'knight' && slot === 2) {
    const e = bashTarget();
    if (e) {
      if (e.shield) { e.shield = false; const c = enemyCenter(e); floatText(c.x, UNIT_Y - 58, 'SHIELD BROKEN!', '#8fd8ff'); sfx.crit(); }
      const shatter = cashIn(e, 'chill', `SHATTER x${T.MARK_CHILL_BASH}`) ? T.MARK_CHILL_BASH : 1;
      hitEnemy(e, st.atk * A.power! * mult * shatter, st.crit, 'bash');
      if (e.hp > 0) mark(e, 'stagger');
      const slam = (e.wind ?? 0) > 0 && moveOf(e) === 'slam';
      if (slam && e.braced) toast(`${e.name} is braced: Bash can't stop it. Ward or Taunt!`, '#ff8a80');
      else if ((e.wind ?? 0) > 0 && !slam) { /* only SMASH can be interrupted */ }
      else { e.stunned = 1; if (slam) { e.wind = 0; e.braced = true; toast(`${h.name} interrupts SMASH! The boss braces for the next one.`, '#8fb3ff'); sfx.good(); } }
    }
    return;
  }
  if (h.id === 'knight' && slot === 3) {
    n.rally = A.dur!; toast(`${h.name}: RALLY! Everyone, now!`, '#f2b84b');
    loudOnce = true; critHeard = false;
    aliveHeroes().forEach(x => { vfx('taunt', heroCenter(S.g.heroes.indexOf(x)), undefined, 0.5); heroAct(x, true); });
    loudOnce = false;
    return;
  }
  if (h.id === 'mage' && slot === 1) {
    n.enemies.filter(e => e.hp > 0).forEach(e => {
      const m = cashIn(e, 'stagger', `STAGGER x${T.MARK_STAGGER_FIRE}`) ? T.MARK_STAGGER_FIRE : 1;
      hitEnemy(e, st.atk * A.power! * mult * m, st.crit, 'fire', me);
    });
    return;
  }
  if (h.id === 'mage' && slot === 2) { const e = frostTarget(); if (e) { hitEnemy(e, st.atk * A.power! * mult, st.crit, 'frost', me); if (e.hp > 0) mark(e, 'chill'); } return; }
  if (h.id === 'mage' && slot === 3) {
    loudOnce = true; critHeard = false;
    for (let i = 0; i < A.hits!; i++) {
      const alive = n.enemies.filter(e => e.hp > 0);
      if (!alive.length) break;
      const e = pick(alive), c = enemyCenter(e);
      hitEnemy(e, st.atk * A.power! * mult, st.crit, 'bolt', { x: c.x + rand(-40, 40), y: 30 });
    }
    loudOnce = false;
    return;
  }
  if (h.id === 'healer' && slot === 1) { sfx.heal(); aliveHeroes().forEach(x => healHero(x, st.atk * A.power! + A.flat!)); return; }
  if (h.id === 'healer' && slot === 2) { n.ward = A.dur!; vfx('ward', heroCenter(1), undefined, 0.8); toast(`${h.name}: WARD`, '#6fcf7f'); return; }
  if (h.id === 'healer' && slot === 3) {
    const down = S.g.heroes.find(x => x.downed);
    sfx.heal();
    if (down) { reviveHero(down, A.power!); vfx('heal', heroCenter(S.g.heroes.indexOf(down)), undefined, 1); toast(`${h.name}: REVIVE! ${down.name} is back.`, '#6fcf7f'); return; }
    const low = mostHurt();
    if (low) healHero(low, maxHp(low) * A.power!);
    return;
  }
}

/** Puts a mark on an enemy (docs/design/dungeon.md). Shows its name once over the enemy. */
function mark(e: Enemy, id: MarkId, sec = T.MARK_SEC) {
  e.marks ??= {};
  const fresh = !(e.marks[id]! > 0);
  e.marks[id] = Math.max(e.marks[id] ?? 0, sec);
  if (fresh) { const c = enemyCenter(e); floatText(c.x, UNIT_Y - 46, MARKS[id].tag, MARKS[id].color); }
}
/** Spends a mark if the enemy has it. Returns true when the combo fires. */
function cashIn(e: Enemy, id: MarkId, label: string): boolean {
  if (!(e.marks?.[id]! > 0)) return false;
  delete e.marks![id];
  const c = enemyCenter(e); floatText(c.x, UNIT_Y - 58, label + '!', MARKS[id].color);
  sfx.crit();
  return true;
}
const mostHurt = () => aliveHeroes().sort((a, b) => a.hp / maxHp(a) - b.hp / maxHp(b))[0];

function heroDamageMult(h?: Hero): number {
  const n = N();
  return n.flow * (n.guilt > 0 ? 1 - T.GUILT_DMG : 1) * (n.rally > 0 ? 1 + ABILITIES.knight[3].power! : 1) * curioDmgMult()
    * (h?.id === 'mage' && n.sulk > 0 ? 1 - T.CURIO_SULK_DMG : 1);   // Magoo read the guild bank log
}

function hitEnemy(e: Enemy, raw: number, crit: number, kind: VfxKind = 'slash', from?: { x: number; y: number }, skill = true): number {
  const n = N();
  vfx(kind, enemyCenter(e), from, kind === 'bolt' ? 0.35 : kind === 'fire' ? 0.6 : 0.35);
  if (n.tired >= T.TIRED_SLUGGISH && chance(T.ECHO_DROWSY_MISS)) {   // Drowsy: your eyes close mid-swing
    const c = enemyCenter(e); floatText(c.x + rand(-10, 10), UNIT_Y - 34, 'zzz', '#a999bd');
    return 0;
  }
  const isCrit = chance((crit + partyCrit()) / 100);
  let dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) - e.armor * 0.5));
  if (isCrit) { dmg *= 2; if (!loudOnce || !critHeard) n.noise += T.NOISE_CRIT; critHeard = true; }
  if (e.shield) dmg = Math.max(1, Math.round(dmg * T.SHIELD_TAKEN));
  if (e.per) {   // a swarm: one body per single hit; Fire hits every body
    const left = bodies(e), cur = e.hp - (left - 1) * e.per;
    dmg = Math.round(kind === 'fire' ? Math.min(dmg, e.per) * (left - 1) + Math.min(dmg, cur) : Math.min(dmg, cur));
    dmg = Math.max(1, dmg);
  }
  e.hp -= dmg; e.flash = 0.15;
  if (e.boss && !e.enraged && e.hp > 0 && e.hp < e.maxHp * T.ECHO_ENRAGE_HP) {   // enrage: the fight of the night, don't look away
    e.enraged = true; sfx.enrage();
    toast(`${e.name} is ENRAGED! Flow builds faster. Alt-tab now and you lose it.`, '#ff5a3a');
  }
  const idx = n.enemies.indexOf(e);
  floatText(ENEMY_X[Math.max(0, idx)] + 18, UNIT_Y - 30, isCrit ? `-${dmg}!` : `-${dmg}`, isCrit ? '#f2b84b' : '#ff8a80');
  if (isCrit) sfx.crit(); else sfx.hit();
  if (skill && e.marks?.judged! > 0) { const low = mostHurt(); if (low && low.hp < maxHp(low)) healHero(low, dmg * T.MARK_JUDGED_HEAL); }
  return dmg;
}

function healHero(h: Hero, amount: number) {
  if (h.downed) return;
  vfx('heal', heroCenter(S.g.heroes.indexOf(h)), undefined, 0.8);
  const mx = maxHp(h);
  const before = h.hp;
  if (N().floorMap === 'cursed') amount *= T.CURSED_HEAL;
  h.hp = Math.min(mx, h.hp + Math.round(amount));
  const i = S.g.heroes.indexOf(h);
  if (h.hp > before) floatText(HERO_X[i] + 18, UNIT_Y - 30, `+${h.hp - before}`, '#6fcf7f');
}

function frontEnemy(): Enemy | undefined { return N().enemies.find(e => e.hp > 0); }
/** Bash goes for a winding-up boss, then a shield, then the front enemy. */
export function bashTarget(): Enemy | undefined { const a = N().enemies.filter(e => e.hp > 0); return a.find(e => (e.wind ?? 0) > 0) ?? a.find(e => e.shield) ?? a[0]; }
/** Frost goes for a healer first (focus the healer), then the front enemy. */
export function frostTarget(): Enemy | undefined { const a = N().enemies.filter(e => e.hp > 0); return a.find(e => roleOf(e) === 'healer') ?? a[0]; }
function weakestEnemy(): Enemy | undefined { return [...N().enemies].filter(e => e.hp > 0).sort((a, b) => a.hp - b.hp)[0]; }

/** A hero's auto action. skill: it came from Rally (counts as a skill hit for Judged). */
function heroAct(h: Hero, skill = false) {
  const n = N();
  h.lunge = 0.3;
  const me = heroCenter(S.g.heroes.indexOf(h));
  if (!loudOnce) n.noise = Math.min(100, n.noise + T.NOISE_ACTION);
  const st = heroStats(h);
  const mult = heroDamageMult(h);
  // Auto attack (slot 0).
  if (h.id === 'healer') {
    const hurt = aliveHeroes().filter(x => x.hp < maxHp(x) * (isAway() ? T.AUTOPILOT_HEAL_BELOW : 0.6)).sort((a, b) => a.hp / maxHp(a) - b.hp / maxHp(b))[0];
    if (hurt) { sfx.heal(); healHero(hurt, st.atk * 1.6 + 8); return; }
  }
  const target = h.id === 'mage' ? weakestEnemy() : frontEnemy();
  if (!target) return;
  hitEnemy(target, st.atk * mult, st.crit, h.id === 'mage' ? 'bolt' : h.id === 'healer' ? 'smite' : 'slash', me, skill);
  if (h.id === 'healer' && target.hp > 0) mark(target, 'judged');
}

function enemyAct(e: Enemy) {
  const n = N();
  e.turnsAlive++;
  if (e.stunned > 0) { e.stunned--; return; }
  if (e.boss && bossMove(e)) return;
  const role = roleOf(e);
  if (role === 'healer') {   // the Shaman heals the most hurt friend
    const hurt = n.enemies.filter(x => x.hp > 0 && x.hp < x.maxHp * T.AUDITOR_HEAL_BELOW).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    if (hurt) {
      const amt = Math.min(hurt.maxHp - hurt.hp, Math.round(e.maxHp * T.AUDITOR_HEAL));
      hurt.hp += amt; e.lunge = 0.3;
      const c = enemyCenter(hurt); vfx('heal', c, undefined, 0.7); floatText(c.x, UNIT_Y - 30, `+${amt}`, '#9fe08a');
      return;
    }
  }
  e.lunge = 0.3;
  const hits = role === 'swarm' ? bodies(e) : 1;   // every imp bites
  for (let k = 0; k < hits; k++) attackHero(e, e.atk);
}

/** One enemy hit on a hero (target: taunt, else random when nobody tanks, else the knight half the time). */
function attackHero(e: Enemy, atk: number) {
  const n = N();
  const alive = aliveHeroes();
  if (!alive.length) return;
  let target: Hero;
  if (n.taunt > 0 && !S.g.heroes[0].downed) target = S.g.heroes[0];
  else if (T.AUTOPILOT_NO_TANK && isAway()) target = pick(alive);
  else target = chance(0.5) && !S.g.heroes[0].downed ? S.g.heroes[0] : pick(alive);
  const st = heroStats(target);
  let raw = atk;
  const over = e.turnsAlive - T.FURY_AFTER_TURNS;
  if (over > 0) raw *= 1 + T.FURY_PER_TURN * over;
  if (n.ward > 0) raw *= ABILITIES.healer[2].power!;
  const dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) - st.armor * 0.5));
  target.hp -= dmg;
  const i = S.g.heroes.indexOf(target);
  vfx('claw', heroCenter(i), undefined, 0.35);
  floatText(HERO_X[i] + 18 + rand(-8, 8), UNIT_Y - 30, `-${dmg}`, '#ff8a80');
  reflect(e, dmg);
  if (isAway() && target.hp < maxHp(target) * T.AUTOPILOT_HEAL_BELOW) autopilotHurt();
  if (target.hp <= 0) { target.hp = 0; target.downed = true; target.queued = null; toast(`${target.name} is down!`, '#ff8a80'); sfx.down(); }
}

/** A boss's telegraphed move starts instead of a normal action. Returns true when it did. */
function bossMove(e: Enemy): boolean {
  const n = N();
  e.acts = (e.acts ?? 0) + 1;
  const move = moveOf(e);
  if (move === 'slam' && e.acts % T.BOSS_SLAM_EVERY === 0) {
    e.wind = e.windMax = T.BOSS_WINDUP_SEC;
    toast(`${e.name} winds up SMASH! Bash, Ward or Taunt!`, '#ff8a80'); sfx.windup(); coach('windup');
    return true;
  }
  if (move === 'loan' && e.acts % T.LOAN_EVERY === 0) {
    e.wind = e.windMax = T.LOAN_WINDUP_SEC;
    const friend = n.enemies.find(x => x !== e && x.hp > 0);
    toast(friend ? `${e.name} empowers the ${friend.name}! Kill it first!` : `${e.name} summons help. Fire or Storm it!`, '#ff8a80'); sfx.windup();
    return true;
  }
  if (move === 'evict' && e.acts % T.EVICT_EVERY === 0) {
    const v = mostHurt();
    if (!v) return false;
    e.evict = S.g.heroes.indexOf(v); e.wind = e.windMax = T.EVICT_WINDUP_SEC;
    toast(`${e.name} marks ${v.name} for EXECUTE! Taunt or Ward!`, '#ff8a80'); sfx.windup();
    return true;
  }
  return false;
}

/** The wind-up is over: the move lands. */
function landMove(e: Enemy) {
  const move = moveOf(e);
  if (move === 'slam') return bossSlam(e);
  if (move === 'loan') return loanFriend(e);
  if (move === 'evict') return eviction(e);
}

/** The Warlock's summon takes the free slot next to him (move id 'loan'). */
function loanFriend(e: Enemy) {
  const n = N();
  const old = n.enemies.find(x => x !== e && x.hp > 0);
  if (old) {   // empowered: back to full and meaner
    old.hp = old.maxHp; old.atk *= T.LOAN_REFI; old.turnsAlive = 0;
    const c = enemyCenter(old); floatText(c.x, UNIT_Y - 46, 'EMPOWERED', '#ff8a80'); vfx('heal', c, undefined, 0.7);
    e.lunge = 0.3; sfx.handle();
    return;
  }
  const i = n.enemies.findIndex(x => x !== e && x.hp <= 0);
  if (i < 0) return;
  const def = ENEMY_BY_ID[e.acts! % (2 * T.LOAN_EVERY) === 0 ? 'junk' : 'auditor'];
  const add = makeEnemy(def, n.floor, n.floorMap === 'elite');
  add.atb = 0;
  n.enemies[i] = add;
  e.lunge = 0.3; sfx.handle();
  toast(`The ${def.name} join${def.role === 'swarm' ? '' : 's'} the fight.`, '#ff8a80');
}

/** EXECUTE lands on one hero; the Black Knight's shield comes back (move id 'evict'). */
function eviction(e: Enemy) {
  const n = N();
  const knight = S.g.heroes[0];
  let v = S.g.heroes[e.evict ?? 0];
  if (!v || v.downed) v = mostHurt();
  e.evict = undefined; e.lunge = 0.3;
  sfx.slam(); n.noise = Math.min(100, n.noise + T.NOISE_CRIT);
  if (v) {
    const taunted = n.taunt > 0 && !knight.downed;
    const h = taunted ? knight : v;
    const dmg = Math.max(1, Math.round(maxHp(h) * (taunted ? T.BOSS_SLAM_TAUNT_PCT : T.EVICT_PCT) * (n.ward > 0 ? T.BOSS_SLAM_WARD_MULT : 1)));
    h.hp -= dmg;
    const i = S.g.heroes.indexOf(h);
    vfx('claw', heroCenter(i), undefined, 0.5);
    floatText(HERO_X[i] + 14, UNIT_Y - 34, `-${dmg}!`, '#ff5a5a');
    reflect(e, dmg);
    toast(taunted ? `${knight.name} takes the EXECUTE for ${v.name}.` : `EXECUTE! ${h.name} takes a brutal hit.`, '#ff8a80');
    if (h.hp <= 0) { h.hp = 0; h.downed = true; h.queued = null; toast(`${h.name} is down!`, '#ff8a80'); sfx.down(); }
  }
  if (e.hp > 0) { e.shield = true; toast(`${e.name} raises his shield again. Bash it off.`, '#8fd8ff'); }
}

function grantXp(amount: number) {
  for (const h of S.g.heroes) {
    if (h.downed) continue;
    h.xp += amount;
    while (h.xp >= xpNeeded(h)) {
      h.xp -= xpNeeded(h); h.level++;
      h.hp = maxHp(h);
      toast(`${h.name} reached level ${h.level}!`, '#f2b84b'); sfx.level();
      N().noise = Math.min(100, N().noise + T.NOISE_LEVEL);
      if (h.level === T.ABILITY_UNLOCK[2]) toast(`${h.name} unlocked ${ABILITIES[h.id][2].name}`, '#f2b84b');
    }
  }
}

/** Ward up and the attacker is Taunted: part of the hit bounces back. */
function reflect(e: Enemy, dmg: number) {
  if (!(N().ward > 0) || !(e.marks?.taunted! > 0)) return;
  const back = Math.max(1, Math.round(dmg * T.MARK_TAUNT_REFLECT));
  e.hp -= back; e.flash = 0.15;
  const c = enemyCenter(e); floatText(c.x, UNIT_Y - 30, `-${back} bounced`, MARKS.taunted.color);
}

/** The boss's telegraphed big attack lands. */
function bossSlam(e: Enemy) {
  const n = N();
  e.braced = false;
  e.lunge = 0.3;
  sfx.slam(); n.noise = Math.min(100, n.noise + T.NOISE_CRIT);
  const ward = n.ward > 0 ? T.BOSS_SLAM_WARD_MULT : 1;
  const knight = S.g.heroes[0];
  const targets = n.taunt > 0 && !knight.downed ? [knight] : aliveHeroes();
  const pct = targets.length === 1 && targets[0] === knight && n.taunt > 0 ? T.BOSS_SLAM_TAUNT_PCT : T.BOSS_SLAM_PCT;
  for (const h of targets) {
    const dmg = Math.max(1, Math.round(maxHp(h) * pct * ward));
    h.hp -= dmg;
    const i = S.g.heroes.indexOf(h);
    vfx('claw', heroCenter(i), undefined, 0.5);
    floatText(HERO_X[i] + 14, UNIT_Y - 34, `-${dmg}!`, '#ff5a5a');
    if (h.hp <= 0) { h.hp = 0; h.downed = true; h.queued = null; toast(`${h.name} is down!`, '#ff8a80'); sfx.down(); }
    reflect(e, dmg);
  }
  toast(n.taunt > 0 && !knight.downed ? `SMASH hits ${knight.name} (taunted).` : ward < 1 ? 'SMASH, softened by Ward.' : 'SMASH hits everyone!', '#ff8a80');
}

/** Advances the battle. Returns 'victory', 'wipe' or null while it is ongoing. */
export function updateBattle(dt: number): 'victory' | 'wipe' | null {
  const n = N();
  for (const h of S.g.heroes) h.cd = h.cd.map(c => Math.max(0, c - dt));
  for (const e of n.enemies) {
    e.flash = Math.max(0, e.flash - dt);
    if (e.marks) for (const k of Object.keys(e.marks) as MarkId[]) { e.marks[k]! -= dt; if (e.marks[k]! <= 0) delete e.marks[k]; }
  }
  for (const h of S.g.heroes) {
    if (h.downed) continue;
    h.atb += heroStats(h).speed * T.ATB_RATE * dt * speedMult() * curioSpeedMult();
    if (h.atb >= 100) { h.atb -= 100; heroAct(h); }
  }
  for (const e of n.enemies) {
    if (e.hp <= 0) continue;
    if ((e.wind ?? 0) > 0) { e.wind! -= dt; if (e.wind! <= 0) { e.wind = 0; landMove(e); } continue; }   // winding up: no normal turns
    e.atb += e.speed * T.ATB_RATE * dt;
    if (e.atb >= 100) { e.atb -= 100; enemyAct(e); }
  }
  // Remove the dead, grant XP.
  for (const e of n.enemies) {
    if (e.hp <= 0 && e.maxHp > 0) {
      grantXp((e.boss ? T.XP_PER_BOSS : T.XP_PER_KILL) * n.floor);
      const ot = overtimeGold();   // Spreadsheet Warrior: kills while Excel is up pay overtime
      if (ot) { S.g.gold += ot; const c = enemyCenter(e); floatText(c.x, UNIT_Y - 20, `+${ot}g overtime`, '#6fcf7f'); }
      if (e.boss) {
        n.noise += T.NOISE_BOSS_KILL; toast(`${e.name} defeated!`, '#f2b84b');
        n.enemies.forEach(x => { if (x !== e && x.hp > 0) { x.hp = 0; x.maxHp = 0; } });   // without the boss the rest run
      }
      e.maxHp = 0;
    }
  }
  if (aliveHeroes().length === 0) return 'wipe';
  if (n.enemies.every(e => e.hp <= 0)) return 'victory';
  return null;
}

export function reviveHero(h: Hero, pct: number) {
  if (!h.downed) return;
  h.downed = false; h.hp = Math.max(1, Math.round(maxHp(h) * pct)); h.atb = 0;
}
export const anyBoss = () => N().enemies.some(e => e.boss);

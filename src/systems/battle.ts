import { T } from '../config/tuning';
import { lapMouse } from './lapsit';
import { eyesBusy } from './eyes';
import { S, N, type Enemy, type Hero, type HeroId, type VfxKind, type MarkId } from '../core/state';
import { ENEMIES, BOSSES, ENEMY_BY_ID, bossFor, type EnemyDef } from '../data/enemies';
import { ABILITIES, ULT_SLOT, heroLabel, HERO_NAME } from '../data/heroes';
import { pick, rand, chance } from '../core/rng';
import { gainGold, blessPow, blessCount } from './run';
import { heroStats, maxHp, xpNeeded } from './stats';
import { floatText, toastAs, fmtNum } from '../core/fx';
const toast = toastAs('GAME');   // feed tag (#49)
import { sfx } from '../ui/audio';
import { speedMult } from './tired';
import { CD_PCT } from '../data/city';
import { isAway, autopilotPull } from './autopilot';
import { MARKS } from '../data/marks';
import { overtimeGold } from './affixes';
import { curioDmgMult, curioSpeedMult, partyCrit, partyCdMult } from './curios';
import { coach } from './coach';
import { POS_X, ENEMY_SLOTS, MID_SLOT, HEAD_Y } from '../core/arena';
import { dropFromKill } from './loot';
import { positionMult, auraTaken, auraCrit, auraCd, heroById, hookLine, shoveLine } from './positions';
import { legendOn, setOn } from './gear';
import { skillOwned, rule, heroFx, autocastOn } from './tree';
import { boysSay, boysNoteDown } from './boys';

let enemyUid = 1;
// A multi-hit skill (Fire, Cataclysm) is one noisy moment: its crits add Noise once.
let loudOnce = false, critHeard = false;

// Visual effects on the battle area, in grid px (core/arena.ts; docs/design/dungeon.md: every action must be visible).
// Party positions are the heroes' order (marching order, #52 1.6: position 1 is S.g.heroes[0]).
export const heroCenter = (i: number) => ({ x: POS_X[Math.max(0, i)], y: HEAD_Y + 20 });
export function enemyCenter(e: Enemy) { const sl = ENEMY_SLOTS[e.slot] ?? ENEMY_SLOTS[0]; return { x: sl.x, y: e.boss ? HEAD_Y + 6 : HEAD_Y + 22 }; }
/** Where numbers float up from: over the HP bar. */
const heroNumY = 108;
const enemyNumY = (e: Enemy) => (ENEMY_SLOTS[e.slot] ?? ENEMY_SLOTS[0]).bar - (e.boss ? 30 : 12);
function vfx(kind: VfxKind, at: { x: number; y: number }, from?: { x: number; y: number }, dur = 0.4) {
  N().vfx.push({ kind, x: at.x, y: at.y, x2: from?.x ?? at.x, y2: from?.y ?? at.y, t: 0, dur, seed: Math.random() });
}

function makeEnemy(def: EnemyDef, floor: number, elite: boolean, slot = 0, pack = false): Enemy {
  const packM = pack && !def.boss ? 1 : 0;   // a pack member is weaker than a lone enemy (#52, 1.3)
  const hpM = T.ENEMY_HP_GROWTH ** (floor - 1) * (elite ? T.ELITE_MULT : 1) * (packM ? T.PACK_HP_MULT : 1) * blessPow('ritual', T.BLESS_RITUAL_HP);   // compounding (#52, 1.2); the chant
  const atkM = T.ENEMY_ATK_GROWTH ** (floor - 1) * (elite ? T.ELITE_MULT : 1) * (packM ? T.PACK_ATK_MULT : 1);
  const hp = Math.round(def.hp * hpM);
  const e: Enemy = { uid: enemyUid++, defId: def.id, name: def.name, hp, maxHp: hp, atk: def.atk * atkM, armor: def.armor * (1 + 0.1 * floor), speed: def.speed, atb: rand(0, 40), aliveSec: 0, stunned: 0, boss: !!def.boss, flash: 0, slot };
  if (def.role === 'shield') e.shield = true;
  if (def.role === 'swarm') e.per = hp / def.stacks!;
  if (def.id === 'bat') { e.look = batLook(e.uid); e.name = e.look === 'vigil' ? 'Vigil' : 'Ironwing'; }   // the v2 roster (#130)
  meet(def);
  return e;
}
/** Each bat is the Ironwing or the Vigil (#130, the v2 redesign), rolled when it spawns from its uid (no draw from the
 *  game's random numbers, so the sims stay the same), kept for its life; a pack can mix them. */
export function batLook(uid: number): 'ironwing' | 'vigil' {
  let h = Math.imul(uid ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) % 2 ? 'vigil' : 'ironwing';
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

/** A pack (#52, 1.3): PACK_MIN + floor / 2 enemies, six on screen (the boss or the lieutenant behind the fodder
 *  in two lanes), the rest waiting off screen. An Elite Pack is stronger and its lieutenant always drops a rare. */
export function spawnBattle(floor: number, boss: boolean, elite: boolean) {
  const n = N();
  boysSay(boss ? 'bossStart' : 'trashStart');   // the boys' chat (#109)
  const pool = ENEMIES.filter(d => (d.from ?? 1) <= floor && !d.breaker);
  const size = Math.round(Math.min(T.PACK_MAX, T.PACK_MIN + Math.floor(floor / 2)) * (n.cond === 'swarm' ? 1 + T.COND_SWARM_PACK : 1));
  const defs: EnemyDef[] = boss ? [bossFor(floor, T.CHECKPOINT_EVERY)] : [];
  // from LINE_BREAK_FROM an encounter may bring a Ghoul (Hook) or a Brute (Shove) in the front lane (#52, 1.6)
  if (!boss && floor >= T.LINE_BREAK_FROM && S.g.heroes.length > 1 && chance(T.LINE_BREAK_CHANCE)) defs.push(ENEMY_BY_ID[pick(['ghoul', 'brute'])]);
  while (defs.length < size) defs.push(pick(pool));
  n.enemies = []; n.reserve = [];
  for (const d of defs) {
    const slot = freeSlot(d);
    if (slot < 0) { n.reserve.push({ defId: d.id, elite }); continue; }
    n.enemies.push(makeEnemy(d, floor, elite, slot, true));
  }
  if (elite) { const lt = n.enemies.find(e => e.slot === MID_SLOT) ?? n.enemies[0]; if (lt) lt.elite = true; }
  if (isAway()) autopilotPull();
}
/** The position a newcomer takes: a boss or a caster behind the mob, fodder in the front lane, then the back lane. */
function freeSlot(d: EnemyDef): number {
  const used = new Set(N().enemies.filter(e => e.hp > 0).map(e => e.slot));
  if ((d.boss || d.role === 'healer') && !used.has(MID_SLOT)) return MID_SLOT;
  if (d.boss) return -1;
  for (const k of [0, 1, 2, 3, 4]) if (!used.has(k)) return k;
  return used.has(MID_SLOT) ? -1 : MID_SLOT;
}
/** A waiting enemy steps into a position the dead left free. */
function stepIn() {
  const n = N();
  while (n.reserve.length) {
    const d = ENEMY_BY_ID[n.reserve[0].defId];
    const slot = freeSlot(d);
    if (slot < 0) return;
    const r = n.reserve.shift()!;
    const e = makeEnemy(d, n.floor, r.elite, slot, true);
    e.enter = T.STEP_IN_SEC;
    const i = n.enemies.findIndex(x => x.hp <= 0 && x.slot === slot);
    if (i >= 0) n.enemies[i] = e; else n.enemies.push(e);
  }
}
export { BOSSES };

/** A curio's fight (the troll): one mini-boss, scaled like the floor. */
export function spawnCurioFight(def: EnemyDef) {
  const n = N();
  n.enemies = [makeEnemy(def, n.floor, n.floorMap === 'elite', MID_SLOT)]; n.reserve = [];
  if (isAway()) autopilotPull();
}
/** Heals every living hero for a share of their max HP. */
export function healParty(pct: number) { aliveHeroes().forEach(h => healHero(h, maxHp(h) * pct)); }

export const aliveHeroes = () => S.g.heroes.filter(h => !h.downed);
/** Skill 2 and the ultimate come from the skill tree (#53). */
export const abilityUnlocked = (h: Hero, slot: number) => slot <= ULT_SLOT && skillOwned(h.id, slot);
/** The ultimate is ready when its charge is full. */
export const ultReady = (h: Hero) => h.ult >= 1;

export function abilitiesLocked(): string | null {
  const n = S.g.night;
  if (!n) return 'No night';
  if (n.location !== 'dungeon') return 'In town';
  if (eyesBusy()) return 'Eyes busy';   // looking at her (#85)
  if (lapMouse()) return 'She has the mouse';   // the lap sit (#86): you ignored her
  if (n.photo) return 'Hands busy';             // her photo open (#92)
  if (n.action !== 'none') return 'Hands busy';
  if (n.switching) return 'Switching window';
  if (n.monitor === 'excel') return 'Excel is up';
  if (n.monitorOff > 0) return 'Monitor off';
  return null;
}

/** Skills that help the party (#122) also work between fights: Arkbishop's Mend, Ward and Miracle, Dutch's Last Stand,
 *  Hixx's Heist. The rest (Taunt, Bash, Backstab, Smoke Bomb, Fire, Frost, Cataclysm) need an enemy. */
const PARTY_SKILLS: Record<HeroId, number[]> = { knight: [ULT_SLOT], rogue: [ULT_SLOT], mage: [], healer: [1, 2, ULT_SLOT] };
export const partySkill = (id: HeroId, slot: number) => PARTY_SKILLS[id].includes(slot);
/** Between fights in the dungeon (#122): the walk (the next pack coming up included) and a curio stop. */
export function betweenFights(): boolean { const n = N(); return n.location === 'dungeon' && (n.phase === 'walk' || n.phase === 'curio'); }
/** A skill can go off now: in a fight with an enemy standing, or a party skill between fights. */
export function castableNow(id: HeroId, slot: number): boolean {
  const n = N();
  return (n.phase === 'battle' && n.enemies.some(e => e.hp > 0)) || (betweenFights() && partySkill(id, slot));
}

export function queueAbility(heroIdx: number, slot: number) {
  const h = S.g.heroes[heroIdx];
  if (!h || slot === 0 || h.downed) return;
  if (abilitiesLocked()) { sfx.bad(); return; }
  if (!abilityUnlocked(h, slot) || h.cd[slot] > 0 || (slot === ULT_SLOT && !ultReady(h))) { sfx.bad(); return; }
  if (h.moving) { toast(`${heroLabel(h.id)} is changing places.`, '#a999bd'); sfx.bad(); return; }   // a swap: 1 s without acting (#52, 1.6)
  const n = N();
  if (!castableNow(h.id, slot)) { toast('No enemies in reach.', '#a999bd'); sfx.bad(); return; }   // party skills work between fights too (#122)
  // Cast right now: no waiting for the hero's turn, no global cooldown.
  h.lunge = 0.3;
  castAbility(h, slot);
}

/** The skill slot that is a melee hit with the weapon (#97): the Knight's Bash, the Rogue's Backstab. */
const MELEE_SKILL: Partial<Record<HeroId, number>> = { knight: 2, rogue: 1 };
function castAbility(h: Hero, slot: number) {
  const n = N();
  const me = heroCenter(S.g.heroes.indexOf(h));
  const st = heroStats(h);
  const mult = heroDamageMult(h) * (h.id === 'mage' && setOn('mage', 'embervow', 2) ? 1 + T.SET_EMBERVOW_SKILL : 1)   // Embervow: skill damage
    * (1 + heroFx(h, 'skillDmg'));   // Spellpower (tree)
  st.crit += auraCrit(h) + (h.nextCrit ? 1000 : 0);   // the rogue's keen eye (marching order); Nightglass's next crit
  h.nextCrit = false;
  h.queued = null;
  attacker = h;
  if (MELEE_SKILL[h.id] === slot) h.swing = T.SWING_SEC;   // Bash, Backstab: the weapon swings (#97)
  if (slot === ULT_SLOT) return castUlt(h, st, mult, me);
  const extraCd = (h.id === 'mage' && slot === 1 && rule('mage', 'inferno') ? T.RULE_INFERNO_CD : 0);
  h.cd[slot] = (ABILITIES[h.id][slot].cd + extraCd) * (1 - heroFx(h, 'cd')) * (h.id === 'rogue' && slot === 1 && rule('rogue', 'shiv') ? 1 - T.RULE_SHIV : 1) * auraCd(h) * (1 - CD_PCT[S.g.furniture.library ?? 0]) * (1 - T.BLESS_PILGRIM_CD) ** blessCount('pilgrim') * (n.cond === 'flooded' ? 1 + T.COND_FLOODED_CD : 1) * partyCdMult();
  if (n.cond !== 'silent') n.noise = Math.min(100, n.noise + T.NOISE_ABILITY);   // Silent Halls: skills make no Noise
  sfx.ability();
  const A = ABILITIES[h.id][slot];
  if (h.id === 'knight' && slot === 1) {
    n.taunt = A.dur!; vfx('taunt', me, undefined, 0.7); toast(`${heroLabel(h.id)}: TAUNT`, '#6aa8ff');
    if (setOn('knight', 'ironwake', 3)) healHero(h, maxHp(h) * T.SET_IRONWAKE_HEAL);   // Ironwake, three pieces
    n.enemies.filter(e => e.hp > 0).forEach(e => mark(e, 'taunted', A.dur!));
    return;
  }
  if (h.id === 'knight' && slot === 2) {
    const first = bashTarget();
    const targets = first ? [first, ...(rule('knight', 'cleave') ? n.enemies.filter(x => x !== first && x.hp > 0).slice(0, 1) : [])] : [];   // Cleaving Bash
    for (const e of targets) {
      if (e.shield) { e.shield = false; const c = enemyCenter(e); floatText(c.x, enemyNumY(e) - 10, 'SHIELD BROKEN!', '#8fd8ff'); sfx.crit(); }
      if (e.marks?.stagger! > 0 && legendOn('lantern') && h.cd[1] > 0) { h.cd[1] = 0; floatText(me.x, heroNumY - 8, 'TAUNT READY', '#f2b84b'); }   // Last Lantern
      const sx = rule('mage', 'shatterpoint') ? T.RULE_SHATTER : T.MARK_CHILL_BASH;   // Shatterpoint (the mage's tree)
      const shatter = cashIn(e, 'chill', `SHATTER x${sx}`) ? sx : 1;
      hitEnemy(e, st.atk * A.power! * mult * shatter * (1 + heroFx(h, 'bashDmg')), st.crit, 'bash');   // Crushing
      if (e.hp > 0) mark(e, 'stagger');
      const slam = (e.wind ?? 0) > 0 && moveOf(e) === 'slam';
      if (slam && e.braced) toast(`${e.name} is braced: Bash can't stop it.`, '#ff8a80');
      else if ((e.wind ?? 0) > 0 && !slam) { /* only SMASH can be interrupted */ }
      else { e.stunned = T.BASH_STUN_SEC * (rule('knight', 'concussion') ? T.RULE_CONCUSSION : 1); if (slam) { e.wind = 0; e.braced = true; toast(`${heroLabel(h.id)} interrupts SMASH! The boss braces for the next one.`, '#8fb3ff'); sfx.good(); } }
    }
    return;
  }
  if (h.id === 'rogue' && slot === 1) {   // Backstab: the front enemy; x2 on Staggered (Bash first)
    boysSay('backstab');   // the boys' chat (#109): text only
    const e = frontEnemy();
    if (e) {
      const sure = (legendOn('widow') && e.marks?.chill! > 0) || (rule('rogue', 'ambush') && e.marks?.stagger! > 0);   // Widow's Kiss on Chilled; Ambush on Staggered
      const m = cashIn(e, 'stagger', `BACKSTAB x${T.MARK_STAGGER_BACKSTAB}`) ? T.MARK_STAGGER_BACKSTAB : 1;
      hitEnemy(e, st.atk * A.power! * mult * m, sure ? 1000 : st.crit, 'slash', me);
    }
    return;
  }
  if (h.id === 'rogue' && slot === 2) {
    n.smoke = A.dur!; vfx('smoke', enemyCenter(frontEnemy() ?? n.enemies[0]), undefined, A.dur!); toast(`${heroLabel(h.id)}: SMOKE BOMB`, '#a999bd');
    if (setOn('rogue', 'nightglass', 3)) aliveHeroes().forEach(x => { x.nextCrit = true; });   // Nightglass: everyone's next hit crits
    return;
  }
  if (h.id === 'mage' && slot === 1) {
    const hit = n.enemies.filter(e => e.hp > 0);
    hit.forEach(e => {
      const m = cashIn(e, 'stagger', `STAGGER x${T.MARK_STAGGER_FIRE}`) ? T.MARK_STAGGER_FIRE : 1;
      const dealt = hitEnemy(e, st.atk * A.power! * mult * m * (1 + heroFx(h, 'fireDmg')) * (rule('mage', 'inferno') ? 1 + T.RULE_INFERNO_DMG : 1), st.crit, 'fire', me);
      if (rule('mage', 'wildfire') && e.hp > 0) { const sec = T.RULE_WILDFIRE_SEC * (1 + heroFx(h, 'elemDur')); e.burn = sec; e.burnDps = dealt * T.RULE_WILDFIRE / sec; }   // Wildfire
    });
    if (setOn('mage', 'embervow', 3) && hit.filter(e => e.hp <= 0).length >= T.SET_EMBERVOW_KILLS) { h.cd[1] = 0; floatText(me.x, heroNumY - 8, 'FIRE READY', '#f2b84b'); }   // Embervow
    return;
  }
  if (h.id === 'mage' && slot === 2) {
    const e = frostTarget();
    if (e) {
      hitEnemy(e, st.atk * A.power! * mult, st.crit, 'frost', me); if (e.hp > 0) mark(e, 'chill', chillSec());
      const second = legendOn('frostbinder') ? n.enemies.find(x => x !== e && x.hp > 0 && !(x.marks?.chill! > 0)) : undefined;   // Frostbinder
      if (second) { mark(second, 'chill', chillSec()); vfx('frost', enemyCenter(second), me, 0.35); }
    }
    return;
  }
  if (h.id === 'healer' && slot === 1) {
    sfx.heal(); aliveHeroes().forEach(x => healHero(x, (st.atk * A.power! + A.flat!) * healPow(h) * (rule('healer', 'greaterMend') ? 1 + T.RULE_GREATER_MEND : 1)));
    if (rule('healer', 'sanctuary')) n.sanctuary = T.RULE_SANCTUARY_SEC;   // Sanctuary
    if (legendOn('ashchoir')) clearDebuffs();   // Ash Choir
    return;
  }
  if (h.id === 'healer' && slot === 2) { n.ward = A.dur! + (rule('healer', 'aegis') ? T.RULE_AEGIS_SEC : 0); vfx('ward', heroCenter(1), undefined, 0.8); toast(`${heroLabel(h.id)}: WARD`, '#6fcf7f'); return; }
}

/** The ultimates (#52, 1.2): the third slot, cast when its charge is full; the charge empties. */
function castUlt(h: Hero, st: ReturnType<typeof heroStats>, mult: number, me: { x: number; y: number }) {
  const n = N();
  attacker = h;
  h.ult = 0;
  if (h.id === 'knight') {
    n.lastStand = T.LAST_STAND_SEC; vfx('taunt', me, undefined, 0.9); sfx.level();
    toast(`${heroLabel(h.id)}: LAST STAND! Nobody falls for ${T.LAST_STAND_SEC} s.`, '#f2b84b');
    return;
  }
  if (h.id === 'rogue') {
    n.heist = T.HEIST_SEC; sfx.level();
    toast(`${HERO_NAME[h.id]}: HEIST! Every kill drops an item for ${T.HEIST_SEC} s.`, '#f2b84b');   // name alone: with the class the line runs past the feed's two rows
    return;
  }
  if (h.id === 'mage') {
    loudOnce = true; critHeard = false;
    toast(`${heroLabel(h.id)}: CATACLYSM!`, '#f2b84b');
    n.enemies.filter(e => e.hp > 0).forEach(e => {
      const marked = (e.marks?.stagger ?? 0) > 0 || (e.marks?.chill ?? 0) > 0;
      hitEnemy(e, st.atk * T.CATACLYSM_POWER * mult * (marked ? T.CATACLYSM_MARK_MULT : 1), st.crit, 'fire', me);
    });
    loudOnce = false;
    return;
  }
  if (h.id === 'healer') {
    sfx.heal(); toast(`${heroLabel(h.id)}: MIRACLE!`, '#f2b84b');
    S.g.heroes.forEach(x => { if (x.downed) reviveHero(x, 1); x.hp = maxHp(x); vfx('heal', heroCenter(S.g.heroes.indexOf(x)), undefined, 1); });
    if (legendOn('vigil')) { n.ward = Math.max(n.ward, T.LEGEND_VIGIL_WARD_SEC); vfx('ward', heroCenter(1), undefined, 0.8); }   // Vigil Censer
  }
}

/** Who is acting right now (for crit damage from his tree). */
let attacker: Hero | null = null;
/** The priest's healing power: his position, Dawnward, Grace and Mercy. */
const healPow = (h: Hero) => positionMult(h) * dawnward() * (1 + heroFx(h, 'healOut'));
/** How long a Chill lasts: Lingering Chill doubles it, Elementalist adds 25%. */
const chillSec = () => T.MARK_SEC * (rule('mage', 'lingering') ? T.RULE_LINGER : 1) * (1 + heroFx(heroById('mage'), 'elemDur'));
/** Damage taken under Ward: Bastion makes it soak more. */
export const wardTaken = () => 1 - (1 - ABILITIES.healer[2].power!) * (1 + heroFx(heroById('healer'), 'wardSoak'));
/** Dawnward (two pieces): the priest heals more. */
const dawnward = () => (setOn('healer', 'dawnward', 2) ? 1 + T.SET_DAWNWARD_HEAL : 1);
/** Ash Choir: the party's debuffs go (curses from curios, the sugar crash). */
function clearDebuffs() {
  const n = N(), had = n.partyBuffs.some(b => b.dmg < 0) || n.crash > 0;
  n.partyBuffs = n.partyBuffs.filter(b => b.dmg >= 0); n.crash = 0;
  if (had) toast('Ash Choir: the party is cleansed.', '#6fcf7f');
}
/** Puts a mark on an enemy (docs/design/dungeon.md). Shows its name once over the enemy. */
function mark(e: Enemy, id: MarkId, sec = T.MARK_SEC) {
  e.marks ??= {};
  const fresh = !(e.marks[id]! > 0);
  e.marks[id] = Math.max(e.marks[id] ?? 0, sec);
  if (fresh) { const c = enemyCenter(e); floatText(c.x, enemyNumY(e) - 6, MARKS[id].tag, MARKS[id].color); }
}
/** Spends a mark if the enemy has it. Returns true when the combo fires. */
function cashIn(e: Enemy, id: MarkId, label: string): boolean {
  if (!(e.marks?.[id]! > 0)) return false;
  delete e.marks![id];
  const c = enemyCenter(e); floatText(c.x, enemyNumY(e) - 10, label + '!', MARKS[id].color);
  boysSay('combo');
  sfx.crit();
  return true;
}
const mostHurt = () => aliveHeroes().sort((a, b) => a.hp / maxHp(a) - b.hp / maxHp(b))[0];

function heroDamageMult(h?: Hero): number {
  const n = N();
  return n.flow * (n.guilt > 0 ? 1 - T.GUILT_DMG : 1) * curioDmgMult() * blessPow('shrine', T.BLESS_SHRINE_DMG) * (h ? positionMult(h) : 1) * (1 + heroFx(h, 'dmg'))
    * (h?.id === 'mage' && n.sulk > 0 ? 1 - T.CURIO_SULK_DMG : 1);   // the mage read the guild bank log
}

function hitEnemy(e: Enemy, raw: number, crit: number, kind: VfxKind = 'slash', from?: { x: number; y: number }, skill = true): number {
  const n = N();
  vfx(kind, enemyCenter(e), from, kind === 'bolt' ? 0.35 : kind === 'fire' ? 0.6 : 0.35);
  if (n.tired >= T.TIRED_SLUGGISH && chance(T.ECHO_DROWSY_MISS)) {   // Drowsy: your eyes close mid-swing
    const c = enemyCenter(e); floatText(c.x + rand(-6, 6), enemyNumY(e), 'zzz', '#a999bd');
    return 0;
  }
  const isCrit = chance((crit + partyCrit()) / 100);
  let dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) - e.armor * 0.5));
  if (isCrit) { dmg = Math.round(dmg * (2 + heroFx(attacker ?? undefined, 'critDmg'))); if ((!loudOnce || !critHeard) && n.cond !== 'silent') n.noise += T.NOISE_CRIT; critHeard = true; }   // Deadly (tree): crits hit harder
  if (e.shield) dmg = Math.max(1, Math.round(dmg * T.SHIELD_TAKEN));
  if (e.per) {   // a swarm: one body per single hit; Fire hits every body
    const left = bodies(e), cur = e.hp - (left - 1) * e.per;
    dmg = Math.round(kind === 'fire' ? Math.min(dmg, e.per) * (left - 1) + Math.min(dmg, cur) : Math.min(dmg, cur));
    dmg = Math.max(1, dmg);
  }
  const full = e.hp >= e.maxHp;
  e.hp -= dmg; e.flash = 0.15;
  if (isCrit && e.hp <= 0 && !e.per) boysSay(attacker?.id === 'mage' && e.boss ? 'mageBoss' : full ? 'oneShot' : 'combo');   // the boys' chat (#109): a crit kill
  if (e.boss && !e.enraged && e.hp > 0 && e.hp < e.maxHp * T.ECHO_ENRAGE_HP) {   // enrage: the fight of the night, don't look away
    e.enraged = true; sfx.enrage();
    toast(`${e.name} is ENRAGED! Flow builds faster.`, '#ff5a3a');
  }
  floatText(enemyCenter(e).x, enemyNumY(e), isCrit ? `-${fmtNum(dmg)}!` : `-${fmtNum(dmg)}`, isCrit ? '#f2b84b' : '#ff8a80');
  if (isCrit) sfx.crit(); else sfx.hit();
  if (skill && e.marks?.judged! > 0) { const low = mostHurt(); if (low && low.hp < maxHp(low)) healHero(low, dmg * T.MARK_JUDGED_HEAL); }
  return dmg;
}

function healHero(h: Hero, amount: number) {
  if (h.downed) return;
  vfx('heal', heroCenter(S.g.heroes.indexOf(h)), undefined, 0.8);
  const mx = maxHp(h);
  const before = h.hp;
  amount *= blessPow('potion', T.BLESS_POTION_HEAL) * (1 + heroFx(h, 'healIn'));   // the Potions run blessing; Hardened (tree)
  if (N().floorMap === 'cursed') amount *= T.CURSED_HEAL;
  h.hp = Math.min(mx, h.hp + Math.round(amount));
  const i = S.g.heroes.indexOf(h);
  if (h.hp > before) floatText(heroCenter(i).x, heroNumY, `+${fmtNum(h.hp - before)}`, '#6fcf7f');
}

function frontEnemy(): Enemy | undefined { return N().enemies.find(e => e.hp > 0); }
/** Bash goes for a winding-up boss, then a shield, then the front enemy. */
export function bashTarget(): Enemy | undefined { const a = N().enemies.filter(e => e.hp > 0); return a.find(e => (e.wind ?? 0) > 0) ?? a.find(e => e.shield) ?? a[0]; }
/** Frost goes for a healer first (focus the healer), then the front enemy. */
export function frostTarget(): Enemy | undefined { const a = N().enemies.filter(e => e.hp > 0); return a.find(e => roleOf(e) === 'healer') ?? a[0]; }
function weakestEnemy(): Enemy | undefined { return [...N().enemies].filter(e => e.hp > 0).sort((a, b) => a.hp - b.hp)[0]; }

/** A hero's auto attack (not a skill: it doesn't cash in Judged). */
function heroAct(h: Hero, skill = false) {
  const n = N();
  h.lunge = 0.3;
  if (h.id === 'knight' || h.id === 'rogue') h.swing = T.SWING_SEC;   // Slash, Stab: melee swings the weapon (#97)
  const me = heroCenter(S.g.heroes.indexOf(h));
  if (!loudOnce) n.noise = Math.min(100, n.noise + T.NOISE_ACTION);
  const st = heroStats(h);
  st.crit += auraCrit(h) + (h.nextCrit ? 1000 : 0);
  h.nextCrit = false;
  attacker = h;
  const mult = heroDamageMult(h);
  // Auto attack (slot 0).
  if (h.id === 'healer') {
    const hurt = aliveHeroes().filter(x => x.hp < maxHp(x) * T.HEALER_AUTO_HEAL_BELOW).sort((a, b) => a.hp / maxHp(a) - b.hp / maxHp(b))[0];
    if (hurt) { sfx.heal(); healHero(hurt, (st.atk * 1.6 + 8) * healPow(h)); return; }
  }
  const target = h.id === 'mage' ? weakestEnemy() : frontEnemy();
  if (!target) return;
  hitEnemy(target, st.atk * mult, st.crit, h.id === 'mage' ? 'bolt' : h.id === 'healer' ? 'smite' : 'slash', me, skill);
  if (h.id === 'mage' && target.hp <= 0 && legendOn('stormcoil')) {   // Stormcoil: a killing Bolt jumps on
    const next = weakestEnemy();
    if (next) hitEnemy(next, st.atk * mult, st.crit, 'bolt', enemyCenter(target), skill);
  }
  if (h.id === 'healer' && target.hp > 0) mark(target, 'judged');
}

function enemyAct(e: Enemy) {
  const n = N();
  if (e.stunned > 0) return;   // stunned (seconds, ticked in updateBattle)
  if (moveOf(e) && bossMove(e)) return;   // a boss's big move, or a Ghoul's Hook, a Brute's Shove
  const role = roleOf(e);
  if (role === 'healer') {   // the Shaman heals the most hurt friend
    const hurt = n.enemies.filter(x => x.hp > 0 && x.hp < x.maxHp * T.AUDITOR_HEAL_BELOW).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
    if (hurt) {
      const amt = Math.min(hurt.maxHp - hurt.hp, Math.round(e.maxHp * T.AUDITOR_HEAL));
      hurt.hp += amt; e.lunge = 0.3;
      const c = enemyCenter(hurt); vfx('heal', c, undefined, 0.7); floatText(c.x, enemyNumY(hurt), `+${fmtNum(amt)}`, '#9fe08a');
      return;
    }
  }
  e.lunge = 0.3;
  const hits = role === 'swarm' ? bodies(e) : 1;   // every imp bites
  for (let k = 0; k < hits; k++) attackHero(e, e.atk);
}

/** One enemy hit on a hero. Taunt overrides everything (everything hits the Knight); melee hits the front position (70%)
 *  or the next; casters hit positions 3 and 4; fliers hit anyone (#52, 1.6: positions are the marching order). */
function attackHero(e: Enemy, atk: number) {
  const n = N();
  const alive = aliveHeroes();
  if (!alive.length) return;
  let target: Hero;
  const role = roleOf(e), knight = heroById('knight');
  if (n.taunt > 0 && knight && !knight.downed) target = knight;
  else if (n.smoke > 0 && rule('rogue', 'vanish') && alive.some(h => h.id !== 'rogue') && role !== 'healer' && e.defId !== 'bat') { const vis = alive.filter(h => h.id !== 'rogue'); target = vis[chance(0.7) || vis.length < 2 ? 0 : 1]; }   // Vanish
  else if (role === 'healer') { const back = alive.filter(h => S.g.heroes.indexOf(h) >= 2); target = pick(back.length ? back : alive); }
  else if (e.defId === 'bat') target = pick(alive);
  else target = alive[chance(0.7) || alive.length < 2 ? 0 : 1];
  if (n.smoke > 0 && rule('rogue', 'vanish') && target.id === 'rogue') { const vis = alive.filter(h => h.id !== 'rogue'); if (vis.length) target = pick(vis); }
  if (heroFx(target, 'dodge') > 0 && chance(heroFx(target, 'dodge'))) { floatText(heroCenter(S.g.heroes.indexOf(target)).x + rand(-6, 6), heroNumY, 'dodge', '#a999bd'); return; }   // Shadow
  if (n.smoke > 0 && chance(T.SMOKE_MISS)) { floatText(heroCenter(S.g.heroes.indexOf(target)).x + rand(-6, 6), heroNumY, 'miss', '#a999bd'); return; }   // Smoke Bomb
  const st = heroStats(target);
  let raw = atk;
  if (n.cond === 'dark') raw *= 1 + T.COND_DARK_ATK;   // Pitch Dark
  const over = e.aliveSec - T.FURY_AFTER_SEC;
  if (over > 0) raw *= 1 + T.FURY_PER_SEC * over;
  if (n.ward > 0) raw *= wardTaken();
  raw *= auraTaken(target);   // the Knight's shield wall covers the hero behind him
  const armor = st.armor * (n.sanctuary! > 0 ? 1 + T.RULE_SANCTUARY_ARMOR : 1) * (target.id === 'knight' && n.taunt > 0 && rule('knight', 'holdTheLine') ? 1 + T.RULE_HOLD_ARMOR : 1);
  const dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) - armor * 0.5));
  const i = S.g.heroes.indexOf(target);
  vfx('claw', heroCenter(i), undefined, 0.35);
  floatText(heroCenter(i).x + rand(-6, 6), heroNumY, `-${fmtNum(dmg)}`, '#ff8a80');
  hurtHero(target, dmg);
  reflect(e, dmg);
  if (target === knight && n.taunt > 0 && e.marks?.taunted! > 0 && legendOn('tithe')) {   // The Tithe
    const g = T.LEGEND_TITHE_GOLD * n.floor; gainGold(g); floatText(enemyCenter(e).x, enemyNumY(e) + 8, `+${g}g`, '#f2b84b');
  }
}
/** Damage on a hero. Last Stand keeps everyone at 1 HP or more. */
function hurtHero(h: Hero, dmg: number) {
  h.hp -= dmg;
  if (h.hp <= 0 && N().lastStand > 0) { h.hp = 1; return; }
  if (h.hp <= 0) { h.hp = 0; h.downed = true; h.queued = null; toast(`${heroLabel(h.id)} is down!`, '#ff8a80'); sfx.down(); boysNoteDown(); }
}

/** A boss's telegraphed move starts instead of a normal action. Returns true when it did. */
function bossMove(e: Enemy): boolean {
  const n = N();
  e.acts = (e.acts ?? 0) + 1;
  const move = moveOf(e);
  if (move === 'slam' && e.acts % T.BOSS_SLAM_EVERY === 0) {
    e.wind = e.windMax = T.BOSS_WINDUP_SEC;
    toast(`${e.name} winds up SMASH!`, '#ff8a80'); sfx.windup(); coach('windup');
    return true;
  }
  if (move === 'loan' && e.acts % T.LOAN_EVERY === 0) {
    e.wind = e.windMax = T.LOAN_WINDUP_SEC;
    const friend = n.enemies.find(x => x !== e && x.hp > 0);
    toast(friend ? `${e.name} empowers the ${friend.name}!` : `${e.name} summons help.`, '#ff8a80'); sfx.windup();
    return true;
  }
  if (move === 'evict' && e.acts % T.EVICT_EVERY === 0) {   // EXECUTE names a position: whoever stands there takes it
    const v = mostHurt();
    if (!v) return false;
    e.evict = S.g.heroes.indexOf(v); e.wind = e.windMax = T.EVICT_WINDUP_SEC;
    toast(`${e.name}: EXECUTE on position ${e.evict + 1} (${HERO_NAME[v.id]})!`, '#ff8a80'); sfx.windup();   // name alone: no room for the class
    return true;
  }
  if ((move === 'hook' || move === 'shove') && S.g.heroes.length > 1 && (e.acts === T.LINE_BREAK_FIRST || (e.acts > T.LINE_BREAK_FIRST && (e.acts - T.LINE_BREAK_FIRST) % T.LINE_BREAK_EVERY === 0))) {
    e.wind = e.windMax = T.LINE_BREAK_WINDUP_SEC; sfx.windup();
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
  if (move === 'hook') { e.lunge = 0.3; sfx.handle(); hookLine(); vfx('chain', { x: POS_X[0], y: 178 }, { x: enemyCenter(e).x - 8, y: 178 }, T.SWAP_SEC); return; }
  if (move === 'shove') { e.lunge = 0.3; sfx.slam(); return shoveLine(); }
}

/** The Warlock's summon takes the free slot next to him (move id 'loan'). */
function loanFriend(e: Enemy) {
  const n = N();
  const old = n.enemies.find(x => x !== e && x.hp > 0);
  if (old) {   // empowered: back to full and meaner
    old.hp = old.maxHp; old.atk *= T.LOAN_REFI; old.aliveSec = 0;
    const c = enemyCenter(old); floatText(c.x, enemyNumY(old) - 6, 'EMPOWERED', '#ff8a80'); vfx('heal', c, undefined, 0.7);
    e.lunge = 0.3; sfx.handle();
    return;
  }
  const def = ENEMY_BY_ID[e.acts! % (2 * T.LOAN_EVERY) === 0 ? 'junk' : 'auditor'];
  const slot = freeSlot({ ...def, role: undefined });
  if (slot < 0) return;
  const add = makeEnemy(def, n.floor, n.floorMap === 'elite', slot, true);
  add.atb = 0; add.enter = T.STEP_IN_SEC;
  const i = n.enemies.findIndex(x => x.hp <= 0 && x.slot === slot);
  if (i >= 0) n.enemies[i] = add; else n.enemies.push(add);
  e.lunge = 0.3; sfx.handle();
  toast(`The ${def.name} join${def.role === 'swarm' ? '' : 's'} the fight.`, '#ff8a80');
}

/** EXECUTE lands on one hero; the Black Knight's shield comes back (move id 'evict'). */
function eviction(e: Enemy) {
  const n = N();
  const knight = heroById('knight')!;
  let v = S.g.heroes[e.evict ?? 0];
  if (!v || v.downed) v = mostHurt();
  e.evict = undefined; e.lunge = 0.3;
  sfx.slam(); n.noise = Math.min(100, n.noise + T.NOISE_CRIT);
  if (v) {
    const taunted = n.taunt > 0 && !knight.downed;
    const h = taunted ? knight : v;
    const dmg = Math.max(1, Math.round(maxHp(h) * (taunted ? T.BOSS_SLAM_TAUNT_PCT : T.EVICT_PCT) * (n.ward > 0 ? T.BOSS_SLAM_WARD_MULT : 1)));
    const i = S.g.heroes.indexOf(h);
    vfx('claw', heroCenter(i), undefined, 0.5);
    floatText(heroCenter(i).x, heroNumY - 4, `-${fmtNum(dmg)}!`, '#ff5a5a');
    reflect(e, dmg);
    toast(taunted ? `${heroLabel(knight.id)} takes the EXECUTE for ${HERO_NAME[v.id]}.` : `EXECUTE! ${heroLabel(h.id)} takes a brutal hit.`, '#ff8a80');
    hurtHero(h, dmg);
  }
  if (e.hp > 0) { e.shield = true; toast(`${e.name} raises his shield again.`, '#8fd8ff'); }
}

function grantXp(amount: number) {
  for (const h of S.g.heroes) {
    if (h.downed) continue;
    h.xp += amount;
    while (h.xp >= xpNeeded(h)) {
      h.xp -= xpNeeded(h); h.level++;
      h.hp = maxHp(h);
      toast(`${heroLabel(h.id)} reached level ${h.level}!`, '#f2b84b'); sfx.level();
      N().noise = Math.min(100, N().noise + T.NOISE_LEVEL);
    }
  }
}

/** Ward up and the attacker is Taunted: part of the hit bounces back. */
function reflect(e: Enemy, dmg: number) {
  const n = N(), taunted = e.marks?.taunted! > 0;
  // Ward + Taunt bounce MARK_TAUNT_REFLECT; Thorns (Knight's tree) bounces from Taunted enemies without Ward;
  // Retribution (the priest's tree) from anyone hitting a warded hero. The biggest one counts.
  const pct = Math.max(n.ward > 0 && taunted ? T.MARK_TAUNT_REFLECT : 0, taunted && rule('knight', 'thorns') ? T.RULE_THORNS : 0, n.ward > 0 && rule('healer', 'retribution') ? T.RULE_RETRIBUTION : 0);
  if (!pct) return;
  const back = Math.max(1, Math.round(dmg * pct));
  e.hp -= back; e.flash = 0.15;
  const c = enemyCenter(e); floatText(c.x, enemyNumY(e) - 6, `-${fmtNum(back)} bounced`, MARKS.taunted.color);
}

/** The boss's telegraphed big attack lands. */
function bossSlam(e: Enemy) {
  const n = N();
  e.braced = false;
  e.lunge = 0.3;
  sfx.slam(); n.noise = Math.min(100, n.noise + T.NOISE_CRIT);
  const ward = n.ward > 0 ? T.BOSS_SLAM_WARD_MULT : 1;
  const knight = heroById('knight')!;
  const targets = n.taunt > 0 && !knight.downed ? [knight] : aliveHeroes();
  const pct = targets.length === 1 && targets[0] === knight && n.taunt > 0 ? T.BOSS_SLAM_TAUNT_PCT : T.BOSS_SLAM_PCT;
  for (const h of targets) {
    const dmg = Math.max(1, Math.round(maxHp(h) * pct * ward));
    const i = S.g.heroes.indexOf(h);
    vfx('claw', heroCenter(i), undefined, 0.5);
    floatText(heroCenter(i).x, heroNumY - 4, `-${fmtNum(dmg)}!`, '#ff5a5a');
    hurtHero(h, dmg);
    reflect(e, dmg);
  }
  toast(n.taunt > 0 && !knight.downed ? `SMASH hits ${heroLabel(knight.id)}, taunted.` : ward < 1 ? 'SMASH, softened by Ward.' : 'SMASH hits everyone!', '#ff8a80');
}

/** Autocast (#53, 2.3): a bought skill casts itself the moment it is ready, on its default target. It ignores marks,
 *  combos and wind-ups, never casts an ultimate, and fires through every away state; changing places stops it. */
function autocast(h: Hero) {
  if (h.downed || h.moving || !N().enemies.some(e => e.hp > 0)) return;
  for (const slot of [1, 2]) if (autocastOn(h.id, slot) && abilityUnlocked(h, slot) && h.cd[slot] <= 0) { h.lunge = 0.3; castAbility(h, slot); }
}
/** Wildfire's burning and Choking Smoke tick (the Mage's and the Rogue's trees, #53). */
function dots(dt: number) {
  const n = N(), rog = heroById('rogue');
  const choke = n.smoke > 0 && rog && !rog.downed && rule('rogue', 'choking') ? heroStats(rog).atk * T.RULE_CHOKE_DPS : 0;
  for (const e of n.enemies) {
    if (e.hp <= 0) continue;
    let d = choke;
    if (e.burn! > 0) { e.burn! -= dt; d += e.burnDps ?? 0; if (e.burn! <= 0) { e.burn = 0; e.burnDps = 0; } }
    if (d > 0) e.hp -= d * dt;
  }
}
/** Advances the battle. Returns 'victory', 'wipe' or null while it is ongoing. */
/** Skill cooldowns run down: in fights, and between them since party skills can be cast there (#122). */
export function tickCooldowns(dt: number) { for (const h of S.g.heroes) h.cd = h.cd.map(c => Math.max(0, c - dt)); }
export function updateBattle(dt: number): 'victory' | 'wipe' | null {
  const n = N();
  tickCooldowns(dt);
  dots(dt);
  if (n.ward > 0 && setOn('healer', 'dawnward', 3)) for (const h of aliveHeroes()) h.hp = Math.min(maxHp(h), h.hp + maxHp(h) * T.SET_DAWNWARD_REGEN * dt);   // Dawnward, three pieces
  for (const e of n.enemies) {
    e.flash = Math.max(0, e.flash - dt);
    if (e.marks) for (const k of Object.keys(e.marks) as MarkId[]) { e.marks[k]! -= dt; if (e.marks[k]! <= 0) delete e.marks[k]; }
  }
  // Real time (#52, 1.2): each unit attacks every BASE_ATTACK_SEC x 10 / speed seconds (atb is the progress, 0..100).
  const flowK = 1 + T.FLOW_SPEED * clamp01((n.flow - T.FLOW_MIN) / (T.FLOW_MAX - T.FLOW_MIN));
  for (const h of S.g.heroes) {
    if (h.downed) continue;
    if (abilityUnlocked(h, ULT_SLOT)) h.ult = Math.min(1, h.ult + dt / T.ULT_CHARGE_SEC * blessPow('moonwell', T.BLESS_MOON_ULT) * (n.cond === 'haunted' ? 1 + T.COND_HAUNTED_ULT : 1) * (1 + heroFx(h, 'ultRate')));   // only during fights, once bought (Ley Lines: faster)
    if (h.moving) continue;   // changing places: no attacks for SWAP_SEC (#52, 1.6)
    autocast(h);   // the tree's autocasts: dumb, and they keep firing while you're away (#53, 2.3)
    h.atb += atbRate(heroStats(h).speed) * dt * speedMult() * curioSpeedMult() * flowK * (1 + heroFx(h, 'atkSpeed'));
    if (h.atb >= 100) { h.atb -= 100; heroAct(h); }
  }
  for (const e of n.enemies) {
    if (e.hp <= 0) continue;
    e.aliveSec += dt;
    if ((e.wind ?? 0) > 0) { e.wind! -= dt; if (e.wind! <= 0) { e.wind = 0; landMove(e); } continue; }   // winding up: no normal attacks
    if (e.stunned > 0) { e.stunned = Math.max(0, e.stunned - dt); continue; }
    if ((e.enter ?? 0) > 0) { e.enter = Math.max(0, e.enter! - dt); continue; }   // still stepping into its position
    e.atb += atbRate(e.speed) * dt;
    if (e.atb >= 100) { e.atb -= 100; enemyAct(e); }
  }
  // Remove the dead, grant XP.
  for (const e of n.enemies) {
    if (e.hp <= 0 && e.maxHp > 0) {
      grantXp((e.boss ? T.XP_PER_BOSS : T.XP_PER_KILL) * n.floor);
      const ot = overtimeGold();   // Spreadsheet Warrior: kills while Excel is up pay overtime
      if (ot) { gainGold(ot); const c = enemyCenter(e); floatText(c.x, enemyNumY(e) + 8, `+${ot}g overtime`, '#6fcf7f'); }
      dropFromKill(e);   // #52, 1.3: drops fall where the enemy died
      if (n.cond === 'haunted') n.noise = Math.min(100, n.noise + T.COND_HAUNTED_NOISE);
      if (e.boss) {
        n.noise += T.NOISE_BOSS_KILL; toast(`${e.name} defeated!`, '#f2b84b'); boysSay('bossKill');
        n.enemies.forEach(x => { if (x !== e && x.hp > 0) { x.hp = 0; x.maxHp = 0; } });   // without the boss the rest run
        n.reserve = [];
        if (N().run) N().run!.oath = false;   // the Pilgrim's oath is kept: the portal opens again
      }
      e.maxHp = 0;
    }
  }
  stepIn();
  if (aliveHeroes().length === 0) return 'wipe';
  if (n.enemies.every(e => e.hp <= 0) && !n.reserve.length) return 'victory';
  return null;
}

/** atb gained per second at this speed: 100 per attack interval (BASE_ATTACK_SEC x 10 / speed). */
const atbRate = (speed: number) => (100 * speed) / (T.BASE_ATTACK_SEC * 10);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function reviveHero(h: Hero, pct: number) {
  if (!h.downed) return;
  h.downed = false; h.hp = Math.max(1, Math.round(maxHp(h) * pct)); h.atb = 0;
}
export const anyBoss = () => N().enemies.some(e => e.boss);

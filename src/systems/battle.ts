import { T } from '../config/tuning';
import { S, N, type Enemy, type Hero, type VfxKind } from '../core/state';
import { ENEMIES, BOSS, type EnemyDef } from '../data/enemies';
import { ABILITIES } from '../data/heroes';
import { pick, randi, rand, chance } from '../core/rng';
import { heroStats, maxHp, xpNeeded } from './stats';
import { floatText, toast } from '../core/fx';
import { sfx } from '../ui/audio';
import { speedMult } from './tired';
import { CD_PCT } from '../data/city';

export const HERO_X = [208, 124, 40];   // knight in front (right), healer at the back
export const ENEMY_X = [380, 457, 534];
export const UNIT_Y = 212;
let enemyUid = 1;

// Visual effects on the monitor (design doc section 4: every action must be visible).
export const heroCenter = (i: number) => ({ x: HERO_X[i] + 30, y: UNIT_Y + 40 });
export function enemyCenter(e: Enemy) { const i = N().enemies.indexOf(e); return e.boss ? { x: 542, y: UNIT_Y + 24 } : { x: ENEMY_X[Math.max(0, i)] + 30, y: UNIT_Y + 40 }; }
function vfx(kind: VfxKind, at: { x: number; y: number }, from?: { x: number; y: number }, dur = 0.4) {
  N().vfx.push({ kind, x: at.x, y: at.y, x2: from?.x ?? at.x, y2: from?.y ?? at.y, t: 0, dur, seed: Math.random() });
}

function makeEnemy(def: EnemyDef, floor: number, elite: boolean): Enemy {
  const hpM = (1 + T.ENEMY_HP_PER_FLOOR * (floor - 1)) * (elite ? T.ELITE_MULT : 1);
  const atkM = (1 + T.ENEMY_ATK_PER_FLOOR * (floor - 1)) * (elite ? T.ELITE_MULT : 1);
  const hp = Math.round(def.hp * hpM);
  return { uid: enemyUid++, defId: def.id, name: def.name, hp, maxHp: hp, atk: def.atk * atkM, armor: def.armor * (1 + 0.1 * floor), speed: def.speed, atb: rand(0, 40), turnsAlive: 0, stunned: 0, boss: !!def.boss, flash: 0 };
}

export function spawnBattle(floor: number, boss: boolean, elite: boolean) {
  const n = N();
  if (boss) n.enemies = [makeEnemy(pick(ENEMIES), floor, elite), makeEnemy(BOSS, floor, elite)];
  else {
    const count = randi(2, 3);
    n.enemies = Array.from({ length: count }, () => makeEnemy(pick(ENEMIES), floor, elite));
  }
}

export const aliveHeroes = () => S.g.heroes.filter(h => !h.downed);
export const abilityUnlocked = (h: Hero, slot: number) => slot <= 2 && h.level >= T.ABILITY_UNLOCK[slot];

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
  const mult = heroDamageMult();
  h.queued = null;
  h.cd[slot] = ABILITIES[h.id][slot].cd * (1 - CD_PCT[S.g.furniture.library ?? 0]);
  n.noise = Math.min(100, n.noise + T.NOISE_ABILITY);
  sfx.ability();
  if (h.id === 'knight' && slot === 1) { n.taunt = 5; vfx('taunt', me, undefined, 0.7); toast(`${h.name}: TAUNT`, '#6aa8ff'); return; }
  if (h.id === 'knight' && slot === 2) { const e = frontEnemy(); if (e) { hitEnemy(e, st.atk * 2 * mult, st.crit, 'bash'); e.stunned = 1; } return; }
  if (h.id === 'mage' && slot === 1) { n.enemies.filter(e => e.hp > 0).forEach(e => hitEnemy(e, st.atk * 1.0 * mult, st.crit, 'fire', me)); return; }
  if (h.id === 'mage' && slot === 2) { const e = frontEnemy(); if (e) hitEnemy(e, st.atk * 2.6 * mult, st.crit, 'frost', me); return; }
  if (h.id === 'healer' && slot === 1) { sfx.heal(); aliveHeroes().forEach(x => healHero(x, st.atk * 2.2 + 14)); return; }
  if (h.id === 'healer' && slot === 2) { n.ward = 6; vfx('ward', heroCenter(1), undefined, 0.8); toast(`${h.name}: WARD`, '#6fcf7f'); return; }
}

function heroDamageMult(): number {
  const n = N();
  return n.flow * (n.guilt > 0 ? 1 - T.GUILT_DMG : 1);
}

function hitEnemy(e: Enemy, raw: number, crit: number, kind: VfxKind = 'slash', from?: { x: number; y: number }) {
  const n = N();
  vfx(kind, enemyCenter(e), from, kind === 'bolt' ? 0.35 : kind === 'fire' ? 0.6 : 0.35);
  const isCrit = chance(crit / 100);
  let dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) - e.armor * 0.5));
  if (isCrit) { dmg *= 2; n.noise += T.NOISE_CRIT; }
  e.hp -= dmg; e.flash = 0.15;
  const idx = n.enemies.indexOf(e);
  floatText(ENEMY_X[Math.max(0, idx)] + 18, UNIT_Y - 30, isCrit ? `-${dmg}!` : `-${dmg}`, isCrit ? '#f2b84b' : '#ff8a80');
  if (isCrit) sfx.crit(); else sfx.hit();
}

function healHero(h: Hero, amount: number) {
  if (h.downed) return;
  vfx('heal', heroCenter(S.g.heroes.indexOf(h)), undefined, 0.8);
  const mx = maxHp(h);
  const before = h.hp;
  h.hp = Math.min(mx, h.hp + Math.round(amount));
  const i = S.g.heroes.indexOf(h);
  if (h.hp > before) floatText(HERO_X[i] + 18, UNIT_Y - 30, `+${h.hp - before}`, '#6fcf7f');
}

function frontEnemy(): Enemy | undefined { return N().enemies.find(e => e.hp > 0); }
function weakestEnemy(): Enemy | undefined { return [...N().enemies].filter(e => e.hp > 0).sort((a, b) => a.hp - b.hp)[0]; }

function heroAct(h: Hero) {
  const n = N();
  h.lunge = 0.3;
  const me = heroCenter(S.g.heroes.indexOf(h));
  n.noise = Math.min(100, n.noise + T.NOISE_ACTION);
  const st = heroStats(h);
  const mult = heroDamageMult();
  // Auto attack (slot 0).
  if (h.id === 'healer') {
    const hurt = aliveHeroes().filter(x => x.hp < maxHp(x) * 0.6).sort((a, b) => a.hp / maxHp(a) - b.hp / maxHp(b))[0];
    if (hurt) { sfx.heal(); healHero(hurt, st.atk * 1.6 + 8); return; }
  }
  const target = h.id === 'mage' ? weakestEnemy() : frontEnemy();
  if (target) hitEnemy(target, st.atk * mult, st.crit, h.id === 'mage' ? 'bolt' : h.id === 'healer' ? 'smite' : 'slash', me);
}

function enemyAct(e: Enemy) {
  const n = N();
  e.turnsAlive++;
  if (e.stunned > 0) { e.stunned--; return; }
  e.lunge = 0.3;
  const alive = aliveHeroes();
  if (!alive.length) return;
  let target: Hero;
  if (n.taunt > 0 && !S.g.heroes[0].downed) target = S.g.heroes[0];
  else target = chance(0.5) && !S.g.heroes[0].downed ? S.g.heroes[0] : pick(alive);
  const st = heroStats(target);
  let raw = e.atk;
  const over = e.turnsAlive - T.INTEREST_AFTER_TURNS;
  if (over > 0) raw *= 1 + T.INTEREST_PER_TURN * over;
  if (n.ward > 0) raw *= 0.6;
  const dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) - st.armor * 0.5));
  target.hp -= dmg;
  const i = S.g.heroes.indexOf(target);
  vfx('claw', heroCenter(i), undefined, 0.35);
  floatText(HERO_X[i] + 18, UNIT_Y - 30, `-${dmg}`, '#ff8a80');
  if (target.hp <= 0) { target.hp = 0; target.downed = true; target.queued = null; toast(`${target.name} is down!`, '#ff8a80'); sfx.bad(); }
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

/** Advances the battle. Returns 'victory', 'wipe' or null while it is ongoing. */
export function updateBattle(dt: number): 'victory' | 'wipe' | null {
  const n = N();
  for (const h of S.g.heroes) h.cd = h.cd.map(c => Math.max(0, c - dt));
  for (const e of n.enemies) e.flash = Math.max(0, e.flash - dt);
  for (const h of S.g.heroes) {
    if (h.downed) continue;
    h.atb += heroStats(h).speed * T.ATB_RATE * dt * speedMult();
    if (h.atb >= 100) { h.atb -= 100; heroAct(h); }
  }
  for (const e of n.enemies) {
    if (e.hp <= 0) continue;
    e.atb += e.speed * T.ATB_RATE * dt;
    if (e.atb >= 100) { e.atb -= 100; enemyAct(e); }
  }
  // Remove the dead, grant XP.
  for (const e of n.enemies) {
    if (e.hp <= 0 && e.maxHp > 0) {
      grantXp((e.boss ? T.XP_PER_BOSS : T.XP_PER_KILL) * n.floor);
      if (e.boss) { n.noise += T.NOISE_BOSS_KILL; toast(`${e.name} defeated!`, '#f2b84b'); }
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

// The battle area's view model (V2, #67): the game's state, read once a frame and handed to the renderer
// (src/render/page/live.js). Rules never live here; this file only reads S.g / N() and lays things out on the grid.
import { T } from '../config/tuning';
import { S, N, type Enemy, type Hero, type HeroId } from '../core/state';
import { ENEMY_BY_ID } from '../data/enemies';
import { MAP_INFO, RARITY_COLOR } from '../data/items';
import { ULT_SLOT, ABILITIES } from '../data/heroes';
import { maxHp } from '../systems/stats';
import { abilitiesLocked, abilityUnlocked, bodies, moveOf } from '../systems/battle';
import { curioDef, curioBlocked, curioText } from '../systems/curios';
import { GOBLIN, goblinPos } from '../ui/monitor';
import { HERO_X, ENEMY_X } from '../systems/battle';

/** The live battle area replaces the old one whenever the party is in the dungeon (not the floor map). */
export function liveActive(): boolean {
  const n = S.g.night;
  return !!n && S.g.screen === 'night' && n.location === 'dungeon' && n.phase !== 'mapChoice';
}

const PAGE_ID: Record<HeroId, string> = { knight: 'knight', mage: 'mage', healer: 'priest' };
const PH: Record<string, number> = { knight: 2.6, rogue: 3.4, mage: 1.3, priest: 0 };
const KEYS: Record<HeroId, string[]> = { knight: ['1', '2', '3'], mage: ['Q', 'W', 'E'], healer: ['A', 'S', 'D'] };
const PAGE_SLOT: Record<string, number> = { knight: 0, rogue: 1, mage: 2, priest: 3 };   // hud.js HEROES order
// the front rank stands at x 126, the others 35 px apart behind it (grid doc §4b)
const rankX = (rank: number) => 126 - 35 * rank;
// enemies: the mob in two lanes (grid doc §4c); up to three now (packs of six come with #52 1.3)
const FRONT_X = [186, 226, 266], BOSS_X = 300;
const LANE_Y: Record<string, number> = { front: 202, back: 190, mid: 196 };
const BAR_Y: Record<string, number> = { front: 132, back: 117, mid: 121 };
const RIG: Record<string, { rig: string; o?: Record<string, unknown> }> = {
  skeleton: { rig: 'skel' }, collector: { rig: 'zomb', o: { sword: true } }, auditor: { rig: 'necro' },
  shelter: { rig: 'skel', o: { helm: true, shield: true } },
};
const MOVE_LABEL: Record<string, string> = { slam: 'Smash', loan: 'Summon', evict: 'Execute' };
const MARK_TAG: Record<string, [string, string]> = { stagger: ['STAGGERED', 'bone'], chill: ['CHILLED', 'stone'], judged: ['JUDGED', 'pale'], taunted: ['TAUNTED', 'dusk'] };
const RARITY_IDX: Record<string, string> = { common: 'moon', uncommon: 'moss', rare: 'stone', epic: 'arcane', legendary: 'gold' };
const colorIdx = (c: string) => /f2b84b|ffd/.test(c) ? 'gold' : /ff8a80|ff5a5a|e0524a/.test(c) ? 'crimson' : /6fcf7f|9fe08a/.test(c) ? 'heal' : /8fd8ff|8fb3ff|6aa8ff/.test(c) ? 'stone' : 'moon';

let flowStep = 0, flowGlowUntil = 0;

export function buildBattleView(nowMs: number) {
  const g = S.g, n = N();
  // the party, front first (the knight leads; marching order comes with #52 1.6)
  const order = g.heroes.map((h, i) => ({ h, i }));
  const party = order.map(({ h }, rank) => {
    const id = PAGE_ID[h.id];
    return { id, x: rankX(rank), ph: PH[id], hp: h.downed ? 0 : h.hp / maxHp(h), down: h.downed, lunge: (h.lunge ?? 0) > 0 ? 3 : 0 };
  });
  // the enemies: the boss on the party's lane behind the mob, the rest in the front lane
  let slot = 0;
  const enemies = n.enemies.map((e: Enemy) => {
    const d = ENEMY_BY_ID[e.defId];
    const boss = e.boss, lane = boss ? 'mid' : 'front', x = boss ? BOSS_X : FRONT_X[Math.min(2, slot++)];
    const rig = !boss ? RIG[e.defId] : undefined;
    const s = boss ? 4 : 3;
    let barY = BAR_Y[lane];
    if (!rig && d) { const h = Math.max(...d.sprite.map(r => r[1] + r[3])) * s; barY = Math.max(66, LANE_Y[lane] - h - (e.defId === 'bat' ? 26 : 8)); }
    const tags: [string, string][] = [];
    if (e.shield) tags.push(['SHIELD', 'stone']);
    if (e.enraged) tags.push(['ENRAGED', 'crimson']);
    for (const k of Object.keys(e.marks ?? {})) if ((e.marks as Record<string, number>)[k] > 0 && MARK_TAG[k]) tags.push(MARK_TAG[k]);
    if (e.stunned > 0) tags.push(['STUNNED', 'moon']);
    const wind = (e.wind ?? 0) > 0 && e.windMax ? { label: windLabel(e), f: 1 - (e.wind ?? 0) / e.windMax } : null;
    return {
      dead: e.hp <= 0, boss, lane, x, barY, hp: Math.max(0, e.hp / (e.maxHp || 1)), flash: e.flash, lunge: (e.lunge ?? 0) > 0 ? 3 : 0, ph: (e.uid % 7) * 0.9,
      rig: rig?.rig, o: rig?.o, px: rig ? null : d?.sprite, s, bodies: e.per ? bodies(e) : 1, fly: e.defId === 'bat', tags: tags.slice(0, 2), wind,
    };
  });
  // floating numbers: the systems place them in the old screen's coordinates; put each over the unit it belongs to
  const live = enemies.map((e, i) => ({ e, i }));
  const floaters = n.fx.map(f => {
    let x: number, y: number;
    if (f.x < 330) { const k = nearest(HERO_X.map(v => v + 18), f.x); x = party[Math.min(k, party.length - 1)]?.x ?? f.x / 2; y = 110; }
    else { const k = nearest(ENEMY_X.map(v => v + 18), f.x); const hit = live.find(q => q.i === k)?.e ?? live[0]?.e; x = hit ? hit.x : f.x / 2; y = hit ? hit.barY - 12 : 100; }
    return { text: f.text, x, y: y - (1 - f.t) * 16, idx: colorIdx(f.color), big: f.text.endsWith('!') };
  });
  // effects: the systems aim them in the old screen's coordinates too (old battle area 668 x 464, scene under a 112 band)
  const at = (ox: number) => {
    if (ox < 330) { const k = nearest(HERO_X.map(v => v + 30), ox); return { x: party[Math.min(k, party.length - 1)]?.x ?? ox / 2, y: 168 }; }
    const k = nearest(ENEMY_X.map(v => v + 30), ox), hit = live.find(q => q.i === k)?.e ?? live[0]?.e;
    return { x: hit ? hit.x : ox / 2, y: hit && hit.boss ? 160 : 172 };
  };
  const vfx = n.vfx.map(v => {
    const a = at(v.x), b = v.x2 === v.x && v.y2 === v.y ? a : (v.x2 < 330 ? at(v.x2) : { x: v.x2 / 2, y: Math.max(70, 64 + (v.y2 - 112) * 142 / 352) });
    return { kind: v.kind, x: a.x, y: v.kind === 'ward' ? 196 : a.y, x2: b.x, y2: b.y, k: v.t / v.dur };
  });
  const loot = n.floorLoot.map(l => ({ x: l.x / 2, y: 201, r: l.entry.kind === 'item' ? l.entry.item.rarity : 'map' }));
  const flies = n.lootFly.filter(f => f.t >= f.delay).map(f => { const k = (f.t - f.delay) / f.max; return { text: f.text, x: f.x / 2 + f.dx / 2, y: 186 - k * 48, idx: rarityIdxOf(f.color) }; });
  // the corner
  const step = Math.floor((n.flow + 1e-6) / T.FLOW_GLOW_STEP);
  if (step > flowStep && n.flow > T.FLOW_MIN + 0.01) flowGlowUntil = nowMs + T.FLOW_GLOW_SEC * 1000;
  flowStep = step;
  const map = n.floorMap === 'plain' ? '' : ` · ${MAP_INFO[n.floorMap].name.toLowerCase()}`;
  const boss = n.floor % T.CHECKPOINT_EVERY === 0 ? ' · boss floor' : '';
  const corner = {
    where: `Shadow Crypt · floor ${n.floor} · battle ${Math.min(n.battleIdx + 1, T.BATTLES_PER_FLOOR)}/${T.BATTLES_PER_FLOOR}${map}${boss}`,
    flow: n.flow.toFixed(1), flowBar: (n.flow - T.FLOW_MIN) / (T.FLOW_MAX - T.FLOW_MIN), flowGlow: nowMs < flowGlowUntil,
  };
  return { mode: n.phase, cam: n.walkScroll * 0.7, walking: n.phase === 'walk', party, enemies, floaters, vfx, loot, flies, corner, portalOk: n.phase !== 'battle', buffs: buffList(), curio: curioView(), goblin: goblinView(), bar: barView(order.map(o => o.h)) };
}

function windLabel(e: Enemy): string {
  const m = moveOf(e) ?? '';
  const base = MOVE_LABEL[m] ?? 'Wind-up';
  if (m === 'evict' && e.evict != null) return `${base} · ${S.g.heroes[e.evict]?.name.split(' ')[0] ?? ''}`;
  return base;
}
const nearest = (xs: number[], x: number) => xs.reduce((b, v, i) => (Math.abs(v - x) < Math.abs(xs[b] - x) ? i : b), 0);
function rarityIdxOf(color: string): string {
  for (const [r, c] of Object.entries(RARITY_COLOR)) if (c.toLowerCase() === color.toLowerCase()) return RARITY_IDX[r] ?? 'moon';
  return colorIdx(color);
}

// buffs, right to left from the top-right corner (grid doc §5)
function buffList() {
  const n = N(), out: { icon: string; label: string; bad?: boolean; sweep?: number; tip: string }[] = [];
  const add = (icon: string, left: number, max: number, tip: string, bad = false) => out.push({ icon, label: `${Math.ceil(left)}s`, bad, sweep: max ? 1 - left / max : undefined, tip });
  if (n.boost > 0) add('can', n.boost, T.MONSTER_BOOST_SEC, 'Goblin Fuel: party acts 30% faster');
  if (n.crash > 0) add('crash', n.crash, T.MONSTER_CRASH_SEC, 'Sugar crash: party slower', true);
  if (n.lastStand > 0) add('shield', n.lastStand, T.LAST_STAND_SEC, 'Last Stand: nobody drops below 1 HP');
  if (n.taunt > 0) add('taunt', n.taunt, ABILITIES.knight[1].dur ?? 5, 'Taunt: enemies hit the knight');
  if (n.ward > 0) add('ward', n.ward, ABILITIES.healer[2].dur ?? 6, 'Ward: party protected');
  for (const b of n.partyBuffs) {
    if (b.fights !== undefined) out.push({ icon: 'cleave', label: 'next', tip: `${b.name}: party +${Math.round(b.dmg * 100)}% damage for the next fight` });
    else if (b.floor) out.push({ icon: b.dmg < 0 ? 'crash' : 'cleave', label: 'floor', bad: b.dmg < 0, tip: `${b.name}: party ${Math.round(b.dmg * 100)}% damage until the next floor` });
    else add(b.dmg < 0 ? 'crash' : 'hellfire', b.t, b.max, `${b.name}: party ${b.dmg >= 0 ? '+' : ''}${Math.round(b.dmg * 100)}% damage${b.speed ? `, +${Math.round(b.speed * 100)}% speed` : ''}`, b.dmg < 0);
  }
  if (n.goodDog > 0) add('judge', n.goodDog, T.GOOD_BOY_SEC, `Good Boy: loot goblins x${T.GOOD_BOY_GOBLIN}`);
  if (n.sulk > 0) add('crash', n.sulk, T.CURIO_SULK_SEC, 'Magoo sulks about the guild bank', true);
  if (n.guilt > 0) add('crash', n.guilt, T.GUILT_SEC, 'Guilt: party -10% damage', true);
  return out.slice(0, 6);
}

// the curio's parchment card in the band, its two choices (the page's layout: 85 x 20 buttons)
function curioView() {
  const n = N();
  if (n.phase !== 'curio' || !n.curio) return null;
  const c = n.curio, d = curioDef(c);
  if (!d) return null;
  const choices = c.stage === 'ask'
    ? d.choices.map(ch => {
      const why = curioBlocked(ch.id);
      return { label: [[curioText(ch.label), why ? 'u4' : 'u6']], cost: [[fit(why || curioText(ch.cost), 19), why ? 'u4' : 'u5']], act: why ? '' : 'curio', arg: ch.id, tip: why || curioText(ch.cost) };
    })
    : [{ label: [[c.stage === 'pick' ? 'Picking the lock' : 'Sneaking', 'u6']], cost: [[`${Math.ceil(c.t)} s left`, 'u5']], act: '', arg: '', tip: '' }];
  return { x: 236, px: d.sprite, card: { title: d.name, line: fit(d.line, 40), timer: c.stage === 'ask' ? Math.max(0, c.t / c.max) : 1 - Math.max(0, c.t / c.max), choices } };
}
const fit = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 3).trimEnd() + '...');

function goblinView() {
  const gp = goblinPos();
  return gp ? { x: gp.x / 2 + 9, px: GOBLIN } : null;
}

// the skill bar (grid doc §5): groups in marching order, two skills and the ultimate's gilded well
function barView(heroes: Hero[]) {
  const n = N();
  const hp = [1, 1, 1, 1], cooldown: Record<string, { f: number; s: number }> = {}, ult: Record<string, string | { need: number }> = {};
  let answer: string | null = null, combo: { key: string; label: string } | null = null;
  const wind = n.enemies.find(e => e.hp > 0 && (e.wind ?? 0) > 0);
  heroes.forEach(h => {
    const pid = PAGE_ID[h.id];
    hp[PAGE_SLOT[pid]] = h.downed ? 0 : h.hp / maxHp(h);
    KEYS[h.id].forEach((key, k) => {
      const si = k + 1, A = ABILITIES[h.id][si];
      if (!abilityUnlocked(h, si)) { cooldown[key] = { f: 1, s: `L${T.ABILITY_UNLOCK[si]}` as unknown as number }; return; }   // locked until that level
      if (si === ULT_SLOT) {
        if (h.ult < 1) cooldown[key] = { f: 1 - h.ult, s: Math.ceil((1 - h.ult) * T.ULT_CHARGE_SEC) };
        ult[key] = 'ready';
        return;
      }
      if (h.cd[si] > 0) cooldown[key] = { f: h.cd[si] / (A.cd || 1), s: Math.ceil(h.cd[si]) };
      else if (wind && !h.downed && answers(wind, h.id, si)) answer = key;
      else if (!combo && !h.downed) { const c = comboLabel(h.id, si); if (c) combo = { key, label: c }; }
    });
  });
  return { order: heroes.map(h => PAGE_ID[h.id]), heroIdx: heroes.map((_, i) => i), selected: n.heroTab, hp, cooldown, ult, answer, combo, queued: null, autocast: {}, blocked: abilitiesLocked() && n.location === 'dungeon' ? abilitiesLocked() : null };
}
/** A mark on the field that this skill cashes in (docs/design/dungeon.md, ability marks): the well glows gold. */
function comboLabel(id: HeroId, si: number): string {
  const alive = N().enemies.filter(e => e.hp > 0);
  const has = (e: Enemy | undefined, m: string) => !!e && ((e.marks as Record<string, number> | undefined)?.[m] ?? 0) > 0;
  if (id === 'mage' && si === 1 && alive.some(e => has(e, 'stagger'))) return `x${T.MARK_STAGGER_FIRE}`;
  if (id === 'knight' && si === 2 && has(alive.find(e => (e.wind ?? 0) > 0) ?? alive.find(e => e.shield) ?? alive[0], 'chill')) return `x${T.MARK_CHILL_BASH}`;
  if (id === 'healer' && si === 2 && alive.some(e => has(e, 'taunted'))) return 'back';
  return '';
}
/** Skills that answer a boss's wind-up (as the old skill bar's red pulse). */
function answers(e: Enemy, id: HeroId, si: number): boolean {
  const move = ENEMY_BY_ID[e.defId]?.move;
  if (move === 'slam') return (id === 'knight' && (si === 1 || (si === 2 && !e.braced))) || (id === 'healer' && si === 2);
  if (move === 'evict') return (id === 'knight' && si === 1) || (id === 'healer' && si === 2);
  if (move === 'loan') return id === 'mage' && si === 1;
  return false;
}

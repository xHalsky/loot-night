// The dungeon as a side-view 2.5D diorama (docs/design/dungeon.md).
// Layers back to front: far cave rock (slow parallax), mid arches and stalactites, a perspective floor, floor loot
// with rarity beams, the units, VFX; then cave lighting (a torch travels with the party, darkness everywhere else),
// fog swallowing the far end, and dark foreground silhouettes (pillars, chains, roots) sliding past the camera.
// The camera acts: dollies while walking, pushes in when a fight starts, pulls back on heavy hits,
// shakes on crits and slowly zooms onto legendary drops.
import { T } from '../config/tuning';
import { S, N, RARITIES, type Vfx, type FloatFx, type MarkId } from '../core/state';
import { HERO_SPRITES } from '../data/heroes';
import { ENEMY_BY_ID, ENVELOPE } from '../data/enemies';
import { bodies, moveOf } from '../systems/battle';
import { MARKS } from '../data/marks';
import { curioDef } from '../systems/curios';
import { HERO_X, ENEMY_X, UNIT_Y } from '../systems/battle';
import { maxHp } from '../systems/stats';
import { entryColor } from '../systems/loot';
import { drawPx, text, bar, drawVfx, GOBLIN, goblinPos } from './monitor';

const W = 616, H = 352, FEET = 296, FLOOR_TOP = 262, VP = 308;
const rnd = (i: number, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------- camera ----------
const cam = { z: 1, fx: W / 2, fy: H / 2, kick: 0, kickV: 0, shake: 0, leg: 0, legX: 0 };
const seenFx = new WeakSet<FloatFx>(), seenV = new WeakSet<Vfx>(), seenL = new WeakSet<object>();
let lastT = 0;
let light: HTMLCanvasElement | null = null;

function updateCamera(dt: number) {
  const n = N();
  for (const f of n.fx) if (!seenFx.has(f)) { seenFx.add(f); if (f.text.endsWith('!')) { cam.shake = 7; cam.kickV -= 0.9; } }
  for (const v of n.vfx) if (!seenV.has(v)) { seenV.add(v); if (v.kind === 'bash' || v.kind === 'smite' || v.kind === 'fire') cam.kickV -= 0.55; }
  for (const l of n.floorLoot) if (!seenL.has(l)) { seenL.add(l); if (l.entry.kind === 'item' && RARITIES.indexOf(l.entry.item.rarity) >= 4) { cam.leg = 3.2; cam.legX = l.x; } }
  const legOn = cam.leg > 0;
  cam.leg = Math.max(0, cam.leg - dt);
  const leg = n.floorLoot.find(l => l.entry.kind === 'item' && l.entry.item.rarity === 'legendary');
  if (leg) cam.legX = leg.x;
  let tz = 1, tfx = W / 2, tfy = H / 2;
  if (n.phase === 'battle') { tz = 1.09; tfx = 318; tfy = 232; }                     // push in when the fight starts
  else if (n.phase === 'walk') { tfy = H / 2 + Math.sin(performance.now() / 260) * 1.5; tfx = W / 2 + 6; }   // dolly sway
  if (legOn) { const k = Math.min(1, (3.2 - cam.leg) / 1.6); tz = 1 + 0.28 * k; tfx = cam.legX; tfy = 238; }   // slow zoom on a legendary
  const rate = legOn ? 1.2 : 3;
  cam.z += (tz - cam.z) * Math.min(1, dt * rate);
  cam.fx += (tfx - cam.fx) * Math.min(1, dt * rate);
  cam.fy += (tfy - cam.fy) * Math.min(1, dt * rate);
  // heavy hits pull the camera back (spring), then it settles in again
  cam.kickV += -cam.kick * 60 * dt; cam.kickV *= Math.exp(-9 * dt); cam.kick += cam.kickV * dt;
  cam.shake = Math.max(0, cam.shake - dt * 22);
}
function camApply(c: CanvasRenderingContext2D, parallax = 1) {
  const z = 1 + (cam.z + cam.kick - 1) * parallax;
  const sx = cam.shake ? (Math.random() - 0.5) * cam.shake : 0, sy = cam.shake ? (Math.random() - 0.5) * cam.shake : 0;
  c.translate(W / 2 + sx, H / 2 + sy); c.scale(z, z);
  // clamp the focus so the frame never shows outside the set
  const hw = W / 2 / z, hh = H / 2 / z;
  const fx = Math.max(hw, Math.min(W - hw, cam.fx)), fy = Math.max(hh, Math.min(H - hh, cam.fy));
  c.translate(-fx, -fy);
}
function toScreen(x: number, y: number) {
  const z = cam.z + cam.kick, hw = W / 2 / z, hh = H / 2 / z;
  const fx = Math.max(hw, Math.min(W - hw, cam.fx)), fy = Math.max(hh, Math.min(H - hh, cam.fy));
  return { x: (x - fx) * z + W / 2, y: (y - fy) * z + H / 2, z };
}

// ---------- set pieces ----------
function farCave(c: CanvasRenderingContext2D, scroll: number) {
  const g = c.createLinearGradient(0, 0, 0, FLOOR_TOP);
  g.addColorStop(0, '#0c0810'); g.addColorStop(1, '#1a1220');
  c.fillStyle = g; c.fillRect(-40, -40, W + 80, FLOOR_TOP + 40);
  const s = scroll * 0.18, span = 900;
  for (let i = 0; i < 16; i++) {
    const x = ((i * 61 - s) % span + span) % span - 120, y = 40 + rnd(i) * 160, r = 40 + rnd(i, 1) * 70;
    c.fillStyle = rnd(i, 2) > 0.5 ? '#160f1c' : '#1c1424';
    c.beginPath(); c.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2); c.fill();
  }
}
function midCave(c: CanvasRenderingContext2D, scroll: number) {
  const s = scroll * 0.5, span = 1040;
  for (let i = 0; i < 4; i++) {
    const x = ((i * 260 - s) % span + span) % span - 140;
    // stone pillar with an arch towards the next one
    c.fillStyle = '#251b2c'; c.fillRect(x, 40, 44, FLOOR_TOP - 40);
    c.fillStyle = '#31263a'; c.fillRect(x, 40, 6, FLOOR_TOP - 40);
    for (let k = 0; k < 7; k++) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, 60 + k * 30, 44, 2); }
    c.strokeStyle = '#251b2c'; c.lineWidth = 14; c.beginPath(); c.moveTo(x + 22, 52); c.quadraticCurveTo(x + 152, -20, x + 282, 52); c.stroke();
    // hanging roots
    c.strokeStyle = '#2e2230'; c.lineWidth = 2;
    for (let r = 0; r < 4; r++) { const rx = x + 60 + r * 40 + rnd(i, r) * 20; c.beginPath(); c.moveTo(rx, 10); c.quadraticCurveTo(rx + 8, 40, rx - 4, 60 + rnd(i, r + 4) * 50); c.stroke(); }
  }
  // stalactites
  const s2 = scroll * 0.6;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 53 - s2) % 742 + 742) % 742 - 60, h = 14 + rnd(i, 7) * 34;
    c.fillStyle = '#1e1624'; c.beginPath(); c.moveTo(x - 9, 28); c.lineTo(x + 9, 28); c.lineTo(x + 1, 28 + h); c.fill();
  }
}
function floor(c: CanvasRenderingContext2D, scroll: number) {
  const g = c.createLinearGradient(0, FLOOR_TOP, 0, H);
  g.addColorStop(0, '#1a131e'); g.addColorStop(1, '#2e2330');
  c.fillStyle = g; c.fillRect(-40, FLOOR_TOP, W + 80, H - FLOOR_TOP + 40);
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1;
  for (let k = 0; k < 7; k++) { const y = FLOOR_TOP + Math.pow(k / 6, 1.6) * (H - FLOOR_TOP + 20); c.beginPath(); c.moveTo(-40, y); c.lineTo(W + 40, y); c.stroke(); }
  const off = scroll % 56;
  for (let j = -6; j < 18; j++) {
    const xf = j * 56 - off, xb = VP + (xf - VP) * 0.45;
    c.beginPath(); c.moveTo(xb, FLOOR_TOP); c.lineTo(xf, H + 20); c.stroke();
  }
  c.fillStyle = '#382b3a'; c.fillRect(-40, FLOOR_TOP, W + 80, 2);
  // pebbles
  for (let i = 0; i < 18; i++) { const x = ((i * 47 - scroll) % 700 + 700) % 700 - 40, y = FLOOR_TOP + 10 + rnd(i, 3) * 70; c.fillStyle = '#3a2e3e'; c.fillRect(x, y, 3 + rnd(i) * 4, 2); }
}
function foreground(c: CanvasRenderingContext2D, scroll: number, torch: { x: number; y: number }) {
  const s = scroll * 1.7, span = 1500;
  for (let i = 0; i < 4; i++) {
    const x = ((i * 375 + 200 - s) % span + span) % span - 200;
    const type = Math.floor(rnd(i, 9) * 3);
    const near = Math.max(0, 1 - Math.abs(x - torch.x) / 260);
    c.fillStyle = '#050307';
    if (type === 0) {                                                     // thick pillar
      c.fillRect(x, -20, 58, H + 40);
      if (near > 0) { c.fillStyle = `rgba(255,140,60,${near * 0.35})`; c.fillRect(x < torch.x ? x + 54 : x, -20, 4, H + 40); }
    } else if (type === 1) {                                              // hanging chains
      for (const dx of [0, 26]) {
        const len = 120 + rnd(i, dx) * 90, sw = Math.sin(performance.now() / 700 + i + dx) * 4;
        c.strokeStyle = '#08060b'; c.lineWidth = 3;
        for (let y = -10; y < len; y += 11) { c.beginPath(); c.ellipse(x + dx + sw * (y / len), y, 3.4, 6, 0, 0, Math.PI * 2); c.stroke(); }
        if (near > 0) { c.strokeStyle = `rgba(255,150,70,${near * 0.4})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x + dx + 3, -10); c.lineTo(x + dx + 3 + sw, len); c.stroke(); }
      }
    } else {                                                              // roots from above and a rock mound below
      c.strokeStyle = '#050307'; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, -10); c.bezierCurveTo(x + 30, 60, x - 20, 110, x + 14, 170); c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(x + 40, -10); c.bezierCurveTo(x + 50, 40, x + 70, 70, x + 56, 120); c.stroke();
      c.beginPath(); c.ellipse(x + 30, H + 10, 80, 46, 0, 0, Math.PI * 2); c.fill();
    }
  }
}

function floorLoot(c: CanvasRenderingContext2D, t: number) {
  for (const l of N().floorLoot) {
    const col = entryColor(l.entry);
    const ri = l.entry.kind === 'item' ? RARITIES.indexOf(l.entry.item.rarity) : 2;
    const drop = Math.min(1, l.t * 3);                   // falls in, bounces once, then rests
    const bounce = drop < 1 ? (1 - drop) * 70 : Math.max(0, Math.sin((l.t - 0.33) * 14)) * 6 * Math.max(0, 1 - (l.t - 0.33) * 3);
    const y = FEET - 8 - bounce;
    const pulse = 0.75 + Math.sin(t * 4 + l.x) * 0.25;
    const bw = 7 + ri * 3, top = 24 + (4 - ri) * 30;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, top, 0, FEET);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, col); g.addColorStop(1, '#ffffff');
    c.globalAlpha = (ri === 0 ? 0.5 : 0.9) * pulse * drop;
    c.fillStyle = g; c.fillRect(l.x - bw / 2, top, bw, FEET - top);
    c.globalAlpha = 0.5 * pulse * drop; c.fillRect(l.x - bw * 1.5, top + 40, bw * 3, FEET - top - 40);    // soft halo around the beam
    const gl = c.createRadialGradient(l.x, FEET - 4, 2, l.x, FEET - 4, 34 + ri * 6);
    gl.addColorStop(0, col); gl.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = 0.8 * drop; c.fillStyle = gl; c.fillRect(l.x - 50, FEET - 50, 100, 60);
    // sparkles drifting up the beam
    for (let k = 0; k < 3 + ri; k++) {
      const ph = (t * 0.6 + k / (3 + ri) + l.x * 0.01) % 1;
      c.globalAlpha = (1 - ph) * drop; c.fillStyle = '#fff';
      c.fillRect(l.x + Math.sin(ph * 9 + k) * bw, FEET - 10 - ph * (FEET - top), 2, 2);
    }
    c.restore();
    // the item itself: a bundle with a gleam
    c.fillStyle = '#1a120c'; c.fillRect(l.x - 10, y - 6, 20, 14);
    c.fillStyle = col; c.fillRect(l.x - 8, y - 4, 16, 10);
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(l.x - 6, y - 3, 3, 3);
    if (Math.sin(t * 3 + l.x) > 0.85) { c.fillStyle = '#fff'; c.fillRect(l.x + 4, y - 9, 2, 6); c.fillRect(l.x + 2, y - 7, 6, 2); }
  }
}

function units(c: CanvasRenderingContext2D, t: number) {
  const n = N();
  S.g.heroes.forEach((h, i) => {
    const x = HERO_X[i];
    const bob = n.phase === 'walk' ? Math.round(Math.sin(t * 9 + i) * 2) : 0;
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(x + 30, FEET, 30, 6, 0, 0, Math.PI * 2); c.fill();
    if (h.downed) {
      c.save(); c.translate(x + 30, UNIT_Y + 70); c.rotate(-Math.PI / 2);
      drawPx(c, HERO_SPRITES[h.id], -40, -30, 5, 0.45); c.restore();
      text(c, 'DOWN', x + 30, UNIT_Y + 40, 12, '#ff8a80', 'center', 600);
      return;
    }
    const lx = h.lunge ? Math.sin(Math.PI * (1 - h.lunge / 0.3)) * 16 : 0;
    drawPx(c, HERO_SPRITES[h.id], x + lx, UNIT_Y + bob, 5);
    if (i === 0) {   // the knight carries the torch
      const fl = Math.sin(t * 20) * 1.5;
      c.fillStyle = '#5a3a20'; c.fillRect(x + 58 + lx, UNIT_Y + 14 + bob, 3, 26);
      c.fillStyle = '#ff7a2a'; c.fillRect(x + 55 + lx, UNIT_Y + 4 + bob + fl, 9, 11);
      c.fillStyle = '#ffd66a'; c.fillRect(x + 57 + lx, UNIT_Y + 7 + bob + fl, 5, 6);
    }
    bar(c, x - 4, UNIT_Y - 18, 68, 9, h.hp / maxHp(h), h.hp / maxHp(h) > 0.5 ? '#6fcf7f' : '#e0b24a');
    if (n.phase === 'battle') { c.fillStyle = '#3a2f47'; c.fillRect(x - 2, UNIT_Y + 86, 64, 3); c.fillStyle = '#8fb3ff'; c.fillRect(x - 2, UNIT_Y + 86, 64 * Math.min(1, h.atb / 100), 3); }
    if (h.queued !== null) text(c, '!', x + 30, UNIT_Y - 24, 16, '#f2b84b', 'center', 600);
  });
  if (n.taunt > 0) text(c, 'TAUNT', HERO_X[0] + 30, UNIT_Y + 100, 11, '#6aa8ff', 'center');
  if (n.ward > 0) { c.strokeStyle = 'rgba(111,207,127,0.6)'; c.lineWidth = 2; c.strokeRect(30, UNIT_Y - 6, 250, 96); }
  n.enemies.forEach((e, i) => {
    if (e.hp <= 0) return;
    const def = ENEMY_BY_ID[e.defId];
    const s = e.boss ? 7 : 5;
    const x = (e.boss ? 500 : ENEMY_X[i]) - (e.lunge ? Math.sin(Math.PI * (1 - e.lunge / 0.3)) * 16 : 0);
    const y = e.boss ? UNIT_Y - 32 : UNIT_Y;
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(x + (e.boss ? 42 : 30), FEET, e.boss ? 44 : 30, 6, 0, 0, Math.PI * 2); c.fill();
    if (e.per) {   // a swarm: one small envelope per body, fluttering
      const k = bodies(e);
      for (let j = 0; j < k; j++) {
        const ex = x + (j % 3) * 20 - 2 + Math.sin(t * 5 + j) * 3, ey = y + 18 + Math.floor(j / 3) * 26 + Math.cos(t * 4 + j * 2) * 4;
        drawPx(c, ENVELOPE, ex, ey, 3, e.flash > 0 ? 0.5 : 1);
      }
    } else drawPx(c, def.sprite, x, y, s, e.flash > 0 ? 0.5 : 1);
    if (e.shield) {   // a shield bubble until Bash breaks it
      const cx = x + (e.boss ? 42 : 30), cy = y + (e.boss ? 56 : 40), r = e.boss ? 62 : 44;
      c.strokeStyle = `rgba(143,216,255,${0.55 + Math.sin(t * 3) * 0.2})`; c.lineWidth = 2;
      c.beginPath(); c.ellipse(cx, cy, r * 0.8, r, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = 'rgba(143,216,255,0.08)'; c.fill();
    }
    bar(c, x - 4, y - 18, e.boss ? 92 : 68, 9, e.hp / e.maxHp, '#e0524a');
    if (e.boss) text(c, e.name, x + 42, y - 24, 12, '#f2b84b', 'center', 600);
    const over = e.turnsAlive - T.INTEREST_AFTER_TURNS;
    if (over > 0) text(c, `INTEREST +${Math.round(over * T.INTEREST_PER_TURN * 100)}%`, x + 30, y - 30, 10, '#ffb3a8', 'center');
    if (e.stunned > 0) text(c, 'STUN', x + 30, y - 24, 11, '#8fb3ff', 'center');
    if (e.enraged) text(c, 'ENRAGED', x + 42, y + 2 + Math.sin(t * 10) * 2, 12, '#ff5a3a', 'center', 700);
    if (e.per) text(c, `x${bodies(e)}`, x + 62, y - 8, 11, '#efe6cf', 'right', 700);
    if (e.evict !== undefined && (e.wind ?? 0) > 0) {   // EVICTION target: a red notice over that hero
      const hx = HERO_X[e.evict] + 30, by = UNIT_Y - 40 + Math.sin(t * 8) * 3;
      c.fillStyle = '#e0302a'; c.fillRect(hx - 22, by - 12, 44, 14);
      text(c, 'EVICT', hx, by - 1, 10, '#fff0e8', 'center', 700);
    }

  });
}

/** The curio the party stopped at, on the floor ahead of them (Zzz over the troll, a shake while picking). */
function curioProp(c: CanvasRenderingContext2D, t: number) {
  const cu = N().curio, d = curioDef(cu);
  if (!cu || !d) return;
  const s = 4, h = Math.max(...d.sprite.map(r => r[1] + r[3])), x = 372 - (d.w * s) / 2 + (cu.stage === 'pick' ? Math.sin(t * 40) * 1.5 : 0), y = FEET - h * s;
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(372, FEET, d.w * s * 0.55, 6, 0, 0, Math.PI * 2); c.fill();
  drawPx(c, d.sprite, x, y, s);
  if (cu.id === 'troll') text(c, 'z'.repeat(1 + Math.floor(t * 1.5) % 3), x + d.w * s - 4, y - 6 - (t * 8) % 10, 13, '#cfd6e4', 'left', 700);
}

/** Ability marks: small tags stacked above each enemy's HP bar, drawn above the darkness so they read at a glance.
 *  The line under a tag shrinks as the mark runs out. */
function markTags(c: CanvasRenderingContext2D) {
  N().enemies.forEach((e, i) => {
    if (e.hp <= 0 || !e.marks) return;
    const x = e.boss ? 500 : ENEMY_X[i], y = e.boss ? UNIT_Y - 32 : UNIT_Y;
    const ms = (Object.keys(e.marks) as MarkId[]).filter(k => e.marks![k]! > 0);
    ms.forEach((k, j) => {
      const cx = x + (e.boss ? 42 : 30), my = y - 54 - j * 13 - (e.boss ? 8 : 0), M = MARKS[k], w = 62;   // stacked above the HP bar and Interest
      c.fillStyle = 'rgba(8,4,12,.85)'; c.fillRect(cx - w / 2, my, w, 12);
      text(c, M.tag, cx, my + 9, 9, M.color, 'center', 700);
      c.fillStyle = M.color; c.fillRect(cx - w / 2, my + 11, w * Math.min(1, e.marks![k]! / T.MARK_SEC), 1);
    });
  });
}

/** Darkness with holes: the torch, a dim glow around the enemies, beams and spell effects. */
function lighting(c: CanvasRenderingContext2D, t: number, torchW: { x: number; y: number }) {
  const n = N();
  if (!light) { light = document.createElement('canvas'); light.width = W; light.height = H; }
  const l = light.getContext('2d')!;
  l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, W, H);
  l.fillStyle = 'rgba(4,1,8,0.95)'; l.fillRect(0, 0, W, H);
  l.globalCompositeOperation = 'destination-out';
  const hole = (wx: number, wy: number, r: number, a: number) => {
    const p = toScreen(wx, wy), rr = r * p.z;
    const g = l.createRadialGradient(p.x, p.y, rr * 0.12, p.x, p.y, rr);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${a * 0.75})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(p.x - rr, p.y - rr, rr * 2, rr * 2);
  };
  const flick = 1 + Math.sin(t * 13) * 0.03 + Math.sin(t * 31) * 0.02;
  hole(torchW.x, torchW.y, 215 * flick, 1);
  if (n.enemies.some(e => e.hp > 0)) hole(480, 236, 135, 0.6);
  for (const fl of n.floorLoot) { const ri = fl.entry.kind === 'item' ? RARITIES.indexOf(fl.entry.item.rarity) : 2; hole(fl.x, 230, 60 + ri * 16, 0.8); }
  for (const v of n.vfx) hole(v.x, v.y, 70, 0.7);
  c.drawImage(light, 0, 0);
  // warm torch tint
  const p = toScreen(torchW.x, torchW.y);
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(p.x, p.y, 4, p.x, p.y, 200 * p.z * flick);
  g.addColorStop(0, 'rgba(255,150,60,0.22)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}
function fog(c: CanvasRenderingContext2D, t: number) {
  const n = N();
  const k = n.phase === 'battle' ? 0.55 : 1;
  const fc = n.floorMap === 'cursed' ? '70,24,92' : '40,30,52', fl = n.floorMap === 'cursed' ? '120,50,150' : '70,58,88';   // Cursed Floor: violet fog
  const g = c.createLinearGradient(400, 0, W, 0);
  g.addColorStop(0, `rgba(${fc},0)`); g.addColorStop(1, `rgba(${fc},${0.85 * k})`);
  c.fillStyle = g; c.fillRect(380, 0, W - 380, H);
  for (let i = 0; i < 6; i++) {
    const x = 480 + ((i * 70 - t * (8 + i * 2)) % 220 + 220) % 220, y = 80 + rnd(i, 5) * 220, r = 60 + rnd(i, 6) * 50;
    const fg = c.createRadialGradient(x, y, 4, x, y, r);
    fg.addColorStop(0, `rgba(${fl},${0.32 * k})`); fg.addColorStop(1, `rgba(${fl},0)`);
    c.fillStyle = fg; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/** The boss's FINAL NOTICE wind-up, drawn above the darkness and fog: it must read at a glance. */
function windupHud(c: CanvasRenderingContext2D) {
  const n = N();
  for (const e of n.enemies) {
    if (e.hp <= 0 || !((e.wind ?? 0) > 0)) continue;
    // a boss cast bar, MMO raid style: fixed at the top centre, outside the camera
    const k = 1 - e.wind! / (e.windMax ?? T.BOSS_WINDUP_SEC), pulse = Math.floor(performance.now() / 120) % 2;
    const move = moveOf(e), victim = e.evict !== undefined ? S.g.heroes[e.evict]?.name : '';
    const label = move === 'loan' ? (N().enemies.some(x => x !== e && x.hp > 0) ? 'REFINANCE' : 'LOAN APPROVED') : move === 'evict' ? `EVICTION: ${victim}` : e.braced ? 'FINAL NOTICE (braced, no interrupt)' : 'FINAL NOTICE';
    const friend = N().enemies.some(x => x !== e && x.hp > 0);
    const hint = move === 'loan' ? (friend ? 'Kill his friend first or it comes back stronger' : 'A friend is coming: Fire or Storm it') : move === 'evict' ? 'Taunt or Ward!' : e.braced ? 'Ward or Taunt!' : 'Bash, Ward or Taunt!';
    const bw = 240, bx = W / 2 - bw / 2, by = 62;
    c.fillStyle = 'rgba(10,4,6,.85)'; c.fillRect(bx - 3, by - 3, bw + 6, 22);
    c.strokeStyle = pulse ? '#ff5a5a' : '#8a2a2a'; c.lineWidth = 2; c.strokeRect(bx - 3, by - 3, bw + 6, 22);
    c.fillStyle = pulse ? '#e0302a' : '#b8401f'; c.fillRect(bx, by, bw * k, 16);
    text(c, `${e.name}: ${label}`, W / 2, by + 12, 12, '#fff0e8', 'center', 700);
    text(c, hint, W / 2, by + 34, 11, '#ffb0a0', 'center', 600);
  }
}

export function drawDungeonScene(c: CanvasRenderingContext2D) {
  const n = N();
  const t = performance.now() / 1000;
  const dt = Math.min(0.05, lastT ? t - lastT : 0.016); lastT = t;
  updateCamera(dt);
  const scroll = n.walkScroll;
  c.fillStyle = '#07050a'; c.fillRect(0, 0, W, H);
  const torch = { x: HERO_X[0] + 60, y: UNIT_Y + 10 };
  // world, with layer parallax on zoom
  c.save(); camApply(c, 0.35); farCave(c, scroll); c.restore();
  c.save(); camApply(c, 0.7); midCave(c, scroll); c.restore();
  c.save(); camApply(c, 1);
  floor(c, scroll);
  floorLoot(c, t);
  curioProp(c, t);
  units(c, t);
  for (const v of n.vfx) drawVfx(c, v);
  const gp = goblinPos();
  if (gp) { drawPx(c, GOBLIN, gp.x, gp.y, 3); text(c, 'CLICK!', gp.x + 18, gp.y - 6, 12, '#f2b84b', 'center', 600); }
  c.restore();
  lighting(c, t, torch);
  fog(c, t);
  // damage numbers stay readable above the dark
  c.save(); camApply(c, 1);
  for (const f of n.fx) { c.globalAlpha = Math.max(0, Math.min(1, f.t)); text(c, f.text, f.x, f.y, f.text.endsWith('!') ? 20 : 16, f.color, 'center', 600); }
  c.globalAlpha = 1;
  c.restore();
  c.save(); camApply(c, 1.35); foreground(c, scroll, toScreen(torch.x, torch.y)); c.restore();
  c.save(); camApply(c, 1); markTags(c); c.restore();   // above the foreground pillars and chains
  windupHud(c);
}

import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { clamp } from '../core/rng';
import { updateTired } from './tired';

/** Night clock speed in game minutes per real second (docs/design/night.md). */
export function clockRate(): number {
  const n = N();
  if (n.location === 'town') return 0;
  const menu = n.phase === 'mapChoice' || !!n.dropPopup || !!n.selected;
  return (60 / T.SEC_PER_GAME_HOUR) * (menu ? T.MENU_CLOCK_SPEED : 1);
}

export function moodZone(m: number): 'green' | 'yellow' | 'red' {
  return m < T.MOOD_GREEN ? 'green' : m < T.MOOD_RED ? 'yellow' : 'red';
}
export function addMood(d: number) { const n = N(); n.mood = clamp(n.mood + d, 0, T.MOOD_MAX); }

export function updateMeters(dt: number) {
  const n = N();
  n.threat += dt;
  const clockDelta = clockRate() * dt;
  n.clock += clockDelta;
  updateTired(dt, clockDelta);

  // Flow builds only while the RPG is on screen in the dungeon and the hands are free.
  const building = n.location === 'dungeon' && n.monitor === 'rpg' && n.action === 'none' && n.monitorOff <= 0;
  const rate = (T.FLOW_MAX - T.FLOW_MIN) / T.FLOW_BUILD_SEC;
  // Zone: headset on without a break fills it; taking the headset off empties it.
  n.zone = n.headset ? Math.min(1, n.zone + dt / T.ZONE_FILL_SEC) : 0;
  if (n.game?.kind === 'cuddle') { /* cuddling: Flow frozen */ }
  else if (building) n.flow += rate * dt * (n.tired >= T.TIRED_SLUGGISH ? T.SLUGGISH_FLOW_MULT : 1) * (n.zone >= 1 ? T.ZONE_FLOW_MULT : 1)
    * (n.phase === 'battle' && n.enemies.some(e => e.enraged && e.hp > 0) ? T.ECHO_ENRAGE_FLOW : 1);   // an enraged boss: the fight of the night
  else n.flow -= rate * T.FLOW_DECAY_MULT * dt;
  n.flow = clamp(n.flow, T.FLOW_MIN, T.FLOW_MAX);

  n.moodDrift += dt;
  if (n.moodDrift >= T.MOOD_DRIFT_EVERY_SEC) { n.moodDrift = 0; addMood(1); }
  n.noise = clamp(n.noise - T.NOISE_DECAY_PER_SEC * dt, 0, 100);

  n.taunt = Math.max(0, n.taunt - dt);
  n.rally = Math.max(0, n.rally - dt);
  n.goodBoy = Math.max(0, n.goodBoy - dt);
  n.goodDog = Math.max(0, n.goodDog - dt);
  n.ward = Math.max(0, n.ward - dt);
  n.guilt = Math.max(0, n.guilt - dt);
  n.monitorOff = Math.max(0, n.monitorOff - dt);


  for (const f of n.fx) { f.t -= dt * 1.2; f.y -= dt * 30; }
  n.fx = n.fx.filter(f => f.t > 0);
  for (const v of n.vfx) v.t += dt;
  n.vfx = n.vfx.filter(v => v.t < v.dur);
  for (const h of S.g.heroes) if (h.lunge) h.lunge = Math.max(0, h.lunge - dt);
  for (const e of n.enemies) if (e.lunge) e.lunge = Math.max(0, e.lunge - dt);
  for (const b of n.beams) b.t -= dt;
  n.beams = n.beams.filter(b => b.t > 0);
  for (const t of n.toasts) t.t -= dt;
  n.toasts = n.toasts.filter(t => t.t > 0);
  if (n.reveal) { n.reveal.t -= dt; if (n.reveal.t <= 0) n.reveal = null; }
}

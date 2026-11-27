import { updatePositions } from './positions';
import { eyesBusy } from './eyes';
import { isWitching } from './affixes';
import { T } from '../config/tuning';
import { S, N } from '../core/state';
import { clamp } from '../core/rng';
import { updateTired } from './tired';
import { toastAs } from '../core/fx';
const toast = toastAs('NIGHT');   // feed tag (#49)

/** Night clock speed in game minutes per real second (docs/design/night.md). */
export function clockRate(): number {
  const n = N();
  if (n.location === 'town') return 0;
  const choosing = n.phase === 'mapChoice';   // the party waits at the stairs; item windows do not slow anything (#49)
  return (60 / T.SEC_PER_GAME_HOUR) * (choosing ? T.MENU_CLOCK_SPEED : 1);
}

export function moodZone(m: number): 'green' | 'yellow' | 'red' {
  return m < T.MOOD_GREEN ? 'green' : m < T.MOOD_RED ? 'yellow' : 'red';
}
export function addMood(d: number) { const n = N(); n.mood = clamp(n.mood + d, 0, T.MOOD_MAX); }

export function updateMeters(dt: number) {
  const n = N();
  n.threat += dt;
  const off = S.g.realLifeOff;   // debug (#52, 1.1): no night clock pressure, no Tiredness, Noise or Mood
  const clockDelta = off ? 0 : clockRate() * dt;
  n.clock += clockDelta;
  if (!off) updateTired(dt, clockDelta);

  // Flow builds only while the RPG is on screen in the dungeon and the hands are free.
  const building = n.location === 'dungeon' && n.monitor === 'rpg' && n.action === 'none' && n.monitorOff <= 0 && !eyesBusy();   // looking at her: no Flow (#85)
  const rate = (T.FLOW_MAX - T.FLOW_MIN) / T.FLOW_BUILD_SEC;
  // Zone: headset on without a break fills it; taking the headset off empties it.
  n.zone = n.headset ? Math.min(1, n.zone + dt / T.ZONE_FILL_SEC) : 0;
  if (n.game?.kind === 'cuddle') { /* cuddling: Flow frozen */ }
  else if (building) n.flow += rate * dt * (n.tired >= T.TIRED_SLUGGISH ? T.SLUGGISH_FLOW_MULT : 1) * (n.zone >= 1 ? T.ZONE_FLOW_MULT : 1)
    * (n.phase === 'battle' && n.enemies.some(e => e.enraged && e.hp > 0) ? T.ECHO_ENRAGE_FLOW : 1);   // an enraged boss: the fight of the night
  else n.flow -= rate * T.FLOW_DECAY_MULT * dt;
  n.flow = clamp(n.flow, T.FLOW_MIN, T.FLOW_MAX);

  if (!n.witchingSaid && isWitching()) {   // the Witching Hour (docs/design/synergy.md)
    n.witchingSaid = true;
    toast('01:00. The Witching Hour: drops can shift up a rarity.', '#c77dff');
  }
  n.moodDrift += off ? 0 : dt;
  if (n.moodDrift >= T.MOOD_DRIFT_EVERY_SEC) { n.moodDrift = 0; addMood(1); }
  n.noise = off ? 0 : clamp(n.noise - T.NOISE_DECAY_PER_SEC * dt, 0, 100);
  if (off) { n.tired = 0; n.mood = 0; }

  if (n.runCard) { n.runCard.t -= dt; if (n.runCard.t <= 0) n.runCard = null; }
  n.taunt = Math.max(0, n.taunt - dt);
  n.lastStand = Math.max(0, n.lastStand - dt);
  n.goodBoy = Math.max(0, n.goodBoy - dt);
  n.goodDog = Math.max(0, n.goodDog - dt);
  n.ward = Math.max(0, n.ward - dt);
  n.smoke = Math.max(0, n.smoke - dt); n.heist = Math.max(0, n.heist - dt); n.sanctuary = Math.max(0, (n.sanctuary ?? 0) - dt);
  updatePositions(dt);   // heroes walking to a new position (#52, 1.6)
  n.guilt = Math.max(0, n.guilt - dt);
  n.monitorOff = Math.max(0, n.monitorOff - dt);


  for (const f of n.fx) { f.t -= dt * 1.2; f.y -= dt * 30; }
  n.fx = n.fx.filter(f => f.t > 0);
  for (const v of n.vfx) v.t += dt;
  n.vfx = n.vfx.filter(v => v.t < v.dur);
  for (const h of S.g.heroes) { if (h.lunge) h.lunge = Math.max(0, h.lunge - dt); if (h.swing) h.swing = Math.max(0, h.swing - dt); }
  for (const e of n.enemies) if (e.lunge) e.lunge = Math.max(0, e.lunge - dt);
  for (const b of n.beams) b.t -= dt;
  n.beams = n.beams.filter(b => b.t > 0);
  for (const t of n.toasts) t.t -= dt;
  if (n.say?.length) { n.say[0].t -= dt; if (n.say[0].t <= 0) n.say.shift(); }   // her speech bubble at the door (#139)
  n.toasts = n.toasts.filter(t => t.t > 0);
  if (n.reveal) { n.reveal.t -= dt; if (n.reveal.t <= 0) n.reveal = null; }
  if (n.appraised) n.appraised.t += dt;   // the Appraiser's reveal in the panel: sparks, a flash, the card
}

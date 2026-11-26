import { T } from '../config/tuning';
import { wet } from '../data/apartment';
import { S, N, type Room } from '../core/state';
import { rand, clamp } from '../core/rng';
import { addMood } from './meters';
import { toastAs } from '../core/fx';
import { sfx } from '../ui/audio';
import { on } from './week';
import { owns } from './shop';
import { realLifeFree } from './reallife';
import { sendHerTo } from './apartment';
import { ACT_BY_ID } from '../data/apartment';
import { ROOM_NEXT, type DeviceId } from '../data/home';
const toast = toastAs('HOME');

// The smart home and the phone battery (step 6, #57; grid doc 7j; docs/design/desk.md, the Home app). From Thursday
// (the week). The battery is FNAF's power: 100% every night, the devices and every call or text you answer take some,
// Charge takes you away from the PC for 15 s. At 0% the phone is dead: no calls, no texts, no Home app (Mom's call
// counts as ignored). The devices push her next visit or keep her busy; each says its condition, never whether it is
// met. They work on her while she is up: asleep she sleeps through them, the shower is hers.

export interface HomeNight {
  batt: number;                          // %
  rest: Record<string, number>; restMax: Record<string, number>;   // a device resting: seconds left (the speaker pair shares one)
  uses: Record<string, number>;          // tonight: speaker, tv, tea
  vac: { room: Room; t: number } | null; // the vacuum running
  bells: number[];                       // bubble tea doorbells due (threat seconds)
  lowShow: number; lowAt: number; deadShow: number;   // the desk phone's low block, the last low mark it showed, dead
  pick: DeviceId | ''; pickRoom: Room;   // the Home app: whose sheet is open; the speaker's or vacuum's room
}
export const newHomeNight = (): HomeNight => ({ batt: 100, rest: {}, restMax: {}, uses: {}, vac: null, bells: [], lowShow: 0, lowAt: 101, deadShow: 0, pick: '', pickRoom: 'living' });

const H = () => N().home;
/** The battery is a thing tonight (Thursday on). */
export const battOn = () => on('home');
/** % a use costs: the New phone drains slower. */
export const battCost = (base: number) => Math.max(1, Math.round(base * (owns('phone') ? T.NEW_PHONE_DRAIN : 1)));
export const battery = () => (battOn() ? H().batt : 100);
/** At 0%: no calls, no texts, no Home app. */
export const phoneDead = () => battOn() && H().batt <= 0;

/** The battery goes down by a use's cost; the desk phone says so at 20% and 10%, and when it dies. */
export function drain(base: number) {
  if (!battOn()) return;
  const h = H(), was = h.batt;
  h.batt = Math.max(0, h.batt - battCost(base));
  const mark = T.BATTERY_LOW.find(m => was > m && h.batt <= m && h.batt > 0);
  if (mark !== undefined) { h.lowShow = T.LOW_SHOW_SEC; h.lowAt = mark; sfx.vibMsg(); toast(`Phone battery ${h.batt}%.`, '#ff8a80'); }
  if (was > 0 && h.batt <= 0) { h.deadShow = T.LOW_SHOW_SEC; toast('Your phone died. No calls, no texts, no Home app until you charge it.', '#ff8a80'); sfx.bad(); }
}
/** Charge (the away state is preemptive.ts's): +40%. */
export function charged() {
  const h = H();
  h.batt = Math.min(100, h.batt + T.CHARGE_ADD);
  toast(`Back at the desk. Phone at ${h.batt}%.`, '#9fe08a');
}

/** What a device on the plan shows: ready, resting (the part left), on (the seal), running (the vacuum). */
export function deviceState(id: DeviceId): 'ready' | 'on' | 'running' | number {
  const h = H(), n = N();
  if (id === 'seal' && n.seal) return 'on';
  if (id === 'vacuum' && h.vac) return 'running';
  const r = h.rest[id] ?? 0;
  return r > 0 ? r / (h.restMax[id] || r) : 'ready';
}
/** Why a device can't be used now ('' = it can). Never says where she is. */
export function deviceBlocked(id: DeviceId | 'tea'): string {
  const h = H();
  if (phoneDead()) return 'The phone is dead';
  if (id === 'tea') {
    if ((h.uses.tea ?? 0) >= T.TEA_MAX) return `${T.TEA_MAX} of ${T.TEA_MAX} tonight`;
    if (S.g.zl < T.SHOP_ZL.tea) return `Needs ${T.SHOP_ZL.tea} zł`;
  } else {
    if (!owns(id)) return 'Not installed';
    if (id === 'vacuum' && h.vac) return 'Running';
    if ((h.rest[id] ?? 0) > 0) return 'Resting';
  }
  if (h.batt < battCost(T.HOME_BATT[id])) return 'Not enough battery';
  return '';
}

/** She is up and can be sent somewhere: not asleep, not in the shower, not at your door. */
const herFree = () => { const n = N(), a = n.apt; return !a.asleep && !wet(a.activity) && n.visit.stage === 'idle'; };
const herRoom = (): Room => N().apt.room;
const rest = (id: string, sec: number) => { const h = H(); h.rest[id] = sec; h.restMax[id] = sec; };

/** Use a device from its sheet. room: where (the vacuum's pick, the speaker you tapped). */
export function useDevice(id: DeviceId, room: Room = 'living'): boolean {
  if (deviceBlocked(id)) { sfx.bad(); return false; }
  const n = N(), h = H(), a = n.apt;
  drain(T.HOME_BATT[id]);
  if (id === 'seal') { n.seal = !n.seal; sfx.click(); toast(n.seal ? 'Door sealed. Quieter, but no light under it.' : 'Seal off. You can see under the door again.', '#c9b8a8'); return true; }
  if (id === 'vacuum') {
    h.vac = { room, t: T.VACUUM_RUN_SEC }; rest('vacuum', T.VACUUM_REST); sfx.vacuum();
    const near = herRoom() === room || ROOM_NEXT[room].includes(herRoom());
    if (near && herFree()) { a.calm += T.VACUUM_CALM; sendHerTo(room, 'VACUUM'); h.vac.t = T.APT_MOVE_SEC + 1; }   // she goes and switches it off
    return true;
  }
  if (id === 'speaker') {
    h.uses.speaker = (h.uses.speaker ?? 0) + 1; rest('speaker', T.SPEAKER_REST); sfx.timer();
    if (herFree()) { a.calm += T.SPEAKER_CALM; sendHerTo(room, 'TIMER'); }
    if (h.uses.speaker >= T.SPEAKER_MOOD_FROM) { addMood(T.SPEAKER_MOOD); toast(`"Who keeps setting timers?!" Mood +${T.SPEAKER_MOOD}.`, '#ffb07a'); }
    return true;
  }
  // the TV cast: only while her show's credits roll; at any other time nothing happens (the use is gone)
  h.uses.tv = (h.uses.tv ?? 0) + 1; rest('tv', T.TV_REST); sfx.click();
  if (h.uses.tv > T.TV_MAX) {   // the third time she notices
    addMood(T.TV_NOTICE_MOOD); a.forceDoor = true; a.t = Math.min(a.t, 2);
    toast(`"The TV keeps starting the next one by itself..." She looks at your door. Mood +${T.TV_NOTICE_MOOD}.`, '#ff8a80');
  } else if (a.activity === 'tv' && a.cued && !a.asleep && n.visit.stage === 'idle') {
    a.t = rand(...ACT_BY_ID.tv.dur); a.cued = false;   // one more episode
  }
  return true;
}

/** Bubble tea: 25 zł, the doorbell 120 s later. Twice a night. */
export function orderTea(): boolean {
  if (deviceBlocked('tea')) { sfx.bad(); return false; }
  const h = H();
  S.g.zl -= T.SHOP_ZL.tea; drain(T.HOME_BATT.tea);
  h.uses.tea = (h.uses.tea ?? 0) + 1; h.bells.push(N().threat + T.TEA_DELAY_SEC);
  sfx.coin(); toast('Bubble tea ordered. The doorbell in 2 min.', '#9fe08a');
  return true;
}
/** Seconds until the next doorbell (the Home app's card), or 0. */
export const teaDue = () => { const b = H().bells; return b.length ? Math.max(0, Math.min(...b) - N().threat) : 0; };

export function updateHome(dt: number) {
  if (!battOn()) return;
  const n = N(), h = H(), a = n.apt;
  for (const k of Object.keys(h.rest)) h.rest[k] = Math.max(0, h.rest[k] - dt);
  if (h.vac && (h.vac.t -= dt) <= 0) h.vac = null;
  h.lowShow = Math.max(0, h.lowShow - dt); h.deadShow = Math.max(0, h.deadShow - dt);
  // the doorbell: when it's due, as soon as nothing else asks for you (the collision rule: it slides, never drops)
  const due = h.bells.findIndex(t => n.threat >= t);
  if (due >= 0 && realLifeFree() && !wet(a.activity)) {   // in her bath (#88) she lets it ring till she's out
    h.bells.splice(due, 1); sfx.doorbell();
    if (a.asleep) { a.wake = clamp(a.wake + T.TEA_WAKE, 0, T.WAKE_UP); toast('The doorbell. Bubble tea, at this hour. She stirs in bed.', '#ff8a80'); return; }
    a.calm = Math.max(a.calm, T.TEA_CALM); sendHerTo('living', 'DOORBELL', T.TEA_CALM);
    toast('The doorbell: bubble tea. She takes it to the couch.', '#ff9ab8');
  }
}

// ---- the door seal: the towel's effect and downside (other systems read these) ----
/** Your Noise reaches her this much. */
export const sealNoise = () => (N().seal ? 1 - T.SEAL_NOISE : 1);
/** Her routine runs this fast (she gets up less often). */
export const sealPace = () => (N().seal ? 1 - T.SEAL_SLOW : 1);
/** Her steps are this loud. */
export const sealSteps = () => (N().seal ? T.SEAL_STEPS : 1);

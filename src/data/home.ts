// The smart home (step 6, #57; grid doc 7j; docs/design/desk.md, the Home app): the devices you buy in the Shop's Home
// tab and use in the phone's Home app, and the bubble tea you order there. Numbers are tuning.ts's (HOME_BATT, the
// rests, the calms); prices SHOP_ZL. What a device does is said with its condition, never whether it is met (the
// pre-emptive rule): the Home app knows its devices, not where she is.
import type { Room } from '../core/state';
import { T } from '../config/tuning';

export type DeviceId = 'vacuum' | 'speaker' | 'tv' | 'seal';
export interface DeviceDef { id: DeviceId; name: string; what: string; note: (uses: number) => string; go: string }
export const DEVICES: DeviceDef[] = [
  { id: 'vacuum', name: 'Robot vacuum', what: `If she's in that room or next door, she goes to stop it. Her next visit comes ${T.VACUUM_CALM} s later.`, note: () => `Then it rests ${T.VACUUM_REST / 60} min.`, go: 'Start' },
  { id: 'speaker', name: 'Speakers', what: `A timer rings in that room. She goes to check it: her next visit comes ${T.SPEAKER_CALM} s later.`, note: (u) => u + 1 >= T.SPEAKER_MOOD_FROM ? 'She is getting tired of timers: it annoys her now.' : `From the ${T.SPEAKER_MOOD_FROM}rd timer in a night it annoys her.`, go: 'Ring the timer' },
  { id: 'tv', name: 'TV cast', what: "While her show's credits roll: Next episode keeps her on the couch for one more.", note: (u) => `${Math.min(u, T.TV_MAX)} of ${T.TV_MAX} tonight. A third time, she notices.`, go: 'Next episode' },
  { id: 'seal', name: 'Door seal', what: `Your Noise reaches her ${Math.round(T.SEAL_NOISE * 100)}% quieter and she gets up less often. No light under your door, so no toes, no shadows.`, note: () => 'She asks about it on every visit.', go: 'Seal the door' },
];
export const DEVICE_BY_ID = Object.fromEntries(DEVICES.map(d => [d.id, d])) as Record<DeviceId, DeviceDef>;

/** The rooms the vacuum can run in, as the Home app names them. */
export const HOME_ROOMS: [Room, string][] = [['living', 'Living'], ['kitchen', 'Kitchen'], ['bathroom', 'Bath'], ['bedroom', 'Bedroom'], ['hallway', 'Hallway']];
/** The speaker pair: one in each of these rooms. */
export const SPEAKER_ROOMS: Room[] = ['kitchen', 'bathroom'];
/** Next door on the build's plan (ui/plan.ts): rooms that share a wall or an opening. The vacuum reaches her here. */
export const ROOM_NEXT: Record<Room, Room[]> = {
  bedroom: ['bathroom', 'hallway', 'living'],
  bathroom: ['bedroom', 'kitchen', 'hallway'],
  kitchen: ['bathroom', 'hallway'],
  hallway: ['bedroom', 'bathroom', 'kitchen', 'living'],
  living: ['bedroom', 'hallway'],
};
/** Where she goes to see to a device: what she does there for a moment (her routine's activity in that room). */
export const ROOM_ACTIVITY: Record<Room, 'tv' | 'tea' | 'toilet' | 'phone'> = { living: 'tv', kitchen: 'tea', bathroom: 'toilet', bedroom: 'phone', hallway: 'phone' };

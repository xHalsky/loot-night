import type { ActivityId, Room } from '../core/state';

// Her activities in the apartment (docs/design/her.md).
// sound: what you hear (empty = silent activity, the map goes stale). end: the cue that it is wrapping up.
export interface ActivityDef { id: ActivityId; room: Room; label: string; sound: string; end: string; dur: [number, number]; weight: number }
export const ACTIVITIES: ActivityDef[] = [
  { id: 'tv', room: 'living', label: 'Watching TV', sound: 'TV', end: 'CREDITS', dur: [20, 35], weight: 5 },
  { id: 'tea', room: 'kitchen', label: 'Making tea', sound: 'KETTLE', end: 'KETTLE CLICK', dur: [10, 18], weight: 2 },
  { id: 'toilet', room: 'bathroom', label: 'Bathroom', sound: 'FLUSH', end: 'TAP', dur: [8, 12], weight: 1 },
  { id: 'phone', room: 'bedroom', label: 'On her phone', sound: '', end: 'BYE LOVE YOU', dur: [15, 25], weight: 2 },
  { id: 'shower', room: 'bathroom', label: 'Shower', sound: 'SHOWER', end: 'HAIR DRYER', dur: [90, 120], weight: 0 },
  { id: 'sleep', room: 'bedroom', label: 'Asleep', sound: 'ZZZ', end: '', dur: [99999, 99999], weight: 0 },
];
export const ACT_BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a])) as Record<ActivityId, ActivityDef>;
export const ROOM_NAME: Record<Room, string> = { living: 'Living room', kitchen: 'Kitchen', bathroom: 'Bathroom', bedroom: 'Bedroom', hallway: 'Hallway' };
// How far each room is from yours on the blueprint (docs/design/her.md, Noise by distance).
// Your room is at the hallway's end (ui/plan.ts): it shares walls with the kitchen and the living room; the
// bathroom is further down the hallway; the bedroom is at the far end.
export const ROOM_DISTANCE: Record<Room, 'next' | 'middle' | 'far'> = { hallway: 'next', living: 'next', kitchen: 'next', bathroom: 'middle', bedroom: 'far' };
/** Which side of the webcam picture each room is on, for his eyes (#37): -1 the viewer's left, 1 the right.
 *  The camera looks at him from his desk; your door is behind him, the hallway straight beyond it. As in the
 *  crack (#64): the kitchen, the bathroom and the bedroom are on the right, the living room on the left. */
export const ROOM_LOOK: Record<Room, number> = { living: -1, bathroom: 1, bedroom: 1, kitchen: 1, hallway: 1 };
export const ROOM_SHORT: Record<Room, string> = { living: 'Living', kitchen: 'Kitchen', bathroom: 'Bath', bedroom: 'Bedroom', hallway: 'Hallway' };

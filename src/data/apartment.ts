import type { ActivityId, Room } from '../core/state';

// Her activities in the apartment (docs/design/her.md).
// sound: what you hear (empty = silent activity, the map goes stale). end: the cue that it is wrapping up.
export interface ActivityDef { id: ActivityId; room: Room; label: string; sound: string; end: string; dur: [number, number]; weight: number }
export const ACTIVITIES: ActivityDef[] = [
  { id: 'tv', room: 'living', label: 'Watching TV', sound: 'TV', end: 'CREDITS', dur: [20, 35], weight: 5 },
  { id: 'tea', room: 'kitchen', label: 'Making tea', sound: 'KETTLE', end: 'KETTLE', dur: [10, 18], weight: 2 },
  { id: 'toilet', room: 'bathroom', label: 'Bathroom', sound: 'FLUSH', end: 'TAP', dur: [8, 12], weight: 1 },
  { id: 'phone', room: 'bedroom', label: 'On her phone', sound: '', end: 'BYE LOVE YOU', dur: [15, 25], weight: 2 },
  { id: 'shower', room: 'bathroom', label: 'Shower', sound: 'SHOWER', end: 'HAIR DRYER', dur: [90, 120], weight: 0 },
  { id: 'sleep', room: 'bedroom', label: 'Asleep', sound: 'ZZZ', end: '', dur: [99999, 99999], weight: 0 },
];
export const ACT_BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a])) as Record<ActivityId, ActivityDef>;
export const ROOM_NAME: Record<Room, string> = { living: 'Living room', kitchen: 'Kitchen', bathroom: 'Bathroom', bedroom: 'Bedroom', hallway: 'Hallway' };
// How far each room is from yours on the blueprint (docs/design/her.md, Noise by distance).
// Your room shares walls with the living room and the kitchen and opens onto the hallway;
// the bathroom is across the hallway; the bedroom is the far corner.
export const ROOM_DISTANCE: Record<Room, 'next' | 'middle' | 'far'> = { hallway: 'next', living: 'next', kitchen: 'next', bathroom: 'middle', bedroom: 'far' };
export const ROOM_SHORT: Record<Room, string> = { living: 'Living', kitchen: 'Kitchen', bathroom: 'Bath', bedroom: 'Bedroom', hallway: 'Hallway' };

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
  { id: 'bath', room: 'bathroom', label: 'Bath', sound: 'MUSIC', end: 'DRAIN', dur: [120, 150], weight: 0 },   // the weekend (#88): her music through the door
  { id: 'yoga', room: 'living', label: 'Yoga', sound: 'VIDEO', end: 'CREDITS', dur: [45, 70], weight: 0 },        // Tuesday on (#77): weight 1 once lean in is in
  { id: 'mask', room: 'bathroom', label: 'Sheet mask', sound: '', end: 'TAP', dur: [60, 90], weight: 0 },          // Friday on: once, before bed
  { id: 'sleep', room: 'bedroom', label: 'Asleep', sound: 'ZZZ', end: '', dur: [99999, 99999], weight: 0 },
];
/** In the water: the shower or the bath (she can't come to your door, real life waits, the towel is hers to ask for). */
export const wet = (id: string) => id === 'shower' || id === 'bath';
export const ACT_BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a])) as Record<ActivityId, ActivityDef>;
export const ROOM_NAME: Record<Room, string> = { living: 'Living room', kitchen: 'Kitchen', bathroom: 'Bathroom', bedroom: 'Bedroom', hallway: 'Hallway' };
// How far each room is from yours on the blueprint (docs/design/her.md, Noise by distance). The plan as approved for
// lean in (#77): your room at the hallway's end shares walls with the kitchen and the living room; the bedroom is off
// the hallway further down (middle), the bathroom at the far end (far). Swapped from the build's first plan
// (decisions 2026-11-23): she hears you half as well from the bath, twice as well on her phone in the bedroom.
export const ROOM_DISTANCE: Record<Room, 'next' | 'middle' | 'far'> = { hallway: 'next', living: 'next', kitchen: 'next', bathroom: 'far', bedroom: 'middle' };
/** Which side of the webcam picture each room is on, for his eyes (#37): -1 the viewer's left, 1 the right.
 *  The camera looks at him from his desk; your door is behind him, the hallway straight beyond it. As in the
 *  crack (#64): the kitchen, the bathroom and the bedroom are on the right, the living room on the left. */
export const ROOM_LOOK: Record<Room, number> = { living: -1, bathroom: 1, bedroom: 1, kitchen: 1, hallway: 1 };
export const ROOM_SHORT: Record<Room, string> = { living: 'Living', kitchen: 'Kitchen', bathroom: 'Bath', bedroom: 'Bedroom', hallway: 'Hallway' };

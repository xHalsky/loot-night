import type { ActivityId, Room } from '../core/state';

// Her activities in the apartment (design doc section 5, "Apartment map").
// sound: what you hear (empty = silent activity, the map goes stale).
export interface ActivityDef { id: ActivityId; room: Room; label: string; sound: string; dur: [number, number]; weight: number }
export const ACTIVITIES: ActivityDef[] = [
  { id: 'tv', room: 'living', label: 'Watching TV', sound: 'TV', dur: [20, 35], weight: 5 },
  { id: 'tea', room: 'kitchen', label: 'Making tea', sound: 'KETTLE', dur: [10, 18], weight: 2 },
  { id: 'toilet', room: 'bathroom', label: 'Bathroom', sound: 'FLUSH', dur: [8, 12], weight: 1 },
  { id: 'phone', room: 'bedroom', label: 'On her phone', sound: '', dur: [15, 25], weight: 2 },
  { id: 'shower', room: 'bathroom', label: 'Shower', sound: 'SHOWER', dur: [90, 120], weight: 0 },
  { id: 'sleep', room: 'bedroom', label: 'Asleep', sound: 'ZZZ', dur: [99999, 99999], weight: 0 },
];
export const ACT_BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a])) as Record<ActivityId, ActivityDef>;
export const ROOM_NAME: Record<Room, string> = { living: 'Living room', kitchen: 'Kitchen', bathroom: 'Bathroom', bedroom: 'Bedroom', hallway: 'Hallway' };
export const ROOM_SHORT: Record<Room, string> = { living: 'Living', kitchen: 'Kitchen', bathroom: 'Bath', bedroom: 'Bedroom', hallway: 'Hallway' };

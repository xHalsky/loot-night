// The apartment plan (docs/design/her.md, "The plan"): the blue sheet taped to his wall. One layout for the big
// sheet (drawn by the renderer) and the corner in the webcam view (door.ts). The layout as Paweł approved it for lean in
// (2026-11-20, grid doc 7l; in from V12, #77): your door at the hallway's end, so the crack looks straight down it; on
// the right wall the kitchen's open doorway first, then the bedroom door; at the far end the bathroom's pocket door,
// facing you; on the left the arch into the living room, and the hall mirror on that wall (when you buy it). Who hears
// what (ROOM_DISTANCE): the kitchen, the living room and the hallway are next to you, the bedroom further (middle), the
// bathroom at the far end. Your desk faces the far wall, so the door is right behind you. The plan never marks her.

/** Walls as segments on a 200 x 200 sheet (openings are gaps). */
export const PLAN_WALLS: [number, number, number, number][] = [
  [2, 2, 198, 2], [2, 2, 2, 198], [2, 198, 198, 198], [198, 2, 198, 198],                        // outer
  [70, 84, 80, 84], [98, 84, 112, 84], [136, 84, 198, 84],                                        // hallway, north: the bedroom door, the kitchen opening; your room | kitchen
  [96, 108, 140, 108],                                                                            // hallway, south: the arch 70..96 into the living room
  [140, 84, 140, 88], [140, 104, 140, 198],                                                       // your room's wall: your door at the hallway's end
  [70, 56, 70, 85], [70, 99, 70, 101],                                                            // the far end: the bathroom's door 85..99, the living room 101..
  [2, 100, 70, 100], [2, 56, 70, 56],                                                             // the bathroom (at the far end)
  [110, 2, 110, 84],                                                                              // bedroom | kitchen
];
/** Your room's centre (the gold YOU). */
export const PLAN_YOU: [number, number] = [152, 140];

/** The whole plan for the renderer's blueprint (V9, #74; grid doc 7g): the page's approved sheet (page: true; its
 *  furniture, door swings, stops, labels and note are the page's), with or without the hall mirror (199 zł, #77). */
export const PLAN = { page: true, mirror: false, walls: PLAN_WALLS };
export const PLAN_MIRROR = { page: true, mirror: true, walls: PLAN_WALLS };

// The apartment plan (docs/design/her.md, "The plan"): the blue sheet taped to his wall. One layout for the big
// sheet (PLAN, drawn by the renderer) and the corner in the webcam view (door.ts), drawn to match the hallway seen through the crack.
// Your door is at the hallway's end, so the crack looks straight down it: on the right wall the kitchen's open
// doorway first, then the bathroom door; at the far end the living room's opening (left) and the bedroom door (right).
// Who hears what (ROOM_DISTANCE): the kitchen and the living room share your walls and the hallway starts at your
// door (next), the bathroom (middle), the bedroom (far). Your desk faces the far wall, so the door is right behind
// you (as in the webcam view). The plan never marks where she is.

/** Walls as segments on a 200 x 200 sheet (openings are gaps). */
export const PLAN_WALLS: [number, number, number, number][] = [
  [2, 2, 198, 2], [2, 2, 2, 198], [2, 198, 198, 198], [198, 2, 198, 198],                        // outer
  [70, 84, 80, 84], [98, 84, 112, 84], [136, 84, 198, 84],                                        // hallway, north: bathroom door, kitchen opening; then your room | kitchen
  [70, 108, 140, 108],                                                                            // hallway, south (the living room)
  [140, 84, 140, 88], [140, 104, 140, 198],                                                       // your room's wall: your door at the hallway's end
  [70, 2, 70, 86], [70, 95, 70, 97], [70, 107, 70, 108],                                          // the far end: bedroom door, living-room opening
  [2, 96, 70, 96],                                                                                // bedroom | living room
  [110, 2, 110, 84],                                                                              // bathroom | kitchen
];
/** Your room's centre (the gold YOU). */
export const PLAN_YOU: [number, number] = [152, 140];

/** The whole plan as data for the renderer's blueprint (V9, #74; grid doc 7g), in the same 200 x 200 sheet units.
 *  Furniture: ['r', x, y, w, h, round?] a box, ['e', cx, cy, rx, ry] an ellipse, ['l', x0, y0, x1, y1] a line,
 *  ['p', x, y, x, y, ...] a polyline, ['v', x, y0, y1] a thick line on a wall. Swings: the leaf (x0 y0 to x1 y1) and its
 *  arc (centre, radius, degrees from +x, clockwise). Stops: where the crack's sight lines go, 1 2 3. */
export const PLAN = {
  walls: PLAN_WALLS,
  windows: [[2, 22, 2, 62], [78, 2, 102, 2], [152, 2, 188, 2], [2, 120, 2, 176], [22, 198, 90, 198], [150, 198, 188, 198]],
  furniture: [
    ['r', 8, 8, 40, 52], ['r', 11, 11, 15, 9], ['r', 30, 11, 15, 9], ['l', 8, 28, 48, 28], ['r', 52, 8, 12, 12], ['r', 52, 26, 14, 30],   // her bed, the nightstand, the wardrobe
    ['r', 74, 6, 22, 46, 6], ['r', 99, 6, 9, 14], ['e', 103, 38, 5, 7],                                                                   // the bathtub, the basin, the toilet
    ['p', 136, 6, 194, 6, 194, 72, 182, 72, 182, 18, 136, 18, 136, 6], ['e', 188, 30, 3, 3], ['e', 188, 44, 3, 3], ['r', 114, 6, 16, 20], ['e', 154, 50, 9, 9],   // the kitchen
    ['v', 8, 116, 160], ['r', 30, 126, 24, 26], ['r', 72, 116, 20, 52, 4], ['r', 24, 172, 28, 18, 4],                                  // the TV, the coffee table, the sofa, the pouf
    ['r', 180, 86, 14, 34], ['v', 190, 90, 116], ['e', 169, 100, 7, 7], ['r', 166, 134, 28, 46], ['r', 170, 137, 20, 9], ['r', 126, 122, 10, 52],   // your desk, monitor, chair, bed, the shelf
  ],
  swings: [[80, 84, 80, 66, 80, 84, 18, 270, 360], [70, 86, 61, 86, 70, 86, 9, 90, 180], [140, 104, 156, 104, 140, 104, 16, 270, 360]],
  latch: [140, 88.4],
  stops: [[116, 68], [89, 85], [62, 101]],
  digits: [['1', 114, 64], ['2', 89, 94], ['3', 62, 110]],
  labels: [['BEDROOM', 30, 82], ['BATH', 89, 62], ['KITCHEN', 154, 78], ['HALLWAY', 112, 105], ['LIVING', 46, 166], ['YOU', 152, 140, true]],
  note: 'Your room is at the end of the hallway. Next to it: the kitchen and the living room (through the walls) and the hallway. She hears you best there. The bathroom is further down, the bedroom at the far end. Through the crack: 1 the kitchen, 2 the bathroom door, 3 the far end only when the door is wide.',
};

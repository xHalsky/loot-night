// Screen layout (#49, the monitor-first "A1 final" layout; docs/design/screen.md). Sizes in stage px on the
// 1280 x 720 base, all even so they land on a 640 x 360 pixel grid at 2x. Not balance numbers: those live in tuning.ts.

/** The left column: the webcam view and her panel. */
export const LEFT_W = 296;
/** The desk column (everything right of the left column). */
export const DESK_X = LEFT_W, DESK_W = 1280 - LEFT_W;
/** The game screen inside the monitor, in desk coordinates. Everything the RPG shows lives in here. */
export const GAME_X = 18, GAME_Y = 16, GAME_W = 948, GAME_H = 464;
/** The battle (or town) area on the left of the game screen; the side panel takes the rest. */
export const BATTLE_W = 668;
export const SIDE_W = GAME_W - BATTLE_W;
/** The dungeon and town scenes are drawn 1:1 (never scaled) at this height, at the bottom of the battle area.
 *  The band above them (BAND_H) holds the dungeon art and the curio windows. */
export const SCENE_H = 352;
export const BAND_H = GAME_H - SCENE_H;
/** The town picture keeps its authored width, centred in the battle area. */
export const TOWN_W = 616, TOWN_X = (BATTLE_W - TOWN_W) / 2;
/** The OS strip under the game screen. */
export const TASKBAR_Y = GAME_Y + GAME_H + 2, TASKBAR_H = 30;
/** Where the desk surface starts (desk coordinates). */
export const DESK_TOP = 528;

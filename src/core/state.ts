import { T } from '../config/tuning';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export type Slot = 'weapon' | 'helm' | 'armor' | 'boots' | 'ring' | 'trinket';
export const SLOTS: Slot[] = ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'];
export type Stat = 'atk' | 'hp' | 'armor' | 'speed' | 'crit' | 'luck';
export type MapKind = 'elite' | 'shrine' | 'vault';

export interface Affix { stat: Stat; amount: number }
export interface Item {
  id: string; name: string; slot: Slot; rarity: Rarity; ilvl: number;
  affixes: Affix[]; value: number; identified: boolean;
  locked?: boolean;              // locked items can't be sold, salvaged, listed or dropped
}
export type BagEntry =
  | { kind: 'item'; id: string; item: Item }
  | { kind: 'map'; id: string; map: MapKind }
  | { kind: 'feather'; id: string };

export type HeroId = 'knight' | 'mage' | 'healer';
export interface Hero {
  id: HeroId; name: string; role: string; level: number; xp: number;
  hp: number; downed: boolean; atb: number;
  gear: Partial<Record<Slot, Item>>;
  cd: number[];          // seconds left per ability slot (5)
  queued: number | null; // ability slot queued for next turn
  lunge?: number;        // attack animation timer
}

export interface Enemy {
  uid: number; defId: string; name: string; hp: number; maxHp: number;
  atk: number; armor: number; speed: number; atb: number;
  turnsAlive: number; stunned: number; boss: boolean; flash: number; lunge?: number;
  wind?: number; acts?: number; braced?: boolean;   // braced: the next big attack cannot be interrupted          // boss: seconds left of a telegraphed big attack; actions taken
}

export interface FloatFx { x: number; y: number; text: string; color: string; t: number }
export interface Toast { text: string; color: string; t: number }
export type VfxKind = 'slash' | 'claw' | 'bolt' | 'fire' | 'frost' | 'heal' | 'taunt' | 'bash' | 'smite' | 'ward';
export interface Vfx { kind: VfxKind; x: number; y: number; x2: number; y2: number; t: number; dur: number; seed: number }

export type VisitStage = 'idle' | 'far' | 'hall' | 'handle' | 'in' | 'passing';
/** What she comes for (docs/design/her.md, visit types). Each asks for a different answer. */
export type VisitKind = 'peek' | 'snack' | 'chat' | 'cuddle';
export interface ChatState { order: number[]; asked: number; good: number; bad: number; t: number; line: string }
export interface VisitState {
  stage: VisitStage; t: number; nextAt: number; fake: boolean; checked: boolean; result: string; from?: string; lean?: boolean;
  kind: VisitKind;
  chat?: ChatState | null;        // Chat: the questions she asks while you sit on Excel
}

export type Room = 'living' | 'kitchen' | 'bathroom' | 'bedroom' | 'hallway';
export type ActivityId = 'tv' | 'tea' | 'toilet' | 'shower' | 'phone' | 'sleep';
export interface Apartment {
  room: Room; activity: ActivityId; t: number; moving: number; soundT: number;
  heard: Room | null; heardWhat: string; heardAt: number;
  showerUsed: boolean; lastVisitEnd: number; forceDoor: boolean;
  asleep: boolean; wake: number; textSent: boolean;
}

// Everything that reaches you through the phone (one device on the desk).
export type InterruptKind = 'mom' | 'boss' | 'text';
export interface Interrupt {
  kind: InterruptKind; t: number; max: number;
  msgs: string[];      // messages that already arrived (each one buzzed and popped on the lock screen)
  pend: number[];      // seconds since arrival at which the next messages come in
  pingAt: number;      // elapsed time of the latest buzz
}

export interface PhoneGame {
  kind: 'phone'; app: InterruptKind;
  stage: 'ringing' | 'locked' | 'call' | 'chat';
  t: number; max: number;            // time left in the current stage (0 = untimed)
  unlock: number; holding: boolean; drag: number;
  beat: number; misses: number; sweep: number; zone: number; need: 0 | 1 | 2; line: string; read: number;   // Mom
  row: number; rows: { a: number; b: number; options: number[] }[];                          // Boss
  feedback: string;
  msgs: string[];                    // chat history shown above the question
}
export interface MonsterGame {
  kind: 'monster'; stage: 'fridge' | 'grab' | 'open' | 'drink' | 'toss';
  drag: number; drink: number; holding: boolean; gulp: number; gulps: number; coughed: boolean; opened: boolean; feedback: string;
  canX: number;                   // where the can stands on the desk (scene px)
}
/** An empty can resting in the bin: two ends of a capsule (scene px of the toss view). */
export interface BinCan { ax: number; ay: number; bx: number; by: number }
/** Cuddle: follow her slow breathing (a dot moving along a path) without rushing. */
export interface CuddleGame { kind: 'cuddle'; t: number; max: number; warmth: number; mx: number; my: number; lastMx: number; lastMy: number; jerk: number }
export type MiniGame = PhoneGame | MonsterGame | CuddleGame;

/** The dog (docs/design/desk.md): pops up at the desk for attention. */
export interface DogState { stage: 'away' | 'up' | 'happy'; t: number; next: number; ignores: number; limit: number; pet: number; sweet: number; flinch: number }
/** She sits on the desk in front of the monitor (docs/design/her.md). */
export interface LapState { stage: 'arrive' | 'ask' | 'react' | 'leave'; t: number; q: number; asked: number; order: number[]; sweet: number; rude: number; face: 'smile' | 'neutral' | 'pout' | 'blush' | 'wink'; line: string; outfit: string }

// Excel: a slow spreadsheet Tetris. Filled rows pay overtime gold.
export interface ExcelPiece { k: number; cells: [number, number][]; x: number; y: number }
export interface ExcelState { board: number[][]; piece: ExcelPiece | null; next: number; fallT: number; rows: number; pay: number; clearFx: number; crashFx: number }

export type DungeonPhase = 'walk' | 'battle' | 'loot' | 'mapChoice';

export interface Night {
  clock: number; threat: number;
  location: 'town' | 'dungeon';
  phase: DungeonPhase; phaseT: number;
  floor: number; battleIdx: number; floorMap: MapKind | 'plain'; checkpoint: number; deepest: number;
  enemies: Enemy[];
  mood: number; noise: number; busy: number; catches: number; flow: number;
  monitor: 'rpg' | 'excel';
  action: 'none' | 'miniGame';
  dropQueue: BagEntry[];
  floorLoot: { entry: BagEntry; x: number; t: number }[];   // drops lying on the dungeon floor (screen x)
  fresh: { id: string; t: number }[];                       // bag slots that just received loot (blink)
  dropPopup: { entry: BagEntry; t: number } | null;
  corpse: BagEntry[]; corpseFloor: number;
  visit: VisitState;
  apt: Apartment;
  headset: boolean;
  scare: number;
  zone: number;                  // 0..1, fills while the headset is on
  tired: number;                 // 0..100, live sleepiness (starts from sleep debt)
  blink: { state: 'open' | 'closing' | 'closed'; lid: number; nextIn: number };
  boost: number; crash: number;  // Monster timers (s)
  cans: number;                  // empty cans in the bin
  bin: BinCan[];                 // where they lie (persists all night)
  log: { text: string; color: string; time: string }[];   // the chat feed
  peeking: boolean; peek: number; peekReveal: number; peekSus: number; peekOff: [number, number];   // door peek
  declineHold: boolean; decline: number;   // holding Decline on a ringing call
  phoneDown: number; flipFx: number;       // phone face-down timer, flip animation
  momCallback: number;                     // threat time Mom calls again (0 = none)
  switching: { to: 'rpg' | 'excel'; t: number; max: number } | null;   // alt-tab blackout in progress
  dog: DogState;
  unplugged: { kinds: number[]; colors: number[]; sockets: number[]; plugged: boolean[] } | null;   // cable minigame: per cable plug type + colour; sockets[slot] = cable index
  lap: LapState | null;
  cansHidden: boolean;
  visitDeck: VisitKind[];                  // visit types still to come this cycle (shuffled)                     // Monster cans shoved under the desk (Snack run tell)
  interrupts: Interrupt[]; nextInterruptAt: number;
  game: MiniGame | null;
  excel: ExcelState;
  taunt: number; ward: number; guilt: number; monitorOff: number; yawn: number; nextYawn: number;
  moodDrift: number;
  selected: string | null; heroTab: number;
  everCaught: boolean; unidentifiedFound: number;
  goblin: { t: number } | null;
  fx: FloatFx[]; vfx: Vfx[]; beams: { x: number; color: string; t: number }[];
  toasts: Toast[];
  walkScroll: number;
  market: number;
  reveal: { name: string; t: number } | null;
}

export interface Results {
  ending: 'sleep' | 'dawn' | 'unplugged';
  endClock: number; stars: number; depth: number; prevRecord: number;
  debtBefore: number; debtAfter: number; mood: number; caught: boolean;
  unidentified: number; nearMisses: string[];
}

export type Screen = 'title' | 'night' | 'results' | 'morning';

export interface GameState {
  heroes: Hero[];
  bag: BagEntry[]; bagSize: number;
  autoSalvage: boolean;          // common + uncommon pickups turn straight into scraps
  gold: number; mats: number; zl: number;
  furniture: Record<'training' | 'inn' | 'library' | 'treasury', number>;   // city building levels
  sleepDebt: number;
  monsters: number;
  bestStars: number; record: number; nightsPlayed: number;
  pendingListings: { name: string; zl: number }[];
  pity: number; uid: number;
  night: Night | null;
  townWin?: 'merchant' | 'appraiser' | 'salvage' | 'auction' | null;
  screen: Screen; paused: boolean; debug: boolean; timeScale: number;
  results: Results | null;
  morning: { paid: number; listings: number } | null;
}

export function newHero(id: HeroId, name: string, role: string, hp: number): Hero {
  return { id, name, role, level: 1, xp: 0, hp, downed: false, atb: Math.random() * 50, gear: {}, cd: [0, 0, 0, 0, 0], queued: null };
}

export function initialState(): GameState {
  return {
    heroes: [newHero('knight', 'Paweł', 'Knight', 130), newHero('mage', 'Rafał', 'Mage', 75), newHero('healer', 'Jacek', 'Healer', 90)],
    bag: [], bagSize: T.BAG_SIZE, autoSalvage: false,
    gold: T.START_GOLD, mats: 0, zl: T.START_ZL,
    furniture: { training: 0, inn: 0, library: 0, treasury: 0 },
    sleepDebt: 0, monsters: 3, bestStars: 0, record: 0, nightsPlayed: 0,
    pendingListings: [], pity: 0, uid: 1,
    night: null, screen: 'title', paused: false, debug: false, timeScale: 1,
    results: null, morning: null,
  };
}

// The one game state object (docs/design/tech.md).
export const S: { g: GameState } = { g: initialState() };
export const N = (): Night => S.g.night as Night;
export const uid = () => 'e' + (S.g.uid++);

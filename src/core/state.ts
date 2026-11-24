import { T } from '../config/tuning';
import { HERO_NAME } from '../data/heroes';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export type Slot = 'weapon' | 'helm' | 'armor' | 'boots' | 'ring' | 'trinket';
export const SLOTS: Slot[] = ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'];
export type Stat = 'atk' | 'hp' | 'armor' | 'speed' | 'crit' | 'luck';
export type MapKind = 'elite' | 'shrine' | 'vault' | 'cursed' | 'goblin';

export interface Affix { stat: Stat; amount: number }
export interface Item {
  id: string; name: string; slot: Slot; rarity: Rarity; ilvl: number;
  affixes: Affix[]; value: number; identified: boolean;
  locked?: boolean;              // locked items can't be sold, salvaged, listed or dropped
  special?: string; specialAmt?: number;   // a special affix id (src/data/affixes.ts) and its stat or gold amount
  witched?: boolean;             // the Witching Hour shifted it up a rarity
  run?: boolean;                 // picked up this run, not banked yet (#52, 1.4): lost on a wipe, even worn
}
export type BagEntry = (
  | { kind: 'item'; id: string; item: Item }
  | { kind: 'map'; id: string; map: MapKind }
  | { kind: 'feather'; id: string }) & { run?: boolean };   // run: picked up this run, not banked yet (#52, 1.4)

export type HeroId = 'knight' | 'mage' | 'healer';
export interface Hero {
  id: HeroId; name: string; role: string; level: number; xp: number;
  hp: number; downed: boolean; atb: number;   // atb: progress to the next auto attack, 0..100 (real time, #52)
  gear: Partial<Record<Slot, Item>>;
  cd: number[];          // seconds left per ability slot (auto, skill 1, skill 2, the ultimate)
  ult: number;           // the ultimate's charge, 0..1 (fills during fights, #52)
  queued: number | null; // ability slot queued for next turn
  lunge?: number;        // attack animation timer
}

export interface Enemy {
  uid: number; defId: string; name: string; hp: number; maxHp: number;
  atk: number; armor: number; speed: number; atb: number;
  aliveSec: number; stunned: number; boss: boolean; flash: number; lunge?: number;   // stunned: seconds left
  slot: number; elite?: boolean; enter?: number;   // where it stands (core/arena.ts); seconds left stepping into its rank
  marks?: Partial<Record<MarkId, number>>;          // seconds left per ability mark (docs/design/dungeon.md)
  shield?: boolean;                                  // takes SHIELD_TAKEN damage until a Bash breaks it
  per?: number;                                      // swarm: HP of one body (stacks = ceil(hp / per))
  windMax?: number; evict?: number;                  // boss: length of the current wind-up; EXECUTE's target hero
  wind?: number; acts?: number; braced?: boolean; enraged?: boolean;   // braced: the next big attack cannot be interrupted          // boss: seconds left of a telegraphed big attack; actions taken
}

export type MarkId = 'stagger' | 'chill' | 'judged' | 'taunted';
export interface FloatFx { x: number; y: number; text: string; color: string; t: number }
export interface Toast { text: string; color: string; t: number }
export type VfxKind = 'slash' | 'claw' | 'bolt' | 'fire' | 'frost' | 'heal' | 'taunt' | 'bash' | 'smite' | 'ward';
export interface Vfx { kind: VfxKind; x: number; y: number; x2: number; y2: number; t: number; dur: number; seed: number }

export type VisitStage = 'idle' | 'far' | 'hall' | 'handle' | 'in' | 'passing';
/** What she comes for (docs/design/her.md, visit types). Each asks for a different answer. */
export type VisitKind = 'peek' | 'snack' | 'chat' | 'cuddle' | 'night';   // night: the hoodie walk-by on her way to bed
export interface ChatState { order: number[]; asked: number; good: number; bad: number; t: number; line: string; last: number }   // last: his last answer (0 good, 1 meh, 2 rude, -1 none)
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
  asleep: boolean; wake: number; textSent: boolean; cued: boolean;   // cued: the end-of-activity sound has played
  calm: number; forceKind: VisitKind | null;   // pre-emptive: seconds with no visit roll; the next visit's type
  calmHard?: boolean;   // the Raid pass: she knows you are raiding, Noise does not end this calm
}

// Everything that reaches you through the phone (one device on the desk).
export type InterruptKind = 'mom' | 'boss' | 'text' | 'courier' | 'friends';
/** Calls ring and can be declined; the rest are messages (lock-screen banners). */
export const isCall = (k: InterruptKind) => k === 'mom' || k === 'courier' || k === 'friends';
export interface Interrupt {
  kind: InterruptKind; t: number; max: number;
  msgs: string[];      // messages that already arrived (each one buzzed and popped on the lock screen)
  pend: number[];      // seconds since arrival at which the next messages come in
  pingAt: number;      // elapsed time of the latest buzz
}

export interface PhoneGame {
  kind: 'phone'; app: InterruptKind;
  stage: 'ringing' | 'locked' | 'call' | 'chat' | 'talk';   // talk: courier / friends dialogue
  t: number; max: number;            // time left in the current stage (0 = untimed)
  unlock: number; holding: boolean; drag: number;
  beat: number; misses: number; sweep: number; zone: number; need: 0 | 1 | 2; line: string; read: number;   // Mom
  row: number; rows: { a: number; b: number; options: number[] }[];                          // Boss
  opts?: string[]; talk?: number;    // courier / friends: the replies shown (shuffled) and which talk script
  feedback: string;
  msgs: string[];                    // chat history shown above the question
}
export interface MonsterGame {
  kind: 'monster'; stage: 'drawer' | 'grab' | 'open' | 'drink' | 'toss';
  opened: boolean; feedback: string;
  drunk: number;                         // share of the can that went down (set when it is empty)
  result: 'full' | 'half' | 'none' | null;
}
/** An empty can lying in the toss view (scene px): centre and angle. In the bin (tonight) or on the floor (for good). */
export interface CanPose { x: number; y: number; a: number }
/** Cuddle: follow her slow breathing (a dot moving along a path) without rushing. */
export interface CuddleGame { kind: 'cuddle'; t: number; max: number; warmth: number; mx: number; my: number; lastMx: number; lastMy: number; jerk: number }
export type MiniGame = PhoneGame | MonsterGame | CuddleGame;

/** The dog (docs/design/desk.md): pops up at the desk for attention. */
export interface DogState { stage: 'away' | 'up' | 'happy'; t: number; next: number; ignores: number; limit: number; pet: number; sweet: number; flinch: number; sweetPet?: number }   // sweetPet: petting done on his favourite spot
/** She leans into your face from the right, asking three things (docs/design/her.md, #65). */
export interface LapState { stage: 'arrive' | 'ask' | 'react' | 'leave'; t: number; q: number; asked: number; order: number[]; sweet: number; rude: number; face: 'smile' | 'neutral' | 'pout' | 'blush' | 'wink'; line: string; outfit: string }

// Excel: a slow spreadsheet Tetris. Filled rows pay overtime gold.
export interface ExcelPiece { k: number; cells: [number, number][]; x: number; y: number }
export interface ExcelState { board: number[][]; piece: ExcelPiece | null; next: number; fallT: number; rows: number; pay: number; clearFx: number; crashFx: number }

/** A pre-emptive action in progress. stage: doing it; ask = her "stay for one episode?"; episode = staying.
 *  away: you are not at the desk. withHer: her apartment routine pauses (she is with you). */
export interface PreState { id: string; stage: 'doing' | 'ask' | 'episode'; t: number; max: number; away: boolean; withHer: boolean; mult: number; outcome: string }
export type DungeonPhase = 'walk' | 'battle' | 'loot' | 'mapChoice' | 'curio';
/** A curio the party stopped at (systems/curios.ts). stage: ask = waiting for your choice; pick, sneak = in progress. */
export interface CurioState { id: string; stage: 'ask' | 'pick' | 'sneak'; t: number; max: number }
/** A timed party buff or debuff (curios, the friends' raid buff). floor: lasts until the next floor instead of t. */
export interface PartyBuff { name: string; dmg: number; speed: number; t: number; max: number; icon: string; floor?: boolean; crit?: number; fights?: number }   // fights: lasts this many battles instead of t

export interface Night {
  clock: number; threat: number;
  location: 'town' | 'dungeon';
  phase: DungeonPhase; phaseT: number;
  floor: number; battleIdx: number; floorMap: MapKind | 'plain'; checkpoint: number; deepest: number;
  enemies: Enemy[];
  mood: number; noise: number; catches: number; flow: number;
  bossQuiet: number; bossCallback: number;   // threat time until the boss stays quiet; when he pings again after a flip (0 = none)
  monitor: 'rpg' | 'excel';
  action: 'none' | 'miniGame' | 'pre';   // pre: busy with a pre-emptive action (systems/preemptive.ts)
  dropQueue: BagEntry[];
  floorLoot: { entry: BagEntry; x: number; t: number }[];   // drops lying on the dungeon floor (screen x)
  fresh: { id: string; t: number }[];                       // bag slots that just received loot (blink)
  lootFly: { x: number; text: string; color: string; t: number; max: number; delay: number; dx: number }[];   // picked-up loot: names flying up from the floor (#49)
  dropPopup: { entry: BagEntry; t: number } | null;
  reserve: { defId: string; elite: boolean }[];   // the pack waiting off screen (#52, 1.3)
  run: RunState | null;                           // the run since the town portal (#52, 1.4)
  runCard: (RunState & { banked: boolean; t: number }) | null;   // the run end card
  visit: VisitState;
  apt: Apartment;
  headset: boolean;
  scare: number;
  zone: number;                  // 0..1, fills while the headset is on
  tired: number;                 // 0..100, live sleepiness (starts from sleep debt)
  blink: { state: 'open' | 'closing' | 'closed'; lid: number; nextIn: number };
  boost: number; crash: number;  // Monster timers (s)
  cans: number;                  // empty cans in the bin
  bin: CanPose[];                // where they lie in the bin (tonight)
  log: { text: string; color: string; time: string; tag?: string }[];   // the feed (tag: YOU, LOOT, HER, PHONE, GAME, or a name)
  peeking: boolean; peek: number; peekSus: number;   // peek: how open the door is, 0 shut .. 1 = PEEK_CRACK_MAX   // door peek
  declineHold: boolean; decline: number;   // holding Decline on a ringing call
  phoneDown: number; flipFx: number;       // phone face-down timer, flip animation
  momCallback: number;                     // threat time Mom calls again (0 = none)
  switching: { to: 'rpg' | 'excel'; t: number; max: number } | null;   // alt-tab blackout in progress
  dog: DogState;
  unplugged: { kinds: number[]; colors: number[]; sockets: number[]; plugged: boolean[]; t0?: number; flow?: number } | null;   // cable minigame: per cable plug type + colour; sockets[slot] = cable index
  lap: LapState | null;
  cansHidden: boolean;
  interrupts: Interrupt[]; nextInterruptAt: number;
  game: MiniGame | null;
  excel: ExcelState;
  callsTonight: Record<string, number>;   // interrupts spawned tonight, per kind (INTERRUPT_PER_NIGHT caps)
  pre: PreState | null; preUses: Record<string, number>; preMenu: 'door' | 'phone' | null;   // pre-emptive actions (#19)
  towel: boolean; herReply: { msg: string; t: number; wait: number } | null;
  curio: CurioState | null; curioPlan: number[]; curioFight: boolean; partyBuffs: PartyBuff[];   // curios (#30)
  sulk: number; bankNotice: number; bankItem: string;
  goodBoy: number; excused: boolean; goodDog: number; forgiven: boolean; witchingSaid: boolean; walkby: boolean;   // forgiven: tonight's Forgiveness is used   // goodDog: Good Boy (petted on his favourite spot), goblins x2   // goodBoy: seconds the petted dog still counts; excused: tonight's excuse is used
  taunt: number; ward: number; lastStand: number; guilt: number; monitorOff: number; yawn: number; nextYawn: number;
  grin: number;   // seconds left of his grin after a big drop (the webcam view, #37)
  tip: { text: string; color: string; t: number } | null;   // a first-time tip pinned in the feed (#28)
  goldStart: number;   // gold when the night began: the F1 line shows tonight's income (#2)
  coach: { id: 'steps' | 'door' | 'phone' | 'loot' | 'windup' | 'headset'; t: number; mark: number } | null;   // a coach mark is up (#42)
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

/** A run (#52, 1.4): from the town portal until the town portal (banked) or a wipe (lost). */
export interface RunState { startFloor: number; deepest: number; gold: number; items: number; souls: number }

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
  mapPath: (string | null)[];    // the dungeon map (#48): what each floor was the last time you entered it, by floor number
  tipsSeen: string[];   // first-time tips already shown (#28)
  howto: boolean;       // the how-to-hide card is open (the night waits)
  seen: string[];                // enemy ids met before: the first meeting shows what they want
  curiosSeen: string[];          // the last few curios, so they don't repeat back to back
  goodwill: number;              // her Goodwill bank, 0-100 (systems/goodwill.ts); half carries over
  floorCans: CanPose[];          // missed throws: they stay on the floor for good (#61)
  pendingListings: { name: string; zl: number }[];
  pity: number; uid: number;
  checkpoints: number[];         // floors a run can start at: 1 and each 5n+1 whose boss you beat (#52, 1.4)
  startFloor: number;            // the floor the town's picker is on
  drops: number; legendaryFound: boolean;   // the first legendary of a save comes within LEGENDARY_FIRST_BY drops
  night: Night | null;
  townWin?: 'merchant' | 'appraiser' | 'salvage' | 'auction' | `build:${'training' | 'inn' | 'library' | 'treasury'}` | null;   // a service window, or a plot's build window (#50)
  screen: Screen; paused: boolean; debug: boolean; timeScale: number;
  realLifeOff: boolean;   // debug (#52, 1.1): nobody is home; the RPG runs alone (not saved)
  results: Results | null;
  morning: { paid: number; listings: number } | null;
}

export function newHero(id: HeroId, name: string, role: string, hp: number): Hero {
  return { id, name, role, level: 1, xp: 0, hp, downed: false, atb: Math.random() * 50, gear: {}, cd: [0, 0, 0, 0], ult: 0, queued: null };
}

export function initialState(): GameState {
  return {
    heroes: [newHero('knight', HERO_NAME.knight, 'Knight', 130), newHero('mage', HERO_NAME.mage, 'Mage', 75), newHero('healer', HERO_NAME.healer, 'Healer', 90)],
    bag: [], bagSize: T.BAG_SIZE, autoSalvage: false,
    gold: T.START_GOLD, mats: 0, zl: T.START_ZL,
    furniture: { training: 0, inn: 0, library: 0, treasury: 0 },
    sleepDebt: 0, monsters: 3, bestStars: 0, record: 0, nightsPlayed: 0, mapPath: [], tipsSeen: [], howto: false, seen: [], curiosSeen: [], goodwill: 0, floorCans: [],
    pendingListings: [], pity: 0, uid: 1, checkpoints: [1], startFloor: 1, drops: 0, legendaryFound: false,
    night: null, screen: 'title', paused: false, debug: false, timeScale: 1, realLifeOff: false,
    results: null, morning: null,
  };
}

// The one game state object (docs/design/tech.md).
export const S: { g: GameState } = { g: initialState() };
export const N = (): Night => S.g.night as Night;
export const uid = () => 'e' + (S.g.uid++);

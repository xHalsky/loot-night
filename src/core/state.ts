import type { LegendId, SetId } from '../data/legendaries';
import { T } from '../config/tuning';
import { HERO_NAME, HERO_CLASS } from '../data/heroes';
import type { PathCard, FeatureId, ConditionId } from '../data/routes';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export type Slot = 'weapon' | 'helm' | 'armor' | 'boots' | 'ring' | 'trinket';
export const SLOTS: Slot[] = ['weapon', 'helm', 'armor', 'boots', 'ring', 'trinket'];
export type Stat = 'atk' | 'hp' | 'armor' | 'speed' | 'crit' | 'luck';
export type MapKind = 'elite' | 'shrine' | 'vault' | 'cursed' | 'goblin';

export interface Affix { stat: Stat; amount: number }
/** The town's services, opened in the side panel's Town tab (grid doc §6b). */
export type ServiceSpot = 'forge' | 'merchant' | 'appraiser' | 'auction';
export interface Item {
  id: string; name: string; slot: Slot; rarity: Rarity; ilvl: number;
  affixes: Affix[]; value: number; identified: boolean;
  locked?: boolean;              // locked items can't be sold, salvaged, listed or dropped
  special?: string; specialAmt?: number;   // a special affix id (src/data/affixes.ts) and its stat or gold amount
  witched?: boolean;             // the Witching Hour shifted it up a rarity
  run?: boolean;                 // picked up this run, not banked yet (#52, 1.4): lost on a wipe, even worn
  legend?: LegendId;             // a legendary: its rule (src/data/legendaries.ts, #52 1.8)
  set?: SetId;                   // a set piece
  cls?: HeroId;                  // class gear (#113): a weapon, helm or armor only this hero can wear; boots, rings and trinkets have none
}
export type BagEntry = (
  | { kind: 'item'; id: string; item: Item }
  | { kind: 'map'; id: string; map: MapKind }
  | { kind: 'feather'; id: string }) & { run?: boolean };   // run: picked up this run, not banked yet (#52, 1.4)

export type HeroId = 'knight' | 'rogue' | 'mage' | 'healer';
export interface Hero {
  id: HeroId; name: string; role: string; level: number; xp: number;
  hp: number; downed: boolean; atb: number;   // atb: progress to the next auto attack, 0..100 (real time, #52)
  gear: Partial<Record<Slot, Item>>;
  cd: number[];          // seconds left per ability slot (auto, skill 1, skill 2, the ultimate)
  ult: number;           // the ultimate's charge, 0..1 (fills during fights, #52)
  queued: number | null; // ability slot queued for next turn
  lunge?: number;        // attack animation timer
  swing?: number;        // a melee attack's weapon swing, seconds left (#97)
  moving?: number;       // seconds left changing position (a swap, a Hook, a Shove): he doesn't act (#52, 1.6)
  from?: number;         // the position he is moving from (0-based), for the walk between positions
  nextCrit?: boolean;    // Nightglass (3 pieces): Smoke Bomb makes his next hit a crit (#52, 1.8)
}

export interface Enemy {
  uid: number; defId: string; name: string; hp: number; maxHp: number;
  atk: number; armor: number; speed: number; atb: number;
  aliveSec: number; stunned: number; boss: boolean; flash: number; lunge?: number;   // stunned: seconds left
  slot: number; elite?: boolean; enter?: number;   // where it stands (core/arena.ts); seconds left stepping into its position
  marks?: Partial<Record<MarkId, number>>;          // seconds left per ability mark (docs/design/dungeon.md)
  shield?: boolean;                                  // takes SHIELD_TAKEN damage until a Bash breaks it
  burn?: number; burnDps?: number;                   // Wildfire (a tree rule, #53): seconds left burning, damage a second
  per?: number;                                      // swarm: HP of one body (stacks = ceil(hp / per))
  bodiesSeen?: number;                               // swarm: bodies last frame (each one lost leaves its own wreck, #154)
  windMax?: number; evict?: number;                  // boss: length of the current wind-up; EXECUTE's target hero
  look?: 'ironwing' | 'vigil';                       // a bat's figure and name (#130), rolled from its uid when it spawns, kept for its life
  wind?: number; acts?: number; braced?: boolean; enraged?: boolean;   // braced: the next big attack cannot be interrupted          // boss: seconds left of a telegraphed big attack; actions taken
}

/** A fallen enemy (#154): it crumbles where it stood, leaves a pile of iron bones of its own kind, and the pile fades
 *  after CORPSE_SEC. Visual only. slot and lane where it stood; dx how far the walk has carried it since (grid px); t its
 *  age in seconds; body: one cherub of a swarm (its index in the swarm), else undefined. */
export interface Corpse { uid: number; defId: string; look?: 'ironwing' | 'vigil'; slot: number; boss: boolean; dx: number; t: number; body?: number }
export type MarkId = 'stagger' | 'chill' | 'judged' | 'taunted';
export interface FloatFx { x: number; y: number; text: string; color: string; t: number }
export interface Toast { text: string; color: string; t: number }
export type VfxKind = 'slash' | 'claw' | 'bolt' | 'fire' | 'frost' | 'heal' | 'taunt' | 'bash' | 'smite' | 'ward' | 'chain' | 'smoke';
export interface Vfx { kind: VfxKind; x: number; y: number; x2: number; y2: number; t: number; dur: number; seed: number }

export type VisitStage = 'idle' | 'far' | 'hall' | 'handle' | 'in' | 'passing';
/** What she comes for (docs/design/her.md, visit types). Each asks for a different answer. */
export type VisitKind = 'peek' | 'snack' | 'chat' | 'cuddle' | 'night' | 'tease';   // night: the hoodie walk-by on her way to bed; tease: she wants you (#85)
export interface ChatState { order: number[]; asked: number; good: number; bad: number; t: number; line: string; last: number; mouse?: boolean }   // mouse: the lap sit's "My turn!" (#86)   // last: his last answer (0 good, 1 meh, 2 rude, -1 none)
export interface VisitState {
  stage: VisitStage; t: number; nextAt: number; fake: boolean; checked: boolean; result: string; from?: string; lean?: boolean;
  safe?: boolean;   // the night's first chance (the week, #56): a catch on it is let go
  bed?: boolean; looked?: number; gw?: number; esc?: boolean;   // the tease (#85): come to bed (#89), seconds you looked, Goodwill it paid, escalated
  ask?: 'towel' | 'wine';   // she came to get it herself (#93, #88)
  feet?: string;            // what's on her feet on this walk (#90): her footsteps
  lapSit?: boolean;         // this chat visit is a lap sit (#86): Saturday on, Goodwill 70+
  kind: VisitKind;
  chat?: ChatState | null;        // Chat: the questions she asks while you sit on Excel
}

export type Room = 'living' | 'kitchen' | 'bathroom' | 'bedroom' | 'hallway';
export type ActivityId = 'tv' | 'tea' | 'toilet' | 'shower' | 'bath' | 'phone' | 'sleep' | 'yoga' | 'mask';   // bath: the weekend's shower (#88); yoga (Tuesday on) and the sheet mask before bed (Friday on): her timers for lean in (#77)
export interface Apartment {
  room: Room; activity: ActivityId; t: number; moving: number; soundT: number;
  heard: Room | null; heardWhat: string; heardAt: number;
  showerUsed: boolean; lastVisitEnd: number; forceDoor: boolean;
  asleep: boolean; wake: number; textSent: boolean; cued: boolean;   // cued: the end-of-activity sound has played
  calm: number; forceKind: VisitKind | null;   // pre-emptive: seconds with no visit roll; the next visit's type
  calmHard?: boolean;   // the Raid pass: she knows you are raiding, Noise does not end this calm
  ajar?: boolean; wineAt?: number; towelAsk?: boolean; dur?: number; maskUsed?: boolean;   // dur: how long this activity was set to run (her timers' stages, #77)   // the bath (#88): the door ajar for her music; when (her a.t) she asks for her wine; she asks for a towel at the end (#93)
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
  kind: 'phone'; app: InterruptKind; speaker?: boolean; log?: ['l' | 'r', string][];   // log: the boys' exchange for their chat   // speaker: answered on speaker, hands free, Noise while it lasts (#54, 3.2)
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

// Q4, Excel: the clicker that pays zl (#55, systems/q4.ts).
/** Q4 for the whole save (#55): lifetime zl earned in Q4 (the titles come from it) and each macro's level. */
export interface Q4Save { life: number; rank: number; macros: Record<string, number> }
/** Q4 tonight: what it paid, Sort, Hustle, the toys' state (their animations), looking busy, the promotion to show. */
export interface Q4Night {
  tonight: number;                 // zl Q4 paid tonight (the morning shows it)
  sortT: number; sortCd: number;   // Sort's x2 left, its cooldown
  flapT: number;                   // the split-flap reshuffle, counting down
  charge: number; hustle: number;  // Hustle: charged in the RPG (0..1), in Excel what is left of it (0..1, x1 to x3)
  lastAct: number;                 // the night's clock (threat) of the last toy action: looking busy
  asked: boolean;                  // she is in and you sat idle: "What are you working on?"
  roll: number; stamp: number; sums: number;   // AutoSum: the roll and the BALANCED stamp counting down; how many so far (the column's numbers)
  fill: { n: number; done: number; t: number; hold: number } | null;   // a flick: cells to fill, filled, the cascade's clock, the hold after it
  pivot: { ang: number; om: number; acc: number; grab: boolean };      // the spinner: angle, its spin (rad/s), the angle toward the next paid turn, held
  auto: { sum: number; fill: number; turn: number };                  // the macros' fractions toward the next press, cell, turn
  pops: { s: string; toy: string; i: number; t: number }[];           // the zl that just paid, rising over the toy that paid it
  promo: { title: number; t: number } | null;                          // a promotion to show (its dialog), and since when
  last: 'sum' | 'fill' | 'sort' | 'pivot';                             // the toy used last (the formula bar)
}

/** A pre-emptive action in progress. stage: doing it; ask = her "stay for one episode?"; episode = staying.
 *  away: you are not at the desk. withHer: her apartment routine pauses (she is with you). */
/** Lean in (V12, #77): u the lean (0 the kitchen .. 1 past the mirror), slit px (24..160), the right button's closer
 *  framing, her look cycle (busy, her tell, she sees you), the red bar 0..1, the creak's last notch, how long it's on. */
export interface LeanState { u: number; u0: number; slit: number; focus: boolean; look: 'busy' | 'tell' | 'sees'; lookT: number; bar: number; notchAt: number; t: number; safe: number }
export interface PreState { id: string; stage: 'doing'; t: number; max: number; away: boolean; withHer: boolean; mult: number; outcome: string }
export type DungeonPhase = 'walk' | 'battle' | 'loot' | 'mapChoice' | 'curio';
/** A curio the party stopped at (systems/curios.ts). stage: ask = waiting for your choice; pick, sneak = in progress. */
export interface CurioState { id: string; stage: 'ask' | 'pick' | 'sneak'; t: number; max: number }
/** The curio standing in the corridor (#99): coming up (the party stops at it), or passed and going by behind them. x: grid px. */
export interface CurioAt { id: string; x: number; passed: boolean; done?: string; out?: string }   // done: the choice taken; out: how it went (the coffin: gold, rare, curse; the cart: caught, glass), for its look after (#131)
/** The next pack in the corridor (#118): it stands still; the walk brings it in. at: grid px the party still has to
 *  walk before it is in position (every enemy is drawn that far right of its slot); front: the x of its front slot;
 *  spot: seconds since it saw the party (the "!"), -1 until its front enemy is in view. */
export interface PackAhead { at: number; front: number; spot: number }
/** A timed party buff or debuff (curios, the friends' raid buff). floor: lasts until the next floor instead of t. */
/** A line in a phone chat: hers or theirs (l), yours (r), a grey note (sys); when it was sent. */
export interface ChatLine { s: 'l' | 'r' | 'sys' | 'photo'; text: string; night: number; clock: number; day?: number; at?: number; seen?: boolean }   // photo (#92): text = the photo's key; at: when she sent it (n.threat); seen: you opened it   // night: the sitting (nightsPlayed); day: the week's day (#56)
export interface PartyBuff { name: string; dmg: number; speed: number; t: number; max: number; icon: string; floor?: boolean; crit?: number; fights?: number; cd?: number; night?: boolean; untilBoss?: boolean }   // fights: lasts this many battles instead of t; night: until dawn; untilBoss: until a boss fight ends; cd: cooldowns down

export interface Night {
  clock: number; threat: number;
  location: 'town' | 'dungeon';
  phase: DungeonPhase; phaseT: number;
  floor: number; battleIdx: number; floorMap: MapKind | 'plain'; checkpoint: number; deepest: number; deepTarget: number;   // deepTarget: tonight's floor for the Deep star (#54)
  enemies: Enemy[];
  mood: number; noise: number; catches: number; flow: number;
  phoneScript: { kind: InterruptKind; at: number; done: boolean }[];   // tonight's phone events, by clock minute (#54, 3.2)
  friendsLeft: number; friendsFloor: number;   // the boys' calls still to come tonight, the floor they last called on
  lastDemand: number;                          // threat time real life last asked for you (phone, dog, her): the gap starts here
  monitor: 'rpg' | 'excel';
  action: 'none' | 'miniGame' | 'pre';   // pre: busy with a pre-emptive action (systems/preemptive.ts)
  dropQueue: BagEntry[];
  floorLoot: { entry: BagEntry; x: number; t: number }[];   // drops lying on the dungeon floor (screen x)
  corpses?: Corpse[];                                        // the fallen (#154): crumbling, then a pile of iron bones that fades
  fresh: { id: string; t: number }[];                       // bag slots that just received loot (blink)
  reject: { id: string; t: number; glow?: number } | null;  // a bag item that wouldn't go on (#113): it shakes in its square for t s; its class's portrait glows for glow s (#121)
  lootFly: { x: number; text: string; color: string; t: number; max: number; delay: number; dx: number }[];   // picked-up loot: names flying up from the floor (#49)
  dropPopup: { entry: BagEntry; t: number } | null;
  reserve: { defId: string; elite: boolean }[];   // the pack waiting off screen (#52, 1.3)
  run: RunState | null;                           // the run since the town portal (#52, 1.4)
  paths: PathCard[] | null; safest: number; mapAway: number;   // the route choice at a floor's end (#52, 1.5)
  feature: FeatureId | null; cond: ConditionId | null; featureMet?: boolean;   // this floor's feature and condition; the feature's curio has stood
  runCard: (RunState & { banked: boolean; t: number }) | null;   // the run end card
  firstSafe?: string;   // the week (#56): tonight's first visit of this type is early and safe
  looking: boolean;     // the pointer is over the webcam view (the UI sets it): during a tease, you look at her (#85)
  tease: { left: number; next: number; bedAt: number; bedDone: boolean };   // tonight's tease visits left, when the next is due (play s); when she gets up to say come to bed (#89)
  runWarned?: { dawn?: boolean; plug?: boolean; bed?: boolean };                // the warnings before a forced end loses the run
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
  phoneDown: number; flipFx: number;       // phone face-down timer, flip animation
  momCallback: number;                     // threat time Mom calls again (0 = none)
  switching: { to: 'rpg' | 'excel'; t: number; max: number } | null;   // alt-tab blackout in progress
  dog: DogState;
  unplugged: { kinds: number[]; colors: number[]; sockets: number[]; plugged: boolean[]; t0?: number; flow?: number } | null;   // cable minigame: per cable plug type + colour; sockets[slot] = cable index
  lap: LapState | null;
  cansHidden: boolean;
  interrupts: Interrupt[];
  game: MiniGame | null;
  q4: Q4Night;
  shopTonight: string[]; dogChew?: boolean;   // the Shop's one-use things bought tonight; a chew waiting for the dog's next visit (#55)
  pre: PreState | null; preUses: Record<string, number>; preMenu: 'door' | 'phone' | null;
  herAsk: { kind: 'towel' | 'wine'; t: number; max: number } | null;   // "Babe, towel!" (#93), "Babe, bring my wine?" (#88): her window, waiting for you
  herThanks: { kind: 'towel' | 'wine'; t: number } | null;
  lapMouse: number; lapSay: { text: string; t: number } | null;
  wear: { top: string | null; feet: string | null }; giftFirst?: string[];
  photo: { key: string; first: boolean; clock: number; t: number } | null;
  lean: LeanState | null; leanHold: number; leanFog: number; leanSpotted: { t: number; good: boolean } | null;   // lean in (#77): his view through the crack; holding the door; the mirror's fog; "Enjoying the view?"   // her photo open beside the phone (#92): hands busy   // her gifts tonight (#91), one per slot; worn for the first time   // the lap sit (#86): seconds she has your mouse; her line by her head          // you brought it: her line for a moment   // pre-emptive actions (#19)
  phApp?: 'home' | 'messages' | 'babe' | 'boys' | 'shop' | 'homeapp'; shopTab?: 'you' | 'her' | 'home'; phUp?: number;   // the idle phone in your hand: which app; her chat scrolled back; when it came up (performance ms)
  seal: boolean;   // the door seal is on (the Home app, #57; it was the towel)
  home: import('../systems/home').HomeNight;   // the battery and the devices tonight (#57)
  herReply: { msg: string; t: number; wait: number } | null;
  curio: CurioState | null; curioPlan: number[]; curioFight: boolean; partyBuffs: PartyBuff[];   // curios (#30)
  curioAt?: CurioAt | null;      // the curio in the corridor, before and after the stop (#99)
  pack?: PackAhead | null;       // the next pack, standing in the corridor ahead until the party walks up to it (#118)
  sulk: number; bankNotice: number; bankItem: string;
  goodBoy: number; excused: boolean; goodDog: number; forgiven: boolean; witchingSaid: boolean; walkby: boolean;   // forgiven: tonight's Forgiveness is used   // goodDog: Good Boy (petted on his favourite spot), goblins x2   // goodBoy: seconds the petted dog still counts; excused: tonight's excuse is used
  smoke: number; heist: number;   // seconds left of the rogue's Smoke Bomb and Heist (#52, 1.7)
  sanctuary?: number;             // seconds left of Sanctuary's armor (a tree rule, #53)
  taunt: number; ward: number; lastStand: number; guilt: number; monitorOff: number; yawn: number; nextYawn: number;
  grin: number;   // seconds left of his grin after a big drop (the webcam view, #37)
  say?: { text: string; t: number; max: number }[];   // what she says, waiting for the door's speech bubble (#139): the head shows, t counts down
  goldStart: number;   // gold when the night began: the F1 line shows tonight's income (#2)
  coach: { id: 'steps' | 'door' | 'phone' | 'loot' | 'windup' | 'headset' | 'lean' | 'leanview' | 'tell'; t: number; mark: number } | null;   // a coach mark is up (#42)
  moodDrift: number;
  selected: string | null; heroTab: number;
  townTab?: 'town' | 'inventory' | 'tree'; treeHero?: HeroId; treeSel?: string;   // the town side panel's tab; the skill tree shown (#53)
  svc?: ServiceSpot | null; svcPick?: string[]; plotHot?: string | null;           // a service open in the Town tab, the items picked; the plot clicked on the map
  appraised?: { id: string; t: number } | null;                                     // the Appraiser's reveal in the panel
  everCaught: boolean; unidentifiedFound: number;
  goblin: { t: number } | null;
  fx: FloatFx[]; vfx: Vfx[]; beams: { x: number; color: string; t: number }[];
  toasts: Toast[];
  walkScroll: number;
  market: number;
  reveal: { name: string; t: number } | null;
}

/** A run (#52, 1.4): from the town portal until the town portal (banked) or a wipe (lost). */
export interface RunState { startFloor: number; deepest: number; gold: number; items: number; souls: number; blessings: string[]; oath: boolean }   // blessings: run blessings (data/blessings.ts), stacking; oath: the Pilgrim's, no portal till the boss

export interface Results {
  ending: 'sleep' | 'dawn' | 'unplugged';
  coming?: boolean;                // Coming, babe (#89): the night ended in bed with her
  bedtime?: boolean;               // the night ended at its set time (Monday, 01:00), as a Sleep
  day: number;                     // the day just played (#56); unplugged: it is played again
  endClock: number; stars: number; depth: number; prevRecord: number;
  debtBefore: number; debtAfter: number; mood: number; caught: boolean;
  q4?: number;                     // zl Q4 paid that night (#55)
  unidentified: number; nearMisses: string[];
  goals: { deep: boolean; unseen: boolean; sweet: boolean; target: number };   // the three stars (#54, 3.1)
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
  q4: Q4Save;           // Q4: lifetime zl and the macros (#55)
  owned: string[];      // the Shop's lasting things you bought (#55, 4.6)
  giftNew?: string[]; giftWorn?: string[];   // her gifts (#91): bought and not worn yet (she wears the newest next); worn at least once (the Goodwill)
  bestStars: number; record: number; nightsPlayed: number;
  day: number;          // the week (#56): the night being played, 0 = the first Monday; an unplugged night is played again
  mapPath: (string | null)[];    // the dungeon map (#48): what each floor was the last time you entered it, by floor number
  tipsSeen: string[];   // first-time tips already shown (#28)
  howto: boolean;       // the night waits before it starts: the boys' message, then How to hide, then tonight's stars (#28, #56, #101)
  howtoPage?: number;   // which card of tonight's deck (#101, #124; not saved)
  howtoAll?: boolean;   // the pause menu's How to play: all four cards (#124; not saved)
  voice?: { date: string; chat: [string, string][]; launch?: 'full' | 'login' } | null;   // the boys' chat at 20:00 while it is up (#102, #108; not saved); launch: Age of Judgment launching on the PC with it, the whole launch on the first Monday, from the login every night after (#127)
  seen: string[];                // enemy ids met before: the first meeting shows what they want
  curiosSeen: string[];          // the last few curios, so they don't repeat back to back
  goodwill: number;              // her Goodwill bank, 0-100 (systems/goodwill.ts); half carries over
  floorCans: CanPose[];          // missed throws: they stay on the floor for good (#61)
  pendingListings: { name: string; zl: number }[];
  pity: number; uid: number;
  checkpoints: number[];         // floors a run can start at: 1 and each 5n+1 whose boss you beat (#52, 1.4)
  startFloor: number;            // the floor the town's picker is on
  drops: number; legendaryFound: boolean;
  orderSet?: boolean;   // the marching order has been set once (#52, 1.6): from then on it is the player's
  trees?: Partial<Record<HeroId, string[]>>;   // skill tree nodes bought, per hero (#53)
  autocast?: Record<string, boolean>;          // autocast switches, 'hero:slot' (#53)   // the first legendary of a save comes within LEGENDARY_FIRST_BY drops
  night: Night | null;
  screen: Screen; paused: boolean; debug: boolean; timeScale: number;
  realLifeOff: boolean;   // debug (#52, 1.1): nobody is home; the RPG runs alone (not saved)
  results: Results | null;
  morning: { paid: number; listings: number; chest: Item | null; chestWaits: boolean; trust: boolean; breakfast: boolean } | null;   // a reward per star (#54)
  carry?: { goodwill: number; drops: BagEntry[] };
  herThread?: ChatLine[]; boysThread?: ChatLine[]; herSeen?: number;   // the phone's chats (V8, #73): hers kept for good, The Boys' last exchange   // the morning's rewards for the next night: Trust's Goodwill, a chest that found the bag full
}

export function newHero(id: HeroId, name: string, role: string, hp: number): Hero {
  return { id, name, role, level: 1, xp: 0, hp, downed: false, atb: Math.random() * 50, gear: {}, cd: [0, 0, 0, 0], ult: 0, queued: null };
}

export function initialState(): GameState {
  return {
    heroes: [newHero('knight', HERO_NAME.knight, HERO_CLASS.knight, 130), newHero('rogue', HERO_NAME.rogue, HERO_CLASS.rogue, 85), newHero('mage', HERO_NAME.mage, HERO_CLASS.mage, 75), newHero('healer', HERO_NAME.healer, HERO_CLASS.healer, 90)],   // the marching order (#52, 1.6); the rogue from night 1 (#96)
    orderSet: true,
    bag: [], bagSize: T.BAG_SIZE, autoSalvage: false,
    gold: T.START_GOLD, mats: 0, zl: T.START_ZL,
    furniture: { training: 0, inn: 0, library: 0, treasury: 0 },
    sleepDebt: 0, monsters: 0, q4: { life: 0, rank: 0, macros: {} }, owned: [], bestStars: 0, record: 0, nightsPlayed: 0, day: 0, mapPath: [], tipsSeen: [], howto: false, seen: [], curiosSeen: [], goodwill: 0, floorCans: [],
    pendingListings: [], pity: 0, uid: 1, checkpoints: [1], startFloor: 1, drops: 0, legendaryFound: false,
    night: null, screen: 'title', paused: false, debug: false, timeScale: 1, realLifeOff: false,
    results: null, morning: null,
  };
}

// The one game state object (docs/design/tech.md).
export const S: { g: GameState } = { g: initialState() };
export const N = (): Night => S.g.night as Night;
export const uid = () => 'e' + (S.g.uid++);

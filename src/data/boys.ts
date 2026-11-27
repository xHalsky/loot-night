// The boys' chat between the calls (#109): Billy (loud, panicky), Mike (the calm organizer) and Lance (dry, a few words)
// post in The Boys' chat as the night goes. Grey, quiet (no banner, no sound), kept until the next call or the next
// 20:00 chat replaces the thread. Lowercase, short, one idea a line, the speaker first. An entry is one message or an
// exchange (several in a row). systems/boys.ts posts them; tuning BOYS_* paces them.
export type BoysTrigger =
  | 'invite' | 'wipe' | 'wipeTrash' | 'oneShot' | 'mageBoss' | 'late' | 'badDrop' | 'bossStart' | 'tired' | 'build'
  | 'cheap' | 'bossKill' | 'cleanTab' | 'raidLate' | 'upgrade' | 'legendary' | 'raidUnlock' | 'herVisit' | 'partyLow'
  | 'cleanRun' | 'combo' | 'dmgBuff' | 'slow' | 'backstab' | 'trashStart' | 'random';
type Say = [string, string];

const WIPE: Say[][] = [[['Billy', 'game over man']], [['Lance', 'death penalty. of course.']], [['Lance', 'i lost xp on death. again.']], [['Lance', 'gg.']]];

export const BOYS_LINES: Record<BoysTrigger, Say[][]> = {
  // the night's first trip down: the raid invite, or one of its exchanges
  invite: [
    [['Billy', 'judgment day at 11? come with me if you want to loot'], ['Mike', 'aoj raid at 11. stay frosty'], ['Lance', '11 works. i prefer the term "support main"']],
    [['Mike', 'raid at 11.'], ['Billy', "i'm already in the lobby"], ['Lance', "it's 20:15"]],
    [['Billy', 'one more upgrade.'], ['Mike', 'no.'], ['Billy', 'one more.']],
  ],
  wipe: WIPE,
  wipeTrash: [...WIPE, [['Billy', 'died to the starter slime again. in 2026.']]],
  oneShot: [[['Billy', 'great scott, 1.21 gigawatts']]],   // a crit that kills from full HP
  mageBoss: [[['Billy', 'hudzor one-shot the boss. hudzor is a god']]],   // a mage crit lands the boss's killing blow
  late: [[['Billy', "dead or alive you're coming to the raid"]]],   // you didn't come when they called
  badDrop: [[['Mike', 'nuke it from orbit']]],   // the Appraiser reveals an item that is nobody's upgrade
  bossStart: [[['Mike', 'if it bleeds we can kill it']], [['Mike', "don't camp the boss spawn, we rotate"]], [['Mike', 'arkbishop, buffs before the boss']]],
  tired: [[['Mike', "ain't got time to sleep"]]],   // your first yawn of the night
  build: [[['Lance', 'would you like to know more?']]],   // you buy a skill tree node
  cheap: [[['Lance', "i'd buy that for a dollar"]]],   // you list a common or an uncommon at the Auction House
  bossKill: [[['Lance', 'hasta la vista, boss']], [['Lance', 'excellent.']]],
  cleanTab: [[['Lance', "it's all in the reflexes"]]],   // she came in and saw Excel
  raidLate: [[['Lance', "i'm too old for this"]]],   // Raid night? from 23:00
  upgrade: [[['Billy', "safe upgrade is +4. i'm going +5. what could go wrong"]]],   // an upgrade for someone lands in the bag
  legendary: [[['Mike', "0.01% drop and it dropped on the 4th try. i'm buying a lottery ticket"]]],
  raidUnlock: [[['Mike', "siege on saturday. bring pots. don't be late"]]],   // Raid night? is open (Goodwill)
  herVisit: [[['Billy', 'afk 5 min. real life aggro.']]],   // she's on her way to your door
  partyLow: [[['Lance', 'buffs are not infinite']], [['Mike', 'you must construct additional healers']]],
  cleanRun: [[['Lance', 'support main. nobody thanks the support main']]],   // a run banked with nobody down
  combo: [[['Lance', 'impressive.']]],   // a mark cashed in (Stagger, Chill, Judged...)
  dmgBuff: [[['Billy', 'quad damage is up, nobody touch it']]],   // the Raid buff, or the Shrine's blessing
  slow: [[['Lance', 'ping 300. i am in another dimension.']]],   // the Goblin Fuel's sugar crash
  backstab: [[['Mike', 'hixx is behind you. hixx is always behind you']]],
  trashStart: [[['Billy', "it's a cute pink slime. kill it anyway"]]],
  // no trigger of its own: now and then in the dungeon
  random: [
    [['Billy', "it broke. it broke on +5. i'm fine. i'm going outside"], ['Mike', 'i said stop at +4. STOP AT +4']],
    [['Mike', '6 hours of grinding for 1% xp. we are so back']],
  ],
};
/** Once a night at most (the rest have their own spacing, BOYS_SAME_GAP_SEC). */
export const BOYS_ONCE: BoysTrigger[] = ['invite', 'tired', 'raidUnlock', 'raidLate'];

// First-time tips (docs/design/night.md, Onboarding; #28). Each one shows once per save, the first time its thing
// happens, as a line in the feed from her or from the guild chat (the mage and the priest, Billy's and Lance's characters; the tag is the
// hero's name from HERO_NAME, a tag has no room for the class). Short, in their
// voice, no walls of text. Plain text only (no em dashes).
export type TipId = 'her_show' | 'plan' | 'pass' | 'caught' | 'endcue' | 'dog' | 'yawn'
  | 'headset' | 'bed' | 'peek' | 'map' | 'shower' | 'q4' | 'mirror';   // the core loop's firsts are coach marks instead (COACH below)
export const TIPS: Record<TipId, { who: 'her' | 'mage' | 'healer'; text: string }> = {
  her_show: { who: 'her', text: "I'm watching my show, babe. Don't play all night, okay?" },
  plan: { who: 'mage', text: 'forgot the layout of your flat? the plan is taped to your wall, left of the door. click it' },
  pass: { who: 'mage', text: 'lol she bought the spreadsheet. back to the loot' },
  caught: { who: 'mage', text: 'F. excel has to be up BEFORE she opens the door. listen for the steps' },
  endcue: { who: 'healer', text: "her thing just ended, she's getting up. what she was doing = what she'll want" },
  dog: { who: 'mage', text: 'the dog wants pets. ignore him and he goes for your cables' },
  yawn: { who: 'healer', text: "you're yawning. grab a Goblin Fuel (G)" },
  headset: { who: 'mage', text: "headset on: after 30 s you're in the Zone. but you won't hear her coming" },
  bed: { who: 'healer', text: "she's asleep. crits, bosses and vaults are LOUD now. keep the Noise down" },
  peek: { who: 'mage', text: 'the wider you open the door, the more you see. and the more she sees you' },
  mirror: { who: 'mage', text: 'the mirror shows round the corner. works both ways tho' },
  map: { who: 'mage', text: 'pick the next floor. hover a node to see what is there' },
  shower: { who: 'healer', text: 'shower = 90 s of freedom. go loud' },
  q4: { who: 'healer', text: 'excel pays best right after you tab in. space = autosum' },   // one idea: the Hustle (the job card has the rest, #124)
};
/** On the first night her note names the cue that ends each activity (the tell that she is about to move). */
export const END_HINT: Record<string, string> = {
  tv: 'Credits music. Her show is over: she is getting up.',
  tea: 'The kettle clicked off. Tea, then maybe a snack run.',
  toilet: 'The tap is running. She is almost out.',
  shower: 'Hair dryer. The shower is over.',
  bath: 'The drain gurgles. Her bath is over.',
  yoga: 'The video ends. Her yoga is over.',
  mask: 'The tap. She rinsed her face: bed next.',
  phone: '"Ok, bye, love you." She is off the phone.',
};

/** Coach marks (#42): the core loop's first moments get a callout next to the thing itself while the game crawls
 *  (`COACH_SLOW`) until the player acts. Once per save. The renderer draws them (V11: small.js coachTarget, the redesign's
 *  sides); `anchor` and `side` were the DOM version's and stay for reference. */
export type CoachId = 'steps' | 'door' | 'phone' | 'loot' | 'windup' | 'headset' | 'lean' | 'leanview' | 'tell';   // lean in's three (#77, week one 2b)
export const COACH: Record<CoachId, { title: string; text: string; anchor: string; side: 'over' | 'right' | 'left' | 'above' }> = {
  steps: { title: 'Footsteps!', text: 'She is coming. Press Tab now: Excel has to be up before she opens the door.', anchor: '#monitor', side: 'over' },
  door: { title: 'She is at your door', text: 'What she wants is in her note, under your door. Answer her there.', anchor: '#herNote', side: 'right' },
  phone: { title: 'Your phone', text: 'Someone wants you. Click the phone to answer.', anchor: '#deskPhone', side: 'above' },
  loot: { title: 'Loot!', text: 'A green arrow means an upgrade. Right-click it to equip it, or drag it onto a hero.', anchor: '#spBag', side: 'left' },
  headset: { title: 'Your headset', text: 'Click your head (or press H) to put it on. In the Zone you loot more, but you cannot hear her.', anchor: '#headHit', side: 'right' },
  windup: { title: 'Big attack incoming', text: 'The boss winds up. Hit a skill now: Bash, Ward or Taunt.', anchor: '#rpgBar', side: 'above' },
  lean: { title: 'Lean in', text: 'She is doing yoga. Hold the door open and you lean in to watch. How far along she is tells you how long you have.', anchor: '#door', side: 'right' },
  leanview: { title: 'You are leaning in', text: 'Move the mouse to look: 1 2 3 are the rooms. The wheel opens the door wider, the right button looks closer. Let go of the door to get back to the game.', anchor: '#monitor', side: 'right' },
  tell: { title: 'She is turning', text: 'Her head turns toward your door. Let go now, or she sees you. The wider the door, the faster the red bar fills.', anchor: '#monitor', side: 'right' },
};

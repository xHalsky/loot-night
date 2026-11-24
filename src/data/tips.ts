// First-time tips (docs/design/night.md, Onboarding; #28). Each one shows once per save, the first time its thing
// happens, as a line in the feed from her or from the guild chat (Magoo and Healero are your party: your friends Danny and Mike). Short, in their
// voice, no walls of text. Plain text only (no em dashes).
export type TipId = 'her_show' | 'plan' | 'pass' | 'caught' | 'endcue' | 'dog' | 'yawn'
  | 'headset' | 'bed' | 'peek' | 'map' | 'shower';   // the core loop's firsts are coach marks instead (COACH below)
export const TIPS: Record<TipId, { who: 'her' | 'Magoo' | 'Healero'; text: string }> = {
  her_show: { who: 'her', text: "I'm watching my show, babe. Don't play all night, okay?" },
  plan: { who: 'Magoo', text: 'forgot the layout of your flat? the plan is taped to your wall, left of the door. click it' },
  pass: { who: 'Magoo', text: 'lol she bought the spreadsheet. back to the loot' },
  caught: { who: 'Magoo', text: 'F. excel has to be up BEFORE she opens the door. listen for the steps' },
  endcue: { who: 'Healero', text: "her thing just ended, she's getting up. what she was doing = what she'll want" },
  dog: { who: 'Magoo', text: 'the dog wants pets. ignore him and he goes for your cables' },
  yawn: { who: 'Healero', text: "you're yawning. grab a Goblin Fuel (G)" },
  headset: { who: 'Magoo', text: "headset on: after 30 s you're in the Zone. but you won't hear her coming" },
  bed: { who: 'Healero', text: "she's asleep. crits, bosses and vaults are LOUD now. keep the Noise down" },
  peek: { who: 'Magoo', text: 'the wider you open the door, the more you see. and the more she sees you' },
  map: { who: 'Magoo', text: 'pick the next floor. hover a node to see what is there' },
  shower: { who: 'Healero', text: 'shower = 90 s of freedom. go loud' },
};
/** On the first night her note names the cue that ends each activity (the tell that she is about to move). */
export const END_HINT: Record<string, string> = {
  tv: 'Credits music. Her show is over: she is getting up.',
  tea: 'The kettle clicked off. Tea, then maybe a snack run.',
  toilet: 'The tap is running. She is almost out.',
  shower: 'Hair dryer. The shower is over.',
  phone: '"Ok, bye, love you." She is off the phone.',
};

/** Coach marks (#42): the core loop's first moments get a callout next to the thing itself while the game crawls
 *  (`COACH_SLOW`) until the player acts. Once per save. `anchor` is a CSS selector; `side` where the bubble sits. */
export type CoachId = 'steps' | 'door' | 'phone' | 'loot' | 'windup' | 'headset';
export const COACH: Record<CoachId, { title: string; text: string; anchor: string; side: 'over' | 'right' | 'left' | 'above' }> = {
  steps: { title: 'Footsteps!', text: 'She is coming. Press Tab now: Excel has to be up before she opens the door.', anchor: '#monitor', side: 'over' },
  door: { title: 'She is at your door', text: 'What she wants is in her note, under your door. Answer her there.', anchor: '.her-note', side: 'right' },
  phone: { title: 'Your phone', text: 'Someone wants you. Click the phone to answer.', anchor: '#deskPhone', side: 'above' },
  loot: { title: 'Loot!', text: 'A green \u25b2 means it is an upgrade. Right-click it to equip it, or drag it onto a hero.', anchor: '#spBag', side: 'left' },
  headset: { title: 'Your headset', text: 'Click your head (or press H) to put it on. In the Zone you loot more, but you cannot hear her.', anchor: '#headHit', side: 'right' },
  windup: { title: 'Big attack incoming', text: 'The boss winds up. Hit a skill now: Bash, Ward or Taunt.', anchor: '#rpgBar', side: 'above' },
};

// First-time tips (docs/design/night.md, Onboarding; #28). Each one shows once per save, the first time its thing
// happens, as a line in the feed from her or from the guild chat (Rafał and Jacek are your party). Short, in their
// voice, no walls of text. Plain text only (no em dashes).
export type TipId = 'her_show' | 'plan' | 'steps' | 'pass' | 'caught' | 'endcue' | 'call' | 'message' | 'dog' | 'yawn'
  | 'headset' | 'bed' | 'peek' | 'loot' | 'map' | 'shower';
export const TIPS: Record<TipId, { who: 'her' | 'Rafał' | 'Jacek'; text: string }> = {
  her_show: { who: 'her', text: "I'm watching my show, babe. Don't play all night, okay?" },
  plan: { who: 'Rafał', text: 'forgot the layout of your flat? the plan is taped to your wall, left of the door. click it' },
  steps: { who: 'Jacek', text: 'FOOTSTEPS. tab to excel now, the switch takes a second' },
  pass: { who: 'Rafał', text: 'lol she bought the spreadsheet. back to the loot' },
  caught: { who: 'Rafał', text: 'F. excel has to be up BEFORE she opens the door. listen for the steps' },
  endcue: { who: 'Jacek', text: "her thing just ended, she's getting up. what she was doing = what she'll want" },
  call: { who: 'Rafał', text: 'phone call. slide to answer, or hold the red button to decline' },
  message: { who: 'Jacek', text: 'someone texted. tap your phone and reply before the ring runs out, or flip it face down' },
  dog: { who: 'Rafał', text: 'the dog wants pets. ignore him and he goes for your cables' },
  yawn: { who: 'Jacek', text: "you're yawning. there's Monster in the fridge on your desk" },
  headset: { who: 'Rafał', text: "headset on: after 30 s you're in the Zone. but you won't hear her coming" },
  bed: { who: 'Jacek', text: "she's asleep. crits, bosses and vaults are LOUD now. keep the Noise down" },
  peek: { who: 'Rafał', text: 'the wider you open the door, the more you see. and the more she sees you' },
  loot: { who: 'Jacek', text: 'loot! click it in the bag to equip. green numbers = better' },
  map: { who: 'Rafał', text: 'pick the next floor. hover a node to see what is there' },
  shower: { who: 'Jacek', text: 'shower = 90 s of freedom. go loud' },
};
/** On the first night her note names the cue that ends each activity (the tell that she is about to move). */
export const END_HINT: Record<string, string> = {
  tv: 'Credits music. Her show is over: she is getting up.',
  tea: 'The kettle clicked off. Tea, then maybe a snack run.',
  toilet: 'The tap is running. She is almost out.',
  shower: 'Hair dryer. The shower is over.',
  phone: '"Ok, bye, love you." She is off the phone.',
};

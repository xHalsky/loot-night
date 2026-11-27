// Her opening line on a fresh save (#28): once, the first night, said through the door (#139). The guild's first-time
// tips that used to sit pinned in the feed are gone (#141, Paweł: no tutorial in the game chat); the coach marks and
// the How-to cards teach. Plain text only (no em dashes).
export type TipId = 'her_show';
export const TIPS: Record<TipId, { who: 'her'; text: string }> = {
  her_show: { who: 'her', text: "I'm watching my show, babe. Don't play all night, okay?" },
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

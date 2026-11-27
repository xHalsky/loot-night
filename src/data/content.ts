// Furniture, dialogue and other small content tables.


// Mom's lines. The ending tells the reply: '?' -> really?!, '...' -> mhm, '!' -> wow.
export const MOM_LINES: { text: string; need: 0 | 1 | 2 }[] = [
  { text: 'So Basia said the pierogi were too salty...', need: 0 },
  { text: 'Can you imagine?', need: 1 },
  { text: 'Your cousin got a promotion!', need: 2 },
  { text: 'And the neighbour parks on the lawn again...', need: 0 },
  { text: 'Are you eating properly?', need: 1 },
  { text: 'I bought a new air fryer!', need: 2 },
  { text: 'Your father fixed the gutter, finally...', need: 0 },
  { text: 'Did you see my message on Facebook?', need: 1 },
];
// Chat visit: she asks while you keep Excel up. [good, meh, bad] answers, shuffled on screen.
export const CHAT_QS: { q: string; a: [string, string, string] }[] = [
  { q: 'Do you think I should cut my hair short?', a: ['You would look great either way', 'Hm, maybe?', 'Whatever is cheaper'] },
  { q: 'My sister wants us over on Sunday. Okay?', a: ['Sure, I will bring wine', 'If we must', 'Sunday is raid day'] },
  { q: 'What should we eat tomorrow?', a: ['Your pick, I will cook', 'Pizza again?', 'Whatever, I am busy'] },
  { q: 'Did you hear what Kasia did at work?', a: ['No, tell me everything', 'Mhm', 'Who is Kasia?'] },
  { q: 'Do you still love me when I snore?', a: ['Especially then', 'Define snore', 'You snore?'] },
  { q: 'Should we get a plant for the balcony?', a: ['Two plants. Let us go wild', 'Sure', 'They always die'] },
];
// The hallway cue for each visit type (shown as a label on the first night; later nights rely on sound).
export const VISIT_CUE: Record<string, string> = {
  peek: 'Quick light steps. She is checking on you: Excel!',
  snack: 'Plates clinking. A snack for you: take the plate.',   // only the first Monday shows these (no cans yet, #124)
  chat: 'She is humming. She wants to talk: Excel, headset off.',
  cuddle: 'Slow slipper steps. She wants a cuddle.',
  night: 'Soft, sleepy steps. She is going to bed.',
};
export const MOM_REPLIES = ['mhm', 'really?!', 'wow'];

export const PEEK_PASS = ['"Okay. Don\'t stay up too late."', '"Mhm. Spreadsheets. Sure."', '"Wow, so productive."', '"Want tea? No? Okay."'];
export const PEEK_CAUGHT = ['"Is that... a dragon?"', '"Work, huh?"', '"Seriously? Again?"'];
export const FAKEOUT_LINES = ['Steps go past. She went to the kitchen.', 'Bathroom. False alarm.'];


// Calls with a short dialogue (#23): each step shows the caller's line and three replies; one is right.
export interface TalkStep { line: string; right: string; wrong: [string, string] }
// The courier wants to hand the parcel over; you want it left with a neighbour (you can't leave the desk).
export const COURIER_TALKS: TalkStep[][] = [
  [{ line: '"Parcel for you, I\'m downstairs. You coming down?"', right: 'Can you leave it with a neighbour?', wrong: ['Coming down now!', 'Throw it up to the window?'] },
   { line: '"Which neighbour?"', right: 'Mrs. Krysia, flat 12. She is always home.', wrong: ['Whoever opens', 'The guy with the drill'] }],
  [{ line: '"Hi, courier. Intercom is broken. Can you come out?"', right: 'Can a neighbour take it?', wrong: ['Leave it on the street', 'One sec, boss fight'] },
   { line: '"Okay, who?"', right: 'Flat 12, the lady with the cat.', wrong: ['Anyone, really', 'Me, but downstairs'] }],
];
// The boys call on speaker, loud. Decline politely; rude replies make them louder.
// The boys' group call (#109): Billy calls (loud, panicky; one of four openers at random), then Mike or Lance. Each line
// has your polite reply (right), then the shouting one and the rude one (wrong: they get louder; on speaker she hears).
const FRIENDS_OPEN: TalkStep[] = [
  { line: 'Billy: "get your ass to the raid"', right: 'Can\'t talk, she\'s home. Text me?', wrong: ['GET TO THE CHOPPER', 'I\'ll be back. Maybe.'] },
  { line: 'Billy: "we need a fourth for the boss. come on, do you wanna loot forever?"', right: 'I\'m already in your party. Check. Muting!', wrong: ['YES LET\'S GOOO', 'Who is this?'] },
  { line: 'Billy: "i need a healer. now. where are you"', right: 'Shh, she\'s next door. Text only, love you guys.', wrong: ['WHAT? I CAN\'T HEAR YOU', 'Nah'] },
  { line: 'Billy: "if it bleeds we can kill it. it bleeds. come on"', right: 'Text me, she\'s in the next room.', wrong: ['Shut up, she\'ll hear you!', 'Ask my mom'] },
];
const FRIENDS_FOLLOW: TalkStep[] = [
  { line: 'Mike: "is she listening? hi babe"', right: 'Bye lads, see you in guild chat.', wrong: ['Say hi louder', '*hang up*'] },
  { line: 'Lance: "your mic is on. we hear her tv."', right: 'Muting. Guild chat in five.', wrong: ['WHAT TV?', '*hang up*'] },
];
export const FRIENDS_TALKS: TalkStep[][] = FRIENDS_OPEN.flatMap(o => FRIENDS_FOLLOW.map(f => [o, f]));

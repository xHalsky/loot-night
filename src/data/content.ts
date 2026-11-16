// Furniture, dialogue and other small content tables.

export interface FurnitureDef { id: 'dummy' | 'bed'; name: string; stat: 'atk' | 'hp'; pct: number[]; gold: number[]; mats: number[] }
export const FURNITURE: FurnitureDef[] = [
  { id: 'dummy', name: 'Training Dummy', stat: 'atk', pct: [0.10, 0.18, 0.25], gold: [300, 700, 1500], mats: [8, 16, 30] },
  { id: 'bed', name: 'Bed', stat: 'hp', pct: [0.10, 0.18, 0.25], gold: [300, 700, 1500], mats: [8, 16, 30] },
];

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
  snack: 'Plates clinking. Snack run: hide the cans!',
  chat: 'She is humming. She wants to talk: Excel, headset off.',
  cuddle: 'Slow slipper steps. She wants a cuddle.',
};
export const MOM_REPLIES = ['mhm', 'really?!', 'wow'];

export const PEEK_PASS = ['"Okay. Don\'t stay up too late."', '"Mhm. Spreadsheets. Sure."', '"Wow, so productive."', '"Want tea? No? Okay."'];
export const PEEK_CAUGHT = ['"Is that... a dragon?"', '"Work, huh?"', '"Seriously? Again?"'];
export const FAKEOUT_LINES = ['Steps go past. She went to the kitchen.', 'Bathroom. False alarm.'];

export const TRADE_CHAT = [
  ['Kubson', 'WTB girlfriend patience, paying 5k gold'],
  ['xXBartekXx', 'LF healer for Sunday raid, must have Zyn'],
  ['Wiktor', 'selling Rusty Fork, mint condition, no lowballs'],
  ['GoldSeller99', 'cheap gold, totally legit, trust'],
  ['Kubson', 'anyone else\'s mom calling every 5 min?'],
];
export const NPCS = [
  { tag: 'Kubson', x: 150, y: 250, color: '#d9534f' },
  { tag: 'xXBartekXx', x: 330, y: 245, color: '#6fcf7f' },
  { tag: 'Wiktor', x: 470, y: 290, color: '#6aa8ff' },
  { tag: 'GoldSeller99', x: 70, y: 300, color: '#8e8a99' },
];

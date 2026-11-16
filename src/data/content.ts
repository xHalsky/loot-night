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

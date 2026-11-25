// Pre-emptive actions (docs/design/preemptive.md, #19): verbs used BEFORE a visit to shape it.
// Rules live in systems/preemptive.ts, numbers in tuning.ts (PRE_*). Each action costs time away, hands busy at
// the desk, or a guess about where she is; the condition is never shown as met or unmet.
//   where:  'phone' = in the phone (Messages); 'desk' = the phone's home screen, but you leave (Charge).
//   away:   you leave the desk (empty chair, no input, she sees whatever is on screen if she comes).
//   toggle: on/off (no diminishing returns, no suspicion).
// Make her tea and the towel under the door were removed in step 6 (#57): bubble tea and the door seal in the Home app.

export type PreId = 'text' | 'raid' | 'charge';
//   goodwill: paid with Goodwill instead (no diminishing returns, no suspicion: you ask her openly).
export interface PreDef { id: PreId; name: string; where: 'phone' | 'desk'; cost: string; tip: string; works: string; effect: string; backfire: string; away?: boolean; toggle?: boolean; goodwill?: boolean }   // tip: the tooltip, one sentence (#43)

export const PRE_ACTIONS: PreDef[] = [
  { id: 'text', name: 'Text her', where: 'phone', cost: '{text} s on the phone',
    tip: 'Her next visit waits {textCalm} s longer, and her reply tells you where she is.',
    works: 'she is busy with something (TV, kitchen, bedroom, bathroom)',
    effect: 'Her next visit waits {textCalm} s longer (unless you get loud), Mood {textMood}. Her reply tells you where she is.',
    backfire: 'On her way somewhere: she comes to chat right away. In the shower: she comes to chat after.' },
  { id: 'raid', name: 'Raid night?', where: 'phone', cost: '{raidCost} Goodwill · {text} s', goodwill: true,
    tip: 'She agrees: no visits for {raidSec} s, however loud you get.',
    works: 'she is awake (before midnight)',
    effect: 'No visits for {raidSec} s, even if you get loud: you asked her openly, so she does not get suspicious.',
    backfire: 'Without {raidCost} Goodwill she will not say yes.' },
  { id: 'charge', name: 'Charge', where: 'desk', cost: '{charge} s away from the PC', away: true, toggle: true,
    tip: 'Plug the phone in: +{chargeAdd}%. You are away from the PC meanwhile.', works: 'always',
    effect: 'Phone battery +{chargeAdd}%.', backfire: 'If she comes meanwhile, she sees whatever is on your monitor.' },
];
export const PRE_BY_ID = Object.fromEntries(PRE_ACTIONS.map(a => [a.id, a])) as Record<PreId, PreDef>;

/** Her reply to "Text her" (the tell): what she is doing, in her words. */
export const HER_REPLIES: Record<string, string[]> = {
  tv: ['watching bake off, the cake collapsed', 'shh, episode 4', 'tv. the detective is SO dumb'],
  tea: ['making tea, want one?', 'kettle is on', 'kitchen, stealing your crisps'],
  phone: ['in bed scrolling, you?', 'lying down, reading', 'bed. come later?'],
  toilet: ['busy lol', 'bathroom, gimme a sec', 'can\'t talk, bathroom'],
  moving: ['coming to you actually', 'omw to you', 'hold on, coming over'],
  shower: ['in the shower!! talk after'],
};
export const SUSPICIOUS_LINES = ['"Why are you being so nice? What did you do?"', '"Okay, this is suspicious."', '"Three times? What are you hiding in there?"'];

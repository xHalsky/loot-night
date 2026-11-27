// The boys at 20:00 (the week, #56; grid doc 7m): Billy, Mike and Lance (#102; their characters are Hudzor, Hixx and Arkbishop),
// in their chat voice (lowercase, casual). Monday is the first night of Age of Judgment, so the first one is the three
// of them typing at once, stoked (FIRST_CHAT, live bubbles); from Tuesday Billy's voice note names tonight's new thing.
// Week one has one a night; a replay has its own. Tuesday's are lean in's (#77).
export const FIRST_CHAT: [string, string][] = [
  ['Billy', 'AGE OF JUDGMENT TONIGHT. LETS GOOO'],
  ['Mike', 'finally!! hixx sharpened both daggers for this'],
  ['Lance', "arkbishop's been ready since lunch"],
  ['Billy', 'she still thinks youre doing spreadsheets lol'],
  ['Mike', 'steps in the hall = tab to excel. BEFORE the door opens'],
  ['Lance', "q4 pays real money btw. shop's on your phone"],
];
export const VOICE_NOTES: Record<string, string[]> = {
  Tuesday: ["no curfew tonight. play till you drop lol", "hold your door open longer: you lean in and see what she's doing", "she can see you too tho. don't get weird"],
  Wednesday: ['your phones gonna ring tonight. your mom, a courier, your boss', 'pick up quick and they pay. on speaker she can hear it tho', "text her while she's busy and she leaves you alone a bit"],
  Thursday: ["the dog's up tonight. pet him or he goes for your cables", "goblin fuel's in your drawer (G). plates in the hall = hide the cans", 'your phone runs the house now. watch the battery tho'],
  Friday: ['she goes to bed at midnight. keep it down after that', 'if she texts you, answer. or she gets up', "after 1 it's the witching hour. the loot gets better"],
  Saturday: ["weekend. she's off tomorrow and she wants you", "she'll come by way more tonight. stay sharp", 'she goes to bed at 1 tonight'],
  Sunday: ["sunday. she's around all night again", 'even more visits than yesterday', "make it to bed and the week's done. gg"],
};
export const voiceReplay = (day: string) => ['F. she pulled the plug', `${day.toLowerCase()} again then. the good loot's still in your bag`, 'tab out BEFORE she opens the door this time'];

// The boys at 20:00 (the week, #56; grid doc 7m): Billy, Mike and Lance (#102; their characters are Hudzor, Hixx and Arkbishop),
// in their chat voice (lowercase, casual). Always text, never voice messages (#108): their chat on the phone, a bubble
// at a time, each after its name and the typing dots. Monday is the first night of Age of Judgment, so they're stoked
// (FIRST_CHAT); from Tuesday they name tonight's new thing (NIGHT_CHAT); after the plug, the replay's (replayChat).
// Week one has one a night. Tuesday's are lean in's (#77).
export const FIRST_CHAT: [string, string][] = [
  ['Billy', 'AGE OF JUDGMENT TONIGHT. LETS GOOO'],
  ['Mike', 'finally!! hixx sharpened both daggers for this'],
  ['Lance', "arkbishop's been ready since lunch"],
  ['Billy', 'she still thinks youre doing spreadsheets lol'],
  ['Mike', 'steps in the hall = tab to excel. BEFORE the door opens'],
  ['Lance', "q4 pays real money btw. shop's on your phone"],
];
/** Tonight's new thing in their chat, week one from Tuesday: one bubble each, the three of them in turn. */
export const NIGHT_CHAT: Record<string, [string, string][]> = {
  Tuesday: [['Billy', 'no curfew tonight. play till you drop lol'], ['Mike', "hold your door open longer: you lean in and see what she's doing"], ['Lance', "she can see you too tho. don't get weird"]],
  Wednesday: [['Billy', 'your phones gonna ring tonight. your mom, a courier, your boss'], ['Lance', 'pick up quick and they pay. on speaker she can hear it tho'], ['Mike', "text her while she's busy and she leaves you alone a bit"]],
  Thursday: [['Mike', "the dog's up tonight. pet him or he goes for your cables"], ['Billy', "goblin fuel's in your drawer (G). plates in the hall = hide the cans"], ['Lance', 'your phone runs the house now. watch the battery tho']],
  Friday: [['Lance', 'she goes to bed at midnight. keep it down after that'], ['Billy', 'if she texts you, answer. or she gets up'], ['Mike', "after 1 it's the witching hour. the loot gets better"]],
  Saturday: [['Billy', "weekend. she's off tomorrow and she wants you"], ['Mike', "she'll come by way more tonight. stay sharp"], ['Lance', 'she goes to bed at 1 tonight']],
  Sunday: [['Lance', "sunday. she's around all night again"], ['Billy', 'even more visits than yesterday'], ['Mike', "make it to bed and the week's done. gg"]],
};
/** After the plug: the night again, and the boys react. */
export const replayChat = (day: string): [string, string][] => [['Mike', 'F. she pulled the plug'], ['Billy', `${day.toLowerCase()} again then. the good loot's still in your bag`], ['Lance', 'tab out BEFORE she opens the door this time']];

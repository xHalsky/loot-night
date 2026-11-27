// The boys at 20:00 (the week, #56; grid doc 7m): Billy, Mike and Lance (#102; their characters are Hudzor, Hixx and Arkbishop),
// in their chat voice (lowercase, short, one idea a line). Always text, never voice messages (#108): their chat on the
// phone, a bubble at a time, each after its name and the typing dots. Billy is loud and panicky (he calls), Mike the
// calm organizer (he posts the raid time), Lance dry and deadpan, a few words a line (#109; data/boys.ts has the rest of
// their lines). Monday the realm of Age of Judgment ("aoj") is up (FIRST_CHAT); from Tuesday they name tonight's new
// thing (NIGHT_CHAT); after the plug, the replay's (replayChat).
// Week one has one a night. Tuesday's are lean in's (#77).
export const FIRST_CHAT: [string, string][] = [
  ['Billy', "yo. realm's up"],
  ['Billy', 'patch notes are forty pages, i read zero'],
  ['Lance', 'would you like to know more?'],
  ['Billy', '11 sharp. and careful with her tonight, they mostly come at night'],
  ['Mike', 'steps in the hall = tab to excel. BEFORE the door opens'],
];
/** Tonight's new thing in their chat, week one from Tuesday: one bubble each, the three of them in turn. */
export const NIGHT_CHAT: Record<string, [string, string][]> = {
  Tuesday: [['Billy', 'no curfew tonight. play till you drop lol'], ['Mike', "hold your door open longer: you lean in and see what she's doing"], ['Lance', "she can see you too. don't get weird"]],
  Wednesday: [['Billy', 'your phones gonna ring tonight. your mom, a courier, your boss'], ['Lance', 'pick up quick, they pay. on speaker she hears it'], ['Mike', "text her while she's busy and she leaves you alone a bit"]],
  Thursday: [['Mike', "the dog's up tonight. pet him or he goes for your cables"], ['Billy', "goblin fuel's in your drawer (G). plates in the hall = hide the cans"], ['Lance', 'phone runs the house now. mind the battery']],
  Friday: [['Lance', 'she sleeps at midnight. keep it down'], ['Billy', 'if she texts you, answer. or she gets up'], ['Mike', "after 1 it's the witching hour. the loot gets better"]],
  Saturday: [['Billy', "weekend. she's off tomorrow and she wants you"], ['Mike', "she'll come by way more tonight. stay sharp"], ['Lance', 'bed at 1 tonight']],
  Sunday: [['Lance', "sunday. she's around all night"], ['Billy', 'even MORE visits than yesterday'], ['Mike', "make it to bed and the week's done. gg"]],
};
/** After the plug: the night again, and the boys react. */
export const replayChat = (day: string): [string, string][] => [['Billy', 'game over man. GAME OVER.'], ['Billy', `${day.toLowerCase()} again then.`], ['Lance', 'all that loot, gone like tears in rain'], ['Mike', 'tab out BEFORE she opens the door this time']];

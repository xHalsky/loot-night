// The boys at 20:00 (the week, #56; grid doc 7m): Billy, Mike and Lance (#102; their characters are Hudzor, Hixx and Arkbishop),
// in their chat voice (lowercase, short, one idea a line). Always text, never voice messages (#108): their chat on the
// phone, a bubble at a time, each after its name and the typing dots. Billy is loud and panicky (he calls), Mike the
// calm organizer (he posts the raid time), Lance dry and deadpan, a few words a line (#109; data/boys.ts has the rest of
// their lines). Monday the realm of Age of Judgment ("aoj") is up (FIRST_CHAT); from Tuesday their banter about the
// night (NIGHT_CHAT); after the plug, the replay's (replayChat). They talk about her and the raid, never teach the
// player how to play (#141, Paweł): the How-to cards and the coach marks do. Week one has one a night.
export const FIRST_CHAT: [string, string][] = [   // paced to the launch (CHAT_LAUNCH_AT); four of them set the mood while it boots (#133);
  ['Billy', "yo. realm's up"],                       // Mike's Tab tip went with #135 (the How-to cards teach it)
  ['Mike', "launching. still can't skip the intro"],
  ['Lance', "good. it's the best part"],
  ['Billy', 'patch notes are forty pages, i read zero'],
  ['Billy', 'this intro looks like an old crack intro lol'],
  ['Lance', 'i read all forty. healers got nerfed. obviously.'],   // to Billy's patch notes; the support main (#156)
  ['Lance', 'in. arkbishop ready to be ignored again'],   // his own login, not your screen (#141)
  ['Billy', '11 sharp. and careful with her tonight, they mostly come at night'],
];
/** Their chat at 20:00, week one from Tuesday: one bubble each, the three of them in turn. Banter about her and the
 *  raid, never how to play (#141, Paweł): the How-to cards teach tonight's new things. */
export const NIGHT_CHAT: Record<string, [string, string][]> = {
  Tuesday: [['Billy', 'no curfew tonight. play till you drop lol'], ['Mike', 'is she still doing the yoga thing in the living room?'], ['Lance', 'yoga. on a raid night. bold.']],
  Wednesday: [['Billy', 'my mom called me four times today. FOUR.'], ['Lance', "we'll call you mid-raid. as is tradition"], ['Mike', 'tell her i said hi. she still mad about last week?']],
  Thursday: [['Mike', 'your dog barked at me through the mic last time. i felt judged'], ['Billy', "goblin fuel restock day. i'm on can three already"], ['Lance', "my phone's at 4%. if i die, it was the phone"]],
  Friday: [['Lance', 'friday. everyone in my flat is asleep but me'], ['Billy', "if she texts 'come to bed' it's a trap. or is it"], ['Mike', "witching hour at 1. i've seen drops you wouldn't believe"]],
  Saturday: [['Billy', "weekend. she's off tomorrow and she wants you"], ['Mike', "siege night. does she know it's siege night?"], ['Lance', "she's bored. you're the entertainment."]],
  Sunday: [['Lance', "sunday. she's around all night"], ['Billy', 'last night of the week. no regrets'], ['Mike', 'monday the patch drops. tonight we farm']],
};
/** After the plug: the night again, and the boys react. */
export const replayChat = (day: string): [string, string][] => [['Billy', 'game over man. GAME OVER.'], ['Billy', `${day.toLowerCase()} again then.`], ['Lance', 'all that loot, gone like tears in rain'], ['Mike', 'she pulled the plug? mid-raid??']];

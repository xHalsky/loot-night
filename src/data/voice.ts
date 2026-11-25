// Danny's 20:00 voice note (the week, #56; grid doc 7m): a voice message in The Boys' chat that names tonight's new
// thing, in his chat voice (lowercase, casual). Magoo is Danny's character. Week one has one a night; a replay has its
// own. Tuesday names what is built: the page's lean-in lines ("hold your door open longer...") come with lean in (#77).
export const VOICE_NOTES: Record<string, string[]> = {
  Monday: ['yo its raid night. she thinks youre doing spreadsheets lol', 'steps in the hall = tab to excel. BEFORE the door opens', "q4 pays real money btw. the shop's on your phone"],
  Tuesday: ["garrote's in the party tonight", "headset on and you loot more. you just can't hear her coming", 'if she hums on her way over she wants to talk. headset off, answer her'],
  Wednesday: ['your phones gonna ring tonight. your mom, a courier, your boss', 'pick up quick and they pay. on speaker she can hear it tho', "text her while she's busy and she leaves you alone a bit"],
  Thursday: ["the dog's up tonight. pet him or he goes for your cables", "goblin fuel's in your drawer (G). plates in the hall = hide the cans", 'your phone runs the house now. watch the battery tho'],
  Friday: ['she goes to bed at midnight. keep it down after that', 'if she texts you, answer. or she gets up', "after 1 it's the witching hour. the loot gets better"],
  Saturday: ["weekend. she's off tomorrow and she wants you", "she'll come by way more tonight. stay sharp", 'she goes to bed at 1 tonight'],
  Sunday: ["sunday. she's around all night again", 'even more visits than yesterday', "make it to bed and the week's done. gg"],
};
export const voiceReplay = (day: string) => ['F. she pulled the plug', `${day.toLowerCase()} again then. the good loot's still in your bag`, 'tab out BEFORE she opens the door this time'];

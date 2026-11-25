# Pre-emptive actions

Framework #19 (built in 0.27 with three actions; the Raid pass in 0.30), the rest of the list #20. Content `src/data/preemptive.ts`,
rules `src/systems/preemptive.ts`, numbers `PRE_*` in `tuning.ts`, acceptance test `test/preemptive.ts`.

## Why

Without them the player can only react once she is already coming. The blueprint, peeking and listening give
information but no way to act on it early. Pre-emptive actions turn knowing where she is into prevention,
and give the map a job between visits.

## Now

**Framework.** Verbs used **before** a visit to shape it. An action can push her next visit (a *calm*: no
visit roll while it runs), set the next visit's type or change Mood. By the week ([night.md](night.md)): Text her
and Raid night? from Wednesday (Messages), Charge from Thursday (with the battery). Make her tea and the towel under
the door were removed in 0.79 (step 6): the Home app's bubble tea and door seal replace them ([desk.md](desk.md), the
Home app).

- **Costs.** Every action costs at least one of:
  - *Hands busy* at the desk (Text her 3 s). Skills say "Hands busy", alt-tab is blocked, the party is on the
    reckless autopilot.
  - *Time away from the PC* (Charge, `CHARGE_SEC` 15 s). Everything above, plus no input at all but the card: the
    right screen dims (it is what she would see), your gaming chair stands empty in front of the desk, its back to
    you, and in the webcam view, its front to the camera; a glass card over the monitor says why you are away
    ("Charging your phone"), the seconds left and that the party is on autopilot, with a moss bar (✕ = come back
    early, no effect) (grid doc 7k). If a visit lands while you are away she sees whatever is on screen: Excel = pass,
    the game = caught.
  - *A condition on where she is.* Read when you start (you text her now, you walk over now). The tooltip is
    the cost and one sentence on what it does, with the condition when there is one (Text her: while she is busy
    with something); the game never says whether it is met. Wrong = that action's backfire.
- **Diminishing returns per night.** The 2nd use of the same action does `PRE_SECOND_MULT` (half). From
  the `PRE_SUSPICIOUS_AT` (3rd) use she gets suspicious ("why are you being so nice? what did you do?"):
  no effect, Mood +5, and her next visit is a Peek. Charge and the Raid pass are exempt. The button shows
  "next: half" or "suspicious next".
- **Calm.** No visit roll while it runs, even past the guaranteed-visit gap. Heard Noise above
  `PRE_CALM_BREAK_NOISE` (70) ends it and she comes to check, so a calm does not make loud play free.
- **Where they live.** In the phone. Charge is on the home screen's battery widget (from Thursday). Text her and
  Raid night? live **in Messages**. Tap the phone while nothing is on it (its label says "tap: text her"): it comes into
  your hand (the same phone window as calls) at **Messages**, two chats: **Babe** (Text her) and **The Boys (3)**
  (Raid night?), each with its cost or why it's blocked. Tap a chat: the message types itself into that chat
  (`PRE_TEXT_SEC`, hands busy), "Delivered", then the phone goes down; her reply lights the desk phone later. No
  call or text arrives while the phone is in your hand. Only allowed while no visit is under way and your hands
  are free. The tap opens the home screen (0.67); Messages is an app on it, beside the Shop (0.76).
  **Decision (#63): everything on the phone happens inside the phone.** Rejected: an iOS card floating next to
  the phone with the two actions, and a "Typing..." busy card on the desk (it was outside the phone, and the raid's
  card even read "Making her tea...").
- **Debug:** F1 → "Calm +30s" (the framework's test action).

| Action | Cost | Works when she is | Effect | Backfire |
|---|---|---|---|---|
| Text her (phone) | 3 s hands busy | Busy with something (TV, kitchen, bedroom, bathroom) | Next visit +`PRE_TEXT_CALM` (40) s (adds up), Mood -5. 2 to 4 s later her reply lights the phone with what she is doing (the tell) | Walking somewhere: a Chat visit within 10 s ("omw to you"). Shower: Chat right after. Asleep: the buzz wakes her a bit (+25) |
| Raid night? (phone, Goodwill) | 40 Goodwill, 3 s hands busy | Awake, before midnight | No visits for 150 s; Noise does not end this calm. No diminishing returns, no suspicion | Below 40 Goodwill the button is blocked |
| Charge (home screen) | 15 s away from the PC | Always (dim at 100%) | Phone battery +`CHARGE_ADD` (40)% | If she comes meanwhile, she sees whatever is on the monitor |

## Decisions

- **Numbers cut from the plan** (0.27): tea calm 2 min → 60 s, episode 4 min → 120 s. A night is about
  7.7 real minutes; at the planned numbers a bot that knew where she was and always stayed for the episode
  got 0 to 1 visits a night, so the dread was gone. At 60 / 120 s (10 good-bot nights each): no actions
  3.6 to 5.1 visits; tea twice and always staying for the episode, 1.0 visits but depth 5.4 instead of 9.3
  and 0.7 wipes a night (2.5 minutes on the reckless autopilot); declining the episode, 3.3 visits and
  depth 8.8. The episode is the real trade: her calm for your dungeon.
- **Loud play breaks a calm** (0.27): without it, a calm made skill spam free.
- **Text calm adds up, tea calm is a floor**: "her next visit waits 40 s longer" pushes; "no visits for a
  minute" holds.
- **The condition is read when you start**, not when the effect lands: you decide on what you heard.
- **Kitchen backfire is a hug, not the cuddle minigame**: the cuddle is a visit; outside a visit it would
  need its own flow for one backfire. The cost (more time away) is the same.
- **Make her tea and the towel are gone** (0.79, step 6, #57): the handoff replaced them with the smart home, the
  door seal (the towel's effect and downside, 4% battery a toggle) and bubble tea (an order, no visits for 120 s), so
  "prevent" has one home, the phone, and costs battery. Their numbers and backfires (tea's hug and its "Stay for one
  episode?") went with them. Rejected: keeping tea beside bubble tea (two ways to buy the same calm).
- **Raid pass** built in 0.30 with Goodwill ([synergy.md](synergy.md)).

## Planned: the rest of the list (#20)

| Action | Cost | Works when she is | Effect | Backfire |
|---|---|---|---|---|
| Text her | Phone, 3 s | Busy (TV, kitchen, bedroom) | Next visit +40 s, Mood −5; her reply lights the phone (a tell) | Idle or hallway: Chat visit within 10 s. Shower: Chat right after |
| Make her tea | 15 s away | Living room or bedroom | Mood −15, no visits 2 min. TV: "stay for one episode?" (accept 60 s more away, 4 min calm; decline Mood +10, half effect) | Kitchen: instant Cuddle there. Hallway: she glances at your screen |
| Queue next episode | Phone, 2 s, 2/night | Watching TV | TV extended by one episode, credits cue skipped | Elsewhere: the TV turns on loud, Peek within 15 s |
| Order food | Phone, 1/night | Anywhere | Doorbell after 90 s, she eats in the living room 3 min (Mood −15), then a Snack run | 30%: courier calls *your* phone (+30 Noise unless answered in 5 s). Asleep: doorbell wakes her |
| Meeting sign | 1 s, 1/night | Anywhere | No Peek, Chat or Snack run for 2 min (Cuddle and Help me ignore it) | A Noise spike above 40 she can hear: instant catch, Mood +20, sign gone for the night |
| Towel under the door | 2 s toggle | Anywhere | Hides the monitor glow, outgoing Noise −40%, visit timer 30% slower | You lose the shadow under the door; her steps muffled 50%. She sees it: Mood +5 |
| Empty the can bin | 12 s away | Not in the kitchen or hallway | Clears the bin tell (bin with 3+ cans becomes a tell) | Kitchen: catch. Hallway: 50% catch |
| Do a chore | 25 s away, 2/night | Anywhere | Mood −20, next visit forced friendly (Cuddle or Snack run) | Only the autopilot risk: safe from the city, dangerous from a dungeon |
| "Five more minutes" | Reply during a visit, 1/night | During a visit | She leaves, Mood −5, no visits for 5 in-game min (countdown on the phone) | She returns exactly on time: RPG on screen = Mood +30 and a catch; Excel 60+ = pass |
| Shout "love you!" | Instant | A far room | Mood −5; her answer's direction is a free location ping | Red Mood: "...what did you do?" Peek in 10 s. Next door or hallway: Chat visit |
| Lock the door | Instant, 1/night | Anywhere | The next visit cannot open the door | She rattles it (Mood +15), "why is it locked?" excuse dialogue; wrong excuse = Peek with Busy 80 needed |

**Raid pass** ("Babe, raid night?"): the only action paid with Goodwill (40) instead of a charge, away time
or a location guess. No visits for 2.5 real minutes, the strongest calm in the game. Exempt from the
suspicion rule (you ask her openly). Not usable in the bed phase or during a visit.

Decided 2026-11-16 (option A): Goodwill pays only for the Raid pass. Rejected: Goodwill paying for every
action (snowballs, and turns "do I know where she is?" into "can I afford it?"); a separate Raid pass button
outside the action menu (two places for one kind of decision). Forgiveness stays automatic and is not an action.

Built: Text her, the Raid pass, Charge (rows above are the original ideas; the built versions are described under
Now). Make her tea and the towel were built (0.27) and removed (0.79). The TV cast (the "Queue next episode" row) is
the Home app's ([desk.md](desk.md)). Every other row is still a plan.

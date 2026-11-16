# Pre-emptive actions (planned, not built)

Framework #19, actions #20. Depends on reckless autopilot (#15) for the "away" cost.

## Why

Today the player can only react once she is already coming. The blueprint, peeking and listening give
information but no way to act on it early. Pre-emptive actions turn knowing where she is into prevention,
and give the map a job between visits.

## Framework

Verbs used **before** a visit to shape it. Each action can push the visit scheduler's next-visit timer,
change the visit-type weights, or lower Mood.

**Every action costs at least one of:**
- **Time away from the PC.** The desk shows the empty chair; the RPG runs on (reckless) autopilot; no
  alt-tab, no input. If a visit lands while you are away, she sees whatever is on screen: RPG = catch,
  Excel = pass.
- **A per-night charge**, shown on the action button.
- **A condition on where she is.** Never shown as met or unmet; the player has to know (sounds, blueprint,
  peeking). Wrong condition = that action's backfire.

**Diminishing returns per night.** The 2nd use of the same action has half effect. On the 3rd she gets
suspicious ("why are you being so nice? what did you do?") and the next visit becomes a Peek.

**Where they live.** A small menu on the door panel; phone actions on the phone desk object.

**Data.** Each action is a data entry with cost, condition, effect and backfire (`src/data/`); every number
in `tuning.ts`. Build the framework with one debug action ("push the timer +30 s") first; real actions
come one per round.

## Actions (ideas, pick per round)

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

## Open questions

- Away time needs a visible "away" state on the desk (empty chair art) and the reckless autopilot (#15).
- Several actions need visit types that are not built yet (Chat, Cuddle, Snack run: #12).

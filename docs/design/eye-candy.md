# Eye-candy moments

A cross-cutting theme: her, the reward the player trades loot for. The core joke is loot vs. her, so the
best moments make her attention the temptation rather than decoration.

**Tone rules.** Babe is a fictional character, not anyone real. Cheeky pin-up, clothed adults, flattering
poses, bare feet (the friend likes feet). Suggestive only: fades, fog and silhouettes do the work. Nothing
explicit. A birthday gift gets shown around.

## Now (built)

| Moment | Where | Detail in |
|---|---|---|
| Barefoot at the door in every outfit, painted toenails | Door | [her.md](her.md) |
| Outfit by activity (off-shoulder tee and shorts, oversized hoodie, tank top, towel wrap and turban, sleep shirt) | Door | her.md |
| Lean visit: leaning on the frame, one foot against her calf, blush and wink | Door | her.md |
| Bare toes in the light gap under the door | Door | her.md |
| Frosted silhouette when peeking during her shower | Door crack | her.md |
| She sits on your desk: first person, thighs up, three poses | Desk | her.md |
| Morning vignette by how the night ended (0.32): green, asleep in your shirt hugging your pillow; yellow, back turned, her phone still lit; red, asleep on the couch in the TV light; unplugged, an empty bed and a note "Hope the loot was worth it." Bare soles toward you in the first three | Morning screen | `drawHerBed` in `src/ui/her.ts` |
| Shower panel (0.32): while she showers and you can hear it (headset off, no visit, not peeking), the apartment map becomes a frosted glass cabin: her blurred silhouette swaying, water streaks, steam, drips. The fog thickens through the shower; at the hair dryer cue the water stops and the glass clears bottom-up, then it cuts back to the map when she moves | Door panel, over the map | `drawShowerPanel` |
| Hoodie walk-by (0.32): green Mood at bedtime, she stops at your door in your dark gaming hoodie (guild logo, sleeves over her hands), sleepy: "Night, babe. Don't stay up too late." Mood −5, no check, once a night, then bed | Door | [her.md](her.md) visit table |

## Planned (#22)

| Moment | Summary | Needs |
|---|---|---|
| "Wanna join?" | Once, night 5, forced shower. 30 to 60 s in she calls out; 10 s choice, landing on a legendary drop or a boss at 10%. Accept: fade to steam and a pixel heart, 60 s away, Mood to 0, "Glow" buff (+loot luck for the night), and the loot is lost. Decline: "...ok. Enjoy your goblins." Mood +20. The punchline of the gift. | Campaign night 5 (#3), autopilot (#15) |
| "How do I look?" | New outfit; turn the chair away (the RPG goes out of focus) and pick the compliment that names a visible detail. Answering without turning: Mood +15. | Visit types (#12) |

## Decisions

- **Shower silhouette** (0.32): under the blur she wears the towel outfit, so the figure stays suggestive
  even where the blur thins (the clearing glass shows calves and feet first). Only the sway and a small bob
  move her; the planned "rinsing hair, arms up" poses need pose art (#26). The panel shows only when you
  could hear the water (headset off), since the water is what already gives her location away.
- **Hoodie walk-by at bedtime, not "after 23:00"** (0.32): she goes to bed at midnight; the walk-by is her
  way there, so it hangs on that moment instead of a clock rule. Not green: she goes straight to bed.
- **Couch scene reuses the bed composition** (0.32): seen from the foot end, so the four vignettes read as
  one series and the soles stay the constant.

- **Attention as temptation** beats a pretty panel with nothing to do: every planned moment either costs
  RPG time or lands on a loot beat.
- **Doorframe date-night visit cut** (2026-11-16): too close to the built lean visit. Can come back later
  as a night-4+ version of the lean visit.
- The shower panel gives away her location; accepted, because the shower sound already does.

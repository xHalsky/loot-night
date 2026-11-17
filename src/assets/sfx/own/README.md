# Your own sounds

Drop a recording here named after a cue and it replaces the baked one on the next build. Formats: mp3, ogg, wav or
m4a (mp3 is the safe choice for Safari). Mono is fine.

- One file: `step.mp3`. Variants (picked at random, never the same twice in a row): `step_0.mp3`, `step_1.mp3`, ...
- Loops (`tv.mp3`, `kettle.mp3`, `shower.mp3`) loop the whole file, so trim them to a seamless cycle.
- Volume: the mix is in `src/data/sounds.ts` (`MIX`); your file plays at its own level times that.
- Cue names: see the F1 sound board in the game, or the file names in `src/assets/sfx/`.

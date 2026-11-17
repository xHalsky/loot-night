# Sound baking

`python3 tools/sfx/make.py` writes every file in `src/assets/sfx/` (needs ffmpeg, numpy, scipy).
`python3 tools/sfx/make.py tv laugh` re-bakes just those cues. The output is deterministic (seeded).

- `kenney/`: the CC0 recordings used (Kenney "RPG Audio" and "Impact Sounds", public domain, see
  `LICENSE-CC0.txt`). Credit is not required; Kenney (kenney.nl) is thanked in the CHANGELOG anyway.
- `dsp.py`: filters, noise, envelopes and a small formant voice (additive harmonics shaped by vowel formants).
- `make.py`: one function per cue. Through-wall sounds export at 24 kHz / 32 kbps, the rest at 32 kHz / 48 kbps;
  one-shots are loudness-matched (loudest 300 ms at -18 dB RMS, peaks under -1 dB) so the mix lives in
  `src/data/sounds.ts`. Loops (`tv`, `kettle`, `shower`) are cyclic and carry 0.25 s of wrap-around on each side.

Your own recordings never go through here: put them in `src/assets/sfx/own/` (see the README there).
Design notes: `docs/design/screen.md`, Audio.

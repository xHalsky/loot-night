// Seeds Math.random (mulberry32) from SEED, so a bot night or a test replays exactly, in this tree and in an older one:
//   SEED=3 npx tsx --import ./test/seed.mjs test/sim.ts good   (W6, #132: the v2 redesign changed no number)
let a = (Number(process.env.SEED) || 1) >>> 0;
Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

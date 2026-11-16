//how many items the Atlas's own tests have and how long they get, in seconds. Each test's items are in its folder,
//generated from fixed seeds so everyone takes the same test. Their readings are compared with each other's, so changing
//a generator, a seed, a count or a time limit changes the test, and readings from before stop being comparable. The
//counts and time limits match the measurements in the norms seed (database/physical_norms_import/src/published.rs)
export const TIMED = {
  matrices: { count: 20, seconds: 600 },
  series: { count: 16, seconds: 480 },
  rotation: { count: 16, seconds: 420 },
  folding: { count: 14, seconds: 420 },
  perspective: { count: 12, seconds: 360 },
  syllogisms: { count: 20, seconds: 420 },
  symbols: { seconds: 90 },
  flanker: { count: 48 },
  cards: { count: 60 },
  words: { count: 20, seconds: 240 },
  hidden: { count: 16, seconds: 360 },
  tapping: { tries: 3, seconds: 10 },
  tracking: { seconds: 45 },
  timing: { count: 20 },
  steering: { seconds: 60 },
  trackCount: { seconds: 60 },
  designs: { seconds: 60 },
  uses: { seconds: 120 },
  problems: { count: 17, seconds: 240 },
};

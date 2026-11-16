import { seeded } from '../test_kit';

export const COLOR_TRIES = 30;
export const COLOR_HUES = (() => {
  const random = seeded(2026);
  return Array.from({ length: COLOR_TRIES }, (_, i) => ((i * 47 + random() * 20) % 360));
})();

//the practice tries before the ones that count, easy to spot: the hue and how far the odd tile is from it, in degrees
export const COLOR_PRACTICE = [
  { hue: 200, difference: 40 },
  { hue: 30, difference: 30 },
  { hue: 300, difference: 22 },
];

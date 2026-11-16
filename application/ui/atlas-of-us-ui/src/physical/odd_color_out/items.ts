import { seeded } from '../test_kit';

export const COLOR_TRIES = 30;
export const COLOR_HUES = (() => {
  const random = seeded(2026);
  return Array.from({ length: COLOR_TRIES }, (_, i) => ((i * 47 + random() * 20) % 360));
})();

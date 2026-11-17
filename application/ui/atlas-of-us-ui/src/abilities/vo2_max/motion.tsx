import { GRAY, line } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { GY, type Motion, SIDE, steps } from '../motion_kit';
import { Ink } from '../motion_marks';

export const run: Motion = {
  label: 'Someone running',
  period: 0.72,
  still: 0,
  figure: {
    view: 'side',
    frames: steps(0.18, [
      { ...SIDE, y: 238, t: 168, ln: [32, 6], lf: [-26, -34], an: [-40, 42], af: [36, 122] },
      { ...SIDE, y: 230, t: 168, ln: [4, -14], lf: [14, -84], an: [0, 70], af: [0, 70] },
      { ...SIDE, y: 238, t: 168, ln: [-26, -34], lf: [32, 6], an: [36, 122], af: [-40, 42] },
      { ...SIDE, y: 230, t: 168, ln: [14, -84], lf: [4, -14], an: [0, 70], af: [0, 70] },
    ]),
  },
  under: (time) => (
    <g>
      <Floor />
      <Ink d={Array.from({ length: 6 }, (_, i) => line([((i * 120 - (time / 0.72) * 120) % 600 + 600) % 600, GY + 18], [((i * 120 - (time / 0.72) * 120) % 600 + 600) % 600 + 40, GY + 18])).join(' ')} c={GRAY} w={4} />
    </g>
  ),
};

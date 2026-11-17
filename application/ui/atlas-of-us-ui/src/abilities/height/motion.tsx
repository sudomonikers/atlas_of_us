import { BLUE, line, ORANGE } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { ease, GY, L, mix, type Motion, STAND } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

export const height: Motion = {
  label: 'Someone standing straight against a wall while a ruler slides down to the top of their head',
  period: 4,
  still: 2,
  figure: { view: 'front', frames: [[0, STAND]] },
  under: () => (
    <g>
      <Floor />
      <Ink d={line([210, GY], [210, 40])} c={ORANGE} w={6} />
      <Ink d={Array.from({ length: 21 }, (_, i) => line([210, GY - i * 15], [210 + (i % 2 ? 10 : 18), GY - i * 15])).join(' ')} c={ORANGE} w={3} />
    </g>
  ),
  draw: (time, j) => {
    const top = j ? j.head[1] - L.head - 4 : 100;
    const y = mix(40, top, ease(Math.min(1, time / 1.4)));
    return (
      <g>
        <Ink d={line([205, y], [340, y])} c={BLUE} w={7} />
        {time > 1.4 && <Say x={440} y={top + 8} text="how tall" size={34} c={BLUE} />}
      </g>
    );
  },
};

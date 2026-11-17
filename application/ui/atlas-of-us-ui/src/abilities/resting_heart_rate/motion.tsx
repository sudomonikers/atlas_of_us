import { line, RED } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { type Motion, STAND } from '../motion_kit';
import { Fill, Ink } from '../motion_marks';

export const pulse: Motion = {
  label: 'Someone counting their pulse with two fingers on their wrist while their heart beats',
  period: 0.9,
  still: 0.1,
  figure: { view: 'front', frames: [[0, { ...STAND, af: [-15, 75], an: { to: [308, 204], bend: -1 } }]] },
  under: () => <Floor />,
  draw: (time) => {
    const beat = 1 + 0.18 * Math.max(0, 1 - time / 0.25);
    const scroll = (time / 0.9) * 120;
    const trace = Array.from({ length: 4 }, (_, i) => {
      const x = 410 + i * 120 - scroll;
      return line([x, 230], [x + 50, 230], [x + 62, 200], [x + 76, 262], [x + 88, 222], [x + 98, 230], [x + 120, 230]);
    }).join(' ');
    return (
      <g>
        <g transform={`translate(470 140) scale(${beat})`}>
          <Fill d="M 0 26 C -40 0 -34 -30 0 -10 C 34 -30 40 0 0 26 Z" c={RED} op={0.6} />
          <Ink d="M 0 26 C -40 0 -34 -30 0 -10 C 34 -30 40 0 0 26 Z" c={RED} w={5} />
        </g>
        <clipPath id="motion-trace">
          <rect x={400} y={180} width={160} height={100} />
        </clipPath>
        <g clipPath="url(#motion-trace)">
          <Ink d={trace} c={RED} w={4} />
        </g>
      </g>
    );
  },
};

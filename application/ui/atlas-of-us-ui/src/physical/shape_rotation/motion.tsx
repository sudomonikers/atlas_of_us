import { circle, GRAY, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Ink } from '../motion_marks';
import { ease, through } from '../screen_kit';
import { Blocks, Screen } from '../screen_marks';

export const rotation: Motion = {
  label: 'A shape of blocks turning around in someone\'s head until it matches one of four, three of which are its mirror image',
  period: 4.8,
  still: 3.8,
  draw: (time) => {
    const turned = ease(through(time, 0.8, 2.4)) * 90;
    return (
      <Screen>
        <Blocks x={300} y={110} size={26} turn={turned} />
        {[
          [120, 270, 180, true],
          [240, 270, 270, true],
          [360, 270, 90, false],
          [480, 270, 0, true],
        ].map(([x, y, turn, mirror], i) => (
          <g key={i}>
            <Blocks x={x as number} y={y as number} size={18} turn={turn as number} mirror={mirror as boolean} c={GRAY} />
            {i === 2 && time > 2.6 && <Ink d={circle(x as number, y as number, 56)} c={RED} w={5} />}
          </g>
        ))}
      </Screen>
    );
  },
};

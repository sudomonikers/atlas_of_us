import { BLUE, circle, ORANGE, type Pt, rect, RED } from '../../shared_components/story/ink';
import { Reach } from '../body_marks';
import { ease, mix, type Motion } from '../motion_kit';
import { Fill, Ink } from '../motion_marks';

export const plateTapping: Motion = {
  label: 'A hand tapping two circles on a table in turn as fast as it can, crossing over the other hand',
  period: 0.7,
  still: 0.1,
  draw: (time) => {
    const p = ease(Math.min(1, (time % 0.35) / 0.25));
    const leftward = time < 0.35;
    const hand: Pt = [leftward ? mix(440, 160, p) : mix(160, 440, p), 186 - 22 * Math.sin(Math.PI * p)];
    const hit = (time % 0.35) > 0.25;
    return (
      <g>
        <Fill d={rect(40, 40, 520, 320)} c={ORANGE} op={0.08} />
        {[160, 440].map((x) => {
          const lit = hit && (leftward ? x === 160 : x === 440);
          return (
            <g key={x}>
              <Fill d={circle(x, 200, 52)} c={lit ? RED : BLUE} op={lit ? 0.45 : 0.18} />
              <Ink d={circle(x, 200, 52)} w={5} />
            </g>
          );
        })}
        <Reach from={[220, 470]} to={[300, 300]} flat />
        <Reach from={[hand[0] + 120, 470]} to={hand} />
      </g>
    );
  },
};

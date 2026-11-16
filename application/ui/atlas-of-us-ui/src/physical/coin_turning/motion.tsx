import { ORANGE, type Pt, rect } from '../../shared_components/story/ink';
import { Coin, Reach } from '../body_marks';
import { ease, mix, type Motion } from '../motion_kit';
import { Fill } from '../motion_marks';

export const coinTurning: Motion = {
  label: 'A hand turning over a row of coins one after another, from heads to tails',
  period: 4.4,
  still: 1.4,
  draw: (time) => {
    const at = time / 0.6;
    const now = Math.floor(at);
    const xs = [130, 198, 266, 334, 402, 470];
    const along = Math.min(xs.length - 1, at);
    const hand: Pt = [mix(xs[Math.floor(along)], xs[Math.min(xs.length - 1, Math.floor(along) + 1)], ease(along % 1)), 248 + 8 * Math.abs(Math.sin(Math.PI * (at % 1)))];
    return (
      <g>
        <Fill d={rect(40, 40, 520, 320)} c={ORANGE} op={0.08} />
        {xs.map((x, i) => {
          const turning = i === now ? Math.cos(Math.PI * (at % 1)) : 1;
          const face = i < now || (i === now && at % 1 > 0.5) ? 'T' : 'H';
          return <Coin key={x} x={x} y={190} face={face} turn={turning} />;
        })}
        <Reach from={[hand[0] + 120, 460]} to={hand} />
      </g>
    );
  },
};

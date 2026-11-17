import { RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { ease, mix, through } from '../screen_kit';
import { Button, Pointer, Screen } from '../screen_marks';
import { clock, clockAt } from './scenes';

//where the clock goes on the screen, and how big
const AT = [100, 34];
const SCALE = 0.85;
const onScreen = ([x, y]: [number, number]): [number, number] => [AT[0] + x * SCALE, AT[1] + y * SCALE];

export const problems: Motion = {
  label: 'A clock face with its 4 missing, and the pointer circling the empty spot and pressing That\'s the problem',
  period: 6,
  still: 5,
  draw: (time) => {
    const spot = onScreen(clockAt(4));
    const toSpot = ease(through(time, 1.2, 2.2));
    const toButton = ease(through(time, 3, 3.8));
    const pointer: [number, number] = [mix(mix(470, spot[0], toSpot), 330, toButton), mix(mix(320, spot[1], toSpot), 312, toButton)];
    return (
      <Screen>
        <g transform={`translate(${AT[0]} ${AT[1]}) scale(${SCALE})`}>{clock.draw(true)}</g>
        {time > 2.3 && <circle cx={spot[0]} cy={spot[1]} r={20} fill="none" stroke={RED} strokeWidth={5} />}
        <Button x={220} y={296} w={220} label="That's the problem" on={time > 3.9} />
        <Pointer at={pointer} />
      </Screen>
    );
  },
};

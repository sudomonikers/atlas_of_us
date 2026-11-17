import { BLUE, circle, GRAY, type Pt, RED, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Button, Pointer, Screen } from '../screen_marks';

const EACH = 1.6; //how long each target takes, in seconds
//the targets in turn, the dot starting from the last
const TARGETS: Pt[] = [[420, 70], [180, 180], [320, 120]];

export const twoHandSteering: Motion = {
  label: 'A dot steered to a target with both hands at once, one holding up or down and the other left or right',
  period: TARGETS.length * EACH,
  still: 0.7,
  draw: (time) => {
    const n = Math.floor(time / EACH);
    const t = time % EACH;
    const [fx, fy] = TARGETS[(n + TARGETS.length - 1) % TARGETS.length];
    const [tx, ty] = TARGETS[n];
    const moving = t > 0.2 && t < 1.2;
    const p = ease(through(t, 0.2, 1.2));
    const dot: Pt = [mix(fx, tx, p), mix(fy, ty, p)];
    const vertical = ty < fy ? 'up' : 'down';
    const across = tx < fx ? 'left' : 'right';
    const pads = { up: [70, 222], down: [70, 272], left: [330, 247], right: [440, 247] } as Record<string, Pt>;
    return (
      <Screen>
        <Ink d={rect(120, 36, 360, 172)} c={GRAY} w={4} />
        {t < 1.3 && <path d={circle(tx, ty, 26)} fill="none" stroke={BLUE} strokeWidth={4} strokeDasharray="8 7" />}
        <Fill d={circle(dot[0], dot[1], 13)} c={RED} op={0.9} />
        <Button x={70} y={222} w={110} label="Up" on={moving && vertical === 'up'} />
        <Button x={70} y={272} w={110} label="Down" on={moving && vertical === 'down'} />
        <Button x={330} y={247} w={100} label="Left" on={moving && across === 'left'} />
        <Button x={440} y={247} w={100} label="Right" on={moving && across === 'right'} />
        <Pointer at={[pads[vertical][0] + 55, pads[vertical][1] + 22]} />
        <Pointer at={[pads[across][0] + 50, pads[across][1] + 22]} />
      </Screen>
    );
  },
};

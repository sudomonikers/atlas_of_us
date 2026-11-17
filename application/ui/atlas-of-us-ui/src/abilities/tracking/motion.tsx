import { BLUE, circle, GRAY, GREEN, line, type Pt, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { Pointer, Screen } from '../screen_marks';

//where the dot drifts, wandering without a pattern
const drift = (t: number): Pt => [300 + 150 * Math.sin(t * 0.9) + 40 * Math.sin(t * 2.3 + 1), 160 + 70 * Math.sin(t * 1.3 + 0.5) + 25 * Math.cos(t * 3.1)];

export const tracking: Motion = {
  label: 'A pointer kept on a dot drifting unpredictably around a box, slipping off now and then, with the share of time on it',
  period: 2 * Math.PI,
  still: 1,
  draw: (time) => {
    const dot = drift(time);
    const slip = Math.max(0, Math.sin(time * 1.7 - 1)) ** 6 * 46; //now and then it gets away
    const pointer: Pt = [drift(time - 0.1)[0] + slip, drift(time - 0.1)[1] + slip * 0.4];
    const on = Math.hypot(pointer[0] - dot[0], pointer[1] - dot[1]) < 24;
    const trail = Array.from({ length: 12 }, (_, i) => drift(time - 0.08 * (12 - i)));
    return (
      <Screen>
        <Ink d={rect(70, 44, 460, 260)} c={GRAY} w={4} />
        <Ink d={line(...trail)} c={BLUE} w={4} op={0.25} />
        <Fill d={circle(dot[0], dot[1], 22)} c={BLUE} op={0.8} />
        {on && <Ink d={circle(dot[0], dot[1], 30)} c={GREEN} w={5} />}
        <Pointer at={pointer} />
        <Say x={510} y={334} text={`on it: ${on ? 'yes' : 'no'}`} size={26} c={on ? GREEN : GRAY} anchor="end" />
      </Screen>
    );
  },
};

import { circle, GRAY, INK, line, ORANGE, rect } from '../../shared_components/story/ink';
import { SKIN, type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { Screen } from '../screen_marks';

const RATE = 6.5; //taps a second
const SECONDS = 10; //how long a try lasts

export const tapping: Motion = {
  label: 'A finger tapping a box as fast as it can, the count of taps climbing as the seconds count down',
  period: 4,
  still: 1.1,
  draw: (time) => {
    const beat = (time * RATE) % 1;
    const lift = 34 * Math.abs(Math.sin(Math.PI * beat)); //how far the fingertip is off the box
    const taps = 18 + Math.floor(time * RATE);
    const tip: [number, number] = [380, 214 - lift];
    return (
      <Screen>
        <Fill d={rect(90, 44, 420, 220)} c="#fff" op={1} />
        <Ink d={rect(90, 44, 420, 220)} c={GRAY} w={4} />
        <Say x={210} y={180} text={String(taps)} size={110} />
        <Say x={480} y={84} text={`${Math.ceil(SECONDS - 3 - time)} s`} size={32} c={GRAY} anchor="end" />
        {lift < 6 && <Ink d={circle(380, 218, 26)} c={ORANGE} w={4} op={0.8} />}
        <Ink d={line([tip[0] + 6, tip[1] + 30], [tip[0] + 40, tip[1] + 170])} c={INK} w={48} />
        <Ink d={line([tip[0] + 6, tip[1] + 30], [tip[0] + 40, tip[1] + 170])} c={SKIN} w={38} />
        <Ink d={line([tip[0] - 4, tip[1] + 8], [tip[0] + 8, tip[1] + 22])} c={GRAY} w={3} />
      </Screen>
    );
  },
};

import { BLUE, GRAY, line, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { Burst, Screen } from '../screen_marks';

const EACH = 1.2; //how long each flash takes, in seconds
//where each flash is from the dot, across and down, or none
const FLASHES: ([number, number] | null)[] = [[210, -40], [-120, 50], [100, 70], null, [-220, -60]];
const DOT: [number, number] = [300, 190];

export const sideVision: Motion = {
  label: 'Eyes kept on a dot in the middle of a screen while flashes appear out to the sides, and the side each one was on tapped',
  period: FLASHES.length * EACH,
  still: 0.3,
  draw: (time) => {
    const at = FLASHES[Math.floor(time / EACH)];
    const t = time % EACH;
    const [dx, dy] = DOT;
    const flashing = at && t > 0.2 && t < 0.4;
    const answered = at && t > 0.6 && t < 1.05;
    return (
      <Screen>
        {answered && <Fill d={rect(at[0] < 0 ? 44 : dx, 22, 256, 322)} c={BLUE} op={0.15} />}
        <Say x={dx} y={66} text="Eyes on the dot" size={28} c={GRAY} />
        <Ink d={line([dx - 14, dy], [dx + 14, dy]) + ' ' + line([dx, dy - 14], [dx, dy + 14])} w={4} />
        <circle cx={dx} cy={dy} r={6} fill={BLUE} />
        {flashing && <Burst x={dx + at[0]} y={dy + at[1]} />}
        {answered && <Say x={at[0] < 0 ? 172 : 428} y={320} text={at[0] < 0 ? 'Left' : 'Right'} size={30} c={BLUE} />}
      </Screen>
    );
  },
};

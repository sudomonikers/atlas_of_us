import { GRAY, line } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Ink, Say } from '../motion_marks';
import { typed } from '../screen_kit';
import { Bubble, Screen, Talker, Typing } from '../screen_marks';

const ROUND = 3.2; //how long each round takes, in seconds
//when each digit is said in a round and how long it shows, and when the noise stops
const SAID = [0.2, 0.8, 1.4];
const SHOWN = 0.5;
const QUIET = 2;
//each round's digits and how loud his voice is: quieter in the second, after the first was right
const ROUNDS = [
  { digits: '958', loud: 1 },
  { digits: '374', loud: 0.4 },
];
//the patch of noise over what he says
const NOISE = { x: 160, y: 46, w: 320, h: 156, dashes: 90 };

//a number from 0 to 1 that looks random, the same for the same inputs
const random = (i: number, seed: number) => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export const digitsNoise: Motion = {
  label: 'A man saying three digits through a rushing noise, typed in after, then three more said more quietly',
  period: ROUNDS.length * ROUND,
  still: 0.4,
  draw: (time) => {
    const { digits, loud } = ROUNDS[Math.floor(time / ROUND)];
    const t = time % ROUND;
    const saying = SAID.findIndex((at) => t > at && t < at + SHOWN);
    const seed = Math.floor(time * 12);
    const noise = Array.from({ length: NOISE.dashes }, (_, i) => {
      const x = NOISE.x + random(i, seed) * NOISE.w;
      const y = NOISE.y + random(i + 500, seed) * NOISE.h;
      return line([x, y], [x + 10, y + (random(i + 900, seed) - 0.5) * 10]);
    }).join(' ');
    return (
      <Screen>
        <Talker x={110} y={262} talking={saying >= 0} />
        <Bubble x={320} y={124} rx={150} ry={74} to={[146, 238]} />
        {saying >= 0 && <Say x={320} y={152} text={digits[saying]} size={84} c={`rgba(35, 48, 59, ${loud})`} />}
        {t < QUIET && <Ink d={noise} c={GRAY} w={3} op={0.8} />}
        <Typing x={230} y={272} w={200} text={typed(digits, t, QUIET + 0.1, 0.2)} right={t > 2.8} />
      </Screen>
    );
  },
};

import { BLUE, GRAY, ORANGE, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { Button, Screen } from '../screen_marks';

const EACH = 1.1; //how long each letter takes, in seconds
//each letter in turn and its color, the blue P the only one pressed for with the first button
const LETTERS = [
  { letter: 'P', c: BLUE },
  { letter: 'F', c: ORANGE },
  { letter: 'F', c: BLUE },
  { letter: 'P', c: ORANGE },
];

export const choiceReaction: Motion = {
  label: 'Letters flashing up one at a time, a blue P answered with one button and every other letter with the other',
  period: LETTERS.length * EACH,
  still: 0.5,
  draw: (time) => {
    const n = Math.floor(time / EACH);
    const { letter, c } = LETTERS[n];
    const t = time % EACH;
    const showing = t > 0.15 && t < 0.75;
    const pressed = t > 0.5 && t < 0.8;
    const target = n === 0;
    return (
      <Screen>
        <Fill d={rect(150, 44, 300, 200)} c="#fff" op={1} />
        <Ink d={rect(150, 44, 300, 200)} c={GRAY} w={4} />
        {showing && <Say x={300} y={200} text={letter} size={150} c={c} />}
        <Button x={80} y={276} w={200} label="Blue P" on={pressed && target} />
        <Button x={320} y={276} w={200} label="Anything else" on={pressed && !target} c={ORANGE} />
      </Screen>
    );
  },
};

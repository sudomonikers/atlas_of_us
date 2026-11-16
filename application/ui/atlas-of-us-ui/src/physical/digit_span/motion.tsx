import { GRAY } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Say } from '../motion_marks';
import { typed } from '../screen_kit';
import { Screen, Typing } from '../screen_marks';

export const digitSpan: Motion = {
  label: 'Digits appearing on a screen one at a time, then typed back in the same order',
  period: 6.6,
  still: 1.3,
  draw: (time) => {
    const digits = '73915';
    const showing = Math.floor((time - 0.3) / 0.7);
    const shown = time > 0.3 && showing < digits.length && (time - 0.3) % 0.7 < 0.5 ? digits[showing] : '';
    const answering = time > 3.9;
    return (
      <Screen>
        <Say x={300} y={70} text={answering ? 'Type them back in order' : 'Remember them in order'} size={28} c={GRAY} />
        {!answering && <Say x={300} y={230} text={shown} size={120} />}
        {answering && <Typing x={200} y={170} w={200} text={typed(digits, time, 4.1, 0.25)} right={time > 5.5} />}
      </Screen>
    );
  },
};

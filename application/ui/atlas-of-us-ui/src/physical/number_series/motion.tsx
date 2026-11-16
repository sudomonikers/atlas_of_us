import { GRAY } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Say } from '../motion_marks';
import { typed } from '../screen_kit';
import { Screen, Typing } from '../screen_marks';

export const numberSeries: Motion = {
  label: 'A row of numbers on a screen that double each time, and the next one typed in',
  period: 4.4,
  still: 3.6,
  draw: (time) => (
    <Screen>
      <Say x={300} y={80} text="What comes next?" size={28} c={GRAY} />
      {[3, 6, 12, 24, 48].map((n, i) => (
        <Say key={n} x={100 + i * 80} y={180} text={String(n)} size={46} />
      ))}
      <Typing x={210} y={220} w={140} text={typed('96', time, 1.4, 0.4)} right={time > 2.6} />
    </Screen>
  ),
};

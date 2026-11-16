import type { CSSProperties } from 'react';
import { HAND } from '../../shared_components/story/ink';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { SERIES_ITEMS, SERIES_PRACTICE } from './items';

const seriesItem = (s: { shown: number[]; answer: number }): Item => ({
  prompt: <p style={styles.series}>{[...s.shown, '?'].join(',  ')}</p>,
  answer: s.answer,
  font: HAND,
});

//inductive reasoning: type the next number of a series
export function Series({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question is a row of numbers built by a rule. The rule might be adding or taking away the same amount
          each time, doubling or two patterns taking turns – and later ones get harder. Work out the rule and type the
          number that comes next. Do it in your head, without a calculator or paper. You'll start with two practice
          questions, and after each one I'll tell you whether you got it right. Then come the {TIMED.series.count} that
          count, and you have {clock(TIMED.series.seconds)} to answer as many as you can. Any you don't reach count as
          wrong, so if one has you stuck, make your best guess and move on.
        </p>
      }
      practice={SERIES_PRACTICE.map(seriesItem)}
      items={SERIES_ITEMS.map(seriesItem)}
      seconds={TIMED.series.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  series: {
    margin: 0,
    fontFamily: HAND, //the animation's hand, where a 1 and a 7 look different
    fontSize: 'clamp(24px, 5vw, 36px)',
    letterSpacing: 1,
    textAlign: 'center',
  },
};

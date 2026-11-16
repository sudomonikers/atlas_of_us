import type { CSSProperties } from 'react';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { SYLLOGISM_ITEMS, SYLLOGISM_PRACTICE } from './items';

const syllogismItem = (s: { premises: string[]; conclusion: string; follows: boolean }): Item => ({
  prompt: (
    <div style={styles.argument}>
      {s.premises.map((p) => (
        <p key={p} style={styles.premise}>{p}</p>
      ))}
      <p style={styles.conclusion}>So: {s.conclusion}</p>
    </div>
  ),
  choices: ['It follows', "It doesn't follow"],
  answer: s.follows ? 0 : 1,
});

//deductive reasoning: does the conclusion have to be true if what's given is?
export function Syllogisms({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question gives you a few statements about made-up things, and then a conclusion. Treat the statements as
          true – even if they sound odd – and decide whether the conclusion has to be true because of them. It only
          follows if there's no way for it to be false while the statements are true. The words are invented so that
          what you know about the real world can't get in the way. You'll start with two practice questions, and after
          each one I'll tell you whether you got it right. Then come the {TIMED.syllogisms.count} that count, and you
          have {clock(TIMED.syllogisms.seconds)} to answer as many as you can. Any you don't reach count as wrong, so if
          one has you stuck, make your best guess and move on.
        </p>
      }
      practice={SYLLOGISM_PRACTICE.map(syllogismItem)}
      items={SYLLOGISM_ITEMS.map(syllogismItem)}
      seconds={TIMED.syllogisms.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  argument: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignSelf: 'stretch',
  },
  premise: {
    margin: 0,
    fontSize: 17,
  },
  conclusion: {
    margin: '6px 0 0',
    fontSize: 17,
    fontWeight: 700,
  },
};

import type { CSSProperties } from 'react';
import { gunmetal, ivory } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { BROKEN_WORDS, type BrokenWord, WORD_COLUMNS, WORD_ROWS, WORDS_PRACTICE } from './items';

function Broken({ item }: { item: BrokenWord }) {
  const w = 300 / WORD_COLUMNS;
  const h = 90 / WORD_ROWS;
  return (
    <svg viewBox="0 0 300 90" style={styles.word} role="img" aria-label="A word with much of it hidden">
      <rect width={300} height={90} fill={ivory} />
      <text x={150} y={66} textAnchor="middle" fontSize={64} fontFamily="Georgia, 'Times New Roman', serif" fontWeight={700} fill={gunmetal}>
        {item.word.toUpperCase()}
      </text>
      {item.hidden.map((c) => (
        <rect key={c} x={(c % WORD_COLUMNS) * w - 0.2} y={Math.floor(c / WORD_COLUMNS) * h - 0.2} width={w + 0.4} height={h + 0.4} fill={ivory} />
      ))}
    </svg>
  );
}

const wordItem = (b: BrokenWord): Item => ({ prompt: <Broken item={b} />, answer: 0, word: b.word });

//speed of closure: read a word with much of it hidden
export function BrokenWords({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question shows a word with parts of its letters hidden, and more is hidden as you go along. Work out what
          the word is from what's left and type it in. They're all everyday English words. You'll start with two
          practice questions, and after each one I'll tell you whether you got it right. Then come the{' '}
          {TIMED.words.count} that count, and you have {clock(TIMED.words.seconds)} to answer as many as you can. Any
          you don't reach count as wrong, so if one has you stuck, make your best guess and move on.
        </p>
      }
      practice={WORDS_PRACTICE.map(wordItem)}
      items={BROKEN_WORDS.map(wordItem)}
      seconds={TIMED.words.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  word: {
    width: '100%',
    maxWidth: 420,
  },
};

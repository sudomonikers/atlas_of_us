import type { CSSProperties } from 'react';
import { gunmetal } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { ends, GRID, HIDDEN_ITEMS, HIDDEN_PRACTICE, type HiddenShape, type Stroke } from './items';

function Strokes({ strokes, size, grid = false }: { strokes: Stroke[]; size: number; grid?: boolean }) {
  return (
    <svg width={size} height={size} viewBox={`-0.5 -0.5 ${GRID} ${GRID}`} aria-hidden="true">
      {grid && Array.from({ length: GRID * GRID }, (_, i) => <circle key={i} cx={i % GRID} cy={Math.floor(i / GRID)} r={0.05} fill="#bbb" />)}
      {strokes.map((s) => {
        const [[x1, y1], [x2, y2]] = ends(s);
        return <line key={s} x1={x1} y1={y1} x2={x2} y2={y2} stroke={gunmetal} strokeWidth={0.12} strokeLinecap="round" />;
      })}
    </svg>
  );
}

const hiddenItem = (h: HiddenShape): Item => ({
  prompt: (
    <>
      <Strokes strokes={h.shape} size={110} grid />
      <span style={styles.small}>Which drawing has this shape in it, the same size and the same way up?</span>
    </>
  ),
  choices: h.choices.map((c, i) => <Strokes key={i} strokes={c} size={110} />),
  answer: h.answer,
  columns: 4,
});

//flexibility of closure: find which drawing has a simple shape hidden in it
export function HiddenShapes({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question shows a simple shape. One of the four drawings below it has exactly that shape hidden in it –
          the same size and the same way up – mixed in among other lines. Look past the extra lines and pick the drawing
          it's hiding in. You'll start with two practice questions, and after each one I'll tell you whether you got it
          right. Then come the {TIMED.hidden.count} that count, and you have {clock(TIMED.hidden.seconds)} to answer as
          many as you can. Any you don't reach count as wrong, so if one has you stuck, make your best guess and move
          on.
        </p>
      }
      practice={HIDDEN_PRACTICE.map(hiddenItem)}
      items={HIDDEN_ITEMS.map(hiddenItem)}
      seconds={TIMED.hidden.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  small: {
    fontSize: 14,
    textAlign: 'center',
  },
};

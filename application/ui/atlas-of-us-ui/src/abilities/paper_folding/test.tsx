import type { CSSProperties } from 'react';
import { brownRed } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { type Fold, type Folding, FOLDING_ITEMS, FOLDING_PRACTICE, type Hole, PAPER, regions } from './items';

const BOX = `-0.4 -0.4 ${PAPER + 0.8} ${PAPER + 0.8}`;

//one step of the folding: the paper as it is, with the half that's folded over shaded and an arrow showing where it goes
function FoldStep({ folds, step }: { folds: Fold[]; step: number }) {
  const shown = regions(folds);
  const r = shown[step];
  const fold = folds[step];
  const stays = step < folds.length ? shown[step + 1] : r;
  const moving = fold && {
    x0: fold === 'left' ? r.x0 : fold === 'right' ? stays.x1 : r.x0,
    x1: fold === 'left' ? stays.x0 : r.x1,
    y0: fold === 'top' ? r.y0 : fold === 'bottom' ? stays.y1 : r.y0,
    y1: fold === 'top' ? stays.y0 : r.y1,
  };
  const center = (g: { x0: number; x1: number; y0: number; y1: number }) => [(g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2];
  return (
    <svg width={96} height={96} viewBox={BOX} aria-hidden="true">
      <defs>
        <marker id={`arrow-${step}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={brownRed} />
        </marker>
      </defs>
      <rect x={0} y={0} width={PAPER} height={PAPER} fill="none" stroke="#bbb" strokeWidth={0.04} strokeDasharray="0.15 0.12" />
      <rect x={r.x0} y={r.y0} width={r.x1 - r.x0} height={r.y1 - r.y0} fill="#fff" stroke="#2b2b2b" strokeWidth={0.06} />
      {moving && (
        <>
          <rect x={moving.x0} y={moving.y0} width={moving.x1 - moving.x0} height={moving.y1 - moving.y0} fill="#ddd" stroke="#2b2b2b" strokeWidth={0.06} />
          <line
            x1={center(moving)[0]}
            y1={center(moving)[1]}
            x2={center(stays)[0]}
            y2={center(stays)[1]}
            stroke={brownRed}
            strokeWidth={0.1}
            markerEnd={`url(#arrow-${step})`}
          />
        </>
      )}
    </svg>
  );
}

//the folded paper with the hole punched through it
function Punched({ folding }: { folding: Folding }) {
  const r = regions(folding.folds)[folding.folds.length];
  return (
    <svg width={96} height={96} viewBox={BOX} aria-hidden="true">
      <rect x={0} y={0} width={PAPER} height={PAPER} fill="none" stroke="#bbb" strokeWidth={0.04} strokeDasharray="0.15 0.12" />
      <rect x={r.x0} y={r.y0} width={r.x1 - r.x0} height={r.y1 - r.y0} fill="#fff" stroke="#2b2b2b" strokeWidth={0.06} />
      <circle cx={folding.punch[0] + 0.5} cy={folding.punch[1] + 0.5} r={0.22} fill="#2b2b2b" />
    </svg>
  );
}

//the whole sheet unfolded, with its holes
function Unfolded({ holes }: { holes: Hole[] }) {
  return (
    <svg width={84} height={84} viewBox={BOX} aria-hidden="true">
      <rect x={0} y={0} width={PAPER} height={PAPER} fill="#fff" stroke="#2b2b2b" strokeWidth={0.06} />
      {holes.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x + 0.5} cy={y + 0.5} r={0.22} fill="#2b2b2b" />
      ))}
    </svg>
  );
}

const foldingItem = (f: Folding): Item => ({
  prompt: (
    <div style={styles.steps} role="img" aria-label={`The paper folded ${f.folds.length} times, then punched`}>
      {f.folds.map((_, i) => (
        <FoldStep key={i} folds={f.folds} step={i} />
      ))}
      <Punched folding={f} />
    </div>
  ),
  choices: f.choices.map((holes, i) => <Unfolded key={i} holes={holes} />),
  answer: f.answer,
  columns: 5,
});

//visualization: where the holes end up when folded paper is punched and unfolded
export function PaperFolding({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question shows a square of paper being folded – one step at a time, from left to right. In each step the
          gray part folds over along the arrow. Once it's folded, a hole is punched through every layer of it. Picture
          the paper being opened out again, and pick the drawing that shows where all the holes end up. You'll start
          with two practice questions, and after each one I'll tell you whether you got it right. Then come the{' '}
          {TIMED.folding.count} that count, and you have {clock(TIMED.folding.seconds)} to answer as many as you can.
          Any you don't reach count as wrong, so if one has you stuck, make your best guess and move on.
        </p>
      }
      practice={FOLDING_PRACTICE.map(foldingItem)}
      items={FOLDING_ITEMS.map(foldingItem)}
      seconds={TIMED.folding.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  steps: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
};

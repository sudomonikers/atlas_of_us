import type { CSSProperties } from 'react';
import { brownRed, comic, gunmetal } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { type Figure, type Matrix, MATRIX_ITEMS, MATRIX_PRACTICE } from './items';

//a figure's color: blue, orange or green, which stay easy to tell apart for people who are color-blind
const COLORS = ['#0072b2', '#e69f00', '#009e73'];
//how big each shape is, as its radius in an 80 by 80 box: small, medium and large are the same size whatever the count,
//and far enough apart to tell at a glance
const SIZES = [5.5, 10, 16];

//one shape, centered on a point, with room r around it
function shapeAt(shape: number, x: number, y: number, r: number, fill: string, key: number) {
  const line = { fill, stroke: '#2b2b2b', strokeWidth: 1.5 };
  if (shape === 0) return <circle key={key} cx={x} cy={y} r={r} {...line} />;
  if (shape === 1) return <rect key={key} x={x - r * 0.85} y={y - r * 0.85} width={r * 1.7} height={r * 1.7} {...line} />;
  if (shape === 2) return <polygon key={key} points={`${x},${y - r} ${x + r * 0.95},${y + r * 0.75} ${x - r * 0.95},${y + r * 0.75}`} {...line} />;
  return <polygon key={key} points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} {...line} />;
}

//a cell's figure: one to three of a shape, in an 80 by 80 box
function FigureView({ figure, size = 76 }: { figure: Figure; size?: number }) {
  const { shape, count, color } = figure;
  const r = SIZES[figure.size];
  const spots: [number, number][] =
    count === 1 ? [[40, 40]] : count === 2 ? [[20, 40], [60, 40]] : [[40, 20], [20, 59], [60, 59]];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      {spots.map(([x, y], i) => shapeAt(shape, x, y, r, COLORS[color], i))}
    </svg>
  );
}

function MatrixGrid({ matrix }: { matrix: Matrix }) {
  return (
    <div style={styles.grid} role="img" aria-label="A grid of eight figures with the last one missing">
      {[...matrix.cells, null].map((f, i) => (
        <div key={i} style={styles.cell}>
          {f ? <FigureView figure={f} /> : <span style={styles.missing}>?</span>}
        </div>
      ))}
    </div>
  );
}

const matrixItem = (m: Matrix): Item => ({
  prompt: <MatrixGrid matrix={m} />,
  choices: m.choices.map((f, i) => <FigureView key={i} figure={f} />),
  answer: m.answer,
  columns: 6,
});

//inductive reasoning: pick the figure that completes the grid
export function Matrices({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each puzzle is a grid of figures in three rows. Along each row the figures change by one or more rules: the
          shape might change, or how many there are, how big they are or what color they are. The last figure in the
          bottom row is missing. Work out the rules from the rows above it, then pick the figure that fits the gap.
          You'll start with two practice questions, and after each one I'll tell you whether you got it right. Then come
          the {TIMED.matrices.count} that count, and you have {clock(TIMED.matrices.seconds)} to answer as many as you
          can. Any you don't reach count as wrong, so if one has you stuck, make your best guess and move on.
        </p>
      }
      practice={MATRIX_PRACTICE.map(matrixItem)}
      items={MATRIX_ITEMS.map(matrixItem)}
      seconds={TIMED.matrices.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 80px)',
    gap: 4,
    padding: 4,
    background: gunmetal,
    borderRadius: 6,
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    background: '#fff',
  },
  missing: {
    fontFamily: comic,
    fontSize: 34,
    color: brownRed,
  },
};

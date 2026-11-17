import { BLUE, GRAY, GREEN, ORANGE, type Pt, rect, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Ink, Say } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Figures, Screen } from '../screen_marks';

//the color of each column, as the puzzle's second rule
const COLUMN = [BLUE, ORANGE, GREEN];
//the grid's cells and the choices' boxes, in the screen's units
const CELL = 76;
const GRID: Pt = [80, 66];
const BOX = 76;
//the four choices, two by two beside the grid: shape, count and color. The second is the answer
const CHOICES: { at: Pt; kind: number; count: number; c: string }[] = [
  { at: [376, 104], kind: 2, count: 3, c: ORANGE },
  { at: [462, 104], kind: 2, count: 3, c: GREEN },
  { at: [376, 192], kind: 2, count: 2, c: GREEN },
  { at: [462, 192], kind: 0, count: 3, c: GREEN },
];
const ANSWER = 1;

const center = ([x, y]: Pt, size: number): Pt => [x + size / 2, y + size / 2];

export const matrices: Motion = {
  label: 'A grid of shapes changing along each row with the last one missing, and the piece that fits moving into the gap',
  period: 5,
  still: 4.2,
  draw: (time) => {
    const moving = ease(through(time, 2.6, 3.6));
    const from = center(CHOICES[ANSWER].at, BOX);
    const gap = center([GRID[0] + 2 * CELL, GRID[1] + 2 * CELL], CELL);
    const answer: Pt = [mix(from[0], gap[0], moving), mix(from[1], gap[1], moving)];
    const picked = time > 1.8;
    return (
      <Screen>
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const [x, y] = [GRID[0] + col * CELL, GRID[1] + row * CELL];
            return (
              <g key={`${row}${col}`}>
                <Ink d={rect(x, y, CELL, CELL)} c={GRAY} w={3} />
                {(row < 2 || col < 2) && <Figures kind={row} count={col + 1} x={x + CELL / 2} y={y + CELL / 2} c={COLUMN[col]} />}
              </g>
            );
          }),
        )}
        {moving < 0.4 && <Say x={gap[0]} y={gap[1] + 16} text="?" size={44} c={RED} />}
        {CHOICES.map(({ at: [x, y], kind, count, c }, i) => (
          <g key={i}>
            <Ink d={rect(x, y, BOX, BOX)} c={i === ANSWER && picked ? RED : GRAY} w={i === ANSWER && picked ? 5 : 3} />
            {i !== ANSWER && <Figures kind={kind} count={count} x={x + BOX / 2} y={y + BOX / 2} c={c} />}
          </g>
        ))}
        <Figures kind={2} count={3} x={answer[0]} y={answer[1]} c={GREEN} />
      </Screen>
    );
  },
};

import { circle, GRAY, line, type Pt, rect, shape } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Ink, Say } from '../motion_marks';
import { Button, Screen } from '../screen_marks';

//one of the nine symbols of symbol matching, drawn in strokes
function symbol(i: number, x: number, y: number, s: number): string {
  const p = (dx: number, dy: number): Pt => [x + dx * s, y + dy * s];
  return [
    line(p(-1, 0), p(1, 0)) + line(p(0, -1), p(0, 1)),
    circle(x, y, s) + circle(x, y, s * 0.2),
    shape(p(0, -1), p(1, 0.8), p(-1, 0.8)),
    line(p(-0.5, -1), p(-0.5, 1)) + line(p(0.5, -1), p(0.5, 1)),
    line(p(-1, -1), p(1, 1)) + line(p(1, -1), p(-1, 1)),
    `M ${x - s} ${y + s * 0.4} a ${s} ${s} 0 0 1 ${2 * s} 0`,
    rect(x - s, y - s, 2 * s, 2 * s) + line(p(-1, 1), p(1, -1)),
    line(p(-1, 0.6), p(-0.4, -0.6), p(0.2, 0.6), p(1, -0.6)),
    line(p(-1, -1), p(1, -1)) + line(p(0, -1), p(0, 1)),
  ][i];
}
const SYMBOL_DIGITS = [3, 7, 1, 9, 5, 2, 8, 4, 6];

export const symbols: Motion = {
  label: 'A key pairing nine symbols with digits, and the digit for each symbol that appears being pressed',
  period: 3.6,
  still: 1,
  draw: (time) => {
    const asked = [2, 6, 4][Math.floor(time / 1.2) % 3];
    const pressing = time % 1.2 > 0.7;
    return (
      <Screen>
        {SYMBOL_DIGITS.map((digit, i) => (
          <g key={i}>
            <Ink d={rect(66 + i * 52, 40, 48, 76)} c={GRAY} w={3} />
            <Ink d={symbol(i, 90 + i * 52, 64, 12)} w={3.5} />
            <Say x={90 + i * 52} y={106} text={String(digit)} size={24} />
          </g>
        ))}
        <Ink d={symbol(asked, 300, 186, 34)} w={7} />
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <Button key={d} x={66 + (d - 1) * 52} y={262} w={46} label={String(d)} on={pressing && d === SYMBOL_DIGITS[asked]} />
        ))}
      </Screen>
    );
  },
};

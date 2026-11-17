import { BLUE, circle, GRAY, INK, line, type Pt, rect, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { mix } from '../screen_kit';
import { Screen } from '../screen_marks';

export const designs: Motion = {
  label: 'Five dots joined by four lines into a design, then a fresh box and a different design, the designs made lined up below',
  period: 6,
  still: 2.6,
  draw: (time) => {
    //the dots, as a pentagon, and three designs of four lines each
    const dot = (i: number, x: number, y: number, r: number): Pt => [x + r * Math.cos(((-90 + i * 72) * Math.PI) / 180), y + r * Math.sin(((-90 + i * 72) * Math.PI) / 180)];
    const designs: [number, number][][] = [
      [[0, 1], [1, 2], [2, 3], [3, 4]],
      [[0, 2], [2, 4], [4, 1], [1, 3]],
      [[0, 1], [0, 4], [0, 2], [0, 3]],
    ];
    const which = Math.min(designs.length - 1, Math.floor(time / 2));
    const drawn = Math.min(4, Math.floor(((time % 2) / 1.6) * 4) + 1);
    const along = Math.min(1, (((time % 2) / 1.6) * 4) % 1 * 1.4);
    const lines = designs[which].slice(0, drawn);
    return (
      <Screen>
        <Ink d={rect(210, 34, 180, 180)} c={GRAY} w={3} />
        {lines.map(([a, b], k) => {
          const p = dot(a, 300, 128, 70);
          const q = dot(b, 300, 128, 70);
          const end: Pt = k === lines.length - 1 && drawn < 4 ? [mix(p[0], q[0], along), mix(p[1], q[1], along)] : q;
          return <Ink key={k} d={line(p, end)} c={BLUE} w={6} />;
        })}
        {[0, 1, 2, 3, 4].map((i) => {
          const [x, y] = dot(i, 300, 128, 70);
          return <Fill key={i} d={circle(x, y, 9)} c={INK} op={1} />;
        })}
        {designs.slice(0, which).map((design, n) => (
          <g key={n}>
            <Ink d={rect(150 + n * 80, 240, 64, 64)} c={GRAY} w={3} />
            {design.map(([a, b], k) => (
              <Ink key={k} d={line(dot(a, 182 + n * 80, 274, 24), dot(b, 182 + n * 80, 274, 24))} c={BLUE} w={3} />
            ))}
            {[0, 1, 2, 3, 4].map((i) => {
              const [x, y] = dot(i, 182 + n * 80, 274, 24);
              return <Fill key={i} d={circle(x, y, 3.5)} c={INK} op={1} />;
            })}
          </g>
        ))}
        <Say x={520} y={66} text={`0:${String(60 - Math.floor(time * 2)).padStart(2, '0')}`} size={30} c={RED} anchor="end" />
      </Screen>
    );
  },
};

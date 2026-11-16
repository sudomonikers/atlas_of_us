import { BLUE, circle, line, type Pt } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { mix, through } from '../screen_kit';
import { Pointer, Screen } from '../screen_marks';

export const trailMaking: Motion = {
  label: 'Circles numbered and lettered on a screen, tapped in turn, 1, A, 2, B, 3, C, 4, with a line joining them',
  period: 5,
  still: 4.4,
  draw: (time) => {
    const spots: [string, number, number][] = [['1', 120, 240], ['A', 210, 100], ['2', 300, 220], ['B', 420, 90], ['3', 490, 220], ['C', 390, 300], ['4', 250, 310]];
    const along = through(time, 0.3, 4) * (spots.length - 1);
    const done = Math.floor(along);
    const trail: Pt[] = spots.slice(0, done + 1).map(([, x, y]) => [x, y]);
    if (done < spots.length - 1) {
      const [, x0, y0] = spots[done];
      const [, x1, y1] = spots[done + 1];
      trail.push([mix(x0, x1, along % 1), mix(y0, y1, along % 1)]);
    }
    return (
      <Screen>
        <Ink d={line(...trail)} c={BLUE} w={5} />
        {spots.map(([name, x, y], i) => (
          <g key={name}>
            <Fill d={circle(x, y, 24)} c={i <= done ? BLUE : '#fff'} op={i <= done ? 0.3 : 1} />
            <Ink d={circle(x, y, 24)} w={4} />
            <Say x={x} y={y + 10} text={name} size={28} />
          </g>
        ))}
        <Pointer at={trail[trail.length - 1]} />
      </Screen>
    );
  },
};

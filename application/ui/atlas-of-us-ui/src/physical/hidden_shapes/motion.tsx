import { GRAY, line, type Pt, rect, RED, shape } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Ink } from '../motion_marks';
import { Screen } from '../screen_marks';

//a few lines in a box, with a triangle hidden among them in one
const HIDDEN_LINES: Pt[][] = [
  [[-40, -30], [40, 20]],
  [[-30, 40], [30, -40]],
  [[-45, 5], [45, 5]],
  [[10, -45], [-20, 45]],
];
const TRIANGLE: Pt[] = [[-28, 22], [0, -26], [28, 22]];

export const hiddenShapes: Motion = {
  label: 'A simple triangle, and four drawings of crossing lines, with the one it is hidden in picked out',
  period: 4.6,
  still: 3.6,
  draw: (time) => (
    <Screen>
      <Ink d={rect(250, 36, 100, 100)} c={GRAY} w={3} />
      <Ink d={shape(...TRIANGLE.map(([x, y]): Pt => [300 + x, 86 + y]))} w={5} />
      {[0, 1, 2, 3].map((i) => {
        const cx = 120 + i * 120;
        const cy = 250;
        const lines = HIDDEN_LINES.map((l, k) => l.map(([x, y]): Pt => (i + k) % 2 ? [x, y] : [-y, x]));
        //the triangle is in the third, and the others have one turned upside down
        const triangle = TRIANGLE.map(([x, y]): Pt => [cx + x, cy + (i === 2 ? y : -y)]);
        return (
          <g key={i}>
            <Ink d={rect(cx - 52, cy - 52, 104, 104)} c={GRAY} w={3} />
            <Ink d={lines.map((l) => line(...l.map(([x, y]): Pt => [cx + x, cy + y]))).join(' ') + ' ' + shape(...triangle)} w={3} />
            {i === 2 && time > 2.2 && <Ink d={shape(...triangle)} c={RED} w={5} />}
            {i === 2 && time > 2.2 && <Ink d={rect(cx - 58, cy - 58, 116, 116)} c={RED} w={4} />}
          </g>
        );
      })}
    </Screen>
  ),
};

import { GREEN, INK, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Ink } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Pointer, Screen } from '../screen_marks';

const EACH = 1.5; //how long each try takes, in seconds
//each try: the tiles' hue, how far the odd one's is from it, in degrees, and which tile it is
const TRIES = [
  { hue: 205, off: 40, odd: 5 },
  { hue: 30, off: 24, odd: 14 },
  { hue: 130, off: 14, odd: 2 },
  { hue: 285, off: 8, odd: 11 },
];
//the grid of tiles: four across and down, each this big with this gap, from here
const TILE = 58;
const GAP = 10;
const LEFT = 169;
const TOP = 50;

const spot = (i: number): [number, number] => [LEFT + (i % 4) * (TILE + GAP), TOP + Math.floor(i / 4) * (TILE + GAP)];

export const colors: Motion = {
  label: 'Sixteen tiles of one color with one a slightly different shade, which is tapped, the difference smaller each time',
  period: TRIES.length * EACH,
  still: 0.2,
  draw: (time) => {
    const n = Math.floor(time / EACH);
    const t = time % EACH;
    const { hue, off, odd } = TRIES[n];
    const [fx, fy] = spot(TRIES[(n + TRIES.length - 1) % TRIES.length].odd);
    const [tx, ty] = spot(odd);
    const move = ease(through(t, 0.3, 0.9));
    const tapped = t > 0.9;
    return (
      <Screen>
        {Array.from({ length: 16 }, (_, i) => {
          const [x, y] = spot(i);
          return <path key={i} d={rect(x, y, TILE, TILE)} fill={`hsl(${i === odd ? hue + off : hue}, 55%, 60%)`} stroke={INK} strokeWidth={3} />;
        })}
        {tapped && <Ink d={rect(tx - 5, ty - 5, TILE + 10, TILE + 10)} c={GREEN} w={6} />}
        <Pointer at={[mix(fx, tx, move) + TILE / 2, mix(fy, ty, move) + TILE / 2]} />
      </Screen>
    );
  },
};

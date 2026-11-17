import { line, ORANGE, type Pt, RED } from '../../shared_components/story/ink';
import { GY, type Motion, type Pose, rad, STAND } from '../motion_kit';
import { Ink, Say } from '../motion_marks';

//jumping out over each side of the hexagon and back in, one side after another
export function hexagonJumps(): [number, Pose][] {
  //standing with the feet together, or in the air with them tucked up
  const at = (dx: number, dy: number, lift: number, y: number): Pose => ({
    ...STAND,
    x: 300 + dx,
    y: y + dy,
    an: [24, -10],
    af: [-24, 10],
    ln: { to: [306 + dx, GY + dy - lift], bend: -1 },
    lf: { to: [294 + dx, GY + dy - lift], bend: 1 },
  });
  const frames: [number, Pose][] = [];
  for (let i = 0; i < 6; i++) {
    const a = rad(i * 60 + 30);
    const dx = 171 * Math.cos(a);
    const dy = 47 * Math.sin(a);
    const t0 = i * 0.7;
    frames.push([t0, at(0, 0, 0, 240)], [t0 + 0.17, at(dx / 2, dy / 2, 34, 196)], [t0 + 0.35, at(dx, dy, 0, 240)], [t0 + 0.52, at(dx / 2, dy / 2, 34, 196)]);
  }
  frames.push([4.2, at(0, 0, 0, 236)]);
  return frames;
}

export const hexagon: Motion = {
  label: 'Someone jumping with both feet out over each side of a hexagon on the floor and back into the middle',
  period: 4.6,
  still: 0.35,
  figure: {
    view: 'front',
    frames: hexagonJumps(),
  },
  under: (time) => {
    const corner = (i: number): Pt => [300 + 150 * Math.cos(rad(i * 60)), GY - 6 + 40 * Math.sin(rad(i * 60))];
    const side = Math.floor(time / 0.7);
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Ink key={i} d={line(corner(i), corner(i + 1))} c={i === side ? RED : ORANGE} w={i === side ? 8 : 5} />
        ))}
        <Say x={432} y={GY + 26} text="60 cm" size={24} c={ORANGE} anchor="start" />
      </g>
    );
  },
};

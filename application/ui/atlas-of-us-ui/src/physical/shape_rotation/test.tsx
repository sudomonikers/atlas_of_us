import type { CSSProperties } from 'react';
import type { TestProps } from '../self_tests';
import { type Item, ItemTest } from '../test_frame';
import { clock, testStyles } from '../test_kit';
import { TIMED } from '../timed';
import { type Cube, type Rotation as RotationItem, ROTATION_ITEMS, ROTATION_PRACTICE } from './items';

//the angle the shapes are seen from: turned a little and looked down on
const YAW = (35 * Math.PI) / 180;
const PITCH = (28 * Math.PI) / 180;
const LIGHT = (() => {
  const l = [0.45, 0.75, 0.5];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

const view = ([x, y, z]: number[]): number[] => {
  const x1 = x * Math.cos(YAW) + z * Math.sin(YAW);
  const z1 = -x * Math.sin(YAW) + z * Math.cos(YAW);
  return [x1, y * Math.cos(PITCH) - z1 * Math.sin(PITCH), y * Math.sin(PITCH) + z1 * Math.cos(PITCH)];
};

const SIDES: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

//a shape of blocks drawn in 3D: the faces that show, furthest first, shaded by how they face the light
function Blocks({ cubes, size }: { cubes: Cube[]; size: number }) {
  const filled = new Set(cubes.map((c) => c.join()));
  const center = [0, 1, 2].map((a) => cubes.reduce((s, c) => s + c[a], 0) / cubes.length);
  const faces: { points: number[][]; depth: number; light: number }[] = [];
  for (const c of cubes) {
    for (const n of SIDES) {
      if (filled.has([c[0] + n[0], c[1] + n[1], c[2] + n[2]].join())) continue;
      const normal = view(n);
      if (normal[2] <= 0.001) continue;
      //the face's corners: the two directions across it, around the point at the middle of the face
      const [u, v] = SIDES.filter((s) => s.every((x, i) => x * n[i] === 0) && s.some((x) => x > 0));
      const middle = [0, 1, 2].map((a) => c[a] - center[a] + n[a] / 2);
      const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => view([0, 1, 2].map((i) => middle[i] + (u[i] * a + v[i] * b) / 2)));
      faces.push({
        points: corners,
        depth: corners.reduce((s, p) => s + p[2], 0) / 4,
        light: 0.35 + 0.65 * Math.max(0, normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2]),
      });
    }
  }
  faces.sort((a, b) => a.depth - b.depth);
  const reach = Math.max(...faces.flatMap((f) => f.points.flatMap((p) => [Math.abs(p[0]), Math.abs(p[1])]))) + 0.3;
  return (
    <svg width={size} height={size} viewBox={`${-reach} ${-reach} ${reach * 2} ${reach * 2}`} aria-hidden="true">
      {faces.map((f, i) => {
        const g = Math.round(90 + 150 * f.light);
        return (
          <polygon
            key={i}
            points={f.points.map((p) => `${p[0]},${-p[1]}`).join(' ')}
            fill={`rgb(${g}, ${g}, ${Math.min(255, g + 12)})`}
            stroke="#2b2b2b"
            strokeWidth={0.05}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

const rotationItem = (r: RotationItem): Item => ({
  prompt: (
    <>
      <Blocks cubes={r.target} size={170} />
      <span style={styles.small}>Which one is this shape turned around?</span>
    </>
  ),
  choices: r.choices.map((c, i) => <Blocks key={i} cubes={c} size={120} />),
  answer: r.answer,
  columns: 4,
});

//visualization: pick the shape that's the first one turned, not its mirror image
export function Rotation({ onDone, onCancel }: TestProps) {
  return (
    <ItemTest
      intro={
        <p style={testStyles.text}>
          Each question shows a shape made of blocks. Of the four shapes below it, one is the same shape turned to a
          different angle, and the other three are its mirror image – which no amount of turning can make match. Turn
          the shapes around in your head and pick the one that's really the same. You'll start with two practice
          questions, and after each one I'll tell you whether you got it right. Then come the {TIMED.rotation.count}{' '}
          that count, and you have {clock(TIMED.rotation.seconds)} to answer as many as you can. Any you don't reach
          count as wrong, so if one has you stuck, make your best guess and move on.
        </p>
      }
      practice={ROTATION_PRACTICE.map(rotationItem)}
      items={ROTATION_ITEMS.map(rotationItem)}
      seconds={TIMED.rotation.seconds}
      onDone={onDone}
      onCancel={onCancel}
    />
  );
}

const styles: Record<string, CSSProperties> = {
  small: {
    fontSize: 14,
  },
};

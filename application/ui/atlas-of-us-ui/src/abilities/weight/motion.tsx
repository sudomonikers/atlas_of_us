import { BLUE, GRAY, GREEN, INK, line, rect } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { GY, type Motion, STAND } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';

//a scale under the feet, its reading settling once someone's on it
export const scale = (unit: string): Motion => ({
  label: `Someone stepping onto a scale, which settles on a reading in ${unit}`,
  period: 4.4,
  still: 3,
  figure: {
    view: 'front',
    frames: [
      [0, { ...STAND, x: 180 }],
      [0.5, { ...STAND, x: 240, y: 222, ln: [12, -4], lf: [-12, 8] }],
      [1, { ...STAND, y: 222 }],
      [3.9, { ...STAND, y: 222 }],
    ],
  },
  under: () => (
    <g>
      <Floor />
      <Fill d={rect(240, GY - 12, 120, 14)} c={BLUE} op={0.25} />
      <Ink d={rect(240, GY - 12, 120, 14)} w={5} />
    </g>
  ),
  draw: (time) => {
    const settled = Math.min(1, Math.max(0, (time - 1.1) / 1.4));
    const shown = time < 1 ? '- - -' : settled < 1 ? (40 + ((Math.floor(time * 14) * 37) % 60)).toFixed(1) : unit === '%' ? '18.0' : '70.0';
    return (
      <g>
        <Ink d={rect(410, 90, 140, 70)} w={5} />
        <Say x={480} y={138} text={`${shown} ${unit}`} size={30} c={settled === 1 ? GREEN : INK} />
        <Ink d={line([410, 160], [352, GY - 14])} c={GRAY} w={3} />
      </g>
    );
  },
});

export const weight: Motion = scale('kg');

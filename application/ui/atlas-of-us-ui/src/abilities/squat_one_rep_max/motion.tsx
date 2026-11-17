import { BLUE, line, rect } from '../../shared_components/story/ink';
import { Floor } from '../body_marks';
import { GY, type Motion, type Pose, STAND } from '../motion_kit';
import { Fill, Ink } from '../motion_marks';

export const squat: Motion = {
  label: 'Someone with a barbell across their shoulders squatting down until their thighs are level, then standing back up',
  period: 3.2,
  still: 1.5,
  figure: {
    view: 'front',
    frames: [234, 234, 298, 298].map((y, i): [number, Pose] => [
      [0, 0.4, 1.4, 1.8][i],
      {
        ...STAND,
        y,
        //hands wide on the bar, which sits across the shoulders behind the neck
        an: { to: [364, y - 90], bend: 1 },
        af: { to: [236, y - 90], bend: -1 },
        //feet a little wider than the hips, with the knees going out over the toes
        ln: { to: [340, GY], bend: -1 },
        lf: { to: [260, GY], bend: 1 },
      },
    ]),
  },
  //the bar and its plates, drawn behind the figure so the head and hands are in front of it
  under: (_, j) => {
    if (!j) return <Floor />;
    const y = j.neck[1] + 4;
    const plate = (x: number) => rect(x - 9, y - 38, 18, 76);
    return (
      <g>
        <Floor />
        <Ink d={line([150, y], [450, y])} w={8} />
        {[170, 192, 408, 430].map((x) => (
          <g key={x}>
            <Fill d={plate(x)} c={BLUE} op={0.35} />
            <Ink d={plate(x)} w={5} />
          </g>
        ))}
      </g>
    );
  },
};

import { circle, GRAY, INK, rect, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { ease, through } from '../screen_kit';
import { Screen } from '../screen_marks';

export const paperFolding: Motion = {
  label: 'A square of paper folded in half, a hole punched through it, and the paper unfolded showing two holes',
  period: 6,
  still: 4.6,
  draw: (time) => {
    //the right half folds over onto the left, then opens again
    const fold = time < 3 ? ease(through(time, 0.4, 1.4)) : 1 - ease(through(time, 3, 4));
    const flapEdge = 300 + 90 * Math.cos(Math.PI * fold);
    const punched = time > 2;
    return (
      <Screen>
        <Fill d={rect(210, 80, 90, 180)} c="#fff" op={1} />
        <Ink d={rect(210, 80, 90, 180)} w={4} />
        {fold < 1 && (
          <g>
            <Fill d={rect(Math.min(300, flapEdge), 80, Math.abs(flapEdge - 300), 180)} c={fold > 0.5 ? GRAY : '#fff'} op={fold > 0.5 ? 0.35 : 1} />
            <Ink d={rect(Math.min(300, flapEdge), 80, Math.abs(flapEdge - 300), 180)} w={4} />
          </g>
        )}
        {fold === 1 && <Fill d={rect(210, 80, 90, 180)} c={GRAY} op={0.35} />}
        {punched && <Fill d={circle(250, 130, 13)} c={INK} op={0.85} />}
        {punched && fold < 0.5 && <Fill d={circle(350, 130, 13)} c={INK} op={0.85} />}
        {time < 1.5 && <Ink d={`M 360 60 Q 300 20 240 60`} c={RED} w={4} />}
        {time > 1.7 && time < 2.3 && <Ink d={circle(250, 130, 24)} c={RED} w={4} />}
        <Say x={300} y={310} text={time < 2 ? 'fold' : time < 3 ? 'punch' : 'unfold'} size={30} c={GRAY} />
      </Screen>
    );
  },
};

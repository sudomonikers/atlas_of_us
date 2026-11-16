import { BLUE, circle, GRAY, type Pt, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { Pointer, Screen } from '../screen_marks';

export const trackCount: Motion = {
  label: 'A pointer kept on a dot drifting around a screen, while high beeps are counted and low ones ignored',
  period: 6,
  still: 2.8,
  draw: (time) => {
    const at = (t: number): Pt => [300 + 170 * Math.sin(t * 1.05), 190 + 90 * Math.sin(t * 2.1 + 0.6)];
    const dot = at(time);
    const pointer = at(time - 0.12);
    const beeps: [number, boolean][] = [[0.7, true], [1.6, false], [2.5, true], [3.6, true], [4.6, false]];
    const sounding = beeps.find(([t]) => time > t && time < t + 0.5);
    const counted = beeps.filter(([t, high]) => high && time > t).length;
    return (
      <Screen>
        <Fill d={circle(dot[0], dot[1], 20)} c={BLUE} op={0.8} />
        <Pointer at={pointer} />
        {sounding && (
          <g>
            <Ink d={`M 74 56 h 14 l 16 -14 v 44 l -16 -14 h -14 Z`} w={4} />
            <Ink d={`M 114 52 q 10 12 0 24 M 124 44 q 18 20 0 40`} w={4} />
            <Say x={150} y={74} text={sounding[1] ? 'high' : 'low'} size={28} c={sounding[1] ? RED : GRAY} anchor="start" />
          </g>
        )}
        <Say x={520} y={74} text={`count: ${counted}`} size={28} c={RED} anchor="end" />
      </Screen>
    );
  },
};

import { BLUE, circle, GRAY, line, RED, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { mix, through } from '../screen_kit';
import { Button, Screen } from '../screen_marks';

const TRY = 3; //how long each try takes, in seconds
const FROM = 100; //where the dot starts, the line, and where the cover starts on the second try
const LINE = 420;
const COVER = 290;
const STOPPED = 1.9; //when it's stopped, just short of the line on the first try and just past it on the second
const REACHES = [1.95, 1.86]; //when the dot would reach the line on each try

export const timing: Motion = {
  label: 'A dot sliding along a track toward a line, stopped as it reaches it, then again with the end of its path hidden',
  period: 2 * TRY,
  still: 1.5,
  draw: (time) => {
    const n = time < TRY ? 0 : 1;
    const t = time % TRY;
    const along = (s: number) => mix(FROM, LINE, through(s, 0.4, REACHES[n]));
    const x = along(Math.min(t, STOPPED));
    const hidden = n === 1;
    const off = Math.round((REACHES[n] - STOPPED) * 1000);
    return (
      <Screen>
        <Fill d={rect(70, 110, 460, 100)} c="#fff" op={1} />
        <Ink d={rect(70, 110, 460, 100)} c={GRAY} w={4} />
        {(!hidden || t > STOPPED) && <Fill d={circle(x, 160, 20)} c={BLUE} op={0.85} />}
        {hidden && t < STOPPED && x < COVER && <Fill d={circle(x, 160, 20)} c={BLUE} op={0.85} />}
        {hidden && t < STOPPED && <Fill d={rect(COVER, 110, LINE - COVER, 100)} c={GRAY} op={0.55} />}
        <Ink d={line([LINE, 118], [LINE, 202])} c={RED} w={5} />
        {t > STOPPED && <Say x={300} y={84} text={`${Math.abs(off)} ms ${off > 0 ? 'early' : 'late'}`} size={32} c={RED} />}
        <Button x={220} y={262} w={160} label="Stop" on={t > STOPPED && t < STOPPED + 0.3} />
      </Screen>
    );
  },
};

import { circle, GRAY, RED, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { Button, Screen } from '../screen_marks';

//each try: when the circle appears after the wait, how long the press takes, and the time shown for it
const TRIES = [
  { at: 1.1, took: 0.26, ms: '262 ms' },
  { at: 3.5, took: 0.22, ms: '224 ms' },
];
const SHOWN = 0.8; //how long the time stays up after the press, in seconds

export const reactionTime: Motion = {
  label: 'An empty box, then a circle appearing in it and the space bar pressed straight away, with the time it took',
  period: 4.8,
  still: 1.2,
  draw: (time) => {
    const now = [...TRIES].reverse().find((t) => time > t.at);
    const showing = now && time < now.at + now.took;
    const pressed = now && time > now.at + now.took && time < now.at + now.took + 0.25;
    const result = now && time > now.at + now.took && time < now.at + now.took + SHOWN;
    return (
      <Screen>
        <Fill d={rect(90, 44, 420, 220)} c="#fff" op={1} />
        <Ink d={rect(90, 44, 420, 220)} c={GRAY} w={4} />
        {showing && <Fill d={circle(300, 154, 56)} c={RED} op={0.85} />}
        {!showing && !result && <Say x={300} y={166} text="wait..." size={34} c={GRAY} />}
        {result && <Say x={300} y={168} text={now.ms} size={44} c={RED} />}
        <Button x={150} y={284} w={300} label="space" on={!!pressed} c={RED} />
      </Screen>
    );
  },
};

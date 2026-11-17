import { BLUE, GRAY, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Button, Headphones, Pointer, Screen, Waves } from '../screen_marks';

const EAR = 3; //how long each ear takes, in seconds
const FADING = 2.4; //how long the tone fades before it's pressed
const BARS = 8;

export const hearing: Motion = {
  label: "A pulsing tone in one side of a pair of headphones fading away, and I can't hear it pressed once it's gone, then the other ear",
  period: 2 * EAR,
  still: 1,
  draw: (time) => {
    const right = time < EAR;
    const t = time % EAR;
    const level = Math.max(0, 1 - t / FADING);
    const sounding = t < FADING && t % 0.7 < 0.45;
    const move = ease(through(t, 1.3, 2.3));
    return (
      <Screen>
        <Say x={300} y={66} text={right ? 'Right ear' : 'Left ear'} size={30} c={GRAY} />
        <Headphones x={300} y={170} />
        {sounding && <Waves x={right ? 368 : 232} y={196} k={right ? 1 : -1} beat={(time * 1.6) % 1} op={0.15 + 0.85 * level} />}
        {Array.from({ length: BARS }, (_, i) => {
          const lit = t < FADING && i < Math.ceil(level * BARS);
          return (
            <g key={i}>
              <Fill d={rect(478, 226 - i * 18, 40, 12)} c={lit ? BLUE : '#fff'} op={lit ? 0.6 : 1} />
              <Ink d={rect(478, 226 - i * 18, 40, 12)} c={GRAY} w={3} />
            </g>
          );
        })}
        <Button x={175} y={270} w={250} label="I can't hear it" on={t > FADING - 0.05 && t < FADING + 0.4} />
        <Pointer at={[mix(470, 320, move), mix(318, 292, move)]} />
      </Screen>
    );
  },
};

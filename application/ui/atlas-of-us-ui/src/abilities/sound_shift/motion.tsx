import { circle, INK, line, ORANGE, rect, shape } from '../../shared_components/story/ink';
import { type Motion, SKIN } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Burst, Button, Pointer } from '../screen_marks';

const TRY = 3; //how long each try takes, in seconds
//when each of the two bursts sounds, and how long
const BURSTS = [0.3, 0.9];
const BURST = 0.4;
const HEAD: [number, number] = [300, 196];

export const soundShift: Motion = {
  label: 'A head in headphones seen from above, with a sound just to one side of straight ahead and then just to the other, and the way it moved pressed',
  period: 2 * TRY,
  still: 1.8,
  draw: (time) => {
    const k = time < TRY ? 1 : -1; //right, then left
    const t = time % TRY;
    const [hx, hy] = HEAD;
    const heard = BURSTS.map((at) => t > at && t < at + BURST);
    const moved = t > BURSTS[1];
    const button = k > 0 ? 395 : 205;
    const move = ease(through(t, 1.5, 2.1));
    return (
      <g>
        <Fill d={circle(hx, hy, 50)} c={SKIN} op={1} />
        <Fill d={circle(hx, hy + 9, 44)} c={INK} op={0.55} />
        <Ink d={circle(hx, hy, 50)} w={6} />
        <Fill d={shape([hx - 10, hy - 48], [hx, hy - 64], [hx + 10, hy - 48])} c={SKIN} op={1} />
        <Ink d={line([hx - 10, hy - 48], [hx, hy - 64], [hx + 10, hy - 48])} w={5} />
        <Ink d={line([hx - 50, hy + 4], [hx + 50, hy + 4])} w={6} />
        {[-1, 1].map((s) => (
          <g key={s}>
            <Fill d={rect(hx + s * 58 - 11, hy - 20, 22, 48)} c={ORANGE} op={0.6} />
            <Ink d={rect(hx + s * 58 - 11, hy - 20, 22, 48)} w={5} />
            <Say x={hx + s * 92} y={hy + 14} text={s < 0 ? 'L' : 'R'} size={30} />
          </g>
        ))}
        {moved && <Ink d={line([hx - k * 60, 70], [hx + k * 30, 70]) + ' ' + line([hx + k * 18, 58], [hx + k * 32, 70], [hx + k * 18, 82])} c={ORANGE} w={5} op={0.6} />}
        {heard.map((on, i) => on && <Burst key={i} x={hx + (i ? k : -k) * 70} y={70} />)}
        <Button x={140} y={300} w={130} label="Left" on={k < 0 && t > 2.1 && t < 2.6} />
        <Button x={330} y={300} w={130} label="Right" on={k > 0 && t > 2.1 && t < 2.6} />
        <Pointer at={[mix(300, button, move), mix(350, 322, move)]} />
      </g>
    );
  },
};

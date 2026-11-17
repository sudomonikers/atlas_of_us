import { BLUE, GRAY } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Say } from '../motion_marks';
import { typed } from '../screen_kit';
import { Bubble, Screen, Talker, Typing } from '../screen_marks';

//when each digit is said and how long it shows, in seconds
const SAID = [0.3, 1.2, 2.1];
const SHOWN = 0.7;
//the three talkers: where, who, and the digits each says, the man in the middle the one to follow
const TALKERS = [
  { x: 150, woman: true, digits: '915' },
  { x: 300, woman: false, digits: '472' },
  { x: 450, woman: false, digits: '386' },
];

export const voices: Motion = {
  label: 'Three people saying different digits at the same time, and the three said by the man in the middle typed in',
  period: 6.4,
  still: 1.4,
  draw: (time) => {
    const saying = SAID.findIndex((at) => time > at && time < at + SHOWN);
    const answering = time > 3;
    return (
      <Screen>
        {TALKERS.map(({ x, woman, digits }, i) => {
          const followed = i === 1;
          return (
            <g key={x}>
              <Talker x={x} y={262} woman={woman} talking={saying >= 0} c={followed ? BLUE : GRAY} />
              {saying >= 0 && (
                <g>
                  <Bubble x={x} y={128} rx={followed ? 66 : 56} ry={followed ? 56 : 46} to={[x, 222]} c={followed ? BLUE : GRAY} w={followed ? 6 : 4} />
                  <Say x={x} y={followed ? 152 : 146} text={digits[saying]} size={followed ? 72 : 52} c={followed ? BLUE : GRAY} />
                </g>
              )}
            </g>
          );
        })}
        {answering && <Typing x={210} y={70} w={180} text={typed('472', time, 3.4, 0.4)} right={time > 4.8} />}
      </Screen>
    );
  },
};

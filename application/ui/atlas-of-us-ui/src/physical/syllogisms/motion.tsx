import { BLUE, INK } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Say } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Button, Pointer, Screen } from '../screen_marks';

export const syllogisms: Motion = {
  label: 'Two statements about made-up things and a conclusion on a screen, and the answer that it follows being picked',
  period: 6,
  still: 5,
  draw: (time) => (
    <Screen>
      {['All blicks are florps.', 'No florps are zans.', 'So no blicks are zans.'].map((said, i) =>
        time > 0.3 + i * 0.8 ? <Say key={said} x={90} y={90 + i * 56} text={said} size={34} anchor="start" c={i === 2 ? BLUE : INK} /> : null,
      )}
      {time > 2.4 && <Button x={120} y={270} w={160} label="It follows" on={time > 3.6} />}
      {time > 2.4 && <Button x={320} y={270} w={180} label="It doesn't" />}
      {time > 2.4 && <Pointer at={[mix(400, 200, ease(through(time, 2.6, 3.4))), mix(320, 292, ease(through(time, 2.6, 3.4)))]} />}
    </Screen>
  ),
};

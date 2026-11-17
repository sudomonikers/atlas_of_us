import { line, rect, RED, shape } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { typed } from '../screen_kit';
import { Screen } from '../screen_marks';

export const brickUses: Motion = {
  label: 'A brick, and unusual uses for it being typed onto a screen one after another',
  period: 6.4,
  still: 5.6,
  draw: (time) => {
    const uses = ['doorstop', 'bookend', 'step to reach a shelf', 'crushing garlic'];
    return (
      <Screen>
        <Fill d={shape([80, 150], [190, 150], [220, 125], [110, 125])} c={RED} op={0.5} />
        <Fill d={rect(80, 150, 110, 50)} c={RED} op={0.65} />
        <Fill d={shape([190, 150], [220, 125], [220, 175], [190, 200])} c={RED} op={0.8} />
        <Ink d={shape([80, 150], [110, 125], [220, 125], [220, 175], [190, 200], [80, 200]) + line([80, 150], [190, 150], [220, 125]) + line([190, 150], [190, 200])} w={4} />
        {uses.map((use, i) => (
          <Say key={use} x={250} y={90 + i * 52} text={typed(use, time, i * 1.4, 0.08)} size={30} anchor="start" />
        ))}
      </Screen>
    );
  },
};

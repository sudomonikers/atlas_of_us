import { BOARD, INK, rect } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { typed } from '../screen_kit';
import { Screen, Typing } from '../screen_marks';

export const brokenWords: Motion = {
  label: 'A word with much of it hidden on a screen, and the word typed in',
  period: 4.6,
  still: 3.6,
  draw: (time) => (
    <Screen>
      <text x={300} y={160} fill={INK} fontFamily="Georgia, 'Times New Roman', serif" fontWeight={700} fontSize={84} textAnchor="middle">
        GARDEN
      </text>
      {[[120, 90, 40, 30], [170, 130, 50, 40], [250, 85, 30, 45], [300, 125, 60, 30], [380, 90, 40, 40], [440, 120, 40, 50], [200, 92, 20, 20]].map(([x, y, w, h], i) => (
        <path key={i} d={rect(x, y, w, h)} fill={BOARD} />
      ))}
      <Typing x={210} y={220} w={180} text={typed('garden', time, 1.4, 0.18)} right={time > 2.7} />
    </Screen>
  ),
};

import { BLUE, RED } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Say } from '../motion_marks';
import { ease, mix, through } from '../screen_kit';
import { Screen, SortCard } from '../screen_marks';

export const cardSorting: Motion = {
  label: 'Cards being sorted onto one of four by a hidden rule, told right for one and wrong for the next as the rule changes',
  period: 4.6,
  still: 1.6,
  draw: (time) => {
    const second = time > 2.3;
    const t = second ? time - 2.3 : time;
    const moving = ease(through(t, 0.4, 1.2));
    const card = second ? { color: 0, kind: 1, count: 3, to: 1 } : { color: 3, kind: 0, count: 2, to: 0 };
    const toX = 120 + card.to * 120;
    return (
      <Screen>
        {[0, 1, 2, 3].map((i) => (
          <SortCard key={i} x={120 + i * 120} y={90} color={i} kind={i} count={i + 1} />
        ))}
        <SortCard x={mix(300, toX, moving)} y={mix(260, 200, moving)} color={card.color} kind={card.kind} count={card.count} />
        {t > 1.3 && <Say x={toX + 60} y={214} text={second ? 'Wrong' : 'Right'} size={32} c={second ? RED : BLUE} anchor="start" />}
      </Screen>
    );
  },
};

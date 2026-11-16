import { BLUE, circle, GRAY, GREEN, INK, line, type Pt, rect, RED, shape } from '../../shared_components/story/ink';
import { type Motion } from '../motion_kit';
import { Fill, Ink, Say } from '../motion_marks';
import { ease, through } from '../screen_kit';
import { Screen } from '../screen_marks';

export const perspective: Motion = {
  label: 'A map of a tree, a house and a flag, imagining standing at the tree facing the house, and pointing on a circle toward the flag',
  period: 5,
  still: 4.2,
  draw: (time) => {
    const tree: Pt = [130, 260];
    const house: Pt = [210, 90];
    const flag: Pt = [310, 230];
    const facing = [house[0] - tree[0], house[1] - tree[1]];
    const toward = [flag[0] - tree[0], flag[1] - tree[1]];
    const angle = Math.atan2(facing[0] * toward[1] - facing[1] * toward[0], facing[0] * toward[0] + facing[1] * toward[1]);
    const pointed = angle * ease(through(time, 2.2, 3.2));
    const dial: Pt = [440, 180];
    return (
      <Screen>
        <Ink d={rect(70, 40, 280, 280)} c={GRAY} w={3} />
        <Fill d={circle(tree[0], tree[1] - 16, 20)} c={GREEN} op={0.4} />
        <Ink d={circle(tree[0], tree[1] - 16, 20) + line([tree[0], tree[1] + 4], [tree[0], tree[1] + 22])} w={4} />
        <Ink d={shape([house[0] - 22, house[1]], [house[0], house[1] - 22], [house[0] + 22, house[1]]) + rect(house[0] - 18, house[1], 36, 26)} w={4} />
        <Ink d={line([flag[0], flag[1] + 22], [flag[0], flag[1] - 22])} w={4} />
        <Fill d={shape([flag[0], flag[1] - 22], [flag[0] + 26, flag[1] - 14], [flag[0], flag[1] - 6])} c={RED} op={0.6} />
        {time > 0.6 && <Ink d={line(tree, house)} c={BLUE} w={3} op={0.8} />}
        {time > 3.2 && <Ink d={line(tree, flag)} c={RED} w={3} op={0.8} />}
        <Ink d={circle(dial[0], dial[1], 80)} w={4} />
        <Say x={dial[0]} y={dial[1] - 92} text="ahead" size={22} c={BLUE} />
        <Ink d={line(dial, [dial[0] + 74 * Math.sin(pointed), dial[1] - 74 * Math.cos(pointed)])} c={RED} w={6} />
        <Fill d={circle(dial[0], dial[1], 6)} c={INK} op={1} />
      </Screen>
    );
  },
};

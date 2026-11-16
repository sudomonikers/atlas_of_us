import { type Motion } from '../motion_kit';
import { Arrow, Button, Screen } from '../screen_marks';

export const flanker: Motion = {
  label: 'Rows of five arrows on a screen, and the button for the way the middle one points being pressed, whichever way the others point',
  period: 3.6,
  still: 1.5,
  draw: (time) => {
    const rows: [boolean, boolean][] = [[true, true], [true, false], [false, false], [false, true]]; //the outer arrows' way, then the middle's
    const [outer, middle] = rows[Math.floor(time / 0.9) % rows.length];
    const pressing = time % 0.9 > 0.55;
    return (
      <Screen>
        {[0, 1, 2, 3, 4].map((i) => (
          <Arrow key={i} x={180 + i * 60} y={160} left={i === 2 ? middle : outer} />
        ))}
        <Button x={150} y={262} w={130} label="Left" on={pressing && middle} />
        <Button x={320} y={262} w={130} label="Right" on={pressing && !middle} />
      </Screen>
    );
  },
};

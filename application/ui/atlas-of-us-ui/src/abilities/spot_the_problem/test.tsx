import { type CSSProperties, type PointerEvent, useRef, useState } from 'react';
import { blue, brownRed, gunmetal } from '../../shared_components/palette';
import { type Pt } from '../../shared_components/story/ink';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { clock, testStyles, useCountdown, useCountIn } from '../test_kit';
import { TIMED } from '../timed';
import { H, ITEMS, onIt, PRACTICE, type Scene, W } from './scenes';

//what was said about one picture: the spot tapped as the problem, or nothing wrong
type Said = Pt | 'fine';

//problem sensitivity: a run of everyday pictures, some with one thing wrong and some fine. Tap the problem, or say
//nothing's wrong. The score is how many pictures were right: the problem found where there is one, or said to be fine
//where there isn't. A tap only counts on the problem itself, so pointing at something every time doesn't pay
export function SpotTheProblem({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'practice' | 'between' | 'timed' | 'done'>('ready');
  const [at, setAt] = useState(0);
  const [marked, setMarked] = useState<Pt | null>(null);
  const [told, setTold] = useState<boolean | null>(null); //after a practice answer, whether it was right
  const said = useRef<Said[]>([]);
  const finished = useRef(false);
  const box = useRef<SVGSVGElement>(null);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase('done');
    const parts = ITEMS.map(([scene, wrong], i): Part => {
      const answer = said.current[i];
      const label = `${i + 1}`;
      if (answer === undefined) return { label, right: false, note: `${scene.name}: not reached in time` };
      if (!wrong) {
        return answer === 'fine'
          ? { label, right: true, note: `${scene.name}: nothing wrong, and you said so` }
          : { label, right: false, note: `${scene.name}: nothing was wrong, but you pointed something out` };
      }
      if (answer !== 'fine' && onIt(scene, answer)) return { label, right: true, note: `${scene.name}: you found it. ${scene.problem}` };
      return { label, right: false, note: `${scene.name}: ${answer === 'fine' ? 'you said nothing was wrong' : 'you tapped somewhere else'}. ${scene.problem}` };
    });
    const score = parts.filter((p) => p.right).length;
    onDone(score, {
      how: `One point for each picture you got right, finding the problem where there was one or saying nothing was wrong where there wasn't: ${score} of ${ITEMS.length}. Any not reached before the time ran out count as wrong.`,
      parts,
    });
  };
  const left = useCountdown(TIMED.problems.seconds, phase === 'timed', finish);

  const list = phase === 'practice' ? PRACTICE : ITEMS;
  const [scene, wrong]: [Scene, boolean] = list[at] ?? list[0];

  const point = (e: PointerEvent<SVGSVGElement>) => {
    if (told !== null) return;
    const svg = box.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    setMarked([p.x, p.y]);
  };

  const onward = () => {
    setMarked(null);
    setTold(null);
    if (at + 1 < list.length) return setAt(at + 1);
    setAt(0);
    if (phase === 'practice') return setPhase('between');
    finish();
  };
  const answer = (a: Said) => {
    if (phase === 'practice') return setTold(a === 'fine' ? !wrong : wrong && onIt(scene, a));
    said.current.push(a);
    onward();
  };

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame
      count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          You'll see a run of everyday pictures. Some have one thing wrong with them, something that doesn't work, doesn't
          add up or is about to go wrong, and some are fine. If you spot a problem, tap it and press That's the problem. If
          nothing's wrong, press Nothing's wrong. You get a point for each picture you get right, so only point out a
          problem you can see, and say so when a picture is fine. You'll start with {PRACTICE.length} practice pictures, and I'll
          tell you how you did on each. Then come the {ITEMS.length} that count, with {clock(TIMED.problems.seconds)} for
          them.
        </p>
      }
    >
      {!asking ? (
        <div style={testStyles.arena}>
          {phase === 'done' ? (
            <span style={testStyles.prompt}>Done</span>
          ) : (
            <button
              type="button"
              className="comic-lift"
              style={testStyles.primary}
              onClick={() =>
                countIn(() => {
                  setAt(0);
                  setPhase(phase === 'ready' ? 'practice' : 'timed');
                })
              }
            >
              {phase === 'ready' ? 'Start the practice' : `Start: ${ITEMS.length} in ${clock(TIMED.problems.seconds)}`}
            </button>
          )}
        </div>
      ) : (
        <div style={styles.play}>
          <svg ref={box} viewBox={`0 0 ${W} ${H}`} style={styles.picture} onPointerDown={point} role="img" aria-label={`${scene.name}. Tap anything wrong with it`}>
            <rect x={0} y={0} width={W} height={H} fill="#fbfbf6" />
            {scene.draw(wrong)}
            {told !== null &&
              wrong &&
              scene.where.map(([x, y, w, h], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} rx={8} fill="none" stroke={blue} strokeWidth={3} strokeDasharray="8 5" />
              ))}
            {marked && <circle cx={marked[0]} cy={marked[1]} r={16} fill="none" stroke={brownRed} strokeWidth={4} />}
          </svg>
          {told === null ? (
            <div style={styles.buttons}>
              <button type="button" className="comic-lift" style={testStyles.primary} disabled={!marked} onClick={() => marked && answer(marked)}>
                That's the problem
              </button>
              <button type="button" className="comic-lift" style={testStyles.secondary} onClick={() => answer('fine')}>
                Nothing's wrong
              </button>
            </div>
          ) : (
            <div style={styles.buttons}>
              <span style={testStyles.text}>
                {told ? 'Right. ' : 'Not quite. '}
                {wrong ? `${scene.problem}, outlined in blue.` : 'Nothing was wrong with this one.'}
              </span>
              <button type="button" className="comic-lift" style={testStyles.primary} onClick={onward}>
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${PRACTICE.length}`}
        {phase === 'between' && `Practice done. Now ${ITEMS.length} that count, with ${clock(TIMED.problems.seconds)} on the clock.`}
        {phase === 'timed' && `${at + 1} of ${ITEMS.length} · ${clock(left)} left`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  play: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  picture: {
    width: '100%',
    maxWidth: 640,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
    touchAction: 'none',
    cursor: 'crosshair',
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
};

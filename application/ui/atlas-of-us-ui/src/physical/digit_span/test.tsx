import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { comic } from '../../shared_components/palette';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { Frame } from '../test_frame';
import { chance, shuffled, testStyles, useCountIn } from '../test_kit';

//how many lists of digits, the length the first one starts at, the longest, and how long each digit shows, in ms
const LISTS = 10;
const FIRST_SPAN = 5;
const LONGEST_SPAN = 14;
const DIGIT_SHOWN = 700;
const DIGIT_GAP = 300;

//a list of digits, none repeated until all nine are used, and never the same one twice running
function digits(length: number): string {
  const out: number[] = [];
  let pool: number[] = [];
  while (out.length < length) {
    if (!pool.length) pool = shuffled(chance, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const d = pool.pop()!;
    if (d === out[out.length - 1]) pool.unshift(d);
    else out.push(d);
  }
  return out.join('');
}

//remember a list of digits shown one at a time, and type them back. Getting one right makes the next list a digit
//longer, and it takes two misses in a row to make it a digit shorter. The score is the longest list got right
export function DigitSpan({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<'ready' | 'showing' | 'answering' | 'done'>('ready');
  const [list, setList] = useState('');
  const [shown, setShown] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(0); //lists done
  const length = useRef(FIRST_SPAN);
  const misses = useRef(0);
  const longest = useRef(0);
  const tries = useRef<Part[]>([]); //each list, as it went
  const timers = useRef<number[]>([]);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (phase === 'answering') input.current?.focus();
  }, [phase]);

  const show = () => {
    const next = digits(length.current);
    setList(next);
    setTyped('');
    setPhase('showing');
    [...next].forEach((d, i) => {
      const at = 600 + i * (DIGIT_SHOWN + DIGIT_GAP);
      timers.current.push(window.setTimeout(() => setShown(d), at));
      timers.current.push(window.setTimeout(() => setShown(null), at + DIGIT_SHOWN));
    });
    timers.current.push(window.setTimeout(() => setPhase('answering'), 600 + next.length * (DIGIT_SHOWN + DIGIT_GAP)));
  };

  const answer = () => {
    const said = typed.replace(/\D/g, '');
    const right = said === list;
    tries.current.push({ label: `${list.length} digits`, right, note: right ? list : `It was ${list}, you typed ${said || 'nothing'}` });
    if (right) {
      longest.current = Math.max(longest.current, list.length);
      length.current = Math.min(length.current + 1, LONGEST_SPAN);
      misses.current = 0;
      setNote(`Right: ${list.length} digits.`);
    } else {
      misses.current += 1;
      if (misses.current >= 2) {
        length.current = Math.max(length.current - 1, 2);
        misses.current = 0;
      }
      setNote(`Not quite. It was ${list}.`);
    }
    const lists = done + 1;
    setDone(lists);
    if (lists >= LISTS) {
      setPhase('done');
      //no list right still records the shortest that can be recorded
      const score = Math.max(longest.current, 1);
      onDone(score, {
        how: longest.current
          ? `Your score is the longest list you got right: ${score} digits.`
          : 'Your score is the longest list you got right. None were right, so it records the shortest it can, 1.',
        parts: tries.current,
      });
    } else show();
  };

  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={styles.text}>
          Digits will appear one at a time in the box. When they stop, type them back in the same order and press Enter.
          There are {LISTS} lists in all. Each time you get one right the next is a digit longer, and if you miss two in
          a row the next is a digit shorter. Keep them in your head, without writing them down or saying them out loud.
        </p>
      }
    >
      <div style={styles.arena} aria-live="off">
        {phase === 'ready' && (
          <button type="button" className="comic-lift" style={styles.primary} onClick={() => countIn(show)}>
            Start
          </button>
        )}
        {phase === 'showing' && <span style={styles.digit}>{shown ?? ''}</span>}
        {phase === 'answering' && (
          <form
            style={styles.answer}
            onSubmit={(e) => {
              e.preventDefault();
              answer();
            }}
          >
            <label style={styles.text} htmlFor="digit-span-answer">
              What were they?
            </label>
            <input
              id="digit-span-answer"
              ref={input}
              style={styles.input}
              inputMode="numeric"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
            <button type="submit" className="comic-lift" style={styles.primary}>
              That's it
            </button>
          </form>
        )}
        {phase === 'done' && <span style={styles.prompt}>Done</span>}
      </div>
      <p style={styles.status} aria-live="polite">
        {phase === 'ready' ? '' : `List ${Math.min(done + 1, LISTS)} of ${LISTS}`}
        {note && ` · ${note}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  ...testStyles,
  digit: {
    fontFamily: comic,
    fontSize: 88,
    lineHeight: 1,
    minHeight: 88,
  },
  answer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
};

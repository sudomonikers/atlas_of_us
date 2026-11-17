import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { blue, brownRed, comic, gunmetal, ivory } from '../../shared_components/palette';
import type { Part } from '../scored';
import type { TestProps } from '../self_tests';
import { type Phase, Starter } from '../starter';
import { Frame } from '../test_frame';
import { testStyles, useCountIn } from '../test_kit';
import { type Card, CARDS, CARDS_PRACTICE, KEY_CARDS, RUN_TO_CHANGE, SORT_RULES, type SortRule } from './items';

const CARD_COLORS = [brownRed, '#3c8a4e', '#d9a520', blue];
const CARD_COLOR_NAMES = ['red', 'green', 'yellow', 'blue'];
const CARD_SHAPE_NAMES = ['triangle', 'star', 'cross', 'circle'];
const CARD_SHAPES_MANY = ['triangles', 'stars', 'crosses', 'circles'];

function cardShape(shape: number, x: number, y: number, fill: string, key: number) {
  const line = { fill, stroke: gunmetal, strokeWidth: 1.2 };
  if (shape === 0) return <polygon key={key} points={`${x},${y - 8} ${x + 8},${y + 6} ${x - 8},${y + 6}`} {...line} />;
  if (shape === 1) {
    const points = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 3.6 : 8.5;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
    });
    return <polygon key={key} points={points.join(' ')} {...line} />;
  }
  if (shape === 2) return <path key={key} d={`M${x - 2.5} ${y - 8}h5v5.5h5.5v5h-5.5v5.5h-5v-5.5h-5.5v-5h5.5z`} {...line} />;
  return <circle key={key} cx={x} cy={y} r={7.5} {...line} />;
}

//a card: one to four of a shape in a color
function CardView({ card }: { card: Card }) {
  const spots: [number, number][][] = [[[25, 35]], [[25, 22], [25, 48]], [[25, 14], [25, 35], [25, 56]], [[14, 22], [36, 22], [14, 48], [36, 48]]];
  return (
    <svg width={56} height={78} viewBox="0 0 50 70" role="img" aria-label={`${card.number} ${CARD_COLOR_NAMES[card.color]} ${CARD_SHAPE_NAMES[card.shape]}`}>
      <rect x={1} y={1} width={48} height={68} rx={5} fill="#fff" stroke={gunmetal} strokeWidth={1.5} />
      {spots[card.number - 1].map(([x, y], i) => cardShape(card.shape, x, y, CARD_COLORS[card.color], i))}
    </svg>
  );
}

//what the person can know of the rule from what they've been told so far, and whether a sort was a mistake they could
//have avoided. Each sort follows at most one rule, as no card matches a key card on more than one thing. A right sort
//pins the rule down. A wrong one rules out the rule it followed, and once the rule they'd pinned down is wrong, it has
//changed, to one of the other two. A wrong sort by a rule that could still be the one is a fair guess, as no one could
//have known better, and anything else is avoidable: a rule already ruled out, drifting off the one pinned down, or
//following no rule at all
function sortingSense() {
  let possible = new Set<SortRule>(SORT_RULES);
  return (followed: SortRule | undefined, right: boolean): boolean => {
    const avoidable = !right && (!followed || !possible.has(followed));
    if (!followed) return avoidable;
    if (right) possible = new Set([followed]);
    else if (possible.size === 1 && possible.has(followed)) possible = new Set(SORT_RULES.filter((r) => r !== followed));
    else {
      possible.delete(followed);
      if (!possible.size) possible = new Set(SORT_RULES.filter((r) => r !== followed));
    }
    return avoidable;
  };
}

//category flexibility: sort each card onto one of four by a hidden rule, color, shape or number, worked out from being
//told right or wrong. The rule changes without warning after a run of right answers. Finding the new rule takes a guess
//between the other two, so the score isn't how many were right, which luck sways, but how many mistakes they could have
//avoided, which it doesn't
export function CardSorting({ onDone, onCancel }: TestProps) {
  const [counting, countIn] = useCountIn();
  const [phase, setPhase] = useState<Phase>('ready');
  const [at, setAt] = useState(0);
  const [note, setNote] = useState<{ right: boolean } | null>(null);
  const state = useRef({ rule: 0, run: 0, avoidable: 0, sense: sortingSense(), parts: [] as Part[] });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const list = phase === 'practice' ? CARDS_PRACTICE : CARDS;
  const card = list[at];

  const sort = (onto: number) => {
    if (note || (phase !== 'practice' && phase !== 'timed')) return;
    const s = state.current;
    const rule = SORT_RULES[s.rule % SORT_RULES.length];
    const correct = card[rule] === KEY_CARDS[onto][rule];
    setNote({ right: correct });
    if (phase === 'timed') {
      const followed = SORT_RULES.find((r) => card[r] === KEY_CARDS[onto][r]);
      const avoidable = s.sense(followed, correct);
      if (avoidable) s.avoidable += 1;
      const named = `${card.number} ${CARD_COLOR_NAMES[card.color]} ${card.number > 1 ? CARD_SHAPES_MANY[card.shape] : CARD_SHAPE_NAMES[card.shape]}`;
      const by = followed ? `by ${followed}` : 'by nothing it shared';
      s.parts.push({
        label: `${s.parts.length + 1}`,
        right: correct ? true : avoidable ? false : undefined,
        note: correct
          ? `${named}, sorted by ${rule}`
          : avoidable
            ? `${named}, sorted ${by} when the rule was ${rule}. You could have known better, so it counts`
            : `${named}, sorted ${by} when the rule was ${rule}. A fair guess while working out a new rule, so it doesn't count`,
      });
      if (correct) {
        s.run += 1;
        if (s.run >= RUN_TO_CHANGE) {
          s.rule += 1;
          s.run = 0;
        }
      } else s.run = 0;
    }
    timer.current = window.setTimeout(() => {
      setNote(null);
      if (at + 1 < list.length) return setAt(at + 1);
      setAt(0);
      if (phase === 'practice') return setPhase('between');
      setPhase('done');
      const { avoidable, parts } = state.current;
      onDone(avoidable, {
        how: `Your score is how many mistakes you could have avoided, so lower is better: ${avoidable}. A wrong sort while you're working out a new rule is a fair guess and doesn't count. Sorting by a rule you'd already been told was wrong, or drifting off one you'd found, does.`,
        right: parts.filter((p) => p.right).length,
        wrong: parts.filter((p) => p.right !== true).length,
        parts,
      });
    }, 700);
  };

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame count={counting}
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          Sort each card by tapping one of the four cards at the top to put it on. There's a rule for which one it goes
          on – by color, shape or number – but I won't tell you what it is. All you're told is whether each sort was
          right, so you'll have to work the rule out from that. Every so often the rule changes without warning, and
          when you start getting told you're wrong, it's time to find the new one. You'll have to guess which it's
          become, and a wrong guess you couldn't have known better than doesn't count against you. What counts is the
          mistakes you could have avoided. The practice uses color as the rule, then there are {CARDS.length} cards
          that count.
        </p>
      }
    >
      {asking ? (
        <>
          <div style={styles.keyCards}>
            {KEY_CARDS.map((k, i) => (
              <button key={i} type="button" className="comic-lift" style={styles.keyCard} onClick={() => sort(i)} aria-label={`Sort onto card ${i + 1}`}>
                <CardView card={k} />
              </button>
            ))}
          </div>
          <div style={{ ...testStyles.arena, minHeight: 130, cursor: 'default', gap: 16 }}>
            <CardView card={card} />
            {note && <span style={{ ...styles.verdict, color: note.right ? blue : brownRed }}>{note.right ? 'Right' : 'Wrong'}</span>}
          </div>
        </>
      ) : (
        <Starter phase={phase} label={`Start: ${CARDS.length} cards`} onStart={() =>
          countIn(() => {
            state.current = { rule: 0, run: 0, avoidable: 0, sense: sortingSense(), parts: [] };
            setAt(0);
            setPhase(phase === 'ready' ? 'practice' : 'timed');
          })
        } />
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && `Practice ${at + 1} of ${list.length}`}
        {phase === 'between' && 'Practice done. From here, work the rule out yourself.'}
        {phase === 'timed' && `Card ${at + 1} of ${list.length}`}
      </p>
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  keyCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
  },
  keyCard: {
    display: 'flex',
    justifyContent: 'center',
    padding: 4,
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    cursor: 'pointer',
  },
  verdict: {
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
  },
};

import { useRef, useState } from 'react';
import { blue, brownRed } from '../../shared_components/palette';
import { DigitPad } from '../digit_pad';
import { digitStyles, gainOf, useTyping, useVoices } from '../digits_kit';
import type { TestProps } from '../self_tests';
import { Speaker } from '../speaker';
import { Frame } from '../test_frame';
import { testStyles } from '../test_kit';
import {
  FOLLOW_VOICE,
  OTHER_VOICES,
  VOICE_DIGITS,
  VOICE_FIRST_STEP,
  VOICE_HIGHEST,
  VOICE_ITEMS,
  VOICE_LOWEST,
  VOICE_PRACTICE,
  VOICE_ROUNDS,
  VOICE_START,
  VOICE_DOWN,
  VOICE_UP,
  type VoiceRound,
} from './items';

// Auditory attention: following one voice while two others talk over it. With headphones, a man says three digits
// while a woman and another man say different ones at the same moments, and they type his. The other voices are said
// at a level against his, in dB: a little louder after a round with all three digits right and further quieter after
// one that isn't, so the level settles where they get about 3 rounds in 4 right. The score is that level, how loud the
// other voices can be while they still follow him: 0 is as loud as him, above 0 is louder

//the level the practice keeps the other voices at, against the voice to follow, in dB
const PRACTICE_LEVEL = -14;
//the rounds the score is the average level of: all but the first few, which find their level
const SCORED_ROUNDS = 12;
//how loud the louder of the voices plays, as a gain on recordings set to -20 dB RMS, leaving room for three at once
const LOUDEST = 0.35;
//the time between one digit and the next, the quiet before each round, and how long a practice answer is shown, in ms
const SLOT = 750;
const BEFORE = 600;
const SHOWN = 1600;

type Phase = 'phones' | 'practice' | 'between' | 'timed' | 'done';

//every recording the test plays, by its name in /voices
const NAMES = [`${FOLLOW_VOICE}-follow`, ...[FOLLOW_VOICE, ...OTHER_VOICES].flatMap((v) => VOICE_DIGITS.map((d) => `${v}-${d}`))];

//a level against the voice to follow, as people say it
const against = (level: number) =>
  level === 0 ? 'as loud as him' : `${Math.abs(level)} dB ${level > 0 ? 'louder' : 'quieter'}`;

export function CompetingVoices({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('phones');
  const [at, setAt] = useState(0);
  const [told, setTold] = useState<{ right: boolean; said: number[] } | null>(null); //after a practice answer
  const { loaded, failed, playing, play, hush, later } = useVoices(NAMES);
  const { typed, type, ask } = useTyping();
  const level = useRef(VOICE_START);
  const missed = useRef(false);
  const heard = useRef<{ level: number; typed: number[]; right: boolean }[]>([]);

  const hearVoice = () => {
    hush();
    play([{ name: `${FOLLOW_VOICE}-follow`, gain: LOUDEST, at: 0 }]);
  };

  //a round, after a quiet moment: the voice to follow and the other two at a level against it
  const round = (r: VoiceRound, at: number) => {
    const gains = at > 0 ? [LOUDEST * gainOf(-at), LOUDEST] : [LOUDEST, LOUDEST * gainOf(at)];
    ask();
    later(BEFORE, () =>
      play(
        [FOLLOW_VOICE, ...OTHER_VOICES].flatMap((voice, v) =>
          [0, 1, 2].map((slot) => ({
            name: `${voice}-${v === 0 ? r.follow[slot] : r.others[v - 1][slot]}`,
            gain: v === 0 ? gains[0] : gains[1],
            at: (slot * SLOT) / 1000 + r.lags[v][slot],
          })),
        ),
      ),
    );
  };

  const begin = (practice: boolean) => {
    hush();
    setAt(0);
    if (practice) {
      setPhase('practice');
      return round(VOICE_PRACTICE[0], PRACTICE_LEVEL);
    }
    level.current = VOICE_START;
    missed.current = false;
    heard.current = [];
    setPhase('timed');
    round(VOICE_ITEMS[0], VOICE_START);
  };

  const finish = () => {
    setPhase('done');
    const from = VOICE_ROUNDS - SCORED_ROUNDS;
    const counted = heard.current.slice(from);
    const score = Math.round((counted.reduce((s, h) => s + h.level, 0) / counted.length) * 10) / 10;
    onDone(score, {
      how: `The other voices got a little louder each time you caught all three of his digits and quieter each time you didn't, so they settle at about the loudest you can follow him through while catching most rounds. The first ${from} rounds find that level, and your score is the average level of the other voices over the last ${counted.length}, against his, in dB, so higher is better: ${score}. 0 is as loud as him, and above 0 is louder.`,
      parts: heard.current.map((h, i) => ({
        label: `${i + 1}`,
        right: h.right,
        note: `The others ${against(h.level)}. You typed ${h.typed.join(' ')}, he said ${VOICE_ITEMS[i].follow.join(' ')}${i >= from ? ', counted in your score' : ', finding your level'}`,
      })),
    });
  };

  //the third digit typed answers the round
  const answer = (digits: number[]) => {
    if (phase === 'practice') {
      const said = VOICE_PRACTICE[at].follow;
      setTold({ right: digits.every((d, i) => d === said[i]), said });
      return later(SHOWN, () => {
        setTold(null);
        if (at + 1 >= VOICE_PRACTICE.length) return setPhase('between');
        setAt(at + 1);
        round(VOICE_PRACTICE[at + 1], PRACTICE_LEVEL);
      });
    }
    const right = digits.every((d, i) => d === VOICE_ITEMS[at].follow[i]);
    heard.current.push({ level: level.current, typed: digits, right });
    if (!right) missed.current = true;
    const step = !missed.current ? VOICE_FIRST_STEP : right ? VOICE_UP : VOICE_DOWN;
    level.current = Math.min(VOICE_HIGHEST, Math.max(VOICE_LOWEST, level.current + (right ? step : -step)));
    if (at + 1 >= VOICE_ROUNDS) return finish();
    setAt(at + 1);
    later(300, () => round(VOICE_ITEMS[at + 1], level.current));
  };

  const press = (d: number | 'back') => {
    const digits = type(d);
    if (digits) answer(digits);
  };

  const asking = phase === 'practice' || phase === 'timed';
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          {phase === 'phones'
            ? "Put on headphones or earbuds in a quiet room. You'll hear a man say three digits while two other people say different digits over him at the same time. Type the three he says, in order. Hear his voice first and set your volume so he's comfortably loud."
            : `Type the three digits the man says, in order. A best guess is fine. The other voices get louder each time you catch all three and quieter when you don't, so expect plenty to be hard. ${VOICE_PRACTICE.length} practice rounds, then ${VOICE_ROUNDS} that count.`}
        </p>
      }
    >
      {phase === 'phones' && (
        <div style={styles.stage}>
          <Speaker booming={playing} />
          {failed ? (
            <p style={testStyles.status}>The voices didn't load. Check your connection and try again.</p>
          ) : (
            <div style={styles.row}>
              <button type="button" className="comic-lift" style={testStyles.secondary} disabled={!loaded} onClick={hearVoice}>
                {loaded ? 'Hear his voice' : 'Loading the voices…'}
              </button>
              <button type="button" className="comic-lift" style={testStyles.primary} disabled={!loaded} onClick={() => begin(true)}>
                Start the practice
              </button>
            </div>
          )}
        </div>
      )}
      {phase === 'between' && (
        <div style={styles.stage}>
          <Speaker booming={false} />
          <button type="button" className="comic-lift" style={{ ...testStyles.primary, alignSelf: 'center' }} onClick={() => begin(false)}>
            Start: {VOICE_ROUNDS} rounds
          </button>
        </div>
      )}
      {asking && (
        <div style={styles.stage}>
          <Speaker booming={playing} style={styles.small} />
          <DigitPad typed={typed} asking={asking} onPress={press} />
        </div>
      )}
      {phase === 'done' && (
        <div style={{ ...testStyles.arena, minHeight: 300 }}>
          <span style={testStyles.prompt}>Done</span>
        </div>
      )}
      <p style={testStyles.status} aria-live="polite">
        {phase === 'practice' && !told && `Practice ${at + 1} of ${VOICE_PRACTICE.length}`}
        {phase === 'practice' && told && (
          <span style={{ ...styles.verdict, color: told.right ? blue : brownRed }}>
            {told.right ? 'Right' : `He said ${told.said.join(' ')}`}
          </span>
        )}
        {phase === 'between' && 'Practice done. Now the ones that count.'}
        {phase === 'timed' && `${at + 1} of ${VOICE_ROUNDS}`}
      </p>
    </Frame>
  );
}

const styles = digitStyles;

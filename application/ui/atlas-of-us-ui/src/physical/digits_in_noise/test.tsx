import { useRef, useState } from 'react';
import { blue, brownRed } from '../../shared_components/palette';
import { DigitPad } from '../digit_pad';
import { digitStyles, gainOf, type Part, useTyping, useVoices } from '../digits_kit';
import type { TestProps } from '../self_tests';
import { Speaker } from '../speaker';
import { DIGITS } from '../spoken_digits';
import { Frame } from '../test_frame';
import { chance, testStyles } from '../test_kit';
import { NOISE_HIGHEST, NOISE_ITEMS, NOISE_LOWEST, NOISE_PRACTICE, NOISE_ROUNDS, NOISE_START, NOISE_STEP } from './items';

// Speech recognition: the digits-in-noise test (Smits and colleagues, 2004). With headphones, a man says three digits
// in a steady noise shaped like his voice, and they type them. His voice is 2 dB quieter against the noise after a
// round with all three right and 2 dB louder after one that isn't, so it settles where they get half the rounds right.
// The score is that level, the speech reception threshold, in dB against the noise: lower is better

//the level the practice and the sample play his voice at, against the noise, in dB
const EASY = 4;
//the first rounds, which find their level, and aren't in the score
const FINDING = 4;
//how loud the louder of his voice and the noise plays, as a gain on recordings set to -20 dB RMS
const LOUDEST = 0.4;
//the time from one digit's start to the next, how long the noise plays before the first and after the last, the quiet
//before each round, and how long a practice answer is shown, in seconds
const SLOT = 0.9;
const AROUND = 0.5;
const BEFORE = 0.6;
const SHOWN = 1.6;

type Phase = 'phones' | 'practice' | 'between' | 'timed' | 'done';

const NAMES = ['noise', ...DIGITS.map((d) => `matthew-${d}`)];

//a level against the noise, as people say it
const against = (level: number) => (level === 0 ? 'as loud as the noise' : `${Math.abs(level)} dB ${level > 0 ? 'louder' : 'quieter'} than the noise`);

export function DigitsInNoise({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('phones');
  const [at, setAt] = useState(0);
  const [told, setTold] = useState<{ right: boolean; said: number[] } | null>(null); //after a practice answer
  const { loaded, failed, playing, play, hush, later, duration } = useVoices(NAMES);
  const { typed, type, ask } = useTyping();
  const level = useRef(NOISE_START);
  const heard = useRef<{ level: number; typed: number[]; right: boolean }[]>([]);

  //three digits in the noise, his voice at a level against it, from a random place in the noise so it's never the
  //same stretch twice
  const say = (digits: number[], at: number) => {
    const [voice, noise] = at > 0 ? [LOUDEST, LOUDEST * gainOf(-at)] : [LOUDEST * gainOf(at), LOUDEST];
    const last = duration(`matthew-${digits[2]}`);
    const lasts = 2 * AROUND + 2 * SLOT + last;
    const parts: Part[] = [
      { name: 'noise', gain: noise, at: 0, from: chance() * (duration('noise') - lasts), lasts },
      ...digits.map((d, i) => ({ name: `matthew-${d}`, gain: voice, at: AROUND + i * SLOT })),
    ];
    play(parts);
  };

  const sample = () => {
    hush();
    say(NOISE_PRACTICE[0], EASY);
  };

  const round = (digits: number[], at: number) => {
    ask();
    later(BEFORE * 1000, () => say(digits, at));
  };

  const begin = (practice: boolean) => {
    hush();
    setAt(0);
    if (practice) {
      setPhase('practice');
      return round(NOISE_PRACTICE[0], EASY);
    }
    level.current = NOISE_START;
    heard.current = [];
    setPhase('timed');
    round(NOISE_ITEMS[0], NOISE_START);
  };

  //the score, as in the published test: the average level of the rounds after the first few, and of the round that
  //would have come next
  const finish = () => {
    setPhase('done');
    const levels = [...heard.current.slice(FINDING).map((h) => h.level), level.current];
    const score = Math.round((levels.reduce((s, l) => s + l, 0) / levels.length) * 10) / 10;
    onDone(score, {
      how: `His voice got 2 dB quieter against the noise each time you caught all three digits and 2 dB louder each time you didn't, so it settles where you catch about half of them. The first ${FINDING} rounds find that level, and your score is the average level of his voice over the rest, and the one that would have come next, in dB against the noise, so lower is better: ${score}. 0 is as loud as the noise, and below 0 is quieter.`,
      parts: heard.current.map((h, i) => ({
        label: `${i + 1}`,
        right: h.right,
        note: `His voice ${against(h.level)}. You typed ${h.typed.join(' ')}, he said ${NOISE_ITEMS[i].join(' ')}${i >= FINDING ? ', counted in your score' : ', finding your level'}`,
      })),
    });
  };

  const answer = (digits: number[]) => {
    if (phase === 'practice') {
      const said = NOISE_PRACTICE[at];
      setTold({ right: digits.every((d, i) => d === said[i]), said });
      return later(SHOWN * 1000, () => {
        setTold(null);
        if (at + 1 >= NOISE_PRACTICE.length) return setPhase('between');
        setAt(at + 1);
        round(NOISE_PRACTICE[at + 1], EASY);
      });
    }
    const right = digits.every((d, i) => d === NOISE_ITEMS[at][i]);
    heard.current.push({ level: level.current, typed: digits, right });
    level.current = Math.min(NOISE_HIGHEST, Math.max(NOISE_LOWEST, level.current + (right ? -NOISE_STEP : NOISE_STEP)));
    if (at + 1 >= NOISE_ROUNDS) return finish();
    setAt(at + 1);
    later(300, () => round(NOISE_ITEMS[at + 1], level.current));
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
            ? "Put on headphones or earbuds in a quiet room. You'll hear a man say three digits in a rushing noise, and you type them. Play the sample and set your volume so he's comfortably loud."
            : `Type the three digits the man says, in order. A best guess is fine. His voice gets quieter each time you catch all three and louder when you don't, so expect about half to be hard. ${NOISE_PRACTICE.length} practice rounds, then ${NOISE_ROUNDS} that count.`}
        </p>
      }
    >
      {phase === 'phones' && (
        <div style={styles.stage}>
          <Speaker booming={playing} />
          {failed ? (
            <p style={testStyles.status}>The sounds didn't load. Check your connection and try again.</p>
          ) : (
            <div style={styles.row}>
              <button type="button" className="comic-lift" style={testStyles.secondary} disabled={!loaded} onClick={sample}>
                {loaded ? 'Play the sample' : 'Loading the sounds…'}
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
            Start: {NOISE_ROUNDS} rounds
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
        {phase === 'practice' && !told && `Practice ${at + 1} of ${NOISE_PRACTICE.length}`}
        {phase === 'practice' && told && (
          <span style={{ ...styles.verdict, color: told.right ? blue : brownRed }}>{told.right ? 'Right' : `He said ${told.said.join(' ')}`}</span>
        )}
        {phase === 'between' && 'Practice done. Now the ones that count.'}
        {phase === 'timed' && `${at + 1} of ${NOISE_ROUNDS}`}
      </p>
    </Frame>
  );
}

const styles = digitStyles;

import { type CSSProperties } from 'react';
import { type Ability } from './api';
import { Disclosure } from '../shared_components/disclosure';
import { gunmetal } from '../shared_components/palette';

//how much practice changes an ability, in a few words
const PRACTICE: Record<string, string> = {
  'a lot': 'Practice changes this a lot.',
  some: 'Practice changes this some.',
  little: 'Practice changes this only a little, so this is about making the most of it.',
};

//how the user can work on an ability: the practice tip when they're below typical on it, and the tip for working
//around an impairment when one is noted on it. Nothing when neither applies
export function Tips({ ability }: { ability: Ability }) {
  const { value, practice, tips, basis } = ability;
  const below = value !== null && value < 0.5;
  const impaired = basis.some((b) => b.kind === 'impairment');
  const shown = tips.filter((t) => (t.kind === 'practice' && below) || (t.kind === 'impairment' && impaired));
  if (!shown.length) return null;
  return (
    <Disclosure label={practice === 'little' && !impaired ? 'Making the most of it' : 'How to work on it'} style={styles.toggle}>
      <div style={styles.tips}>
        {below && practice && <p style={styles.practice}>{PRACTICE[practice]}</p>}
        {shown.map((t) => (
          <p key={t.kind} style={styles.tip}>
            {t.kind === 'impairment' && <strong>With your impairment: </strong>}
            {t.text}
          </p>
        ))}
      </div>
    </Disclosure>
  );
}

const styles: Record<string, CSSProperties> = {
  toggle: {
    fontSize: 14,
  },
  tips: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingTop: 2,
  },
  practice: {
    margin: 0,
    fontSize: 13,
    fontStyle: 'italic',
  },
  tip: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.45,
    color: gunmetal,
  },
};

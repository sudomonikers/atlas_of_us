import { useEffect, useState, type CSSProperties } from 'react';
import { RequireLogin } from '../auth/require-login';
import { AtlasError } from '../shared_components/atlas-error';
import { Mascot } from '../shared_components/mascot';
import { Nav } from '../shared_components/nav';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { Dots, Thinking } from '../shared_components/thinking';
import { failure } from '../shared_components/use_save';
import { getCharacteristics, setCharacteristics, type Characteristic } from './api';

//the user's characteristics, such as their sex, which hand they use or their blood type, each a question with a few
//choices to pick one of
export default function Characteristics() {
  const [characteristics, setList] = useState<Characteristic[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getCharacteristics().then(setList, (e) => setError(failure(e)));
  }, []);

  return (
    <RequireLogin reason="I can't keep track of what you're like until I know who you are. Make an account and let's start.">
      <div style={styles.page} className="comic-page">
        <Nav />
        <header style={styles.header}>
          <h1 style={styles.title} className="comic-title">
            Characteristics
          </h1>
          <div style={styles.guide}>
            <Mascot />
            <div style={styles.bubble} className="comic-bubble comic-pop">
              A few quick facts about your body, each one of a few choices. Skip any you don't know, like your blood type, and
              come back to it whenever you like.
            </div>
          </div>
        </header>
        {error ? (
          <AtlasError message={error} />
        ) : !characteristics ? (
          <Thinking label="Looking you over" />
        ) : (
          <ul style={styles.list}>
            {characteristics.map((c) => (
              <li key={c.key} className="comic-panel" style={styles.card}>
                <h2 style={styles.name}>{c.name}</h2>
                <p style={styles.question}>{c.question}</p>
                <Choice characteristic={c} onSaved={setList} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </RequireLogin>
  );
}

//one characteristic's choices, and taking the answer back. The pick shows as soon as it's made, while it's saved. Sex
//decides who their readings in Abilities are compared with, so leaving it unsaid compares them with everyone
function Choice({ characteristic, onSaved }: { characteristic: Characteristic; onSaved: (all: Characteristic[]) => void }) {
  const { key, name, choices, value } = characteristic;
  const sex = key === 'sex';
  const [saving, setSaving] = useState<{ value: string | null }>(); //the choice being saved, when one is
  const [error, setError] = useState<string>();
  const shown = saving ? saving.value : value;

  const pick = (picked: string | null) => {
    setSaving({ value: picked });
    setError(undefined);
    setCharacteristics({ [key]: picked })
      .then(onSaved)
      .catch((e) => setError(failure(e)))
      .finally(() => setSaving(undefined));
  };

  const options = [...choices.map((c) => ({ value: c as string | null, label: c })), { value: null, label: sex ? 'Compare me with everyone' : "Don't know" }];
  return (
    <>
      <div style={styles.choices} role="group" aria-label={name}>
        {options.map((c) => (
          <button
            key={c.label}
            className="comic-lift"
            style={shown === c.value ? { ...styles.choice, ...styles.picked } : styles.choice}
            aria-pressed={shown === c.value}
            disabled={!!saving}
            onClick={() => shown !== c.value && pick(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {saving && (
        <p style={styles.note} aria-live="polite">
          Saving
          <Dots />
        </p>
      )}
      {error && <AtlasError message={error} />}
      {sex && (
        <p style={styles.note}>
          This decides who you're compared with in Abilities. Most comparisons come from NHANES, the US national health survey
          run by the CDC, so they describe people in the United States.
        </p>
      )}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 16px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  //title on the left with the guide beside it; the guide drops underneath on narrow screens
  header: {
    maxWidth: 900,
    margin: '8px auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px 40px',
  },
  title: {
    fontSize: 'clamp(44px, 8vw, 84px)',
  },
  guide: {
    flex: '1 1 320px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  bubble: {
    maxWidth: 480,
    '--tilt': '-1deg',
  } as CSSProperties,
  list: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '18px 22px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': ivory,
  } as CSSProperties,
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1,
    color: brownRed,
  },
  question: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.4,
  },
  choices: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  choice: {
    padding: '4px 18px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
  },
  picked: {
    background: brownRed,
    color: ivory,
  },
  note: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
  },
};

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { RequireLogin } from '../auth/require-login';
import { canSpend, cost, refreshCredits, useCredits } from '../credits/api';
import { GetCredits } from '../credits/get_credits';
import { navigate } from '../router';
import { AtlasError } from '../shared_components/atlas-error';
import { Checkbox } from '../shared_components/checkbox';
import { FileUpload } from '../shared_components/file_upload';
import { Mascot } from '../shared_components/mascot';
import { Nav } from '../shared_components/nav';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { Thinking } from '../shared_components/thinking';
import { LEVEL_NAMES } from '../skills/api';
import { BLOOM_NAMES } from '../topics/api';
import { confirmImport, discardImport, getImport, importResume, MAX_RESUME_MB, type Achievement, type Added, type Found, type Import, type NotOnThisResume } from './api';

//how often a resume being read is checked on, and for how long before saying it's taking a while
const CHECK_EVERY = 4000;
const CHECK_FOR = 180_000;

const levelNames = (f: Found) => (f.kind === 'skill' ? LEVEL_NAMES : BLOOM_NAMES);

//whether a skill or topic is added, and at which level
interface Choice {
  added: boolean;
  rank: number;
}

//importing a resume: upload it, Atlas reads it for the skills and knowledge it shows, and the person changes the levels,
//leaves out what's wrong and adds the rest. The resume is kept as evidence on each
export default function Resume() {
  return (
    <RequireLogin reason="I can't add what you can do to your profile until I know who you are. Make an account and let's start.">
      <div style={styles.page} className="comic-page">
        <Nav />
        <header style={styles.header}>
          <h1 style={styles.title} className="comic-title">
            Your Resume
          </h1>
          <div style={styles.guide}>
            <Mascot />
            <div style={styles.bubble} className="comic-bubble comic-pop">
              Hand me your resume and I'll pick out what you can do and what you know. You get the final say on all of it.
            </div>
          </div>
        </header>
        <ResumeImport />
      </div>
    </RequireLogin>
  );
}

function ResumeImport() {
  const [state, setState] = useState<Import>();
  const [error, setError] = useState<string>();
  const [slow, setSlow] = useState(false);
  const [added, setAdded] = useState<Added>();
  const credits = useCredits();

  useEffect(() => {
    getImport().then(setState, (e: Error) => setError(e.message));
  }, []);

  //while it's being read, check on it until it's done or it's taking too long. Reading spends a credit and a failure
  //gives it back, so the balance is read again once it's done either way
  const reading = state?.status === 'reading';
  const started = useRef(0);
  useEffect(() => {
    if (!reading) {
      refreshCredits();
      return;
    }
    started.current = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started.current > CHECK_FOR) {
        setSlow(true);
        clearInterval(timer);
        return;
      }
      getImport().then(setState, () => {});
    }, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [reading]);

  const upload = async (file: File) => {
    setError(undefined);
    setAdded(undefined);
    setSlow(false);
    setState(await importResume(file));
  };

  if (error && !state) return <AtlasError message={error} />;
  if (!state) return <Thinking label="Finding your resume" />;

  if (added) {
    return (
      <section className="comic-panel" style={styles.panel}>
        <h2 style={styles.heading}>Added</h2>
        <p style={styles.text}>
          You're on {count(added.skills, 'skill')} and {count(added.topics, 'topic')} now, with your resume as evidence on each
          {added.achievements > 0 && `, and ${count(added.achievements, 'achievement')} to show for them`}. The new ones are being written
          up, so give them a minute before you read their levels.
        </p>
        <div style={styles.actions}>
          <button className="comic-lift" style={styles.primary} onClick={() => navigate('/skills?view=mine')}>
            My Skills
          </button>
          <button className="comic-lift" style={styles.primary} onClick={() => navigate('/topics?view=mine')}>
            My Knowledge
          </button>
        </div>
      </section>
    );
  }

  if (state.status === 'reading') {
    return (
      <section className="comic-panel" style={styles.panel}>
        {slow ? (
          <p style={styles.text}>This is taking longer than usual. Check back in a bit.</p>
        ) : (
          <Thinking label={`Reading ${state.file_name ?? 'your resume'}`} />
        )}
      </section>
    );
  }

  if (state.status === 'ready') {
    return (
      <Review
        state={state}
        onAdded={setAdded}
        onDiscarded={() => setState({ status: 'none', file_name: null, found: [], achievements: [], not_on_this_resume: { skills_and_topics: [], achievements: [] } })}
      />
    );
  }

  return (
    <section className="comic-panel" style={styles.panel}>
      <h2 style={styles.heading}>Import your resume</h2>
      <p style={styles.text}>
        Upload your resume as a PDF and I'll read it for the skills and knowledge it shows, each at the level it shows. You'll see all
        of it before anything's added, so you can change a level or leave something out. Your resume is kept as evidence on each one
        you add.
      </p>
      {state.status === 'failed' && <p style={styles.note}>I couldn't read your last one just now, and your credit is back. Try again?</p>}
      {canSpend(credits) ? (
        <FileUpload
          onUpload={upload}
          label={`Upload my resume${cost(credits)}`}
          accept=".pdf,application/pdf"
          maxMb={MAX_RESUME_MB}
          hint={`A PDF up to ${MAX_RESUME_MB} MB`}
        />
      ) : (
        <GetCredits buttonStyle={styles.primary} />
      )}
    </section>
  );
}

const count = (n: number, what: string) => `${n} ${what}${n === 1 ? '' : 's'}`;

//what the resume showed, to change and confirm. Each is added unless they're at its level or higher already, and each
//achievement is kept unless they untick it or have it already. Then what earlier resumes added that this one doesn't show
function Review({ state, onAdded, onDiscarded }: { state: Import; onAdded: (added: Added) => void; onDiscarded: () => void }) {
  const [choices, setChoices] = useState<Map<number, Choice>>(
    () => new Map(state.found.map((f) => [f.index, { added: f.current_rank === null || f.rank > f.current_rank, rank: f.rank }])),
  );
  const [kept, setKept] = useState<Set<number>>(() => new Set(state.achievements.filter((a) => !a.on_profile).map((a) => a.index)));
  const [busy, setBusy] = useState<'adding' | 'discarding'>();
  const [error, setError] = useState<string>();

  const choose = (index: number, change: Partial<Choice>) =>
    setChoices((c) => new Map(c).set(index, { ...c.get(index)!, ...change }));
  const chosen = state.found.filter((f) => choices.get(f.index)?.added);
  //an achievement is added with what it shows that they're adding, so it needs at least one of those
  const standsOn = (a: Achievement) => a.shows.some((i) => choices.get(i)?.added);
  const keeping = state.achievements.filter((a) => kept.has(a.index) && standsOn(a));
  const keep = (index: number, on: boolean) =>
    setKept((k) => {
      const next = new Set(k);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });

  const add = () => {
    setBusy('adding');
    setError(undefined);
    confirmImport(
      chosen.map((f) => ({ index: f.index, rank: choices.get(f.index)!.rank })),
      keeping.map((a) => a.index),
    )
      .then(onAdded, (e: Error) => {
        setError(e.message);
        setBusy(undefined);
      });
  };
  const discard = () => {
    setBusy('discarding');
    setError(undefined);
    discardImport().then(onDiscarded, (e: Error) => {
      setError(e.message);
      setBusy(undefined);
    });
  };

  const group = (kind: Found['kind'], heading: string, intro: string) => {
    const found = state.found.filter((f) => f.kind === kind);
    if (found.length === 0) return null;
    return (
      <section style={styles.group} aria-label={heading}>
        <h2 style={styles.heading}>{heading}</h2>
        <p style={styles.text}>{intro}</p>
        <ul style={styles.list}>
          {found.map((f) => (
            <Row key={f.index} found={f} choice={choices.get(f.index)!} onChange={(change) => choose(f.index, change)} disabled={!!busy} />
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div style={styles.review}>
      <p style={styles.lead}>
        Here's what I found in <strong>{state.file_name ?? 'your resume'}</strong>. Untick anything that isn't you, and move a level if I
        got it wrong.
      </p>
      {group('skill', 'Skills', 'What you can do, on the five levels from Novice to Expert.')}
      {group('topic', 'Knowledge', 'What you know about, on the six depths from Remember to Create.')}
      {state.achievements.length > 0 && (
        <section style={styles.group} aria-label="Achievements">
          <h2 style={styles.heading}>Achievements</h2>
          <p style={styles.text}>The things you did worth pointing to, each with what it shows you can do or know.</p>
          <ul style={styles.list}>
            {state.achievements.map((a) => (
              <AchievementRow
                key={a.index}
                achievement={a}
                found={state.found}
                kept={kept.has(a.index)}
                standsOn={standsOn(a)}
                onChange={(on) => keep(a.index, on)}
                disabled={!!busy}
              />
            ))}
          </ul>
        </section>
      )}
      <NotOnIt dropped={state.not_on_this_resume} />
      {state.found.length === 0 && <p style={styles.text}>I couldn't find any skills or knowledge in it. Is it the right file?</p>}

      <div style={styles.footer} className="comic-panel">
        {busy === 'adding' ? (
          <Thinking label="Adding them to your profile" />
        ) : (
          <>
            <button className="comic-lift" style={styles.primary} disabled={!!busy || chosen.length === 0} onClick={add}>
              {chosen.length === 1 ? 'Add it to my profile' : `Add these ${chosen.length} to my profile`}
            </button>
            <button className="comic-lift" style={styles.secondary} disabled={!!busy} onClick={discard}>
              Start over
            </button>
          </>
        )}
        {error && <AtlasError message={error} size={36} />}
      </div>
    </div>
  );
}

//one achievement the resume showed: whether it's kept, what it was, and the skills and topics it shows
function AchievementRow({ achievement, found, kept, standsOn, onChange, disabled }: { achievement: Achievement; found: Found[]; kept: boolean; standsOn: boolean; onChange: (kept: boolean) => void; disabled: boolean }) {
  const shows = achievement.shows.map((i) => found.find((f) => f.index === i)).filter((f) => f !== undefined);
  const on = kept && standsOn;
  return (
    <li className="comic-panel" style={{ ...styles.row, ...(on ? {} : styles.left) }}>
      <div style={styles.rowTop}>
        <Checkbox checked={on} onChange={onChange} label={achievement.title} disabled={disabled || !standsOn} />
        {achievement.year !== null && <span style={styles.small}>{achievement.year}</span>}
        {achievement.on_profile && <span style={styles.tag}>Already on your profile</span>}
      </div>
      <p style={styles.evidence}>{achievement.description}</p>
      <p style={styles.small}>
        {standsOn
          ? `Shows ${shows.map((f) => f.existing_name ?? f.name).join(', ')}`
          : `Shows ${shows.map((f) => f.existing_name ?? f.name).join(', ')}, which you've left out, so it can't be added`}
      </p>
    </li>
  );
}

//what earlier resumes added that this one doesn't show, for them to know about. Nothing here changes
function NotOnIt({ dropped }: { dropped: NotOnThisResume }) {
  const { skills_and_topics, achievements } = dropped;
  if (skills_and_topics.length === 0 && achievements.length === 0) return null;
  return (
    <section style={styles.group} aria-label="Not on this resume">
      <h2 style={styles.heading}>Not on this resume</h2>
      <p style={styles.text}>
        These came from an earlier resume and aren't on this one. They stay on your profile, and the skills and topics keep
        that resume as their evidence. A skill or topic that isn't you anymore can be removed from its own page.
      </p>
      <ul style={styles.dropped}>
        {skills_and_topics.map((d) => {
          const to = `/${d.kind === 'skill' ? 'skills' : 'topics'}/${encodeURIComponent(d.id)}`;
          return (
            <li key={d.id}>
              <a style={styles.droppedLink} href={to} onClick={(e) => { e.preventDefault(); navigate(to); }}>
                {d.name}
              </a>{' '}
              <span style={styles.small}>{d.kind === 'skill' ? 'skill' : 'topic'}</span>
            </li>
          );
        })}
        {achievements.map((title) => (
          <li key={title}>
            {title} <span style={styles.small}>achievement</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

//one skill or topic the resume showed: whether it's added, what showed it, and the level it's added at
function Row({ found, choice, onChange, disabled }: { found: Found; choice: Choice; onChange: (change: Partial<Choice>) => void; disabled: boolean }) {
  const names = levelNames(found);
  const name = found.existing_name ?? found.name;
  const lower = found.current_rank !== null && choice.rank < found.current_rank;
  return (
    <li className="comic-panel" style={{ ...styles.row, ...(choice.added ? {} : styles.left) }}>
      <div style={styles.rowTop}>
        <Checkbox checked={choice.added} onChange={(added) => onChange({ added })} label={name} disabled={disabled} />
        {found.id === null && <span style={styles.tag}>New to Atlas</span>}
      </div>
      <p style={styles.evidence}>From your resume: {found.evidence}</p>
      {found.current_rank !== null && (
        <p style={styles.small}>
          You're at {names[found.current_rank - 1]} already.
          {choice.added && lower && ` Adding this moves you down to ${names[choice.rank - 1]}.`}
        </p>
      )}
      {choice.added && (
        <div style={styles.levels} role="radiogroup" aria-label={`${name} level`}>
          {names.map((level, i) => (
            <button
              key={level}
              role="radio"
              aria-checked={choice.rank === i + 1}
              disabled={disabled}
              style={{ ...styles.level, ...(choice.rank === i + 1 ? styles.levelOn : {}) }}
              onClick={() => onChange({ rank: i + 1 })}
            >
              {level}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 16px 64px',
    boxSizing: 'border-box',
  },
  header: {
    maxWidth: 820,
    margin: '0 auto 24px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    margin: '8px 0',
    fontSize: 'clamp(48px, 9vw, 96px)',
    textAlign: 'center',
  },
  guide: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    maxWidth: 420,
  },
  bubble: {
    fontSize: 17,
    lineHeight: 1.4,
  },
  panel: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '24px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': ivory,
  } as CSSProperties,
  review: {
    maxWidth: 760,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  lead: {
    margin: 0,
    fontSize: 19,
    lineHeight: 1.4,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 34,
    letterSpacing: 1,
    color: gunmetal,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.45,
  },
  note: {
    margin: 0,
    fontSize: 17,
    color: brownRed,
  },
  small: {
    margin: 0,
    fontSize: 15,
    opacity: 0.8,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '14px 18px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': '#fff',
    transition: 'opacity 120ms',
  } as CSSProperties,
  left: {
    opacity: 0.55,
  },
  rowTop: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  tag: {
    padding: '2px 10px',
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    background: 'var(--pale-blue)',
    fontSize: 13,
    fontWeight: 600,
  },
  dropped: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 16,
  },
  droppedLink: {
    color: brownRed,
    fontWeight: 600,
  },
  evidence: {
    margin: 0,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  levels: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  level: {
    padding: '4px 10px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    fontSize: 14,
    cursor: 'pointer',
  },
  levelOn: {
    background: brownRed,
    color: ivory,
  },
  footer: {
    position: 'sticky',
    bottom: -48, //sticky keeps clear of the page's 64px bottom padding, so this sits 16px off the bottom of the screen
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    padding: '14px 18px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': ivory,
  } as CSSProperties,
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  primary: {
    padding: '6px 18px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    cursor: 'pointer',
  },
  secondary: {
    padding: '6px 18px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    cursor: 'pointer',
  },
};

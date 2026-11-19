import { useEffect, useState, type ReactNode } from 'react';
import { ATLAS, useSession } from '../api';
import { navigate } from '../router';
import Login from '../login';
import { Closeness } from './home';
import {
  BLOOM_LEVELS,
  DREYFUS_LEVELS,
  getOccupation,
  percent,
  howOften,
  type AbilityRequirement,
  type Demand,
  type LevelRequirement,
  type Occupation,
  type Part,
  type TraitRequirement,
} from './api';

//one occupation: what the work takes, and for a logged in user, where they are with each part of it
export default function OccupationPage({ id }: { id: string }) {
  const session = useSession();
  const [occupation, setOccupation] = useState<Occupation>();
  const [error, setError] = useState('');
  //the same occupation again once someone logs in or out, so their own levels come with it
  const who = session.status === 'authenticated' ? session.person.id : session.status;

  useEffect(() => {
    if (who === 'checking') return;
    getOccupation(id)
      .then(setOccupation)
      .catch((e: Error) => setError(e.message));
  }, [id, who]);

  //an occupation someone just added fills in as each part is worked out, so it's read again until it's done
  const filling = occupation?.status === 'filling';
  useEffect(() => {
    if (!filling) return;
    const timer = setInterval(() => {
      getOccupation(id)
        .then(setOccupation)
        .catch(() => {});
    }, FILLING_POLL_MS);
    return () => clearInterval(timer);
  }, [id, filling]);

  if (error) return <p className="error page">{error}</p>;
  if (!occupation) return <p className="muted page">Loading...</p>;

  const signedIn = occupation.closeness !== null;
  //how each part stands: still being worked out, couldn't be, or there
  const state = (part: Part): PartState => (occupation.pending.includes(part) ? 'pending' : occupation.failed.includes(part) ? 'failed' : 'done');
  return (
    <div className="page">
      <a
        className="back"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}
      >
        All occupations
      </a>
      <section className="occupation-head">
        <div>
          <h1>{occupation.title}</h1>
          <p className="lead">{occupation.description}</p>
          {occupation.alternate_titles.length > 0 && (
            <p className="muted small">Also called {occupation.alternate_titles.slice(0, 6).join(', ')}</p>
          )}
          {!occupation.onet_soc && (
            <p className="muted small">
              Added by someone on Atlas Of Us. What it takes is worked out from the occupations O*NET rates that are most like it.
            </p>
          )}
        </div>
        {signedIn && (
          <div className="card summary">
            <span className="muted small">You're this close</span>
            <Closeness value={occupation.closeness ?? 0} />
            <span className="muted small">{percent(occupation.coverage ?? 0)} of what the work takes is measured for you</span>
          </div>
        )}
      </section>

      {filling && (
        <p className="notice" role="status">
          Working out what this work takes. Each part shows here as it's ready, usually within a minute.
        </p>
      )}

      {!signedIn && session.status === 'anonymous' && <Login />}

      <Section
        title="Knowledge"
        intro="The subjects the work takes, and how deeply, on Bloom's six levels."
        count={occupation.knowledge.length}
        state={state('knowledge')}
      >
        {occupation.knowledge.map((r) => (
          <LevelRow key={r.id} requirement={r} names={BLOOM_LEVELS} signedIn={signedIn} to={`${ATLAS}/topics/${encodeURIComponent(r.id)}`} />
        ))}
      </Section>

      <Section
        title="Skills"
        intro="What the work has you do, and how well, on the Dreyfus model's five levels."
        count={occupation.skills.length}
        state={state('skills')}
      >
        {occupation.skills.map((r) => (
          <LevelRow key={r.id} requirement={r} names={DREYFUS_LEVELS} signedIn={signedIn} to={`${ATLAS}/skills/${encodeURIComponent(r.id)}`} />
        ))}
      </Section>

      <Section
        title="Abilities"
        intro="What the work takes of your body and mind. The mark is the level the work takes, and the bar is where you stand."
        count={occupation.abilities.length}
        state={state('abilities')}
      >
        {occupation.abilities.map((r) => (
          <AbilityRow key={r.id} requirement={r} signedIn={signedIn} />
        ))}
      </Section>

      <WorkDemands demands={occupation.demands ?? []} state={state('abilities')} />

      <Section
        title="Personality"
        intro="The traits that matter to the work. The mark is where the work pulls, and the bar is your score."
        count={occupation.traits.length}
        state={state('personality')}
      >
        {occupation.traits.map((r) => (
          <TraitRow key={r.name} requirement={r} signedIn={signedIn} />
        ))}
      </Section>
    </div>
  );
}

//how often a filling occupation is read again
const FILLING_POLL_MS = 4000;

type PartState = 'pending' | 'failed' | 'done';

//what a section shows in place of its list while its part is being worked out, or when it couldn't be
function PartNote({ state }: { state: PartState }) {
  return state === 'pending' ? (
    <p className="muted working">Working this out...</p>
  ) : (
    <p className="error">This couldn't be worked out.</p>
  );
}

//a demand shows from about half the time, or monthly, the way O*NET's own summaries do
const SHOWN = 0.5;
const GROUPS: { group: Demand['group']; title: string }[] = [
  { group: 'position', title: 'Your body' },
  { group: 'environment', title: 'Surroundings' },
  { group: 'hazard', title: 'Hazards' },
];

//what the work is like physically, and for the logged in user, what it strains that they've noted. The notes are for
//them alone, and never change how close they are
function WorkDemands({ demands, state }: { demands: Demand[]; state: PartState }) {
  const shown = demands.filter((d) => d.frequency >= SHOWN);
  const noted = demands.filter((d) => d.noted.length > 0);
  if (state !== 'done') {
    return (
      <section className="section">
        <div className="section-head">
          <h2>What the work is like</h2>
        </div>
        <PartNote state={state} />
      </section>
    );
  }
  return (
    <section className="section">
      <div className="section-head">
        <h2>What the work is like</h2>
        <p className="muted">How often the work has people in each of these, from the people who do it.</p>
      </div>
      {noted.length > 0 && (
        <div className="note" role="note">
          <strong>Worth knowing for you</strong>
          <ul>
            {noted.map((d) => (
              <li key={d.name}>
                {d.name}, {howOften(d).toLowerCase()}, touches {joined(d.noted)}, which you've noted.
              </li>
            ))}
          </ul>
          <p className="muted small">
            Only you see this, and it doesn't change how close you are. Plenty of people do this work around it.
          </p>
        </div>
      )}
      {shown.length === 0 ? (
        <p className="muted">Nothing physically demanding about it most of the time.</p>
      ) : (
        <div className="demands">
          {GROUPS.map(({ group, title }) => {
            const these = shown.filter((d) => d.group === group);
            if (!these.length) return null;
            return (
              <div key={group} className="card demand-group">
                <h3>{title}</h3>
                <ul>
                  {these.map((d) => (
                    <li key={d.name} className={d.noted.length ? 'demand demand-noted' : 'demand'}>
                      <span>{d.name}</span>
                      <span className="muted small">{howOften(d)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

//"a, b and c", lowercased to sit in a sentence
function joined(items: string[]) {
  const lower = items.map((i) => i.charAt(0).toLowerCase() + i.slice(1));
  return lower.length < 2 ? lower.join('') : `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}

function Section({ title, intro, count, state, children }: { title: string; intro: string; count: number; state: PartState; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        <p className="muted">{intro}</p>
      </div>
      {state !== 'done' ? (
        <PartNote state={state} />
      ) : count === 0 ? (
        <p className="muted">None that matter to this work.</p>
      ) : (
        <ul className="requirements">{children}</ul>
      )}
    </section>
  );
}

//met, partway there, or not yet measured
function Status({ score }: { score: number | null }) {
  if (score === null) return <span className="status status-unknown">Not measured</span>;
  if (score >= 1) return <span className="status status-met">Met</span>;
  return <span className="status status-gap">{percent(score)} there</span>;
}

function Importance({ value }: { value: number }) {
  const label = value >= 0.75 ? 'Very important' : value >= 0.5 ? 'Important' : 'Somewhat important';
  return <span className="importance">{label}</span>;
}

function LevelRow({ requirement: r, names, signedIn, to }: { requirement: LevelRequirement; names: string[]; signedIn: boolean; to: string }) {
  return (
    <li className="requirement">
      <div className="requirement-name">
        <a href={to}>{r.name}</a>
        <Importance value={r.importance} />
      </div>
      <div className="requirement-levels">
        <Steps count={names.length} needed={r.rank} yours={r.yours} />
        <span className="small">
          Takes <strong>{names[r.rank - 1]}</strong>
          {signedIn && <span className="muted">{r.yours ? `, you're at ${names[r.yours - 1]}` : ", you haven't added it"}</span>}
        </span>
      </div>
      {signedIn && <Status score={r.score} />}
    </li>
  );
}

//a level scale as steps: the ones the work takes filled, and the person's own level marked
function Steps({ count, needed, yours }: { count: number; needed: number; yours: number | null }) {
  return (
    <span className="steps" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`step${i < needed ? ' step-needed' : ''}${yours !== null && i < yours ? ' step-yours' : ''}`} />
      ))}
    </span>
  );
}

function AbilityRow({ requirement: r, signedIn }: { requirement: AbilityRequirement; signedIn: boolean }) {
  return (
    <li className="requirement">
      <div className="requirement-name">
        <a href={`${ATLAS}/abilities?view=explore`}>{r.name}</a>
        <Importance value={r.importance} />
      </div>
      <div className="requirement-levels">
        <Scale target={r.level} yours={signedIn ? r.yours : null} label={r.name} />
      </div>
      {signedIn && <Status score={r.score} />}
    </li>
  );
}

function TraitRow({ requirement: r, signedIn }: { requirement: TraitRequirement; signedIn: boolean }) {
  //the mark sits where the work pulls: high on the trait, or low for its low end
  const mark = r.opposite ? 1 - r.target : r.target;
  return (
    <li className="requirement">
      <div className="requirement-name">
        <span>
          {r.opposite ? 'Low ' : ''}
          {r.name}
        </span>
        <Importance value={r.importance} />
      </div>
      <div className="requirement-levels">
        <Scale target={mark} yours={signedIn ? r.yours : null} label={r.name} />
        <span className="muted small">{r.opposite ? 'Lower suits the work' : 'Higher suits the work'}</span>
      </div>
      {signedIn && <Status score={r.score} />}
    </li>
  );
}

//a scale from 0 to 1 with a mark where the work sits, and the person's bar when they have one
function Scale({ target, yours, label }: { target: number; yours: number | null; label: string }) {
  return (
    <span className="scale" role="img" aria-label={`${label}: the work takes ${percent(target)}${yours === null ? '' : `, you're at ${percent(yours)}`}`}>
      {yours !== null && <span className="scale-fill" style={{ width: percent(yours) }} />}
      <span className="scale-mark" style={{ left: percent(target) }} />
    </span>
  );
}

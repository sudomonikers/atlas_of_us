import { useEffect, useState } from 'react';
import { ATLAS, useSession } from '../api';
import { navigate } from '../router';
import Login from '../login';
import { getClosest, percent, searchOccupations, type Closest, type OccupationRef } from './api';

//the occupations home: search for any occupation, and the ones the logged in user is closest to
export default function Home() {
  const session = useSession();

  return (
    <div className="page">
      <section className="intro">
        <h1>Occupations</h1>
        <p className="lead">
          894 kinds of work, each with the knowledge, skills, abilities and personality it takes. See how far you are from any
          of them.
        </p>
        <Search />
      </section>

      {session.status === 'authenticated' && <ClosestList />}
      {session.status === 'anonymous' && <Login />}
    </div>
  );
}

//how long typing has to pause before a search is sent
const SEARCH_DELAY_MS = 250;

function Search() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<OccupationRef[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const typed = q.trim();
    if (!typed) return;
    let current = true;
    const timer = setTimeout(() => {
      searchOccupations(typed)
        .then((found) => {
          if (current) {
            setResults(found);
            setError('');
          }
        })
        .catch((e: Error) => current && setError(e.message));
    }, SEARCH_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [q]);

  const showing = q.trim() ? results : [];
  return (
    <div className="search">
      <input
        className="search-input"
        type="search"
        placeholder="Search occupations, such as nurse or data scientist"
        aria-label="Search occupations"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      {showing.length > 0 && (
        <ul className="results">
          {showing.map((o) => (
            <li key={o.id}>
              <OccupationLink id={o.id} title={o.title} />
              <p className="muted small clamp">{o.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OccupationLink({ id, title }: { id: string; title: string }) {
  const to = `/occupations/${encodeURIComponent(id)}`;
  return (
    <a
      className="occupation-link"
      href={to}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {title}
    </a>
  );
}

function ClosestList() {
  const [closest, setClosest] = useState<Closest>();
  const [error, setError] = useState('');

  useEffect(() => {
    getClosest()
      .then(setClosest)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!closest) return <p className="muted">Working out the work you're closest to...</p>;

  const missing = [
    !closest.topics && { label: 'the topics you know', to: `${ATLAS}/topics` },
    !closest.skills && { label: 'your skills', to: `${ATLAS}/skills` },
    !closest.abilities && { label: 'your abilities', to: `${ATLAS}/abilities` },
    !closest.personality && { label: 'your personality', to: `${ATLAS}/personality` },
  ].filter((m): m is { label: string; to: string } => !!m);

  return (
    <section className="section">
      <div className="section-head">
        <h2>Closest to you</h2>
        <p className="muted">
          How much of what each kind of work takes you already have, from what you've added to Atlas Of Us. Measured is how
          much of the work that rests on.
        </p>
      </div>
      {missing.length > 0 && (
        <p className="notice">
          Add{' '}
          {missing.map((m, i) => (
            <span key={m.to}>
              {i > 0 && (i === missing.length - 1 ? ' and ' : ', ')}
              <a href={m.to}>{m.label}</a>
            </span>
          ))}{' '}
          on atlas-of-us.com to make this more accurate.
        </p>
      )}
      {closest.occupations.length === 0 ? (
        <p className="muted">Nothing to compare yet. Once you've added something about yourself, the closest work shows here.</p>
      ) : (
        <ol className="closest">
          {closest.occupations.map((o) => (
            <li key={o.id} className="closest-row">
              <div className="closest-main">
                <OccupationLink id={o.id} title={o.title} />
                <p className="muted small clamp">{o.description}</p>
              </div>
              <div className="closest-stats">
                <Closeness value={o.closeness} />
                <span className="muted small">
                  {o.met} of {o.requirements} met, {percent(o.coverage)} measured
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

//closeness as a bar and a percent
export function Closeness({ value }: { value: number }) {
  return (
    <span className="closeness" role="meter" aria-label="Closeness" aria-valuemin={0} aria-valuemax={1} aria-valuenow={value}>
      <span className="closeness-bar">
        <span className="closeness-fill" style={{ width: percent(value) }} />
      </span>
      <span className="closeness-value">{percent(value)}</span>
    </span>
  );
}

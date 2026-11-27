import { useEffect, useState } from 'react';
import { ATLAS, request, useSession } from './api';
import { navigate } from './router';

//the parts of their profile matching reads
interface Profile {
  personality: { traits: unknown[]; report: unknown | null };
  topics: unknown[];
  skills: unknown[];
  abilities: { placed: unknown[] };
}

//how much of their Atlas is filled out, with links to the main site for what isn't, then on to their match
export default function Ready() {
  const session = useSession();
  const username = session.status === 'authenticated' ? session.person.username : '';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Profile>('GET', `/profiles/${encodeURIComponent(username)}`).then(setProfile, (e: Error) => setError(e.message));
  }, [username]);

  if (error) return <p className="page error">{error}</p>;
  if (!profile) return <p className="page muted">Reading your Atlas...</p>;

  const parts = [
    { name: 'Personality', path: '/personality', done: profile.personality.report !== null },
    { name: 'Interests', path: '/topics', done: profile.topics.length > 0 },
    { name: 'Skills', path: '/skills', done: profile.skills.length > 0 },
    { name: 'Abilities', path: '/abilities', done: profile.abilities.placed.length > 0 },
  ];
  const ready = parts.every((p) => p.done);

  return (
    <div className="page">
      <h1>{ready ? "You're ready." : 'First, your Atlas.'}</h1>
      <p className="lead">
        {ready
          ? "We know enough about you to find your person."
          : 'The more of you the Atlas knows, the better your match. Fill out what’s missing on atlas-of-us.com.'}
      </p>
      <ul className="parts">
        {parts.map((p) => (
          <li key={p.name} className={p.done ? 'part done' : 'part'}>
            <span>{p.name}</span>
            {p.done ? <span className="muted">Done</span> : <a href={`${ATLAS}${p.path}`}>Fill out</a>}
          </li>
        ))}
      </ul>
      <button className="button" disabled={!ready} onClick={() => navigate('/match')}>
        Find my person
      </button>
    </div>
  );
}

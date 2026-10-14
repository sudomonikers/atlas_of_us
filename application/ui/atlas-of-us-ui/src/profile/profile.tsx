import { useEffect, useState, type CSSProperties } from 'react';
import { setPublic, useSession } from '../auth/api';
import { DOMAINS, getProfile, type Profile as ProfileData } from '../personality/api';
import { navigate } from '../router';
import { Nav } from '../shared_components/nav';
import { Toggle } from '../shared_components/toggle';
import { AtlasError } from '../shared_components/atlas-error';

const gunmetal = 'var(--gunmetal-black)';
const blue = 'var(--air-force-blue)';
const comic = 'var(--font-comic)';

//everything we know about someone, at /u/{username}, one section per part of them. Anyone can see it once
//they've made it public, otherwise only they can
export default function Profile({ username }: { username: string }) {
  const session = useSession();
  const [profile, setProfile] = useState<ProfileData>();
  const [error, setError] = useState<string>();

  //waits for a stored login to be checked, so an owner viewing their private profile isn't turned away
  useEffect(() => {
    if (session.status === 'checking') return;
    getProfile(username).then(setProfile, (e) => setError(e instanceof Error ? e.message : String(e)));
  }, [username, session.status]);

  const mine = session.status === 'authenticated' && session.person.username === profile?.username;
  const shared = mine ? session.person.public : false; //the session has the owner's latest toggle
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string>(); //"Copied!"
  const [failure, setFailure] = useState<string>(); //a sharing action that failed

  const run = (action: () => Promise<unknown>) => {
    setBusy(true);
    setNote(undefined);
    setFailure(undefined);
    action()
      .catch((e) => setFailure(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };
  const copy = () => run(() => navigator.clipboard.writeText(window.location.href).then(() => setNote('Copied!')));

  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <header style={styles.header}>
        <h1 style={styles.title} className="comic-title">
          {profile ? `This Is ${profile.first_name}` : 'This Is...'}
        </h1>
        {error ? (
          <AtlasError message={error} style={styles.bubble} />
        ) : (
          <div style={styles.bubble} className="comic-bubble comic-pop">
            {profile ? `@${profile.username}` : "Looking them up. I'm sure they're fascinating..."}
          </div>
        )}
      </header>

      {/* the owner's sharing controls */}
      {mine && (
        <div style={styles.share}>
          <Toggle on={shared} disabled={busy} label="Public profile" onChange={(on) => run(() => setPublic(on))} />
          <span style={styles.hint}>
            {shared ? 'Anyone with the link can see this page.' : 'Only you can see this page.'}
          </span>
          {shared && (
            <button className="comic-lift" style={styles.small} disabled={busy} onClick={copy}>
              Copy link
            </button>
          )}
          {note && <span style={styles.note}>{note}</span>}
          {failure && <AtlasError message={failure} />}
        </div>
      )}

      {profile && <PersonalitySection profile={profile} />}

      <div style={styles.footer}>
        <button className="comic-lift" style={styles.button} onClick={() => navigate(mine ? '/personality' : '/')}>
          {mine ? 'Back to the Atlas ▶' : 'Map yourself ▶'}
        </button>
      </div>
    </div>
  );
}

//measured traits only, grouped by domain like My Personality
function PersonalitySection({ profile }: { profile: ProfileData }) {
  const domains = DOMAINS.map((d) => ({ ...d, traits: profile.traits.filter((t) => t.domain === d.key) })).filter((d) => d.traits.length);

  return (
    <section style={styles.section} className="comic-panel">
      <h2 style={styles.sectionTitle}>Personality</h2>
      {!domains.length && <p>{profile.first_name} hasn't played enough scenarios to be measured yet.</p>}
      {domains.map((domain) => (
        <div key={domain.key} style={styles.domain}>
          <h3 style={styles.domainTitle}>{domain.title}</h3>
          <ul style={styles.traits}>
            {domain.traits.map((t) => {
              const percent = Math.round(Math.min(Math.max(t.value, 0), 1) * 100);
              return (
                <li key={t.id} style={styles.trait}>
                  <span style={styles.traitName}>{t.name}</span>
                  <div style={styles.scale} role="meter" aria-label={t.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                    <div style={styles.track}>
                      <div className="comic-meter-fill" style={{ ...styles.fill, width: `${percent}%` }} />
                    </div>
                    <div style={styles.ends} aria-hidden>
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  <span style={styles.value}>{percent}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 24px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  header: {
    maxWidth: 1100,
    margin: '8px auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px 40px',
  },
  title: {
    fontSize: 'clamp(40px, 7vw, 76px)',
  },
  bubble: {
    maxWidth: 520,
    '--tilt': '-1deg',
  } as CSSProperties,
  share: {
    maxWidth: 1100,
    margin: '0 auto 24px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px 16px',
    fontSize: 19,
  },
  hint: {
    flex: '1 1 240px',
  },
  small: {
    padding: '4px 14px',
    background: 'var(--ivory-white)',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: 'var(--font-comic)',
    fontSize: 20,
    letterSpacing: 1,
  },
  note: {
    color: 'var(--brown-red)',
  },
  //one part of the person, as a panel. More sections will sit alongside personality
  section: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    padding: '22px 28px 8px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    fontSize: 19,
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  sectionTitle: {
    marginBottom: 12,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 44,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: blue,
  },
  domain: {
    marginBottom: 24,
  },
  domainTitle: {
    paddingBottom: 6,
    borderBottom: `4px solid ${gunmetal}`,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: 'var(--brown-red)',
  },
  traits: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  //name, bar and score on one line, wrapping on narrow screens
  trait: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 24px',
    padding: '12px 0',
    borderBottom: '2px dashed rgba(57, 61, 63, 0.35)',
  },
  traitName: {
    flex: '1 1 200px',
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  scale: {
    flex: '3 1 300px',
  },
  track: {
    height: 18,
    padding: 3,
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: `repeating-linear-gradient(-45deg, ${blue} 0 10px, #7d9dba 10px 20px)`,
    borderRadius: 6,
  },
  ends: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '2px 4px 0',
    fontSize: 14,
    opacity: 0.6,
  },
  value: {
    width: 40,
    textAlign: 'right',
    fontFamily: comic,
    fontSize: 22,
    color: blue,
  },
  footer: {
    maxWidth: 1100,
    margin: '40px auto 0',
    textAlign: 'center',
  },
  button: {
    padding: '6px 18px',
    background: 'var(--air-force-blue)',
    color: 'var(--ivory-white)',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: 'var(--font-comic)',
    fontSize: 24,
    letterSpacing: 1.5,
  },
};

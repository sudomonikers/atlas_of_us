import type { CSSProperties } from 'react';
import { useSession } from '../auth/api';
import { navigate } from '../router';
import { Nav } from '../shared_components/nav';
import { Mascot } from '../shared_components/mascot';

const gunmetal = 'var(--gunmetal-black)';
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

const STOPS = [
  {
    title: 'Your personality',
    body: "Personality tests are broken: a vague statement, five buttons, and nobody ever asks why. So we drop you into situations instead. A shipwreck, a party full of strangers, a ferry with one seat left. You decide what to do, tell us why, and we map you across the Big Five and the parts of being human it leaves out.",
  },
  { title: 'What you know', body: 'A map of every idea people hold, true, disputed or flat-out wrong, and how deeply you hold each one.' },
  { title: 'What you can do', body: 'Every skill from cooking to coding, measured from fumbling novice to effortless expert.' },
  { title: 'Your body', body: 'The physical you, because what you can become depends on what you have to work with.' },
  { title: 'Your people', body: 'Friends, family, the places you work and the circles you move in.' },
  { title: 'Your stuff', body: "The things you own and use, which say more about you than you'd think." },
  { title: 'Your world', body: "The places, events and works of art that make up the world you're living in." },
];

const APPS = [
  { name: 'Tinder, but better', body: "Matched on who you actually are, not six photos and a joke about pineapple on pizza." },
  { name: 'LinkedIn, but better', body: 'Your dream job, found from everything you can do, not the buzzwords on your résumé.' },
  { name: 'Hiring, but better', body: 'Companies meet the people who will thrive with them, not just the ones who interview well.' },
  { name: 'Meetup, but better', body: 'Friends who get you, found by what you share rather than which app you both happened to download.' },
  { name: 'Shopping, but better', body: 'Things that fit your goals and your life, recommended by something that knows you.' },
];

//where the Atlas is headed, one stop at a time, ending with who you could become
export default function Roadmap() {
  const loggedIn = useSession().status === 'authenticated';

  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <h1 style={styles.title} className="comic-title">
        The Road Ahead
      </h1>
      <div style={styles.guide}>
        <Mascot />
        <div style={styles.bubble} className="comic-bubble comic-pop">
          Nobody has ever mapped a whole person. Not your personality, not your skills, not your people. <em>All</em> of
          it. That's what we're building, and here's the route.
        </div>
      </div>

      <ol style={styles.route}>
        {STOPS.map((s, i) => (
          <li key={s.title} style={styles.stop}>
            <span style={{ ...styles.pin, background: i ? ivory : brownRed, color: i ? gunmetal : ivory }}>{i + 1}</span>
            <section
              style={{ ...styles.panel, '--panel-fill': i ? '#fff' : 'var(--pale-red)', '--tilt': `${i % 2 ? 0.4 : -0.4}deg`, animationDelay: `${i * 90}ms` } as CSSProperties}
              className="comic-panel comic-pop"
            >
              <span style={{ ...styles.stamp, color: i ? blue : brownRed }} className="comic-stamp">
                {i ? 'Coming soon' : 'You are here'}
              </span>
              <h2 style={styles.heading}>{s.title}</h2>
              <p style={styles.text}>{s.body}</p>
            </section>
          </li>
        ))}
        <li style={styles.stop}>
          <span style={{ ...styles.pin, background: blue, color: ivory }}>★</span>
          <section style={{ ...styles.panel, '--panel-fill': 'var(--pale-blue)', '--tilt': '-0.5deg' } as CSSProperties} className="comic-panel comic-pop">
            <span style={{ ...styles.stamp, color: brownRed }} className="comic-stamp">
              The destination
            </span>
            <h2 style={{ ...styles.heading, fontSize: 'clamp(34px, 6vw, 52px)' }}>Who you could become</h2>
            <p style={styles.text}>
              Once we've mapped everything a human can be, and exactly where you stand on it, we can show you every road out
              from here. Real ones, grounded in who you actually are: which come naturally, which will be a climb, and the
              steps to get there.
            </p>
            <p style={styles.big}>If you've got dreams, we'll show you the way. If you don't, we'll give you some.</p>
          </section>
        </li>
      </ol>

      <footer style={styles.footer}>
        <h2 style={styles.subtitle} className="comic-title">
          Every journey starts somewhere.
        </h2>
        <p style={styles.text}>Yours starts with your personality. Play a few scenarios and watch your map appear.</p>
        <div style={styles.ctas}>
          <button
            className="comic-lift"
            style={styles.primary}
            onClick={() => navigate(loggedIn ? '/personality' : '/create-account?next=/personality')}
          >
            Map my personality ▶
          </button>
          {!loggedIn && (
            <button className="comic-lift" style={styles.secondary} onClick={() => navigate('/login?next=/personality')}>
              Log in
            </button>
          )}
        </div>
      </footer>

      <aside style={styles.ps} className="comic-panel comic-pop">
        <h2 style={styles.heading}>P.S. Here's where it gets wild.</h2>
        <p style={styles.text}>
          Every app that matches you with something works from a sliver of you: a few photos, a résumé, what you bought
          last week. The Atlas has the whole picture, from your personality and what you know to what you can do, your
          people and your world. <em>That's</em> what lets us do it better. Once enough of us are on the map, here's what
          we'd love to build:
        </p>
        <ul style={styles.apps}>
          {APPS.map((a) => (
            <li key={a.name} style={styles.text}>
              <strong style={styles.app}>{a.name}.</strong> {a.body}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

const button: CSSProperties = {
  padding: '6px 18px',
  border: `3px solid ${gunmetal}`,
  borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
  boxShadow: `3px 4px 0 ${gunmetal}`,
  fontFamily: comic,
  fontSize: 24,
  letterSpacing: 1.5,
};

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 16px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  title: {
    margin: '8px auto 28px',
    fontSize: 'clamp(48px, 9vw, 96px)',
    textAlign: 'center',
  },
  guide: {
    maxWidth: 820,
    margin: '0 auto 48px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    flex: '1 1 280px',
    '--tilt': '-1deg',
  } as CSSProperties,
  //a dashed road down the left, with a numbered pin at each stop
  route: {
    maxWidth: 820,
    margin: '0 auto',
    padding: '0 0 0 22px',
    listStyle: 'none',
    borderLeft: `4px dashed ${gunmetal}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 36,
  },
  stop: {
    marginLeft: -46,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  pin: {
    flex: '0 0 auto',
    width: 44,
    boxSizing: 'border-box',
    height: 44,
    display: 'grid',
    placeItems: 'center',
    border: `3px solid ${gunmetal}`,
    borderRadius: '50%',
    boxShadow: `2px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 24,
  },
  panel: {
    flex: 1,
    minWidth: 0,
    padding: '18px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderRadius: 'var(--wobbly)',
  },
  stamp: {
    alignSelf: 'flex-start',
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 'clamp(28px, 4.5vw, 36px)',
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.35,
  },
  big: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.3,
    color: blue,
  },
  footer: {
    maxWidth: 820,
    margin: '64px auto 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 'clamp(34px, 6vw, 56px)',
  },
  ctas: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  ps: {
    maxWidth: 820,
    margin: '72px auto 0',
    padding: '20px 26px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-cinnamon)',
    '--tilt': '0.6deg',
  } as CSSProperties,
  apps: {
    margin: 0,
    paddingLeft: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  app: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: blue,
  },
  primary: { ...button, background: brownRed, color: ivory },
  secondary: { ...button, background: ivory, color: gunmetal },
};

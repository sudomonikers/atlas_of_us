import type { CSSProperties } from 'react';
import { useSession } from '../auth/api';
import { navigate } from '../router';
import { Nav } from '../shared_components/nav';
import { Chart } from './chart';

const gunmetal = 'var(--gunmetal-black)';
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const sand = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';

const APPS = [
  {
    name: 'Tinder, but better',
    body: "Matched on who you actually are, not six photos and a joke about pineapple on pizza. This is for soul mates. Already found yours? Put your maps side by side and see where you click and where you'll clash.",
  },
  {
    name: 'LinkedIn, but better',
    body: "Your dream job, with skills that are verified instead of oversold. If you're a company: your dream candidate, and a team that knows how each person works best and where the friction will come from.",
  },
  {
    name: 'Meetup, but better',
    body: 'Friends who get you, found by what you share rather than which app you both happened to download. Plus the co-founder you can build with and the roommate you can actually live with.',
  },
  {
    name: 'Shopping, but better',
    body: "Things that fit your goals and your life, recommended by something that knows you. Gifts your friends will actually love, and the next hobby you didn't know you needed.",
  },
  {
    name: 'School, but better',
    body: 'Pick anything you want to learn or become, and get a path there that starts exactly where you are and fits how you learn.',
  },
];

//a message in a bottle, washed up on a little wave
const Bottle = () => (
  <svg viewBox="0 0 160 130" width={150} style={{ flex: '0 0 auto', stroke: gunmetal, strokeLinejoin: 'round' }} aria-hidden>
    <g className="atlas-bob">
      <g transform="translate(0 34) rotate(-18 80 50)" strokeWidth={3}>
        <path d="M30 50 C30 34 46 30 62 30 H88 C96 30 98 38 104 41 H116 V59 H104 C98 62 96 70 88 70 H62 C46 70 30 66 30 50Z" style={{ fill: 'var(--pale-blue)' }} />
        <rect x="116" y="42" width="13" height="16" rx="3" style={{ fill: 'var(--cinnamon-wood)' }} />
        <rect x="42" y="42" width="44" height="16" rx="8" style={{ fill: ivory }} />
        <path d="M50 48 H78 M50 53 H70" fill="none" strokeWidth={1.5} />
        <path d="M40 40 C46 35 56 34 66 35" fill="none" style={{ stroke: '#fff' }} strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
    <path d="M0 104 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 V130 H0Z" style={{ fill: 'var(--pale-blue)' }} stroke="none" />
    <path d="M0 104 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0 q10 -9 20 0" fill="none" strokeWidth={3} />
  </svg>
);

//where the Atlas is headed, charted as a map, ending with who you could become
export default function Roadmap() {
  const loggedIn = useSession().status === 'authenticated';

  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <Chart />

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
            Set sail: map my personality ▶
          </button>
          {!loggedIn && (
            <button className="comic-lift" style={styles.secondary} onClick={() => navigate('/login?next=/personality')}>
              Log in
            </button>
          )}
        </div>
      </footer>

      <aside style={styles.ps}>
        <Bottle />
        <div style={styles.scroll} className="comic-panel comic-pop">
          <span style={{ ...styles.roll, top: -12 }} />
          <h2 style={styles.heading}>P.S. The possibilities of what we could do with a full mapping of people are endless.</h2>
          <p style={styles.text}>
            Every app that matches you with something works from a sliver of you: a few photos, a résumé, what you bought
            last week. The Atlas has the whole picture - from your personality to your knowledge to your skills and everything in
            between. <em>That's</em> what lets us do it better. Once enough of us are on the Atlas, here's what
            we'd love to build:
          </p>
          <ul style={styles.apps}>
            {APPS.map((a) => (
              <li key={a.name} style={styles.text}>
                <strong style={styles.app}>{a.name}.</strong> {a.body}
              </li>
            ))}
          </ul>
          <span style={{ ...styles.roll, bottom: -12 }} />
        </div>
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
    overflowX: 'hidden',
    padding: '32px 16px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
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
    maxWidth: 900,
    margin: '72px auto 0',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  //a paper scroll, with a rolled edge top and bottom
  scroll: {
    flex: '1 1 300px',
    padding: '28px 26px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    borderRadius: 6,
    '--panel-fill': sand,
    '--tilt': '0.6deg',
  } as CSSProperties,
  roll: {
    position: 'absolute',
    left: -10,
    right: -10,
    height: 22,
    background: sand,
    border: `4px solid ${gunmetal}`,
    borderRadius: 11,
  },
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

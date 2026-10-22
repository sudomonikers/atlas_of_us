import type { CSSProperties } from 'react';
import { navigate } from '../router';
import { Nav } from '../shared_components/nav';
import { Scenes } from './scenes';
import { Strip } from './strip';

const gunmetal = 'var(--gunmetal-black)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

export default function Home() {
  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <h1 style={styles.title} className="comic-title">
        The Atlas of Us
      </h1>
      <Strip />
      <section style={styles.blurb} className="comic-panel comic-pop">
        <h2 style={styles.heading}>What is this exactly?</h2>
        <p style={styles.text}>
          The Atlas of Us is a map of you. All the things that make you you from your physical self to your mental thoughts 
          to your personality to your skills and dreams and desires. The Atlas endeavors to capture all that you are, and 
          show you all that you could be. No horoscopes, no ten-question quizzes. We drop you into situations, like a store 
          where someone is shoplifting or bungie jumping off a bridge with just rope, and ask what you'd do and <em>why</em>. 
        </p>
      </section>
      <section style={styles.scenes} className="comic-panel">
        <h2 style={{ ...styles.heading, textAlign: 'center' }}>What is a human made of?</h2>
        <Scenes />
      </section>
      <footer style={styles.footer}>
        <button className="comic-lift" style={styles.primary} onClick={() => navigate('/roadmap')}>
          See where we're headed ▶
        </button>
      </footer>
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
  },
  title: {
    margin: '8px auto 36px',
    fontSize: 'clamp(48px, 9vw, 96px)',
    textAlign: 'center',
  },
  primary: { ...button, background: brownRed, color: ivory },
  blurb: {
    maxWidth: 760,
    margin: '48px auto 0',
    padding: '22px 28px',
    boxSizing: 'border-box',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
    '--tilt': '-0.4deg',
  } as CSSProperties,
  heading: {
    margin: '0 0 10px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 'clamp(30px, 5vw, 40px)',
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 21,
    lineHeight: 1.35,
  },
  scenes: {
    maxWidth: 1000,
    margin: '48px auto 0',
    padding: '22px clamp(16px, 4vw, 40px) 28px',
    boxSizing: 'border-box',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--ivory-white)',
    '--tilt': '0.3deg',
  } as CSSProperties,
  footer: {
    margin: '40px auto 0',
    textAlign: 'center',
  },
};

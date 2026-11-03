import { useState, type CSSProperties } from 'react';
import Conditions from './conditions';
import Impairments from './impairments';
import Measurements from './measurements';
import { RequireLogin } from '../auth/require-login';
import { Footer } from '../shared_components/footer';
import { Mascot } from '../shared_components/mascot';
import { Nav } from '../shared_components/nav';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

type View = 'measurements' | 'impairments' | 'conditions';

const VIEWS: { id: View; label: string; bubble: string }[] = [
  {
    id: 'measurements',
    label: 'Measurements',
    bubble: "Measure what you can, and I'll show you where you sit among people your age. Bigger isn't always better, and where it is, I'll say so.",
  },
  {
    id: 'impairments',
    label: 'Impairments',
    bubble: "Anything about your body or mind that doesn't work the way it might. Knowing it means I can show you paths that work for you, not around you.",
  },
  {
    id: 'conditions',
    label: 'Conditions',
    bubble: "Asthma, ADHD, a heart that skips: whatever you live with. It stays between us, and it helps me find what fits you.",
  },
];

//Physical Traits: the user's measurements, impairments and conditions
function Physical() {
  const [view, setView] = useState<View>('measurements');
  const current = VIEWS.find((v) => v.id === view)!;

  return (
    <RequireLogin reason="I can't show you how your body compares until I know who you are. Make an account and let's measure up.">
      <div style={styles.page} className="comic-page">
        <Nav />
        <header style={styles.header}>
          <h1 style={styles.title} className="comic-title">
            Physical Traits
          </h1>
          <div style={styles.guide}>
            <Mascot />
            <div style={styles.bubble} className="comic-bubble comic-pop">
              {current.bubble}
            </div>
          </div>
        </header>

        <div style={styles.views}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className="comic-lift"
              style={{ ...styles.viewButton, ...(view === v.id ? styles.viewButtonActive : {}) }}
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'measurements' && <Measurements />}
        {view === 'impairments' && <Impairments />}
        {view === 'conditions' && <Conditions />}
        <Footer />
      </div>
    </RequireLogin>
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
  //title on the left with the guide beside it; the guide drops underneath on narrow screens
  header: {
    maxWidth: 1100,
    margin: '8px auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px 40px',
  },
  title: {
    fontSize: 'clamp(48px, 8vw, 84px)',
  },
  guide: {
    flex: '1 1 360px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    maxWidth: 520,
    '--tilt': '-1deg',
  } as CSSProperties,
  views: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  viewButton: {
    padding: '4px 20px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1.5,
  },
  viewButtonActive: {
    background: brownRed,
    color: ivory,
  },
};

export default Physical;

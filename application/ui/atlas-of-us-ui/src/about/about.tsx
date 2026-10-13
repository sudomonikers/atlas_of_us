import type { CSSProperties } from 'react';
import { Nav } from '../shared_components/nav';

export default function About() {
  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <h1 style={styles.title} className="comic-title">
        About Us
      </h1>
      <div style={styles.bubble} className="comic-bubble comic-pop">
        Who's behind the Atlas, and why we're building it. We're still writing this page.
      </div>
    </div>
  );
}

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
  bubble: {
    maxWidth: 560,
    margin: '0 auto',
    '--tilt': '-1deg',
  } as CSSProperties,
};

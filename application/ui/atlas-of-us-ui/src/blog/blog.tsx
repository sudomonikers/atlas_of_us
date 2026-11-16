import type { CSSProperties } from 'react';
import { Mascot } from '../shared_components/mascot';
import { Nav } from '../shared_components/nav';

export default function Blog() {
  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <h1 style={styles.title} className="comic-title">
        The Blog
      </h1>
      <div style={styles.guide}>
        <Mascot />
        <div style={styles.bubble} className="comic-bubble comic-pop">
          This is where the notes from the road go. There aren't any yet. Andrew says he's &ldquo;working on it.&rdquo; Check back soon, it'll be worth it.
        </div>
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
  guide: {
    maxWidth: 680,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    flex: 1,
    '--tilt': '-1deg',
  } as CSSProperties,
};

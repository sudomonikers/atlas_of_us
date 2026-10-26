import type { CSSProperties } from 'react';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const paleBlue = 'var(--pale-blue)';
const comic = 'var(--font-comic)';

//the Skills Explorer view: every skill in the Atlas and how they connect, to browse and open
export default function Explorer() {
  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>Skills Explorer</h2>
      <p style={styles.text}>Every skill in the Atlas, and how each one connects to the others.</p>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px 30px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  heading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: '12px 0 0',
    fontSize: 17,
    lineHeight: 1.5,
  },
};

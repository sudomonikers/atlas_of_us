import type { CSSProperties } from 'react';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const paleCinnamon = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';

//the My Knowledge view: the topics the user knows, how deeply they know them, and the ones they want to know
export default function MyKnowledge() {
  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>My Knowledge</h2>
      <p style={styles.text}>The topics you know, how deeply you know them, and the ones you want to learn next.</p>
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
    '--panel-fill': paleCinnamon,
    '--tilt': '0.3deg',
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

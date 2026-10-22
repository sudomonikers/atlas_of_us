import type { CSSProperties } from 'react';
import { Mascot } from './mascot';

const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const brownRed = 'var(--brown-red)';
const comic = 'var(--font-comic)';

//the Stripe payment link people chip in through. Public, so it's fine in the bundle
const SUPPORT_URL = 'https://buy.stripe.com/6oU3co0sj1rg8NL9ay7IY00';

//Atlas begging for a dollar toward the servers, in every page's footer and the popup
export function Plea() {
  return (
    <>
      <div style={styles.wrap}>
        <Mascot size={70} />
        <p style={styles.text} className="comic-bubble">
          Real talk: every person I map costs about $0.68 in AI and servers, and Andrew is fresh out of VC money (he never
          had any). No ads, no selling your data, just me with my hat out. Chip in a dollar and you've paid your own way.
          Mostly.
        </p>
      </div>
      <a className="comic-lift" style={styles.button} href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        Chip in $1
      </a>
    </>
  );
}

//the plea, popped up once when someone gets their report
export function SupportPopup({ onClose }: { onClose: () => void }) {
  return (
    <div style={styles.backdrop} onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div style={styles.dialog} className="comic-panel comic-pop" role="dialog" aria-modal aria-label="Chip in" onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>You made it to the end!</h2>
        <Plea />
        <button className="comic-lift" style={styles.later} onClick={onClose} autoFocus>
          Maybe later
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    maxWidth: 640,
    margin: '0 auto 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 18, //room for the bubble's tail
    textAlign: 'left',
  },
  text: {
    flex: 1,
    margin: 0,
    padding: '8px 14px',
    fontSize: 19,
    lineHeight: 1.3,
  },
  button: {
    display: 'inline-block',
    padding: '6px 18px',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    background: ivory,
    color: gunmetal,
    fontSize: 20,
    textDecoration: 'none',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    display: 'grid',
    padding: 16,
    overflowY: 'auto',
    background: 'rgba(57, 61, 63, 0.55)',
  },
  dialog: {
    maxWidth: 520,
    margin: 'auto',
    padding: '24px 28px',
    textAlign: 'center',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': ivory,
  } as CSSProperties,
  heading: {
    margin: '0 0 12px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    color: brownRed,
  },
  later: {
    display: 'block',
    margin: '14px auto 0',
    padding: 0,
    border: 'none',
    background: 'none',
    color: gunmetal,
    fontSize: 17,
    textDecoration: 'underline',
  },
};

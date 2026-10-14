import type { CSSProperties } from 'react';
import { Mascot } from './mascot';

//how Atlas opens an error, snarky but on your side. The real message follows, so the error stays useful
const OPENERS = [
  'Well, this is embarrassing.',
  "Okay, that didn't go to plan.",
  'Whoops, I dropped something. Not the world, thankfully.',
  'Not my finest moment.',
  "Plot twist. Don't worry, you've got this.",
  "Deep breath. We'll sort this out.",
];

//picked from the message, so the same error always gets the same opener instead of a new one every render
const opener = (message: string) => {
  let hash = 0;
  for (const c of message) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return OPENERS[Math.abs(hash) % OPENERS.length];
};

//an error as Atlas says it: a little Atlas, his opener, then the message. Use it wherever the ui shows an error.
//size is Atlas's width, bigger where he's normally drawn full size (like a page header)
export function AtlasError({ message, size = 46, style }: { message: string; size?: number; style?: CSSProperties }) {
  return (
    <div role="alert" style={{ ...styles.wrap, ...style }}>
      <Mascot size={size} />
      <p style={styles.bubble} className="comic-bubble">
        <strong style={styles.opener}>{opener(message)}</strong> {message}
      </p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 18, //room for the bubble's tail
    textAlign: 'left',
  },
  bubble: {
    flex: 1,
    margin: 0,
    padding: '8px 14px',
    fontSize: 17,
    color: 'var(--gunmetal-black)',
  },
  opener: {
    fontFamily: 'var(--font-comic)',
    fontWeight: 400,
    letterSpacing: 0.5,
    color: 'var(--brown-red)',
  },
};

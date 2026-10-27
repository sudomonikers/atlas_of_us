import type { CSSProperties } from 'react';
import { Mascot } from './mascot';

//STYLE_GUIDE.md palette, defined as variables in App.css
const gunmetal = 'var(--gunmetal-black)';

//an ellipsis whose dots rise in turn, for the end of anything that's waiting on the api ("Saving", "Reading it").
//Screen readers hear the words alone, and with reduced motion the dots sit still
export function Dots() {
  return (
    <span className="comic-dots" aria-hidden>
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  );
}

interface ThinkingProps {
  label: string; //what's happening, without an ellipsis: "Finding that skill"
  mascot?: boolean; //for a whole page waiting on its data: the mascot says it in a speech bubble
  style?: CSSProperties;
}

//a line telling the user something is being fetched, announced to screen readers once
export function Thinking({ label, mascot, style }: ThinkingProps) {
  if (mascot) {
    return (
      <div role="status" style={{ ...styles.page, ...style }}>
        <Mascot />
        <p style={styles.bubble} className="comic-bubble comic-pop">
          {label}
          <Dots />
        </p>
      </div>
    );
  }
  return (
    <p role="status" style={{ ...styles.line, ...style }}>
      {label}
      <Dots />
    </p>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    maxWidth: 520,
    margin: 0,
    '--tilt': '-1deg',
  } as CSSProperties,
  line: {
    margin: 0,
    fontSize: 16,
    color: gunmetal,
  },
};

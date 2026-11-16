import type { CSSProperties } from 'react';
import { navigate } from '../router';

//in place of a premium feature's button when they're out of credits: says so, and sends them to buy more. buttonStyle
//is the feature's own button style, so it sits where that button would
export function GetCredits({ buttonStyle }: { buttonStyle: CSSProperties }) {
  return (
    <>
      <span style={styles.out}>You're out of credits.</span>
      <button className="comic-lift" style={buttonStyle} onClick={() => navigate('/credits')}>
        Get credits
      </button>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  out: {
    fontSize: 17,
    fontWeight: 700,
  },
};

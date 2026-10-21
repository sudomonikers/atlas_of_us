import type { CSSProperties } from 'react';
import { Plea } from './support';

const gunmetal = 'var(--gunmetal-black)';

//every page's footer: the plea for a dollar toward the servers
export function Footer() {
  return (
    <footer style={styles.footer}>
      <Plea />
    </footer>
  );
}

const styles: Record<string, CSSProperties> = {
  footer: {
    maxWidth: 1000,
    margin: '56px auto 0',
    paddingTop: 20,
    borderTop: `3px solid ${gunmetal}`,
    textAlign: 'center',
  },
};

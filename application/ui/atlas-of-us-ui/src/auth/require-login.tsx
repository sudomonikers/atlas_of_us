import type { CSSProperties, ReactNode } from 'react';

import { navigate } from '../router';
import { useSession } from './api';

interface RequireLoginProps {
  reason: string; //why this page needs an account, shown on the card
  children: ReactNode;
}

//wrap a page in this to require a login. Logged out users can see the page dimmed behind a card,
//but can't interact with it until they log in or create an account
export function RequireLogin({ reason, children }: RequireLoginProps) {
  const session = useSession();
  const locked = session.status === 'anonymous';
  //come back to this page after logging in
  const go = (path: string) => navigate(`${path}?next=${encodeURIComponent(window.location.pathname)}`);

  return (
    <>
      {/* inert stops clicks, focus and screen readers reaching the page behind the card */}
      <div inert={locked}>{children}</div>

      {locked && (
        <div style={styles.backdrop}>
          <section role="dialog" aria-modal aria-labelledby="require-login-title" style={styles.card} className="comic-panel comic-pop">
            <h2 id="require-login-title" style={styles.title} className="comic-title">
              Hold up!
            </h2>
            <p style={styles.text}>{reason}</p>
            <div style={styles.actions}>
              <button autoFocus className="comic-lift" style={styles.primary} onClick={() => go('/login')}>
                Log in ▶
              </button>
              <button className="comic-lift" style={styles.secondary} onClick={() => go('/create-account')}>
                Create an account
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const gunmetal = 'var(--gunmetal-black)';
const rounded = '14px 8px 12px 6px / 8px 12px 6px 14px';

const button: CSSProperties = {
  padding: '6px 18px',
  border: `3px solid ${gunmetal}`,
  borderRadius: rounded,
  boxShadow: `3px 4px 0 ${gunmetal}`,
  fontFamily: 'var(--font-comic)',
  fontSize: 24,
  letterSpacing: 1.5,
};

const styles: Record<string, CSSProperties> = {
  //the page shows through, faded and blurred
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    background: 'rgba(255, 252, 232, 0.7)',
    backdropFilter: 'blur(3px)',
  },
  card: {
    width: 'min(460px, 100%)',
    padding: '26px 30px 28px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    textAlign: 'center',
    '--panel-fill': 'var(--pale-red)',
    '--tilt': '-0.8deg',
  } as CSSProperties,
  title: {
    fontSize: 52,
    marginBottom: 10,
  },
  text: {
    fontSize: 21,
    lineHeight: 1.3,
    marginBottom: 22,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  primary: { ...button, background: 'var(--brown-red)', color: 'var(--ivory-white)' },
  secondary: { ...button, background: 'var(--ivory-white)', color: gunmetal },
};

import { useEffect, useState, type CSSProperties } from 'react';
import { useSession } from '../auth/api';
import { navigate, replace, useSearch } from '../router';
import { AtlasError } from '../shared_components/atlas-error';
import { Mascot } from '../shared_components/mascot';
import { Nav } from '../shared_components/nav';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { Thinking } from '../shared_components/thinking';
import { checkout, confirm, manage, price, useCredits, type Kind } from './api';

//what credits buy, so far
const FEATURES = [
  { name: 'Your physical summary', body: 'Everything you\'ve added to Physical Traits, written up as one picture of your body and mind.', path: '/physical' },
  { name: 'Your personality report', body: 'Every trait from every chapter, written up in one place, with your strengths and what to watch for.', path: '/personality' },
];

const until = (at: string) => new Date(at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

//the logged in person's credits, what they pay for, and buying more: a pack, or a subscription for unlimited use. Stripe
//sends them back here with ?checkout= once they've paid, which is settled before the balance shows
export default function Credits() {
  const session = useSession();
  const balance = useCredits();
  const search = useSearch();
  const [settling, setSettling] = useState(() => new URLSearchParams(search).has('checkout'));
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (session.status === 'anonymous') navigate('/login?next=/credits');
  }, [session.status]);

  useEffect(() => {
    const id = new URLSearchParams(search).get('checkout');
    if (!id || session.status !== 'authenticated') return;
    confirm(id)
      .catch((e: Error) => setError(e.message))
      .finally(() => {
        setSettling(false);
        replace('/credits');
      });
  }, [search, session.status]);

  //off to Stripe, which brings them back here
  const go = (to: () => Promise<void>) => {
    setError(undefined);
    to().catch((e: Error) => setError(e.message));
  };
  const buy = (kind: Kind) => go(() => checkout(kind));

  const subscribed = balance?.subscribed_until;
  const sale = balance?.for_sale;

  return (
    <div style={styles.page} className="comic-page">
      <Nav />
      <h1 style={styles.title} className="comic-title">
        Credits
      </h1>

      {!balance || settling ? (
        <div style={styles.center}>
          <Thinking label={settling ? 'Checking on your payment' : 'Finding your credits'} />
        </div>
      ) : (
        <>
          <section style={styles.balance} className="comic-panel" aria-label="Your credits">
            <Mascot size={90} />
            <div style={styles.balanceText}>
              {subscribed ? (
                <>
                  <p style={styles.big}>Unlimited</p>
                  <p style={styles.text}>You're subscribed until {until(subscribed)}, so I'll write as much as you like.</p>
                  {balance.has_customer && (
                    <button className="comic-lift" style={styles.secondary} onClick={() => go(manage)}>
                      Manage my subscription
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p style={styles.big}>
                    {balance.credits} credit{balance.credits === 1 ? '' : 's'}
                  </p>
                  <p style={styles.text}>
                    Each one has me write up one of the things below. If I can't write it, you get the credit back.
                  </p>
                </>
              )}
            </div>
          </section>

          <section style={styles.section} aria-label="What credits buy">
            <h2 style={styles.heading}>What they're for</h2>
            <div style={styles.cards}>
              {FEATURES.map((f) => (
                <button key={f.name} className="comic-panel comic-lift" style={styles.feature} onClick={() => navigate(f.path)}>
                  <strong style={styles.featureName}>{f.name}</strong>
                  <span style={styles.text}>{f.body}</span>
                </button>
              ))}
            </div>
          </section>

          {!subscribed && (
            <section style={styles.section} aria-label="Get more">
              <h2 style={styles.heading}>Get more</h2>
              {sale ? (
                <div style={styles.cards}>
                  <div className="comic-panel" style={styles.offer}>
                    <strong style={styles.featureName}>{sale.pack_credits} credits</strong>
                    <span style={styles.price}>{price(sale.pack)}</span>
                    <span style={styles.text}>Use them whenever you like. They don't run out.</span>
                    <button className="comic-lift" style={styles.primary} onClick={() => buy('pack')}>
                      Buy {sale.pack_credits} credits
                    </button>
                  </div>
                  <div className="comic-panel" style={styles.offer}>
                    <strong style={styles.featureName}>Unlimited</strong>
                    <span style={styles.price}>{price(sale.subscription)} a month</span>
                    <span style={styles.text}>Everything I write, as often as you like, while you're subscribed. Cancel anytime.</span>
                    <button className="comic-lift" style={styles.primary} onClick={() => buy('subscription')}>
                      Subscribe
                    </button>
                  </div>
                </div>
              ) : (
                <p style={styles.text}>Buying credits isn't open yet. Check back soon.</p>
              )}
              <p style={styles.small}>Payments go through Stripe. Your card details never reach me.</p>
            </section>
          )}
        </>
      )}

      {error && <AtlasError message={error} style={styles.error} />}
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
    margin: '8px auto 28px',
    fontSize: 'clamp(48px, 9vw, 96px)',
    textAlign: 'center',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
  },
  balance: {
    maxWidth: 760,
    margin: '0 auto 36px',
    padding: '20px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 20,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-blue)',
  } as CSSProperties,
  balanceText: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  big: {
    margin: 0,
    fontFamily: comic,
    fontSize: 48,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: brownRed,
  },
  section: {
    maxWidth: 760,
    margin: '0 auto 36px',
  },
  heading: {
    margin: '0 0 14px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 34,
    letterSpacing: 1,
    color: gunmetal,
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
  },
  feature: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '16px 20px',
    textAlign: 'left',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    color: gunmetal,
    font: 'inherit',
    cursor: 'pointer',
    '--panel-fill': ivory,
  } as CSSProperties,
  offer: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    padding: '18px 22px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-cinnamon)',
  } as CSSProperties,
  featureName: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 26,
    letterSpacing: 1,
    color: brownRed,
  },
  price: {
    fontFamily: comic,
    fontSize: 32,
    letterSpacing: 1,
  },
  text: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.4,
  },
  small: {
    margin: '14px 0 0',
    fontSize: 14,
    opacity: 0.75,
  },
  primary: {
    marginTop: 'auto',
    padding: '6px 20px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    cursor: 'pointer',
  },
  secondary: {
    padding: '4px 16px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    fontSize: 17,
    cursor: 'pointer',
  },
  error: {
    maxWidth: 760,
    margin: '0 auto',
  },
};

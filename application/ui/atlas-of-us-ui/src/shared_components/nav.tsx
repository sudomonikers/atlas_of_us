import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { logout, useSession } from '../auth/api';
import { Feedback } from '../feedback/feedback';
import { navigate, usePath } from '../router';

const LINKS = [
  ['Home', '/'],
  ['Explore the Atlas'], //the menu of ATLAS
  ['Roadmap', '/roadmap'],
  ['About', '/about'],
  ['Blog', '/blog'],
];

//every part of a person the Atlas maps. Only those with a path are live
const ATLAS = [
  ['Personality', '/personality'],
  ['Knowledge', '/topics'],
  ['Skills', '/skills'],
  ['Your body'],
  ['Your people'],
  ['Your stuff'],
  ['Your world'],
];

//the nav bar, with the current page pressed in and, once logged in, the account buttons on the right
export function Nav() {
  const path = usePath();
  const session = useSession();
  const auth = path === '/login' || path === '/create-account';
  return (
    <nav style={styles.nav}>
      <div style={styles.group}>
        {LINKS.map(([label, to]) =>
          to ? (
            <button
              key={to}
              className="comic-lift"
              style={path === to ? { ...styles.link, ...styles.active } : styles.link}
              aria-current={path === to ? 'page' : undefined}
              onClick={() => navigate(to)}
            >
              {label}
            </button>
          ) : (
            <Menu key={label} label={label} active={ATLAS.some(([, to]) => to === path)}>
              {ATLAS.map(([label, to]) => (
                <button
                  key={label}
                  className="comic-lift"
                  style={to === path ? { ...styles.item, ...styles.active } : to ? styles.item : { ...styles.item, ...styles.soon }}
                  aria-current={to === path ? 'page' : undefined}
                  disabled={!to}
                  onClick={() => to && navigate(to)}
                >
                  {label}
                  {!to && ' · soon'}
                </button>
              ))}
            </Menu>
          ),
        )}
      </div>
      {session.status === 'authenticated' && <Account username={session.person.username} admin={session.person.admin} />}
      {session.status === 'anonymous' && (
        <button
          className="comic-lift"
          style={auth ? { ...styles.link, ...styles.active } : styles.link}
          onClick={() => !auth && navigate(`/login?next=${encodeURIComponent(path)}`)}
        >
          Log in / Sign up
        </button>
      )}
    </nav>
  );
}

//a nav button with a menu under it. The menu stays mounted while open so a popup inside it (feedback) survives,
//and closes on a click outside or escape
function Menu({ label, active = false, children }: { label: string; active?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={styles.dropdown}>
      <button className="comic-lift" style={open || active ? { ...styles.link, ...styles.active } : styles.link} aria-expanded={open} onClick={() => setOpen(!open)}>
        {label} ▾
      </button>
      {open && (
        <div style={styles.menu} className="comic-panel">
          {children}
        </div>
      )}
    </div>
  );
}

function Account({ username, admin }: { username: string; admin: boolean }) {
  return (
    <Menu label="My profile" active={usePath() === `/u/${username}`}>
      <button className="comic-lift" style={styles.item} onClick={() => navigate(`/u/${username}`)}>
        View profile
      </button>
      {admin && (
        <button className="comic-lift" style={styles.item} onClick={() => navigate('/admin')}>
          Admin
        </button>
      )}
      <Feedback buttonStyle={styles.item} />
      <button className="comic-lift" style={styles.item} onClick={logout}>
        Log out
      </button>
    </Menu>
  );
}

const styles: Record<string, CSSProperties> = {
  nav: {
    maxWidth: 1100,
    margin: '0 auto 24px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px 32px',
  },
  group: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  link: {
    padding: '4px 14px',
    background: 'var(--ivory-white)',
    color: 'var(--gunmetal-black)',
    border: '3px solid var(--gunmetal-black)',
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: '3px 4px 0 var(--gunmetal-black)',
    fontFamily: 'var(--font-comic)',
    fontSize: 20,
    letterSpacing: 1,
  },
  dropdown: {
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    zIndex: 30,
    minWidth: '100%',
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    borderRadius: 'var(--wobbly)',
  },
  item: {
    padding: '4px 14px',
    background: 'var(--ivory-white)',
    color: 'var(--gunmetal-black)',
    border: '3px solid var(--gunmetal-black)',
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: '3px 4px 0 var(--gunmetal-black)',
    fontFamily: 'var(--font-comic)',
    fontSize: 20,
    letterSpacing: 1,
    whiteSpace: 'nowrap',
  },
  soon: {
    opacity: 0.5,
    boxShadow: 'none',
  },
  active: {
    background: 'var(--brown-red)',
    color: 'var(--ivory-white)',
  },
};

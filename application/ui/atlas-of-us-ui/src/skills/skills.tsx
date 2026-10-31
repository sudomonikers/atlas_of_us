import { useState, type CSSProperties } from 'react';
import { navigate, usePath } from '../router';
import Explorer from './explorer';
import { emptyBoard, place, type SkillBoard } from './skill_board';
import MySkills from './my_skills';
import Explained from './explained';
import { Footer } from '../shared_components/footer';
import { Nav } from '../shared_components/nav';
import { RequireLogin } from '../auth/require-login';
import { Mascot } from '../shared_components/mascot';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

type View = 'explorer' | 'mine' | 'explained';

const VIEWS: { id: View; label: string; bubble: string }[] = [
  { id: 'explained', label: 'Skills Explained', bubble: 'Nobody starts out an expert. Here is how the levels work.' },
  { id: 'explorer', label: 'Skills Explorer', bubble: 'Every skill anyone can have, from juggling to brain surgery. Search for one, then follow where it leads.' },
  { id: 'mine', label: 'My Skills', bubble: "What you can do now, and what you'd like to be able to do." },
];

function Skills() {
  const path = usePath();
  //an open skill lives in the url, /skills/<id>, and always shows in the explorer
  const skillId = path.startsWith('/skills/') ? decodeURIComponent(path.slice('/skills/'.length)) || undefined : undefined;
  const [chosen, setView] = useState<View>('explained');
  //the explorer's board, kept here so it's still there after a look at Skills Explained
  const [board, setBoard] = useState<SkillBoard>(emptyBoard);
  const view = skillId ? 'explorer' : chosen;
  const current = VIEWS.find((v) => v.id === view)!;
  const choose = (next: View) => {
    setView(next);
    if (skillId && next !== 'explorer') navigate('/skills');
  };

  return (
    <RequireLogin reason="I can't tell what you can do until I know who you are. Make an account and let's find out.">
      <div style={dash.page} className="comic-page">
        <Nav />
        <header style={dash.header}>
          <h1 style={dash.title} className="comic-title">
            Skills
          </h1>
          <div style={dash.guide}>
            <Mascot />
            <div style={dash.bubble} className="comic-bubble comic-pop">
              {current.bubble}
            </div>
          </div>
        </header>

        <div style={dash.views}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className="comic-lift"
              style={{ ...dash.viewButton, ...(view === v.id ? dash.viewButtonActive : {}) }}
              aria-pressed={view === v.id}
              onClick={() => choose(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        {view === 'explorer' && <Explorer skillId={skillId} board={board} onBoard={setBoard} />}
        {view === 'mine' && <MySkills />}
        {view === 'explained' && (
          <Explained
            onExplore={(skill) => {
              setBoard((b) => place(b, skill));
              setView('explorer');
            }}
          />
        )}
        <Footer />
      </div>
    </RequireLogin>
  );
}

const dash: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    padding: '32px 24px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  //title on the left with the guide beside it; the guide drops underneath on narrow screens
  header: {
    maxWidth: 1100,
    margin: '8px auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '16px 40px',
  },
  title: {
    fontSize: 'clamp(48px, 8vw, 84px)',
  },
  guide: {
    flex: '1 1 360px',
    display: 'flex',
    alignItems: 'center',
    gap: 18,
  },
  bubble: {
    maxWidth: 520,
    '--tilt': '-1deg',
  } as CSSProperties,
  views: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  viewButton: {
    padding: '4px 20px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1.5,
  },
  viewButtonActive: {
    background: brownRed,
    color: ivory,
  },
};

export default Skills;

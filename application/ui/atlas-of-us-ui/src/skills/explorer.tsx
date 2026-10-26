import { useCallback, useState, type CSSProperties } from 'react';
import type { SkillRef } from './api';
import { SkillGraph } from './graph';
import { emptyBoard, expandSkill, place, type SkillBoard } from './skill_board';
import { SkillPage } from './skill_page';
import { SkillSearch } from './search';
import type { SearchState } from './use_skill_search';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

type Mode = 'search' | 'graph';

const MODES: { id: Mode; label: string }[] = [
  { id: 'search', label: 'Search' },
  { id: 'graph', label: 'Graph' },
];

//the Skills Explorer view. Search for a skill and hop from it to every skill linked to it, or lay skills out on the
//graph and expand them. The open skill is in the url (/skills/<id>), and the trail of skills hopped through sits above it
export default function Explorer({ skillId }: { skillId?: string }) {
  const [mode, setMode] = useState<Mode>('search');
  const [search, setSearch] = useState<SearchState>({ query: '' });
  const [board, setBoard] = useState<SkillBoard>(emptyBoard);
  const [trail, setTrail] = useState<SkillRef[]>([]);

  //the trail up to the open skill, so going back cuts it there
  const at = trail.findIndex((s) => s.id === skillId);
  const shown = at >= 0 ? trail.slice(0, at + 1) : trail;

  const open = (skill: SkillRef, from: Mode | 'skill') => {
    setTrail(from === 'skill' ? [...shown, skill] : [skill]);
    navigate(`/skills/${encodeURIComponent(skill.id)}`);
  };
  //puts a skill on the graph, expanded, and goes to it
  const showInGraph = (skill: SkillRef) => {
    setBoard((b) => place(b, skill));
    expandSkill(board, skill.id, setBoard).catch(() => {}); //it's on the board either way, and can be expanded from there
    setMode('graph');
    navigate('/skills');
  };
  //a skill opened straight from its url starts a trail of its own
  const loaded = useCallback((skill: SkillRef) => setTrail((t) => (t.some((s) => s.id === skill.id) ? t : [skill])), []);

  if (!skillId) {
    return (
      <>
        <div style={styles.modes} role="group" aria-label="How to explore">
          {MODES.map((m) => (
            <button
              key={m.id}
              className="comic-lift"
              style={{ ...styles.mode, ...(mode === m.id ? styles.modeActive : {}) }}
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        {mode === 'search' && <SkillSearch search={search} onSearch={setSearch} onOpen={(skill) => open(skill, 'search')} />}
        {mode === 'graph' && <SkillGraph board={board} onBoard={setBoard} onOpen={(skill) => open(skill, 'graph')} />}
      </>
    );
  }

  return (
    <>
      <nav style={styles.trail} aria-label="Skills you've opened">
        <button className="comic-lift" style={styles.crumb} onClick={() => navigate('/skills')}>
          {MODES.find((m) => m.id === mode)!.label}
        </button>
        {shown.map((skill) => (
          <span key={skill.id} style={styles.step}>
            <span style={styles.arrow} aria-hidden>
              →
            </span>
            {skill.id === skillId ? (
              <span style={{ ...styles.crumb, ...styles.current }} aria-current="page">
                {skill.name}
              </span>
            ) : (
              <button className="comic-lift" style={styles.crumb} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                {skill.name}
              </button>
            )}
          </span>
        ))}
      </nav>
      <SkillPage key={skillId} id={skillId} onLoaded={loaded} onOpen={(skill) => open(skill, 'skill')} onShowInGraph={showInGraph} />
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  modes: {
    maxWidth: 1100,
    margin: '0 auto 20px',
    display: 'flex',
    gap: 8,
  },
  mode: {
    padding: '2px 16px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
  },
  modeActive: {
    background: gunmetal,
    color: ivory,
  },
  trail: {
    maxWidth: 1100,
    margin: '0 auto 20px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    fontSize: 20,
    color: brownRed,
  },
  crumb: {
    padding: '2px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: corners,
    font: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  current: {
    background: brownRed,
    color: ivory,
    cursor: 'default',
  },
};

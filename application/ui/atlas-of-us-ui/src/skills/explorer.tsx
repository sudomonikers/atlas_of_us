import { useCallback, useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react';
import type { SkillRef } from './api';
import { SkillGraph } from './graph';
import { place, type SkillBoard } from './skill_board';
import { SkillPage } from './skill_page';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface ExplorerProps {
  skillId?: string; //the open skill, from the url
  board: SkillBoard;
  onBoard: Dispatch<SetStateAction<SkillBoard>>;
}

//the Skills Explorer view. The board of every skill, to search, zoom around, select and expand; and a skill's page once
//one is opened. The open skill is in the url (/skills/<id>), and the trail of skills hopped through sits above it
export default function Explorer({ skillId, board, onBoard }: ExplorerProps) {
  const [trail, setTrail] = useState<SkillRef[]>([]);

  //the trail up to the open skill, so going back cuts it there
  const at = trail.findIndex((s) => s.id === skillId);
  const shown = at >= 0 ? trail.slice(0, at + 1) : trail;

  const open = (skill: SkillRef, from: 'board' | 'skill') => {
    setTrail(from === 'skill' ? [...shown, skill] : [skill]);
    navigate(`/skills/${encodeURIComponent(skill.id)}`);
  };
  //selects a skill on the board and goes back to it
  const showInGraph = (skill: SkillRef) => {
    onBoard((b) => place(b, skill));
    navigate('/skills');
  };
  //a skill opened straight from its url starts a trail of its own
  const loaded = useCallback((skill: SkillRef) => setTrail((t) => (t.some((s) => s.id === skill.id) ? t : [skill])), []);

  if (!skillId) return <SkillGraph board={board} onBoard={onBoard} onOpen={(skill) => open(skill, 'board')} />;

  return (
    <>
      <nav style={styles.trail} aria-label="Skills you've opened">
        <button className="comic-lift" style={styles.crumb} onClick={() => navigate('/skills')}>
          The map
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

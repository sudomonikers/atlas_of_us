import { useCallback, useState, type CSSProperties } from 'react';
import type { SkillRef } from './api';
import { SkillPage } from './skill_page';
import { SkillSearch, type SearchState } from './search';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//the Skills Explorer view: search for a skill, then hop from it to every skill linked to it. The open skill is in the
//url (/skills/<id>), and the trail of skills hopped through sits above it
export default function Explorer({ skillId }: { skillId?: string }) {
  const [search, setSearch] = useState<SearchState>({ query: '' });
  const [trail, setTrail] = useState<SkillRef[]>([]);

  //the trail up to the open skill, so going back cuts it there
  const at = trail.findIndex((s) => s.id === skillId);
  const shown = at >= 0 ? trail.slice(0, at + 1) : trail;

  const open = (skill: SkillRef, from: 'search' | 'skill') => {
    setTrail(from === 'search' ? [skill] : [...shown, skill]);
    navigate(`/skills/${encodeURIComponent(skill.id)}`);
  };
  //a skill opened straight from its url starts a trail of its own
  const loaded = useCallback((skill: SkillRef) => setTrail((t) => (t.some((s) => s.id === skill.id) ? t : [skill])), []);

  if (!skillId) return <SkillSearch search={search} onSearch={setSearch} onOpen={(skill) => open(skill, 'search')} />;

  return (
    <>
      <nav style={styles.trail} aria-label="Skills you've opened">
        <button className="comic-lift" style={styles.crumb} onClick={() => navigate('/skills')}>
          Search
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
      <SkillPage key={skillId} id={skillId} onLoaded={loaded} onOpen={(skill) => open(skill, 'skill')} />
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

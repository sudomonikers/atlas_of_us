import { useEffect, useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, getAchievements, monthYear, type AchievedSkill } from './api';
import { navigate } from '../router';
import { AtlasError } from '../shared_components/atlas-error';
import { LevelSteps } from '../shared_components/level_steps';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleCinnamon = 'var(--pale-cinnamon)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

//the My Skills view: the skills the user has placed themselves on, grouped by level from Expert down, each opening its
//skill page
export default function MySkills() {
  const [skills, setSkills] = useState<AchievedSkill[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    getAchievements().then(
      (loaded) => live && setSkills(loaded),
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <section style={styles.panel} className="comic-panel comic-pop">
      <h2 style={styles.heading}>My Skills</h2>
      <p style={styles.text}>The skills you have, grouped by the level you have them at.</p>
      {error && <AtlasError message={error} />}
      {!error && !skills && <Thinking label="Gathering what you can do" />}
      {skills && !skills.length && <p style={styles.text}>Nothing here yet. Open a skill in the Skills Explorer and add yourself to it.</p>}
      {LEVEL_NAMES.map((name, i) => ({ name, rank: i + 1 }))
        .reverse()
        .map(({ name, rank }) => {
          const at = skills?.filter((s) => s.rank === rank) ?? [];
          return (
            !!at.length && (
              <section key={rank} style={styles.group} aria-label={name}>
                <h3 style={styles.groupHeading}>
                  <LevelSteps rank={rank} total={LEVEL_NAMES.length} />
                  {name}
                  <span style={styles.count}>{at.length}</span>
                </h3>
                <ul style={styles.list}>
                  {at.map(({ skill, achieved_on, evidence }) => (
                    <li key={skill.id}>
                      <button className="comic-lift" style={styles.row} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
                        <span style={styles.name}>{skill.name}</span>
                        <span style={styles.detail}>
                          {achieved_on && `Since ${monthYear(achieved_on)}. `}
                          {evidence.length ? `${evidence.length} piece${evidence.length === 1 ? '' : 's'} of evidence` : 'No evidence yet'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          );
        })}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px 30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleCinnamon,
    '--tilt': '0.3deg',
  } as CSSProperties,
  heading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.5,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  groupHeading: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  count: {
    minWidth: 28,
    padding: '0 8px',
    boxSizing: 'border-box',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    fontFamily: 'inherit',
    fontSize: 16,
    textAlign: 'center',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 18px',
    padding: '10px 16px',
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  name: {
    flex: '1 1 220px',
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    overflowWrap: 'anywhere',
  },
  detail: {
    fontSize: 15,
    color: blue,
  },
};

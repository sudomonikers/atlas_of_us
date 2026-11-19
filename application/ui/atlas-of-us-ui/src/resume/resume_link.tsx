import type { CSSProperties } from 'react';
import { navigate } from '../router';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

//a way into importing a resume, from My Skills and My Knowledge
export function ResumeLink() {
  return (
    <div style={styles.row}>
      <span style={styles.text}>Have a resume? I can read it and add what it shows for you to check.</span>
      <button className="comic-lift" style={styles.button} onClick={() => navigate('/resume')}>
        Import my resume
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 14px',
    padding: '10px 14px',
    border: `2px dashed ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
  },
  text: {
    flex: '1 1 240px',
    fontSize: 16,
  },
  button: {
    padding: '4px 14px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    cursor: 'pointer',
  },
};

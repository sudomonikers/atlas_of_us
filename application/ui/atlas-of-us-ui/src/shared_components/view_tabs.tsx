import type { CSSProperties } from 'react';
import { brownRed, comic, gunmetal, ivory } from './palette';

interface ViewTabsProps<V extends string> {
  views: { id: V; label: string }[];
  current: V;
  onChoose: (view: V) => void;
  onReplay?: () => void; //plays the page's intro again, from a button at the far end of the row
}

//the row of a page's views under its title, the open one filled in
export function ViewTabs<V extends string>({ views, current, onChoose, onReplay }: ViewTabsProps<V>) {
  return (
    <div style={styles.views}>
      {onReplay && (
        <button className="comic-lift" style={{ ...styles.viewButton, ...styles.replay }} onClick={onReplay}>
          Replay the intro ▶
        </button>
      )}
      {views.map((v) => (
        <button
          key={v.id}
          className="comic-lift"
          style={{ ...styles.viewButton, ...(current === v.id ? styles.viewButtonActive : {}) }}
          aria-pressed={current === v.id}
          onClick={() => onChoose(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  views: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  //at the far end of the row of views
  replay: {
    order: 1,
    marginLeft: 'auto',
    fontSize: 20,
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

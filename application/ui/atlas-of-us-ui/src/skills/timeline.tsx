import { useState, type CSSProperties } from 'react';
import { LEVEL_NAMES, monthYear, type TimelineSkill } from './api';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the five levels as one hue, light to dark, from Novice to Expert
const LEVEL_FILLS = ['#dbe6f1', '#a9c0d6', '#6a8eae', '#4a6c8c', '#2e4862'];
//the levels dark enough to take light text
const DARK_FROM = 3;

//a date, YYYY-MM-DD, as a time
const time = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

const DAY = 24 * 60 * 60 * 1000;
//the axis covers at least a day, so a timeline that started today still has room
const MIN_SPAN = DAY;
//room before the first step, as a share of the span, so it doesn't sit on the edge
const LEAD_IN = 0.04;
//about how many marks the axis gets at most
const MARKS = 8;

//a mark on the time axis: where it falls and what it says
interface Tick {
  time: number;
  label: string;
}

//marks from `start` to `end` in years, months or days, whichever suits how long it is, at most about MARKS of them
function ticks(start: number, end: number): Tick[] {
  const span = end - start;
  const from = new Date(start);
  const marks: Tick[] = [];
  if (span > 3 * 365 * DAY) {
    const years = new Date(end).getFullYear() - from.getFullYear();
    const every = Math.ceil(years / MARKS);
    for (let year = from.getFullYear() + 1; year <= new Date(end).getFullYear(); year += every) {
      marks.push({ time: new Date(year, 0, 1).getTime(), label: String(year) });
    }
  } else if (span > 90 * DAY) {
    const every = Math.ceil(span / (30 * DAY) / MARKS);
    for (let month = new Date(from.getFullYear(), from.getMonth() + 1, 1); month.getTime() <= end; month.setMonth(month.getMonth() + every)) {
      const first = !marks.length || month.getMonth() < every;
      marks.push({ time: month.getTime(), label: month.toLocaleDateString(undefined, first ? { month: 'short', year: 'numeric' } : { month: 'short' }) });
    }
  } else {
    const every = Math.ceil(span / DAY / MARKS);
    for (let day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1); day.getTime() <= end; day.setDate(day.getDate() + every)) {
      marks.push({ time: day.getTime(), label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    }
  }
  return marks;
}

//the user's skills over time: a lane for each skill, split into the levels they've reached in it, each lasting until the
//next or until now, on one time axis from their first step to now
export default function Timeline({ skills }: { skills: TimelineSkill[] }) {
  const [hover, setHover] = useState<{ skill: string; step: number }>();
  const [now] = useState(() => Date.now()); //the right end of the axis, fixed when the timeline first shows
  const first = Math.min(...skills.flatMap(({ steps }) => steps.map(({ on }) => time(on))));
  const span = Math.max(now - first, MIN_SPAN);
  const start = now - span * (1 + LEAD_IN);
  const at = (t: number) => ((t - start) / (now - start)) * 100;
  const marks = ticks(start, now);

  return (
    <section style={styles.group} aria-label="Timeline">
      <h3 style={styles.heading}>Timeline</h3>
      <p style={styles.text}>When you reached each level of your skills.</p>
      <ul style={styles.legend} aria-label="Levels">
        {LEVEL_NAMES.map((name, i) => (
          <li key={name} style={styles.legendItem}>
            <span style={{ ...styles.swatch, background: LEVEL_FILLS[i] }} />
            {name}
          </li>
        ))}
      </ul>
      <div style={styles.chart}>
        <div style={styles.lane} aria-hidden="true">
          <span style={styles.label} />
          <div style={styles.axis}>
            {marks.map(({ time, label }) => (
              <span key={time} style={{ ...styles.tick, left: `${at(time)}%` }}>
                {label}
              </span>
            ))}
          </div>
        </div>
        {skills.map(({ skill, steps }) => (
          <div key={skill.id} style={styles.lane}>
            <button className="comic-lift" style={styles.label} onClick={() => navigate(`/skills/${encodeURIComponent(skill.id)}`)}>
              {skill.name}
            </button>
            <div style={styles.track}>
              {marks.map(({ time }) => (
                <span key={time} style={{ ...styles.grid, left: `${at(time)}%` }} />
              ))}
              {steps.map(({ rank, on }, i) => {
                const until = steps[i + 1]?.on;
                const left = at(time(on));
                const width = Math.max(at(until ? time(until) : now) - left, 0.8);
                const name = LEVEL_NAMES[rank - 1];
                const span = `${monthYear(on)} to ${until ? monthYear(until) : 'now'}`;
                const shown = hover?.skill === skill.id && hover.step === i;
                return (
                  <span
                    key={`${rank}-${on}`}
                    tabIndex={0}
                    role="img"
                    aria-label={`${skill.name}: ${name}, ${span}`}
                    style={{ ...styles.segment, left: `${left}%`, width: `${width}%`, background: LEVEL_FILLS[rank - 1], color: rank >= DARK_FROM ? ivory : gunmetal }}
                    onMouseEnter={() => setHover({ skill: skill.id, step: i })}
                    onMouseLeave={() => setHover(undefined)}
                    onFocus={() => setHover({ skill: skill.id, step: i })}
                    onBlur={() => setHover(undefined)}
                  >
                    <span style={styles.segmentName}>{name}</span>
                    {shown && (
                      <span style={{ ...styles.tip, ...(left > 60 ? { right: 0 } : { left: 0 }) }}>
                        <strong>{name}</strong>
                        <span>{span}</span>
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <details>
        <summary style={styles.summary}>As a list</summary>
        <ul style={styles.list}>
          {skills.map(({ skill, steps }) => (
            <li key={skill.id}>
              <strong>{skill.name}:</strong> {steps.map(({ rank, on }) => `${LEVEL_NAMES[rank - 1]} in ${monthYear(on)}`).join(', ')}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 17,
    lineHeight: 1.5,
  },
  legend: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 16px',
    fontSize: 14,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 14,
    height: 14,
    border: `2px solid ${gunmetal}`,
    borderRadius: 4,
  },
  chart: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px 16px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  lane: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 12px',
  },
  label: {
    flex: '0 0 170px',
    padding: 0,
    background: 'none',
    border: 'none',
    color: gunmetal,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'left',
    overflowWrap: 'anywhere',
    cursor: 'pointer',
  },
  axis: {
    position: 'relative',
    flex: '1 1 240px',
    height: 18,
    fontSize: 13,
    color: blue,
  },
  tick: {
    position: 'absolute',
    top: 0,
    transform: 'translateX(-50%)',
  },
  track: {
    position: 'relative',
    flex: '1 1 240px',
    height: 30,
  },
  grid: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    background: gunmetal,
    opacity: 0.12,
  },
  segment: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    boxSizing: 'border-box',
    padding: '0 6px',
    border: `2px solid ${gunmetal}`,
    borderRadius: 6,
    fontSize: 13,
    lineHeight: '20px',
    cursor: 'default',
    outlineOffset: 2,
  },
  segmentName: {
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  tip: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    padding: '6px 10px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    boxShadow: `2px 2px 0 ${gunmetal}`,
    fontSize: 14,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  summary: {
    cursor: 'pointer',
    fontSize: 15,
    color: blue,
  },
  list: {
    margin: '8px 0 0',
    paddingLeft: 20,
    fontSize: 15,
    lineHeight: 1.5,
  },
};

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { CATEGORIES, waitingToCompare, capitalized, comparedWith, conditionName, SEVERITIES, shownReading, type Ability, type AffectedBy, type Better, type Measurement } from './api';
import { hex, standingColor, type Body } from './body_parts';
import BodyStage from './body_stage';
import Results from './results';
import { AREA_CHAPTER } from './chapter_thumbs';
import { SummaryPanel } from './summary';
import { chapterSteps, CHAPTERS, type Known } from './tour';
import { navigate } from '../router';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

// Your results: everything the user has added to Abilities, seen as a whole. Atlas's summary of it on top, then
// the basics at a glance, every ability they have a place on laid out by area, the same drawn on their body with the
// list to open each one, their conditions and impairments, and what's still to find out.

interface YourResultsProps {
  known: Known;
  affectedBy: AffectedBy[];
  body: Body;
}

//the measurements shown at a glance: their size and their vitals
const GLANCE_GROUPS = ['Body', 'Vitals'];

//the chapter that finds out each area's abilities

export default function YourResults({ known, affectedBy, body }: YourResultsProps) {
  const [picked, setPicked] = useState<string>();
  return (
    <div style={styles.page}>
      <SummaryPanel />
      <Glance known={known} />
      <AbilityChart abilities={known.abilities} picked={picked} onPick={setPicked} />
      <BodyStage
        body={body}
        layers={['skeleton', 'muscles', 'nervous', 'organs']}
        panel={(onLight) => <Results abilities={known.abilities} measurements={known.measurements} body={body} onLight={onLight} picked={picked} onPick={setPicked} />}
      />
      <div style={styles.pair}>
        <LivingWith known={known} affectedBy={affectedBy} />
        <StillToFind known={known} />
      </div>
    </div>
  );
}

//where a reading sits, in a few words: how many it beats, or how far from typical when neither way is better
function brief(percentile: number, better: Better) {
  if (better !== 'neither') {
    const beats = Math.round(better === 'lower' ? 100 - percentile : percentile);
    return beats < 1 ? 'better than hardly any' : beats > 99 ? 'better than nearly all' : `better than ${beats} in 100`;
  }
  return `${percentile < 20 ? 'well below' : percentile < 40 ? 'below' : percentile <= 60 ? 'about' : percentile <= 80 ? 'above' : 'well above'} typical for`;
}

//the basics: what they've said about themselves, and the latest of their size and vitals, each against people like them
function Glance({ known }: { known: Known }) {
  const said = known.me.characteristics.filter((c) => c.value);
  const measured = known.measurements.measurements.filter((m) => GLANCE_GROUPS.includes(m.group) && m.readings.length);
  if (!said.length && !measured.length) return null;
  return (
    <section style={styles.section} aria-labelledby="glance">
      <h2 id="glance" style={styles.heading}>
        At a glance
      </h2>
      <ul style={styles.tiles}>
        {said.map((c) => (
          <li key={c.id} style={styles.tile}>
            <span style={styles.tileName}>{c.name}</span>
            <span style={styles.tileValue}>{c.value}</span>
          </li>
        ))}
        {measured.map((m) => (
          <ReadingTile key={m.id} measurement={m} />
        ))}
      </ul>
    </section>
  );
}

function ReadingTile({ measurement: m }: { measurement: Measurement }) {
  const latest = m.readings[0];
  return (
    <li style={styles.tile}>
      <span style={styles.tileName}>{m.name}</span>
      <span style={styles.tileValue}>{shownReading(latest.value, m)}</span>
      {latest.percentile !== null && latest.compared_with && (
        <span style={styles.tileNote}>
          {brief(latest.percentile, m.better)} {comparedWith(latest.compared_with)}
        </span>
      )}
    </li>
  );
}

//how big a dot is, in pixels
const DOT = 22;

//every ability they have a place on, as a dot along a line from 0 to 100, one row an area. One that's only an early
//read is faint. Dots that would overlap go in lanes above
//each other. Picking one opens it in the list beside the body
function AbilityChart({ abilities, picked, onPick }: { abilities: Ability[]; picked?: string; onPick: (id?: string) => void }) {
  //how far apart two dots in a lane have to be, as a share of the line, from how wide the line is
  const line = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const el = line.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const gap = ((DOT + 3) / Math.max(width, 1)) * 100;
  //the dot under the pointer or keyboard focus, named above it
  const [hovered, setHovered] = useState<string>();

  const rows = useMemo(
    () =>
      CATEGORIES.map((c) => {
        const all = abilities.filter((a) => a.category === c.id);
        const placed = all.filter((a) => a.value !== null).sort((a, b) => a.value! - b.value!);
        const lanes: number[] = []; //where each lane's last dot sits
        const dots = placed.map((a) => {
          const at = a.value! * 100;
          let lane = lanes.findIndex((last) => at - last >= gap);
          if (lane < 0) lane = lanes.length;
          lanes[lane] = at;
          return { ability: a, at, lane };
        });
        return { ...c, total: all.length, dots, lanes: Math.max(lanes.length, 1) };
      }),
    [abilities, gap],
  );
  if (!rows.some((r) => r.dots.length)) return null;

  return (
    <section style={styles.section} aria-labelledby="abilities">
      <h2 id="abilities" style={styles.heading}>
        Your abilities
      </h2>
      <p style={styles.text}>Each dot is an ability, from low on the left to high on the right, with typical in the middle. Pick one to open it.</p>
      <div style={styles.key} aria-hidden="true">
        <span style={styles.keyItem}>
          <span style={{ ...styles.dot, ...styles.keyDot, background: hex(standingColor(0.7)), opacity: 0.55 }} /> Early read
        </span>
      </div>
      {rows.map((row, i) => (
        <div key={row.id} style={styles.row}>
          <div style={styles.rowLabel}>
            <span style={styles.rowName}>{row.label}</span>
            <span style={styles.small}>
              {row.dots.length} of {row.total} with a score
            </span>
          </div>
          <div ref={i === 0 ? line : undefined} style={{ ...styles.track, height: row.lanes * (DOT + 4) + 10 }} role="group" aria-label={row.label}>
            <span style={styles.typical} />
            {row.dots.map(({ ability: a, at, lane }) => {
              const early = (a.confidence ?? 0) < 0.5;
              const value = Math.round(at);
              return (
                <button
                  key={a.id}
                  className="comic-lift"
                  onMouseEnter={() => setHovered(a.id)}
                  onMouseLeave={() => setHovered((h) => (h === a.id ? undefined : h))}
                  onFocus={() => setHovered(a.id)}
                  onBlur={() => setHovered((h) => (h === a.id ? undefined : h))}
                  aria-label={`${a.name}, ${value}${early ? ', an early read' : ''}`}
                  aria-pressed={picked === a.id}
                  onClick={() => onPick(picked === a.id ? undefined : a.id)}
                  style={{
                    ...styles.dot,
                    left: `calc(${at}% - ${DOT / 2}px)`,
                    bottom: 5 + lane * (DOT + 4),
                    background: hex(standingColor(a.value!)),
                    ...(early ? { opacity: 0.55 } : {}),
                    ...(picked === a.id ? styles.dotPicked : {}),
                  }}
                />
              );
            })}
            {row.dots
              .filter(({ ability }) => ability.id === hovered)
              .map(({ ability: a, at, lane }) => (
                <span
                  key={a.id}
                  aria-hidden="true"
                  style={{
                    ...styles.label,
                    left: `${at}%`,
                    bottom: 5 + lane * (DOT + 4) + DOT + 6,
                    //kept inside the line near its ends
                    transform: `translateX(${at < 15 ? -DOT / 2 + 'px' : at > 85 ? `calc(-100% + ${DOT / 2}px)` : '-50%'})`,
                  }}
                >
                  {a.name} <strong>{Math.round(at)}</strong>
                </span>
              ))}
            {!row.dots.length && <span style={styles.empty}>Nothing here yet</span>}
          </div>
        </div>
      ))}
      <div style={styles.scale} aria-hidden="true">
        <span style={styles.rowLabel} />
        <span style={styles.ends}>
          <span>Low</span>
          <span>Typical</span>
          <span>High</span>
        </span>
      </div>
    </section>
  );
}

//the conditions and impairments they've added, each with the abilities it can affect
function LivingWith({ known, affectedBy }: { known: Known; affectedBy: AffectedBy[] }) {
  const { conditions, impairments } = known;
  const byId = new Map(conditions.conditions.map((c) => [c.id, c]));
  //what an impairment is in is named beside the abilities it can affect
  const impairmentNames = new Map(affectedBy.flatMap((a) => a.impairments.map((i) => [i.id, i.name] as const)));
  const affects = (id: string) => affectedBy.filter((a) => a.conditions.some((c) => c.id === id) || a.impairments.some((i) => i.id === id)).map((a) => a.name);

  const items = [
    ...conditions.mine.flatMap((m) => {
      const c = byId.get(m.id);
      if (!c) return [];
      const notes = [SEVERITIES.find((s) => s.value === m.severity)?.label, m.diagnosed && 'diagnosed', m.managed && 'under control'].filter(Boolean).join(', ');
      return [{ id: c.id, name: conditionName(c), notes, pending: c.pending }];
    }),
    ...impairments.impairments.map((i) => {
      const name = impairmentNames.get(i.id) ?? impairments.functions.find((f) => f.id === i.id)?.name ?? 'Something you noted';
      return { id: i.id, name: capitalized(name), notes: `${capitalized(i.extent)} impairment`, pending: false };
    }),
  ].map((i) => ({ ...i, abilities: affects(i.id) }));

  return (
    <section style={styles.section} aria-labelledby="living">
      <h2 id="living" style={styles.heading}>
        Your conditions and impairments
      </h2>
      {!items.length ? (
        <p style={styles.text}>None added. If you have a condition or impairment, like needing glasses, a bad knee or asthma, add it so I can flag the skills it matters for.</p>
      ) : (
        <ul style={styles.lived}>
          {items.map((i) => (
            <li key={i.id} style={styles.livedItem}>
              <span style={styles.rowName}>{i.name}</span>
              {i.notes && <span style={styles.small}>{i.notes}</span>}
              <span style={styles.affects}>
                {i.abilities.length ? `Can affect ${i.abilities.join(', ')}.` : i.pending ? "I'm still working out what this can affect." : "It doesn't reach any of the abilities I track."}
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className="comic-lift" style={styles.link} onClick={() => navigate('/abilities?chapter=living-with')}>
        {items.length ? 'Change your conditions and impairments' : 'Add your conditions and impairments'}
      </button>
    </section>
  );
}

//each area's tests still to do, counted as its chapter counts them, with the chapter, and its abilities
//whose tests are done but are waiting on more people to compare with
function StillToFind({ known }: { known: Known }) {
  const { abilities, measurements } = known;
  const areas = CATEGORIES.map((c) => {
    const { tested } = chapterSteps(abilities, measurements, c.id);
    const toDo = tested.filter((m) => !m.readings.length).length;
    const waiting = abilities.filter((a) => a.category === c.id && waitingToCompare(a, measurements)).length;
    const chapter = CHAPTERS.find((ch) => ch.id === AREA_CHAPTER[c.id])!;
    return { ...c, toDo, waiting, chapter };
  }).filter((a) => a.toDo || a.waiting);

  return (
    <section style={styles.section} aria-labelledby="still">
      <h2 id="still" style={styles.heading}>
        Still to find out
      </h2>
      {!areas.length ? (
        <p style={styles.text}>You've done every test. Testing again later will show how you're changing.</p>
      ) : (
        <ul style={styles.lived}>
          {areas.map((a) => (
            <li key={a.id} style={styles.livedItem}>
              <span style={styles.rowName}>{a.label}</span>
              <span style={styles.small}>{a.toDo ? `${a.toDo} ${a.toDo === 1 ? 'test' : 'tests'} to do` : 'All done'}</span>
              {!!a.toDo && (
                <button className="comic-lift" style={styles.link} onClick={() => navigate(`/abilities?chapter=${a.chapter.id}`)}>
                  Go to {a.chapter.title}
                </button>
              )}
              {!!a.waiting && (
                <span style={styles.affects}>
                  {a.waiting} {a.waiting === 1 ? 'ability is' : 'abilities are'} waiting on more people to take the same tests, so I can compare you with them.
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1400,
    margin: '0 auto 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '20px 24px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `4px 5px 0 ${gunmetal}`,
    minWidth: 0,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 28,
    letterSpacing: 1,
  },
  text: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  small: {
    fontSize: 14,
    opacity: 0.8,
  },
  tiles: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 130px), 1fr))',
    gap: 10,
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 12px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
  },
  tileName: {
    fontSize: 14,
  },
  tileValue: {
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
  },
  tileNote: {
    fontSize: 13,
    lineHeight: 1.3,
    opacity: 0.85,
  },
  key: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 18px',
    fontSize: 14,
  },
  keyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  keyDot: {
    position: 'static',
    width: 16,
    height: 16,
    boxShadow: 'none',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 16px',
  },
  rowLabel: {
    flex: '0 0 200px',
    display: 'flex',
    flexDirection: 'column',
  },
  rowName: {
    fontSize: 17,
  },
  track: {
    flex: '1 1 320px',
    position: 'relative',
    minWidth: 0,
    margin: `0 ${DOT / 2}px`,
    borderBottom: `3px solid ${gunmetal}`,
  },
  typical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: -8,
    borderLeft: `2px dashed ${gunmetal}`,
    opacity: 0.6,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    padding: 0,
    border: `2px solid ${gunmetal}`,
    borderRadius: '50%',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  label: {
    position: 'absolute',
    zIndex: 2,
    padding: '2px 10px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    boxShadow: `2px 3px 0 ${gunmetal}`,
    fontSize: 14,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  dotPicked: {
    outline: `3px solid ${brownRed}`,
    outlineOffset: 2,
    zIndex: 1,
  },
  empty: {
    position: 'absolute',
    left: 0,
    bottom: 6,
    fontSize: 14,
    opacity: 0.6,
  },
  scale: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0 16px',
  },
  ends: {
    flex: '1 1 320px',
    display: 'flex',
    justifyContent: 'space-between',
    margin: `0 ${DOT / 2}px`,
    fontSize: 13,
  },
  pair: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
    alignItems: 'start',
    gap: 28,
  },
  lived: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  livedItem: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '2px 12px',
    paddingBottom: 8,
    borderBottom: `2px dashed rgba(57, 61, 63, 0.25)`,
  },
  affects: {
    flexBasis: '100%',
    fontSize: 14,
    lineHeight: 1.4,
  },
  link: {
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    padding: '2px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
};

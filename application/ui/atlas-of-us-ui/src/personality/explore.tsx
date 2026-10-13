import { useEffect, useState, type CSSProperties } from 'react';
import { getExplore, type Breakdown, type Explore as ExploreData, type ExploreTrait } from './api';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const paleRed = 'var(--pale-red)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

const anchor = (name: string) => `explore-${name.replace(/\W+/g, '-')}`;

//facet descriptions carry their domain as a prefix, e.g. "openness facet: ...", which the domain heading already says
const shortDescription = (description: string | null) => {
  const text = description?.replace(/^\w+ facet: /, '');
  return text && text[0].toUpperCase() + text.slice(1);
};

//the Explore view: what the Big Five is, then every domain and trait in depth, all read from the database
export default function Explore() {
  const [explore, setExplore] = useState<ExploreData>();
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<Set<string>>(new Set()); //names of the expanded traits

  useEffect(() => {
    getExplore().then(setExplore, (e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const toggle = (name: string) =>
    setOpen((was) => {
      const next = new Set(was);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  //opens another trait and scrolls to it, once it has rendered open
  const jump = (name: string) => {
    setOpen((was) => new Set(was).add(name));
    requestAnimationFrame(() => document.getElementById(anchor(name))?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (error) return <p style={styles.status}>Hmm, we couldn't load the guide. {error}</p>;
  if (!explore) return <p style={styles.status}>Dusting off the field guide...</p>;

  const { model, domains } = explore;
  const intro = [
    { title: 'What it is', body: model.overview },
    { title: 'Where it came from', body: model.history },
    { title: "What it can't tell you", body: model.limits },
    { title: 'How we use it', body: model.our_take },
  ].filter((part) => part.body);

  return (
    <>
      <section style={styles.intro} className="comic-panel comic-pop">
        {intro.map((part) => (
          <div key={part.title} style={styles.introPart}>
            <h2 style={styles.introHeading}>{part.title}</h2>
            <p style={styles.text}>{part.body}</p>
          </div>
        ))}
      </section>

      {domains.map((domain) => (
        <section key={domain.key} style={styles.domain}>
          <header style={styles.domainHead}>
            <h2 style={styles.domainTitle}>{domain.name}</h2>
            <span className="comic-chip" style={styles.domainCount}>
              {domain.traits.length} traits
            </span>
          </header>
          {domain.overview && <p style={{ ...styles.text, ...styles.domainOverview }}>{domain.overview}</p>}
          <BreakdownGrid breakdown={domain} />

          <ul style={styles.traitList}>
            {domain.traits.map((t) => (
              <TraitEntry key={t.id} trait={t} open={open.has(t.name)} onToggle={() => toggle(t.name)} onJump={jump} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

interface TraitEntryProps {
  trait: ExploreTrait;
  open: boolean;
  onToggle: () => void;
  onJump: (name: string) => void; //open and scroll to another trait
}

function TraitEntry({ trait, open, onToggle, onJump }: TraitEntryProps) {
  return (
    <li id={anchor(trait.name)} style={styles.traitItem}>
      <button style={styles.traitButton} aria-expanded={open} onClick={onToggle}>
        <span style={styles.traitLabel}>
          <span style={styles.traitName}>{trait.name}</span>
          {trait.description && <span style={styles.traitDescription}>{shortDescription(trait.description)}</span>}
        </span>
        <span style={styles.traitToggle}>{open ? 'Less ▲' : 'More ▼'}</span>
      </button>

      {open && (
        <div style={styles.traitBody}>
          {trait.overview && <p style={styles.text}>{trait.overview}</p>}
          <BreakdownGrid breakdown={trait} />
          {trait.interactions.length > 0 && (
            <div>
              <h3 style={styles.subheading}>How it plays with other traits</h3>
              <ul style={styles.interactions}>
                {trait.interactions.map((i) => (
                  <li key={i.name} style={styles.interaction}>
                    <button className="comic-chip comic-lift" style={styles.interactionChip} onClick={() => onJump(i.name)}>
                      {i.name} →
                    </button>
                    <span>{i.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

const SIDES = [
  { key: 'high_good', title: 'High: where it helps', fill: paleBlue, ink: blue },
  { key: 'high_watch', title: 'High: watch out for', fill: paleRed, ink: brownRed },
  { key: 'low_good', title: 'Low: where it helps', fill: paleBlue, ink: blue },
  { key: 'low_watch', title: 'Low: watch out for', fill: paleRed, ink: brownRed },
] as const;

//the four lists side by side, stacking on narrow screens. Missing lists are left out
function BreakdownGrid({ breakdown }: { breakdown: Breakdown }) {
  const sides = SIDES.filter((side) => breakdown[side.key]?.length);
  if (!sides.length) return null;
  return (
    <div style={styles.grid}>
      {sides.map((side) => (
        <div key={side.key} style={{ ...styles.side, background: side.fill }}>
          <h3 style={{ ...styles.subheading, color: side.ink }}>{side.title}</h3>
          <ul style={styles.bullets}>
            {breakdown[side.key]!.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  status: {
    maxWidth: 1100,
    margin: '0 auto',
    fontSize: 20,
  },
  text: {
    fontSize: 19,
    lineHeight: 1.35,
  },
  intro: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    padding: '26px 30px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '20px 40px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  introPart: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  introHeading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  domain: {
    maxWidth: 1100,
    margin: '0 auto 48px',
  },
  domainHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 16px',
    paddingBottom: 6,
    borderBottom: `4px solid ${gunmetal}`,
  },
  domainTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 38,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: brownRed,
  },
  domainCount: {
    marginLeft: 'auto',
  },
  domainOverview: {
    margin: '14px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: 14,
    margin: '14px 0',
  },
  side: {
    padding: '10px 14px',
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  subheading: {
    margin: '0 0 6px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  bullets: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 17,
    lineHeight: 1.25,
  },
  traitList: {
    margin: '8px 0 0',
    padding: 0,
    listStyle: 'none',
  },
  traitItem: {
    borderBottom: '2px dashed rgba(57, 61, 63, 0.35)',
    scrollMarginTop: 24,
  },
  //a button, reset so it looks like the rest of the row
  traitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    padding: '14px 0',
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  traitLabel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  traitName: {
    fontFamily: comic,
    fontSize: 23,
    letterSpacing: 0.5,
  },
  traitDescription: {
    fontSize: 17,
    lineHeight: 1.2,
    opacity: 0.8,
  },
  traitToggle: {
    fontSize: 15,
    whiteSpace: 'nowrap',
    color: cinnamon,
  },
  traitBody: {
    padding: '0 0 20px',
  },
  interactions: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  interaction: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 12px',
    fontSize: 17,
    lineHeight: 1.25,
  },
  interactionChip: {
    flex: 'none',
    color: gunmetal,
    fontFamily: 'inherit',
    fontSize: 16,
  },
};

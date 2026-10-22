import { useEffect, useState, type CSSProperties } from 'react';
import { getModel, type Breakdown, type Domain, type DomainTrait, type PersonalityModel } from './api';
import { DOMAIN_LOOK, polesOf, type Poles } from './poles';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const paleCinnamon = 'var(--pale-cinnamon)';
const paleRed = 'var(--pale-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

const anchor = (name: string) => `explore-${name.replace(/\W+/g, '-')}`;

//facet descriptions carry their domain as a prefix, e.g. "openness facet: ...", which the domain heading already says
const shortDescription = (description: string | null) => {
  const text = description?.replace(/^\w+ facet: /, '');
  return text && text[0].toUpperCase() + text.slice(1);
};

//the opening sentences of a paragraph, and whatever follows them
const splitSentences = (text: string, count: number) => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return [sentences.slice(0, count).join(' '), sentences.slice(count).join(' ')];
};

//how the model came about, in four steps, drawn above the history paragraph
const TIMELINE = [
  { when: '1930s', what: 'Collect every word we have for describing people' },
  { when: 'Next', what: 'Cluster them. Five groups keep turning up' },
  { when: '1980s', what: 'Costa and McCrae build the NEO questionnaire' },
  { when: 'Today', what: 'The free IPIP-NEO, which our scenes are written to' },
];

//the Explore view: what the Big Five is, then every domain and trait in depth, all read from the database. Only the
//gist shows at first; the longer reading opens on request
export default function Explore() {
  const [model, setModel] = useState<PersonalityModel>();
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<Set<string>>(new Set()); //names of the expanded traits and domains

  useEffect(() => {
    getModel().then(setModel, (e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const toggle = (name: string) =>
    setOpen((was) => {
      const next = new Set(was);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  //opens a trait or domain and scrolls to it, once it has rendered open
  const jump = (name: string) => {
    setOpen((was) => new Set(was).add(name));
    requestAnimationFrame(() => document.getElementById(anchor(name))?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (error) return <AtlasError message={`I couldn't load the guide. ${error}`} style={styles.status} />;
  if (!model) return <p style={styles.status}>Dusting off the field guide...</p>;

  const { domains } = model;
  const [overview, overviewRest] = splitSentences(model.overview ?? '', 2);
  const background = [
    { title: 'Where it came from', body: model.history, timeline: true },
    { title: "What it can't tell you", body: model.limits },
    { title: 'How we use it', body: model.our_take },
  ].filter((part) => part.body);

  return (
    <>
      <section style={styles.intro} className="comic-panel comic-pop">
        <h2 style={styles.introHeading}>The Big Five at a glance</h2>
        {overview && (
          <p style={styles.text}>
            {overview}{' '}
            {overviewRest && (
              <Disclosure label="More">
                <span>{overviewRest}</span>
              </Disclosure>
            )}
          </p>
        )}

        {/* one tile per domain, each a jump to its section below */}
        <ul style={styles.tiles}>
          {domains.map((domain) => {
            const look = DOMAIN_LOOK[domain.key];
            return (
              <li key={domain.key} style={styles.tileSlot}>
                <button className="comic-chip comic-lift" style={styles.tile} onClick={() => jump(domain.name)}>
                  {look && (
                    <span style={styles.tileLetter} aria-hidden>
                      {look.letter}
                    </span>
                  )}
                  <span style={styles.tileName}>{domain.name}</span>
                  {look && <Spectrum poles={look} small />}
                </button>
              </li>
            );
          })}
        </ul>

        <div style={styles.background}>
          {background.map((part) => (
            <div key={part.title} style={styles.backgroundPart}>
              <Disclosure label={part.title} style={styles.backgroundToggle}>
                {part.timeline && <Timeline />}
                <p style={styles.text}>{part.body}</p>
              </Disclosure>
            </div>
          ))}
        </div>
      </section>

      {domains.map((domain) => (
        <DomainSection key={domain.key} domain={domain} open={open} onToggle={toggle} onJump={jump} />
      ))}
    </>
  );
}

function Timeline() {
  return (
    <ol style={styles.timeline}>
      {TIMELINE.map((step) => (
        <li key={step.when} style={styles.timelineStep}>
          <span style={styles.timelineWhen}>{step.when}</span>
          <span style={styles.timelineWhat}>{step.what}</span>
        </li>
      ))}
    </ol>
  );
}

interface DomainSectionProps {
  domain: Domain;
  open: Set<string>;
  onToggle: (name: string) => void;
  onJump: (name: string) => void;
}

function DomainSection({ domain, open, onToggle, onJump }: DomainSectionProps) {
  const look = DOMAIN_LOOK[domain.key];
  const expanded = open.has(domain.name);
  return (
    <section id={anchor(domain.name)} style={styles.domain}>
      <header style={styles.domainHead}>
        <h2 style={styles.domainTitle}>
          {domain.name}
        </h2>
        <span className="comic-chip" style={styles.domainCount}>
          {domain.traits.length} traits
        </span>
      </header>
      {look && (
        <div style={styles.domainSpectrum}>
          <Spectrum poles={look} />
        </div>
      )}
      <button style={styles.reveal} aria-expanded={expanded} onClick={() => onToggle(domain.name)}>
        {expanded ? 'Hide ▲' : "What it's like at each end ▼"}
      </button>
      {expanded && (
        <>
          {domain.overview && <p style={{ ...styles.text, ...styles.domainOverview }}>{domain.overview}</p>}
          <BreakdownGrid breakdown={domain} poles={look} />
        </>
      )}

      <ul style={styles.traitList}>
        {domain.traits.map((t) => (
          <TraitEntry key={t.id} trait={t} open={open.has(t.name)} onToggle={() => onToggle(t.name)} onJump={onJump} />
        ))}
      </ul>
    </section>
  );
}

interface TraitEntryProps {
  trait: DomainTrait;
  open: boolean;
  onToggle: () => void;
  onJump: (name: string) => void; //open and scroll to another trait
}

function TraitEntry({ trait, open, onToggle, onJump }: TraitEntryProps) {
  const poles = polesOf(trait.name);
  const [picked, setPicked] = useState<string>(); //the interaction whose explanation is showing
  const interaction = trait.interactions.find((i) => i.name === picked);
  return (
    <li id={anchor(trait.name)} style={styles.traitItem}>
      <button style={styles.traitButton} aria-expanded={open} onClick={onToggle}>
        <span style={styles.traitName}>{trait.name}</span>
        {poles ? (
          <span style={styles.traitSpectrum}>
            <Spectrum poles={poles} small />
          </span>
        ) : (
          trait.description && <span style={styles.traitDescription}>{shortDescription(trait.description)}</span>
        )}
        <span style={styles.traitToggle}>{open ? 'Less ▲' : 'More ▼'}</span>
      </button>

      {open && (
        <div style={styles.traitBody}>
          {poles && trait.description && <p style={styles.traitSummary}>{shortDescription(trait.description)}</p>}
          {trait.overview && <p style={styles.text}>{trait.overview}</p>}
          <BreakdownGrid breakdown={trait} poles={poles} />
          {trait.interactions.length > 0 && (
            <div>
              <h3 style={styles.subheading}>How it plays with other traits</h3>
              <div style={styles.interactions}>
                {trait.interactions.map((i) => (
                  <button
                    key={i.name}
                    className="comic-chip comic-lift"
                    style={{ ...styles.interactionChip, ...(picked === i.name ? styles.interactionPicked : {}) }}
                    aria-pressed={picked === i.name}
                    onClick={() => setPicked(picked === i.name ? undefined : i.name)}
                  >
                    + {i.name}
                  </button>
                ))}
              </div>
              {interaction && (
                <p style={styles.interaction}>
                  {interaction.description}{' '}
                  <button style={styles.reveal} onClick={() => onJump(interaction.name)}>
                    Go to {interaction.name} →
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

//a scale drawn like the bars on My Personality, striped end to end with the word for each end underneath
function Spectrum({ poles, small }: { poles: Poles; small?: boolean }) {
  return (
    <span style={styles.spectrum}>
      <span style={{ ...styles.spectrumTrack, ...(small ? styles.spectrumTrackSmall : {}) }} aria-hidden>
        <span style={styles.spectrumFill} />
      </span>
      <span style={{ ...styles.spectrumEnds, ...(small ? styles.spectrumEndsSmall : {}) }}>
        <span>{poles.low}</span>
        <span>{poles.high}</span>
      </span>
    </span>
  );
}

const SIDES = [
  { end: 'low', good: 'low_good', watch: 'low_watch', fill: paleCinnamon },
  { end: 'high', good: 'high_good', watch: 'high_watch', fill: paleBlue },
] as const;

//the low end beside the high end, each with where it helps and what to watch for
function BreakdownGrid({ breakdown, poles }: { breakdown: Breakdown; poles?: Poles }) {
  return (
    <div style={styles.grid}>
      {SIDES.map((side) => (
        <div key={side.end} style={{ ...styles.side, background: side.fill }}>
          <h3 style={styles.sideTitle}>
            {side.end === 'low' ? 'Low' : 'High'}
            {poles && <span style={styles.sidePole}> · {poles[side.end]}</span>}
          </h3>
          <ul style={styles.bullets}>
            {breakdown[side.good].map((point) => (
              <li key={point} style={styles.bullet}>
                <span style={{ ...styles.bulletMark, color: blue }} aria-label="Helps">
                  +
                </span>
                {point}
              </li>
            ))}
            {breakdown[side.watch].map((point) => (
              <li key={point} style={styles.bullet}>
                <span style={{ ...styles.bulletMark, color: brownRed }} aria-label="Watch out">
                  !
                </span>
                {point}
              </li>
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
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  introHeading: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  tiles: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
    gap: 14,
  },
  tileSlot: {
    display: 'flex',
  },
  tile: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 12px 10px',
    background: ivory,
    color: gunmetal,
    fontFamily: 'inherit',
    borderRadius: corners,
  },
  tileLetter: {
    display: 'grid',
    placeItems: 'center',
    width: 40,
    height: 40,
    background: blue,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    fontFamily: comic,
    fontSize: 24,
  },
  tileName: {
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
  },
  background: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: 12,
    paddingTop: 12,
    borderTop: `3px dashed ${gunmetal}`,
  },
  backgroundPart: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  backgroundToggle: {
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    color: brownRed,
  },
  timeline: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderLeft: `3px solid ${gunmetal}`,
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 14,
    fontSize: 16,
    lineHeight: 1.2,
  },
  timelineWhen: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: blue,
  },
  timelineWhat: {},
  domain: {
    maxWidth: 1100,
    margin: '0 auto 48px',
    scrollMarginTop: 24,
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
  domainSpectrum: {
    maxWidth: 520,
    margin: '14px 0 6px',
  },
  domainOverview: {
    margin: '10px 0',
  },
  //a reset button that reads as a small link
  reveal: {
    padding: 0,
    background: 'none',
    border: 'none',
    color: cinnamon,
    font: 'inherit',
    fontSize: 17,
    textAlign: 'left',
    cursor: 'pointer',
  },
  spectrum: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  //the same track as My Personality's bars
  spectrumTrack: {
    display: 'flex',
    height: 22,
    boxSizing: 'border-box',
    padding: 3,
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
  },
  spectrumTrackSmall: {
    height: 18,
    padding: 2,
  },
  spectrumFill: {
    flex: 1,
    //My Personality's stripes, lightened every other band, over a fade from the low end's red to the high end's blue
    background: `repeating-linear-gradient(-45deg, transparent 0 10px, rgba(255, 255, 255, 0.22) 10px 20px), linear-gradient(90deg, ${brownRed}, ${blue})`,
    borderRadius: 6,
  },
  spectrumEnds: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '0 8px',
    margin: '2px 4px 0',
    fontSize: 16,
    opacity: 0.75,
  },
  spectrumEndsSmall: {
    fontSize: 15,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: 14,
    margin: '14px 0 8px',
  },
  side: {
    padding: '10px 14px',
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  sideTitle: {
    margin: '0 0 6px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  sidePole: {
    color: cinnamon,
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
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 17,
    lineHeight: 1.25,
  },
  bullet: {
    display: 'flex',
    gap: 8,
  },
  bulletMark: {
    flex: 'none',
    width: 12,
    fontWeight: 700,
    fontSize: 20,
    lineHeight: 1,
    textAlign: 'center',
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
  //a button, reset so it looks like the rest of the row. Name, scale and toggle wrap onto two lines on narrow screens
  traitButton: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 16px',
    width: '100%',
    padding: '14px 0',
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  traitName: {
    flex: '0 0 220px',
    fontFamily: comic,
    fontSize: 23,
    letterSpacing: 0.5,
  },
  traitSpectrum: {
    flex: '1 1 260px',
    display: 'flex',
    maxWidth: 440,
  },
  traitDescription: {
    flex: '1 1 260px',
    fontSize: 17,
    lineHeight: 1.2,
    opacity: 0.8,
  },
  traitToggle: {
    marginLeft: 'auto',
    fontSize: 15,
    whiteSpace: 'nowrap',
    color: cinnamon,
  },
  traitBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '0 0 20px',
  },
  traitSummary: {
    fontSize: 19,
    fontStyle: 'italic',
    color: blue,
  },
  interactions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  interactionChip: {
    color: gunmetal,
    fontFamily: 'inherit',
    fontSize: 16,
  },
  interactionPicked: {
    background: paleRed,
  },
  interaction: {
    marginTop: 10,
    padding: '8px 12px',
    background: ivory,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    fontSize: 17,
    lineHeight: 1.25,
  },
};

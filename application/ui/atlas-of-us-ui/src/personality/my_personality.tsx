import { useState, type CSSProperties } from 'react';
import { DOMAINS, type Contribution, type Trait } from './api';
import { ProgressMeter } from '../shared_components/progress-meter';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const comic = 'var(--font-comic)';

//the "My Personality" view: where the user sits on every trait, grouped by domain
export default function MyPersonality({ traits }: { traits: Trait[] }) {
  const [compare, setCompare] = useState(false); //overlay everyone's average on each bar
  const measured = traits.filter((t) => t.value !== undefined).length;
  const domains = DOMAINS.map((d) => ({ ...d, traits: traits.filter((t) => t.domain === d.key) })).filter((d) => d.traits.length);

  return (
    <>
      <div style={styles.meter}>
        <ProgressMeter done={measured} total={traits.length} label="measured" />
      </div>
      <p style={styles.traitsIntro}>
        Each bar shows where you sit between low and high on a trait. Low isn't bad and high isn't good, they're just
        different. The bars fill in as you play scenarios and we read your answers.
      </p>
      <div style={styles.compare}>
        <button className="comic-chip comic-lift" style={styles.compareButton} aria-pressed={compare} onClick={() => setCompare((c) => !c)}>
          {compare ? '✓ ' : ''}Compare with everyone
        </button>
        {compare && (
          <span style={styles.compareKey}>
            <span style={styles.compareSwatch} /> the average across everyone we've measured
          </span>
        )}
      </div>
      {domains.map((domain) => (
        <section key={domain.key} style={styles.domain}>
          <header style={styles.domainHead}>
            <h2 style={styles.domainTitle}>{domain.title}</h2>
            <span style={styles.domainBlurb}>{domain.blurb}</span>
            <span className="comic-chip" style={styles.domainCount}>
              {domain.traits.filter((t) => t.value !== undefined).length} / {domain.traits.length} measured
            </span>
          </header>
          <ul style={styles.traitList}>
            {domain.traits.map((t) => (
              <TraitRow key={t.id} trait={t} compare={compare} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

const toPercent = (value?: number) => (value === undefined ? undefined : Math.round(Math.min(Math.max(value, 0), 1) * 100));

function TraitRow({ trait, compare }: { trait: Trait; compare: boolean }) {
  const [open, setOpen] = useState(false);
  const percent = toPercent(trait.value);
  const average = compare ? toPercent(trait.average) : undefined;
  const explained = trait.contributions.length > 0;

  return (
    <li style={styles.traitItem}>
      {/* name and description on the left, the scale on the right. They stack on narrow screens.
          Clicking it opens the answers behind the score */}
      <button
        style={{ ...styles.trait, ...(explained ? styles.traitButton : {}) }}
        disabled={!explained}
        aria-expanded={explained ? open : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <div style={styles.traitLabel}>
          <div style={styles.traitHead}>
            <span style={styles.traitName}>{trait.name}</span>
            {percent !== undefined && (
              <span style={styles.traitScore}>
                {average !== undefined && <span style={styles.traitAverage}>global average {average}</span>}
                <span style={styles.traitValue}>{percent}</span>
              </span>
            )}
            {percent !== undefined && (trait.confidence ?? 0) < 0.5 && (
              <span className="comic-chip" title="Based on only a little of what you've told us so far">
                Early read
              </span>
            )}
          </div>
          {trait.description && <p style={styles.traitDescription}>{trait.description}</p>}
        </div>
        {percent === undefined ? (
          <div style={{ ...styles.traitScale, ...styles.gathering }}>Still gathering information on this one...</div>
        ) : (
          //read only: looks like a slider, but there's nothing to drag
          <div style={styles.traitScale} role="meter" aria-label={trait.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div style={styles.bar}>
              <div style={styles.barTrack}>
                <div className="comic-meter-fill" style={{ ...styles.barFill, width: `${percent}%` }} />
              </div>
              {average !== undefined && <span style={{ ...styles.averageMark, left: `${average}%` }} title={`Global average: ${average}`} />}
              <span className="comic-pop" style={{ ...styles.barThumb, left: `${percent}%` }} />
            </div>
            <div style={styles.barEnds} aria-hidden>
              <span>Low</span>
              {explained && <span>{open ? 'Hide why ▲' : 'Why? ▼'}</span>}
              <span>High</span>
            </div>
          </div>
        )}
      </button>
      {open && (
        <ol style={styles.contributions}>
          {trait.contributions.map((c, i) => (
            <ContributionCard key={i} contribution={c} />
          ))}
        </ol>
      )}
    </li>
  );
}

//how strongly an answer showed it, in words
const strength = (weight: number) => (weight >= 0.6 ? 'strongly' : weight >= 0.3 ? '' : 'slightly');

function ContributionCard({ contribution: c }: { contribution: Contribution }) {
  const up = c.level >= 0;
  return (
    <li style={styles.contribution}>
      <div style={styles.contributionHead}>
        <span className="comic-chip">{c.scenario}</span>
        <span style={{ ...styles.push, color: up ? blue : brownRed }}>
          {up ? '▲' : '▼'} {strength(c.weight)} {up ? 'raised' : 'lowered'}
        </span>
      </div>
      <p style={styles.contributionQuestion}>{c.question}</p>
      <p style={styles.contributionAnswer}>
        <strong>You said:</strong> {c.answer}
      </p>
      {c.reasoning && (
        <p style={styles.contributionAnswer}>
          <strong>Because:</strong> {c.reasoning}
        </p>
      )}
      <p style={styles.contributionWhy}>{c.evidence}</p>
    </li>
  );
}


const styles: Record<string, CSSProperties> = {
  meter: {
    maxWidth: 1100,
    margin: '0 auto 32px',
  },
  traitsIntro: {
    maxWidth: 1100,
    margin: '-12px auto 16px',
    fontSize: 19,
    lineHeight: 1.3,
  },
  compare: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 16px',
  },
  compareButton: {
    color: gunmetal,
    fontFamily: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  compareKey: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  compareSwatch: {
    width: 5,
    height: 22,
    background: gunmetal,
    borderRadius: 2,
  },
  domain: {
    maxWidth: 1100,
    margin: '0 auto 40px',
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
  domainBlurb: {
    fontSize: 19,
    fontStyle: 'italic',
    color: cinnamon,
  },
  domainCount: {
    marginLeft: 'auto',
  },
  traitList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  traitItem: {
    borderBottom: `2px dashed rgba(57, 61, 63, 0.35)`,
  },
  //a button, reset so it looks like the rest of the row
  trait: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px 32px',
    width: '100%',
    padding: '14px 0',
    background: 'none',
    border: 'none',
    color: 'inherit',
    font: 'inherit',
    textAlign: 'left',
  },
  traitButton: {
    cursor: 'pointer',
  },
  contributions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
    margin: '0 0 18px',
    padding: 0,
    listStyle: 'none',
  },
  contribution: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 14px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  contributionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  push: {
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  contributionQuestion: {
    fontSize: 16,
    fontStyle: 'italic',
    opacity: 0.75,
  },
  contributionAnswer: {
    fontSize: 16,
    lineHeight: 1.25,
  },
  contributionWhy: {
    padding: '6px 10px',
    background: paleBlue,
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 1.25,
  },
  traitLabel: {
    flex: '1 1 280px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  traitScale: {
    flex: '2 1 360px',
  },
  traitHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  traitName: {
    fontFamily: comic,
    fontSize: 23,
    letterSpacing: 0.5,
  },
  //the user's value, with the global average to its left when comparing
  traitScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
  },
  traitAverage: {
    fontSize: 14,
    whiteSpace: 'nowrap',
    opacity: 0.7,
  },
  traitValue: {
    fontFamily: comic,
    fontSize: 23,
    color: blue,
  },
  traitDescription: {
    fontSize: 17,
    lineHeight: 1.2,
    opacity: 0.8,
  },
  //margins leave room for the thumb's overhang at 0 and 100
  bar: {
    position: 'relative',
    margin: '6px 13px 0',
  },
  barTrack: {
    height: 22,
    padding: 3,
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    overflow: 'hidden',
  },
  barFill: {
    background: `repeating-linear-gradient(-45deg, ${blue} 0 10px, #7d9dba 10px 20px)`,
    borderRadius: 6,
  },
  //a tick through the bar at everyone's average, under the user's thumb
  averageMark: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    width: 5,
    marginLeft: -2.5,
    background: gunmetal,
    borderRadius: 2,
  },
  //centred with margins, since comic-pop animates the transform
  barThumb: {
    position: 'absolute',
    top: '50%',
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    background: brownRed,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    boxShadow: `2px 2px 0 ${gunmetal}`,
    boxSizing: 'border-box',
    animationDelay: '600ms',
  },
  barEnds: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '2px 4px 0',
    fontSize: 14,
    opacity: 0.6,
  },
  gathering: {
    marginTop: 4,
    padding: '6px 12px',
    border: `3px dashed ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    background: 'repeating-linear-gradient(-45deg, transparent 0 8px, rgba(57, 61, 63, 0.07) 8px 16px)',
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.75,
  },
};

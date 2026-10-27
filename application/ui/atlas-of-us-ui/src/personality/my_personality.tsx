import { useState, type CSSProperties, type ReactNode } from 'react';
import { contestEvidence, DOMAINS, MAX_ANSWER_LENGTH, MAX_CONTESTS_PER_EVIDENCE, type Contest, type Contribution, type Report, type Shift, type Trait } from './api';
import { PersonalityReport } from './report';
import { polesOf } from './poles';
import { AtlasError } from '../shared_components/atlas-error';
import { ProgressMeter } from '../shared_components/progress-meter';
import { Dots } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const comic = 'var(--font-comic)';

//the "My Personality" view: their report once they've finished every scenario, then where they sit on every trait,
//grouped by domain. onContested is called when the user contests a piece of evidence, so the traits can be fetched again
export default function MyPersonality({ traits, report, onContested }: { traits: Trait[]; report: Report | null; onContested: () => void }) {
  const [compare, setCompare] = useState(false); //overlay everyone's average on each bar
  const measured = traits.filter((t) => t.value !== undefined).length;
  const domains = DOMAINS.map((d) => ({ ...d, traits: traits.filter((t) => t.domain === d.key) })).filter((d) => d.traits.length);

  return (
    <>
      <div style={styles.meter}>
        <ProgressMeter done={measured} total={traits.length} label="measured" />
      </div>
      {report ? (
        <section style={styles.report} className="comic-panel">
          <PersonalityReport report={report} />
        </section>
      ) : (
        <p style={styles.traitsIntro}>Finish every scenario and I'll write up your full report.</p>
      )}
      <p style={styles.traitsIntro}>Neither end of a bar is the good one. They're just different.</p>
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
              <TraitRow key={t.id} trait={t} compare={compare} onContested={onContested} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

const toPercent = (value?: number) => (value === undefined ? undefined : Math.round(Math.min(Math.max(value, 0), 1) * 100));

function TraitRow({ trait, compare, onContested }: { trait: Trait; compare: boolean; onContested: () => void }) {
  const [open, setOpen] = useState(false);
  const percent = toPercent(trait.value);
  const average = compare ? toPercent(trait.average) : undefined;
  const explained = trait.contributions.length > 0;
  const early = percent !== undefined && trait.contributions.filter((c) => c.weight > 0).length < 3; //based on fewer than 3 answers, so shown faded
  const poles = polesOf(trait.name);

  return (
    <li style={styles.traitItem}>
      {/* name on the left, the scale on the right with a word for each end. They stack on narrow screens. The
          description is on hover and with the answers behind the score, which clicking it opens */}
      <button
        title={trait.description}
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
            {early && (
              <span className="comic-chip" title="I've only got a little to go on here, so take it with a grain of salt">
                Early read
              </span>
            )}
          </div>
        </div>
        {percent === undefined ? (
          <div style={{ ...styles.traitScale, ...styles.gathering }}>
            {poles ? `${poles.low} or ${poles.high}? ` : ''}Still sizing you up...
          </div>
        ) : (
          //read only: looks like a slider, but there's nothing to drag
          <div style={{ ...styles.traitScale, ...(early ? styles.tentative : {}) }} role="meter" aria-label={trait.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div style={styles.bar}>
              <div style={styles.barTrack}>
                <div className="comic-meter-fill" style={{ ...styles.barFill, width: `${percent}%` }} />
              </div>
              {average !== undefined && <span style={{ ...styles.averageMark, left: `${average}%` }} title={`Global average: ${average}`} />}
              <span className="comic-pop" style={{ ...styles.barThumb, left: `${percent}%` }} />
            </div>
            <div style={styles.barEnds} aria-hidden>
              <span>{poles?.low ?? 'Low'}</span>
              {explained && <span>{open ? 'Hide why ▲' : 'Why? ▼'}</span>}
              <span>{poles?.high ?? 'High'}</span>
            </div>
          </div>
        )}
      </button>
      {open && trait.description && <p style={styles.traitDescription}>{trait.description}</p>}
      {open && (
        <ol style={styles.contributions}>
          {trait.contributions.map((c) => (
            <ContributionCard key={`${c.answer_id} ${c.trait}`} contribution={c} onContested={onContested} />
          ))}
        </ol>
      )}
    </li>
  );
}

//how an answer moved the trait, in words. A level of exactly 0.5 leans neither way, as the scorer counts it
const push = ({ level, weight }: Shift) =>
  weight === 0
    ? 'no longer counts'
    : level === 0.5
      ? 'neither raised nor lowered'
      : `${weight >= 0.6 ? 'strongly ' : weight >= 0.3 ? '' : 'slightly '}${level > 0.5 ? 'raised' : 'lowered'}`;

//how a contest changed the evidence. A change too small to alter the words says which way it went
const pull = ({ level, weight }: Shift) => Math.abs(level - 0.5) * weight;
const change = (before: Shift, after: Shift) =>
  push(before) !== push(after)
    ? `${push(before)} → ${push(after)}`
    : pull(after) === pull(before)
      ? `still ${push(after)}, reworded`
      : `still ${push(after)}, but ${pull(after) < pull(before) ? 'less' : 'more'} than before`;

function ContributionCard({ contribution: c, onContested }: { contribution: Contribution; onContested: () => void }) {
  const [contesting, setContesting] = useState(false);
  const up = c.level > 0.5;
  const removed = c.weight === 0;
  const neither = c.level === 0.5;
  const pending = c.contests.some((contest) => contest.status === 'pending');
  const contestable = !pending && !c.dropped && c.contests.length < MAX_CONTESTS_PER_EVIDENCE;
  return (
    <li style={styles.contribution}>
      <div style={styles.contributionHead}>
        <span className="comic-chip">{c.scenario}</span>
        <span style={{ ...styles.push, color: removed || neither ? gunmetal : up ? blue : brownRed }}>
          {removed ? '✕' : neither ? '–' : up ? '▲' : '▼'} {push(c)}
        </span>
        {contestable && !contesting && (
          <button className="comic-lift" style={styles.contestButton} title="Contest this" aria-label="Contest this" onClick={() => setContesting(true)}>
            ⚑
          </button>
        )}
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
      <p style={{ ...styles.contributionWhy, ...(removed && !c.dropped ? styles.removed : {}) }}>{c.evidence}</p>
      {c.contests.length > 0 && (
        <ol style={styles.contests}>
          {c.contests.map((contest, i) => (
            <ContestEntry key={i} contest={contest} />
          ))}
        </ol>
      )}
      {contesting && (
        <ContestForm
          contribution={c}
          onCancel={() => setContesting(false)}
          onSent={() => {
            setContesting(false);
            onContested();
          }}
        />
      )}
    </li>
  );
}

const OUTCOMES: Record<Contest['status'], ReactNode> = { pending: <>Thinking it over<Dots /></>, accepted: 'You got me', rejected: 'Not budging' };

//one thing the person said about the evidence, and what came of it
function ContestEntry({ contest: c }: { contest: Contest }) {
  return (
    <li style={styles.contest}>
      <p>
        <strong>{c.kind === 'explain' ? 'You explained:' : 'You said I got it wrong:'}</strong> {c.message}
      </p>
      <span className="comic-chip" style={styles.outcome}>
        {OUTCOMES[c.status]}
      </span>
      {c.reply && <p style={styles.reply}>{c.reply}</p>}
      {c.before && c.after && (
        <p style={styles.change}>
          {change(c.before, c.after)}
        </p>
      )}
    </li>
  );
}

const KINDS: { kind: Contest['kind']; label: string; placeholder: string }[] = [
  { kind: 'explain', label: 'Let me explain', placeholder: "Why did you answer the way you did? I'm listening." },
  { kind: 'wrong', label: 'This is wrong', placeholder: 'What did I get wrong? Go on, I can take it.' },
];

//explaining an answer, or saying the evidence got it wrong. Sent for review, which changes this evidence or explains why not
function ContestForm({ contribution: c, onCancel, onSent }: { contribution: Contribution; onCancel: () => void; onSent: () => void }) {
  const [kind, setKind] = useState<Contest['kind']>('explain');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const send = () => {
    setSending(true);
    setError(undefined);
    contestEvidence(c.answer_id, c.trait, kind, message).then(onSent, (e) => {
      setError(e instanceof Error ? e.message : String(e));
      setSending(false);
    });
  };
  return (
    <div style={styles.contestForm}>
      <div style={styles.contestKinds}>
        {KINDS.map((k) => (
          <button
            key={k.kind}
            className="comic-chip comic-lift"
            style={{ ...styles.contestKind, ...(kind === k.kind ? styles.contestKindOn : {}) }}
            aria-pressed={kind === k.kind}
            onClick={() => setKind(k.kind)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <textarea
        style={styles.contestText}
        rows={3}
        maxLength={MAX_ANSWER_LENGTH}
        value={message}
        placeholder={KINDS.find((k) => k.kind === kind)?.placeholder}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && <AtlasError message={error} />}
      <div style={styles.contestKinds}>
        <button className="comic-chip comic-lift" style={styles.contestKind} onClick={onCancel}>
          Cancel
        </button>
        <button className="comic-chip comic-lift" style={styles.contestKind} disabled={sending || !message.trim()} onClick={send}>
          {sending ? <>Sending<Dots /></> : 'Send'}
        </button>
      </div>
    </div>
  );
}


const styles: Record<string, CSSProperties> = {
  meter: {
    maxWidth: 1100,
    margin: '0 auto 32px',
  },
  report: {
    maxWidth: 1100,
    margin: '0 auto 32px',
    padding: '22px 28px 8px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
  } as CSSProperties,
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
  //evidence a contest found the answer doesn't show
  removed: {
    opacity: 0.5,
    textDecoration: 'line-through',
  },
  //a flag in the card's corner
  contestButton: {
    marginLeft: 'auto',
    padding: '0 6px',
    background: 'none',
    border: 'none',
    color: gunmetal,
    font: 'inherit',
    fontSize: 18,
    cursor: 'pointer',
  },
  contests: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: 0,
    padding: '8px 0 0',
    borderTop: `2px dashed rgba(57, 61, 63, 0.35)`,
    listStyle: 'none',
  },
  contest: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    fontSize: 15,
    lineHeight: 1.25,
  },
  outcome: {
    fontSize: 13,
  },
  reply: {
    fontStyle: 'italic',
  },
  change: {
    fontFamily: comic,
    letterSpacing: 0.5,
  },
  contestForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  contestKinds: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  contestKind: {
    color: gunmetal,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  contestKindOn: {
    background: paleBlue,
  },
  contestText: {
    fontSize: 16,
    padding: '6px 10px',
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: '12px 8px 14px 7px / 8px 14px 7px 12px',
    outlineColor: brownRed,
    resize: 'vertical',
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
  tentative: {
    opacity: 0.5,
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
    margin: '0 0 10px',
    fontSize: 17,
    lineHeight: 1.2,
    fontStyle: 'italic',
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
    fontSize: 15,
    opacity: 0.75,
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

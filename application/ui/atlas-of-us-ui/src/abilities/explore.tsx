import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CATEGORIES, handOf, inYourHands, type Ability, type Measurement } from './api';
import { ABILITIES, AREA_OVERVIEW } from './explore_copy';
import { AREA_CHAPTER, THUMBS } from './chapter_thumbs';
import { MotionPanel, type MotionName } from './motion';
import { plain, plainLabel } from './plain';
import { askedFor, motionOf, type Known } from './tour';
import { navigate } from '../router';
import { Disclosure } from '../shared_components/disclosure';
import { blue, brownRed, cinnamon, comic, gunmetal, ivory } from '../shared_components/palette';

const paleBlue = 'var(--pale-blue)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

const anchor = (name: string) => `explore-${name.replace(/\W+/g, '-')}`;

//the opening sentences of a paragraph, and whatever follows them. A sentence ends after a word, so "U.S." doesn't end one
const splitSentences = (text: string, count: number) => {
  const sentences = text.split(/(?<=[a-z]{2}[.!?])\s+/);
  return [sentences.slice(0, count).join(' '), sentences.slice(count).join(' ')];
};

//how the abilities came about, in four steps, drawn above the history paragraph
const TIMELINE = [
  { when: '1950s', what: 'Fleishman tests thousands of people on hundreds of tasks' },
  { when: '1970s', what: 'The tasks people are good at together become a list of abilities, each with a scale' },
  { when: '1998', what: "O*NET rates every job on 52 abilities, built on Fleishman's work" },
  { when: 'Today', what: 'The Atlas tests 42 of them at home and in the app' },
];

//an amount on a bar of three segments: how many are filled, and in words
type Amount = { filled: number; words: string };

//how much practice changes an ability
const PRACTICE: Record<NonNullable<Ability['practice']>, Amount> = {
  little: { filled: 1, words: 'A little' },
  some: { filled: 2, words: 'Some' },
  'a lot': { filled: 3, words: 'A lot' },
};

//how much a reading of a test says about the abilities it shows
const says = (confidence: number): Amount =>
  confidence >= 0.6 ? { filled: 3, words: 'A lot' } : confidence >= 0.4 ? { filled: 2, words: 'A fair amount' } : { filled: 1, words: 'A little' };

//where a test is taken
const where = (m: Measurement) => (m.test === null ? 'A result you type in' : m.test === 'home' ? 'At home' : 'In the app');

//what a test is compared with, in a few words. Its full source opens under it
const comparedWith = (m: Measurement) => (m.atlas_norms ? 'Atlas users' : m.source?.startsWith('NHANES') ? 'NHANES' : m.source ? 'A published study' : 'Nothing yet');

//how long a card takes to open or close, and to move aside, in ms, and how it eases
const MOVE_MS = 380;
const MOVE_EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

//a box's place and size
interface Place {
  left: number;
  top: number;
  width: number;
  height: number;
}

//where everything that moves when a card opens or closes is: each card within its grid, by its ability's id, so only
//the cards in the grid that changed move, and each section after it on the screen, by its name
function places(): Map<string, Place> {
  const all = new Map<string, Place>();
  for (const el of document.querySelectorAll<HTMLElement>('[data-card]')) {
    const r = el.getBoundingClientRect();
    const grid = el.parentElement!.getBoundingClientRect();
    all.set(`card ${el.dataset.card}`, { left: r.left - grid.left, top: r.top - grid.top, width: r.width, height: r.height });
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-flip]')) {
    const r = el.getBoundingClientRect();
    all.set(`part ${el.dataset.flip}`, { left: r.left, top: r.top, width: r.width, height: r.height });
  }
  return all;
}
const keyOf = (el: HTMLElement) => (el.dataset.card ? `card ${el.dataset.card}` : `part ${el.dataset.flip}`);

//the box of an open card, moved and stretched from one place to another, with what's in it hidden while it moves and
//shown as it settles, or hidden first when it's closing
function morph(el: HTMLElement, from: string, to: string, closing: boolean) {
  el.style.transformOrigin = 'top left';
  const shown = closing ? [{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }];
  for (const part of el.firstElementChild?.children ?? []) part.animate(shown, { duration: MOVE_MS, fill: closing ? 'forwards' : 'none' });
  return el.animate([{ transform: from }, { transform: to }], { duration: MOVE_MS, easing: MOVE_EASE, fill: closing ? 'forwards' : 'none' });
}

//a transform taking a box at one place and size to another
const between = (box: Place, place: Place) =>
  `translate(${place.left - box.left}px, ${place.top - box.top}px) scale(${place.width / box.width}, ${place.height / box.height})`;

//the cards in the order they're laid out: the open one first in the row it was in, with the cards that were before it
//in that row after it, so it opens where it is
function inOrder(abilities: Ability[], picked: string | undefined, columns: number) {
  const at = abilities.findIndex((a) => a.id === picked);
  if (at < 0) return abilities;
  const start = at - (at % columns);
  return [...abilities.slice(0, start), abilities[at], ...abilities.slice(start, at), ...abilities.slice(at + 1)];
}

//the test an ability's picture is of: its first that has an animation
const pictureOf = (tests: Measurement[]) => tests.map((m) => motionOf(m.name)).find((n) => n !== null) ?? null;

//the Explore view: what the abilities are and where they come from, then every area and ability in depth, with how
//each is tested. Only the gist shows at first; the longer reading opens on request
export default function Explore({ known }: { known: Known }) {
  const [picked, setPicked] = useState<string>(); //the id of the ability open
  const [columns, setColumns] = useState(1); //how many cards were across a row when it opened
  const [sources, setSources] = useState(false); //whether where the numbers come from is open, under the other reading

  //where everything was just before a card opens or closes, and where the open card was in its grid, so the change can
  //be eased: the open card grows from where it was into its place across the row, and the other cards and the
  //sections below slide to their new places rather than jumping there
  const before = useRef<Map<string, Place>>(undefined);
  const slot = useRef<Place>(undefined);
  useLayoutEffect(() => {
    const was = before.current;
    before.current = undefined;
    if (!was || reducedMotion()) return;
    const now = places();
    for (const el of document.querySelectorAll<HTMLElement>('[data-card], [data-flip]')) {
      const from = was.get(keyOf(el));
      const to = now.get(keyOf(el));
      if (!from || !to) continue;
      if (el.dataset.card && el.dataset.card === picked) {
        slot.current = from;
        morph(el, between(to, from), 'none', false);
      } else if (from.left !== to.left || from.top !== to.top) {
        el.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: 'none' }], { duration: MOVE_MS, easing: MOVE_EASE });
      }
    }
  }, [picked]);

  //opens an ability, or closes the open one, bringing it into view once it's grown
  const pick = (id: string) => {
    before.current = places();
    const grid = document.querySelector(`[data-card="${id}"]`)?.parentElement;
    if (grid) setColumns(getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    setPicked((was) => (was === id ? undefined : id));
    window.setTimeout(() => document.getElementById(anchor(id))?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), MOVE_MS);
  };
  //closes the open ability, shrinking it back into the place it grew from first
  const close = () => {
    const el = document.querySelector<HTMLElement>(`[data-card="${picked}"]`);
    const s = slot.current;
    const done = () => {
      before.current = places();
      setPicked(undefined);
    };
    if (!el || !s || reducedMotion()) return done();
    morph(el, 'none', between(places().get(keyOf(el))!, s), true).onfinish = done;
  };
  const jump = (name: string) => document.getElementById(anchor(name))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const byId = new Map(known.measurements.measurements.map((m) => [m.id, m]));
  const testsOf = (a: Ability) => askedFor(a).flatMap((s) => byId.get(s.id) ?? []);
  const areas = CATEGORIES.map((c) => ({
    ...c,
    abilities: known.abilities.filter((a) => a.category === c.id),
  }));
  const [overview, overviewRest] = splitSentences(ABILITIES.overview, 2);
  const background = [
    { title: 'Where it came from', body: ABILITIES.history, timeline: true },
    { title: "What it can't tell you", body: ABILITIES.limits },
    { title: 'How we use it', body: ABILITIES.ourTake },
  ];

  return (
    <>
      <section style={styles.intro} className="comic-panel comic-pop">
        <h2 style={styles.introHeading}>Your abilities at a glance</h2>
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

        {/* one tile per area, each a jump to its section below */}
        <ul style={styles.tiles}>
          {areas.map((area) => (
            <li key={area.id} style={styles.tileSlot}>
              <button className="comic-chip comic-lift" style={styles.tile} onClick={() => jump(area.label)}>
                {THUMBS[AREA_CHAPTER[area.id]] && <img src={THUMBS[AREA_CHAPTER[area.id]]} alt="" style={styles.tileImage} loading="lazy" />}
                <span style={styles.tileName}>{area.label}</span>
                <span style={styles.tileCount}>{area.abilities.length} abilities</span>
              </button>
            </li>
          ))}
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
          <div style={styles.backgroundPart}>
            <button style={{ ...styles.sourcesToggle, ...styles.backgroundToggle }} aria-expanded={sources} onClick={() => setSources((o) => !o)}>
              Where the numbers come from {sources ? '▲' : '▼'}
            </button>
          </div>
          {/* the list of sources is long, so it opens across the whole panel */}
          {sources && (
            <div style={styles.wide}>
              <Sources abilities={known.abilities} measurements={byId} />
            </div>
          )}
        </div>
      </section>

      {areas.map((area) => {
        const [lede, more] = splitSentences(AREA_OVERVIEW[area.id], 1);
        return (
          <section key={area.id} id={anchor(area.label)} data-flip={area.id} style={styles.area}>
            <header style={styles.areaHead}>
              <h2 style={styles.areaTitle}>{area.label}</h2>
              <span className="comic-chip" style={styles.areaCount}>
                {area.abilities.length} abilities
              </span>
            </header>
            {lede && (
              <p style={{ ...styles.text, ...styles.areaOverview }}>
                {lede}{' '}
                {more && (
                  <Disclosure label="More">
                    <span>{more}</span>
                  </Disclosure>
                )}
              </p>
            )}
            <ul style={styles.cards}>
              {/* the open ability grows in place across its own row, and the cards before it in that row move after it */}
              {inOrder(area.abilities, picked, columns).map((a) =>
                a.id === picked ? (
                  <li key={a.id} data-card={a.id} style={{ ...styles.cardSlot, ...styles.wide }}>
                    <AbilityDetail ability={a} tests={testsOf(a)} hand={handOf(known.me)} chapter={AREA_CHAPTER[area.id]} onClose={close} />
                  </li>
                ) : (
                  <AbilityCard key={a.id} ability={a} picture={pictureOf(testsOf(a))} onPick={() => pick(a.id)} />
                ),
              )}
            </ul>
          </section>
        );
      })}

      <p data-flip="credit" style={styles.credit}>
        The abilities, their descriptions and their example tasks are from the{' '}
        <a href="https://www.onetcenter.org/database.html" target="_blank" rel="noreferrer" style={styles.link}>
          O*NET 30.0 Database
        </a>{' '}
        by the U.S. Department of Labor, Employment and Training Administration, under CC BY 4.0.
      </p>
    </>
  );
}

function Timeline() {
  return (
    <ol style={styles.timeline}>
      {TIMELINE.map((step) => (
        <li key={step.when} style={styles.timelineStep}>
          <span style={styles.timelineWhen}>{step.when}</span>
          <span>{step.what}</span>
        </li>
      ))}
    </ol>
  );
}

//what every test is compared with: published norms, each source with the tests that use it, then the tests compared
//with Atlas users
function Sources({ abilities, measurements }: { abilities: Ability[]; measurements: Map<string, Measurement> }) {
  const tests = [...new Set(abilities.flatMap((a) => askedFor(a).map((s) => s.id)))].flatMap((id) => measurements.get(id) ?? []);
  const published = new Map<string, string[]>();
  for (const m of tests.filter((t) => !t.atlas_norms && t.source)) published.set(m.source!, [...(published.get(m.source!) ?? []), m.name]);
  const ours = tests.filter((t) => t.atlas_norms).map((t) => t.name).sort();
  return (
    <div style={styles.sources}>
      <p style={styles.text}>
        Each test is compared with people of your sex and age. Where a large survey or a published study has measured the same thing the same way, it's
        compared with them:
      </p>
      <ul style={styles.sourceList}>
        {[...published].map(([source, names]) => (
          <li key={source} style={styles.source}>
            <span style={styles.sourceTests}>{names.sort().join(', ')}</span>
            <span>{source}</span>
          </li>
        ))}
      </ul>
      {!!ours.length && (
        <p style={styles.text}>
          The rest were made for the Atlas, and are compared with the Atlas's own users, by age group, once 100 people of your age have taken them: {ours.join(', ')}.
        </p>
      )}
    </div>
  );
}

//an ability as a card: a still of its test, which plays while it's pointed at, its name, what people call it,
//and how much practice changes it
function AbilityCard({ ability: a, picture, onPick }: { ability: Ability; picture: MotionName | null; onPick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <li data-card={a.id} style={styles.cardSlot}>
      <button
        className="comic-lift"
        style={styles.card}
        aria-expanded={false}
        onClick={onPick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <span style={styles.cardPicture} aria-hidden>{picture ? <MotionPanel name={picture} playing={hovered} /> : <span style={styles.cardBlank}>{a.name[0]}</span>}</span>
        <span style={styles.cardName}>{a.name}</span>
        {plain(a.name) !== a.name.toLowerCase() && <span style={styles.cardPlain}>{plainLabel(a.name)}</span>}
        {a.practice && <PracticeBar practice={a.practice} />}
      </button>
    </li>
  );
}

//an amount as a bar of three segments, filled from the left
function Segments({ amount }: { amount: Amount }) {
  return (
    <span style={styles.segments} role="img" aria-label={amount.words}>
      {[1, 2, 3].map((n) => (
        <span key={n} style={{ ...styles.segment, ...(n <= amount.filled ? styles.segmentFilled : {}) }} />
      ))}
    </span>
  );
}

//how much practice changes an ability, on its card
function PracticeBar({ practice }: { practice: NonNullable<Ability['practice']> }) {
  return (
    <span style={styles.cardPractice}>
      <span style={styles.practiceLabel}>Practice helps</span>
      <Segments amount={PRACTICE[practice]} />
    </span>
  );
}

//an ability at a glance: how much practice helps, the tests of it, where they're taken, what they're compared with and
//how much a reading says
function Facts({ ability: a, tests }: { ability: Ability; tests: Measurement[] }) {
  const unique = (list: string[]) => [...new Set(list)].join(', ');
  const best = says(Math.max(...tests.map((m) => m.confidence)));
  const rows: [string, ReactNode][] = [
    ...(a.practice ? [['Practice helps', <Amounted amount={PRACTICE[a.practice]} />] as [string, ReactNode]] : []),
    ...(tests.length
      ? ([
          ['Tested with', unique(tests.map((m) => m.name))],
          ['Taken', unique(tests.map(where))],
          ['Compared with', unique(tests.map(comparedWith))],
          ['A reading says', <Amounted amount={best} />],
        ] as [string, ReactNode][])
      : []),
  ];
  return (
    <dl style={styles.facts}>
      {rows.map(([label, value]) => (
        <div key={label} style={styles.fact}>
          <dt style={styles.factLabel}>{label}</dt>
          <dd style={styles.factValue}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

//an amount's bar with its words beside it
const Amounted = ({ amount }: { amount: Amount }) => (
  <span style={styles.amounted}>
    <Segments amount={amount} />
    <span aria-hidden>{amount.words}</span>
  </span>
);

interface AbilityDetailProps {
  ability: Ability;
  tests: Measurement[]; //the tests asked for it
  hand: string | null;
  chapter: string; //the chapter its tests are in
  onClose: () => void;
}

//an open ability: its test playing beside what it is and what a little and a lot of it looks like, then how it's
//tested and how to work on it
function AbilityDetail({ ability: a, tests, hand, chapter, onClose }: AbilityDetailProps) {
  const picture = pictureOf(tests);
  return (
    <div id={anchor(a.id)} style={styles.detail}>
      <header style={styles.detailHead}>
        <h3 style={styles.detailTitle}>{a.name}</h3>
        <button style={styles.close} aria-expanded onClick={onClose}>
          Close ▲
        </button>
      </header>
      <div style={styles.detailTop}>
        {picture && (
          <div style={styles.detailPicture}>
            <MotionPanel name={picture} />
          </div>
        )}
        <div style={styles.detailWhat}>
          <p style={styles.detailDescription}>{a.description}</p>
          <Facts ability={a} tests={tests} />
        </div>
      </div>

      {tests.length > 0 && (
        <div>
          <h4 style={styles.subheading}>How it's tested</h4>
          <div style={styles.tests}>
            {tests.map((m) => (
              <TestRow key={m.id} test={m} hand={hand} chapter={chapter} />
            ))}
          </div>
        </div>
      )}

      {a.tips.length > 0 && (
        <div>
          <h4 style={styles.subheading}>Working on it</h4>
          <div style={styles.tips}>
            {a.tips.map((t) => (
              <p key={t.kind} style={styles.tip}>
                <strong style={styles.tipKind}>{t.kind === 'impairment' ? 'With an impairment' : 'To get better'}</strong>
                {t.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

//a test of an ability: how it goes, with its full source if wanted and a way to take it
function TestRow({ test: m, hand, chapter }: { test: Measurement; hand: string | null; chapter: string }) {
  return (
    <div style={styles.test}>
      <div style={styles.testHead}>
        <span style={styles.testName}>{m.name}</span>
        <button className="comic-lift" style={styles.take} onClick={() => navigate(`/abilities?chapter=${chapter}&scene=${m.id}`)}>
          {m.readings.length ? 'Take it again ▶' : 'Take it ▶'}
        </button>
      </div>
      <p style={styles.small}>{inYourHands(m.description, hand)}</p>
      {m.source && !m.atlas_norms && (
        <Disclosure label="Source" style={styles.sourceToggle}>
          <p style={styles.sourceText}>{m.source}</p>
        </Disclosure>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  text: {
    fontSize: 19,
    lineHeight: 1.35,
  },
  small: {
    fontSize: 16,
    lineHeight: 1.3,
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
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
    padding: '10px 10px 12px',
    background: ivory,
    color: gunmetal,
    fontFamily: 'inherit',
    borderRadius: corners,
  },
  tileImage: {
    width: '100%',
    aspectRatio: '3 / 2',
    objectFit: 'cover',
    border: `3px solid ${gunmetal}`,
    borderRadius: 10,
    boxSizing: 'border-box',
  },
  tileName: {
    fontFamily: comic,
    fontSize: 22,
    letterSpacing: 1,
    textAlign: 'center',
  },
  tileCount: {
    fontSize: 15,
    opacity: 0.75,
  },
  background: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
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
  sources: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  wide: {
    gridColumn: '1 / -1',
  },
  //the same look as the other reading's toggles
  sourcesToggle: {
    alignSelf: 'flex-start',
    padding: 0,
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
  sourceList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 12,
    fontSize: 15,
    lineHeight: 1.3,
  },
  source: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: 12,
    borderLeft: `3px solid ${blue}`,
  },
  sourceTests: {
    fontFamily: comic,
    fontSize: 17,
    letterSpacing: 0.5,
  },
  area: {
    maxWidth: 1100,
    margin: '0 auto 48px',
    scrollMarginTop: 24,
  },
  areaHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '4px 16px',
    paddingBottom: 6,
    borderBottom: `4px solid ${gunmetal}`,
  },
  areaTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 38,
    letterSpacing: 1.5,
    lineHeight: 1,
    color: brownRed,
  },
  areaCount: {
    marginLeft: 'auto',
  },
  areaOverview: {
    margin: '12px 0',
  },
  cards: {
    margin: '16px 0 0',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
    gap: 16,
  },
  cardSlot: {
    display: 'flex',
  },
  card: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 4,
    padding: 10,
    background: '#fff',
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `4px 4px 0 ${gunmetal}`,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  cardPicture: {
    display: 'block',
    aspectRatio: '3 / 2',
    marginBottom: 4,
  },
  cardBlank: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 12,
    fontFamily: comic,
    fontSize: 48,
    color: blue,
  },
  cardName: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 0.5,
    lineHeight: 1.1,
  },
  cardPlain: {
    fontSize: 16,
    opacity: 0.8,
  },
  cardPractice: {
    marginTop: 'auto',
    paddingTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  practiceLabel: {
    fontSize: 14,
    color: cinnamon,
    whiteSpace: 'nowrap',
  },
  segments: {
    flex: 'none',
    display: 'flex',
    gap: 3,
    width: 84,
  },
  segment: {
    flex: 1,
    height: 10,
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: '5px 3px 6px 3px',
  },
  segmentFilled: {
    background: cinnamon,
  },
  facts: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  fact: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: '2px 14px',
    paddingBottom: 8,
    borderBottom: '2px dashed rgba(57, 61, 63, 0.25)',
  },
  factLabel: {
    flex: '0 0 150px',
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 0.5,
    color: cinnamon,
  },
  factValue: {
    flex: '1 1 200px',
    margin: 0,
    fontSize: 17,
    lineHeight: 1.3,
  },
  amounted: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
  },
  detail: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    padding: '18px 22px 22px',
    background: '#fff',
    border: `4px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `6px 6px 0 ${gunmetal}`,
    scrollMarginTop: 24,
  },
  detailHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 16,
  },
  detailTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 30,
    letterSpacing: 1,
    color: brownRed,
  },
  close: {
    marginLeft: 'auto',
    padding: 0,
    background: 'none',
    border: 'none',
    color: cinnamon,
    font: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  detailTop: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 24,
  },
  detailPicture: {
    flex: '0 1 380px',
    minWidth: 'min(100%, 260px)',
    aspectRatio: '3 / 2',
  },
  detailWhat: {
    flex: '1 1 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  detailDescription: {
    fontSize: 20,
    lineHeight: 1.3,
    fontStyle: 'italic',
    color: blue,
  },
  subheading: {
    margin: '0 0 8px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 21,
    letterSpacing: 0.5,
  },
  tests: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: 14,
  },
  test: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 14,
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  testHead: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  testName: {
    fontFamily: comic,
    fontSize: 21,
    letterSpacing: 0.5,
  },
  take: {
    marginLeft: 'auto',
    padding: '4px 12px',
    background: brownRed,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    fontFamily: comic,
    fontSize: 16,
    letterSpacing: 0.5,
    cursor: 'pointer',
  },
  sourceToggle: {
    fontSize: 14,
  },
  sourceText: {
    fontSize: 14,
    lineHeight: 1.3,
    opacity: 0.85,
  },
  tips: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: 12,
  },
  tip: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '10px 14px',
    background: ivory,
    border: `2px dashed ${gunmetal}`,
    borderRadius: corners,
    fontSize: 16,
    lineHeight: 1.3,
  },
  tipKind: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 17,
    letterSpacing: 0.5,
    color: cinnamon,
  },
  credit: {
    maxWidth: 1100,
    margin: '0 auto 40px',
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  link: {
    color: cinnamon,
  },
};

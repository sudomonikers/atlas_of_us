import { useState, type CSSProperties } from 'react';
import { getTopicMap, IDEA_TYPES, type IdeaType, type TopicRef } from './api';
import { useMap } from '../shared_components/use_map';
import { GraphBoard, MapWaiting, type LinkKind } from '../shared_components/graph_board';
import { BoardLayout } from '../shared_components/board_layout';
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

//what changes as someone comes to know a subject more deeply
const SHIFTS = [
  { from: 'Taking it in', to: 'Making something of it' },
  { from: 'One Idea at a time', to: 'The whole topic at once' },
  { from: 'Trusting what you were told', to: 'Judging it for yourself' },
];

//the six levels of Bloom's taxonomy every topic is known to, each followed through the same topic so they can be compared
const LEVELS = [
  {
    name: 'Remember',
    gist: 'Recalls the facts, the terms and the basic Ideas.',
    board: 'Can name the Ruy Lopez and the Sicilian (specific openings in Chees), and can name the first moves of each.',
    detail: "Remembering is having the topic's facts to hand: names, dates, definitions, sequences. It is the ground everything else stands on. Someone who only remembers can repeat an answer but can't yet say why it's the answer.",
  },
  {
    name: 'Understand',
    gist: 'Explains the Ideas in their own words, and how they connect.',
    board: 'Explains why both sides fight for the centre in the opening, and what developing a piece is for.',
    detail: 'Understanding is being able to say what something means: putting it another way, giving an example, telling it apart from what it resembles. The Ideas start to hang together, so one makes sense of another.',
  },
  {
    name: 'Apply',
    gist: 'Uses the Ideas in a situation they have not met before.',
    board: 'Faced with an unfamiliar opening, develops quickly, castles early and keeps the queen back.',
    detail: "Applying is putting what's understood to work somewhere new. The Ideas stop being things to talk about and become things to use, which is where most people find out what they really understood.",
  },
  {
    name: 'Analyze',
    gist: 'Breaks the topic into parts and sees how they relate.',
    board: 'Looks at a game and shows where the opening went wrong, and which move gave the other side the centre.',
    detail: 'Analyzing is taking the topic apart: telling what matters from what doesn\'t, seeing how the parts depend on each other, and finding the assumptions underneath. From here on, knowing is about the topic as a whole more than any one Idea in it.',
  },
  {
    name: 'Evaluate',
    gist: 'Judges claims and arguments, and defends a position.',
    board: "Argues whether the King's Gambit is sound, weighing engine lines against results in practice.",
    detail: "Evaluating is judging: which of two claims holds up, which argument is stronger, what a source is worth. Someone at this level holds views of their own in the topic, and can say why, including when they disagree with the people who taught them.",
  },
  {
    name: 'Create',
    gist: 'Puts the Ideas together into something new.',
    board: 'Prepares a new line nobody has played, and the plans that make it work.',
    detail: 'Creating is making something that wasn\'t there before out of what the topic offers: a new argument, a theory, a design, a work. It takes every level below it, which is why it sits at the top.',
  },
];

//an example of each type of Idea, all from chess, each saying enough for someone who doesn't play
const TYPE_EXAMPLES: Record<IdeaType, string> = {
  concept: '"Controlling the center." Pieces in the middle of the board reach more squares. You grasp it well or badly, but the concept itself is not true or false.',
  claim: '"The player who moves first has an advantage." Most players believe it, but no one has proved this particular claim.',
  norm: '"Get your king to safety early." Norms are common ideas of what to do.',
  value: '"Fighting spirit": playing for a win when a draw is there for the taking.',
};

//how the Atlas puts the model to work
const IN_THE_ATLAS = [
  {
    title: 'Every topic has its own six levels',
    body: 'You can evaluate chess openings and only remember the basics of chemistry. Levels belong to a topic, so there is no single score for how much you know.',
  },
  {
    title: 'Topics are made of Ideas',
    body: 'Each topic is broken into the single Ideas someone who knows it has grasped, with the ones to understand first. One Idea can be part of many topics, so learning it in one helps you in all of them.',
  },
  {
    title: 'What people hold true, not what is true',
    body: "The Atlas maps people, so it keeps claims people believe whether or not they're right, and claims that contradict each other side by side. It doesn't take sides.",
  },
  {
    title: 'Skills need knowledge',
    body: 'Competent cooking needs food safety at Apply. Skill levels point at the depth of each topic they need, which is how the Atlas shows what to learn to get better at something.',
  },
  {
    title: 'The people who know a topic keep it honest',
    body: 'Levels and Ideas start out written by AI and marked provisional, until people who know the topic agree with them.',
  },
];


//the Topics Explained view: why what you know matters, over a map of every topic, what Bloom's taxonomy is, each of its levels, the kinds of Idea, then how the Atlas uses them
//how the map draws a topic's link to the broader topic it's part of, as the explorer's board does
const PART_OF: LinkKind[] = [{ id: 'part_of', label: 'Part of', line: 'solid', arrow: true, colour: gunmetal, length: 90 }];

interface ExplainedProps {
  onExplore: (topic: TopicRef) => void; //a topic or a field on the map was clicked, to explore from it
}

export default function Explained({ onExplore }: ExplainedProps) {
  const map = useMap(getTopicMap);
  const [layout] = useState(() => new BoardLayout());
  return (
    <div style={styles.column}>
      <header style={styles.why}>
        <span className="comic-stamp" style={{ ...styles.stamp, color: cinnamon }}>
          Why it matters
        </span>
        <h2 style={styles.heading}>What you know is how you see.</h2>
      </header>
      {map.nodes ? (
        <GraphBoard
          preview
          label="Every topic in the Atlas"
          noun="topics"
          items={map.items}
          kinds={PART_OF}
          hierarchy="part_of"
          layout={layout}
          onSelect={(id) => {
            const topic = id ? map.byId.get(id) : undefined;
            if (topic) onExplore({ id: topic.id, name: topic.name, status: topic.status });
          }}
        />
      ) : (
        <MapWaiting error={map.error} preview />
      )}

      <section style={{ ...styles.panel, ...styles.intro }} className="comic-panel comic-pop">
        <div style={styles.introColumn}>
          <span className="comic-stamp" style={{ ...styles.stamp, color: brownRed }}>
            The model
          </span>
          <h2 style={styles.heading}>Knowing about something has depths.</h2>
          <p style={styles.text}>
            A topic is something you can know about, understand or hold views on. To say how deeply you know it, the
            Atlas uses Bloom's taxonomy. In 1956 the educational psychologist Benjamin Bloom and his colleagues set out
            the kinds of thinking that teaching asks of students, from simply recalling facts up to judging and making
            things. In 2001 Lorin Anderson and David Krathwohl revised it into the six levels used here.
          </p>
          <p style={styles.text}>
            Each level builds on the ones below it. You can't judge an argument you don't understand, and you can't
            understand what you don't remember.
          </p>
        </div>

        <div style={styles.introColumn}>
          <span className="comic-stamp" style={{ ...styles.stamp, color: blue }}>
            What changes
          </span>
          <ol style={styles.shifts}>
            {SHIFTS.map((shift, i) => (
              <li key={shift.from} style={styles.shift}>
                <span style={styles.number}>{i + 1}</span>
                <span style={styles.shiftFrom}>{shift.from}</span>
                <span style={styles.shiftArrow} aria-hidden>
                  →
                </span>
                <span style={styles.shiftTo}>{shift.to}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <h2 style={styles.sectionHeading}>The six levels</h2>
      <p style={styles.sectionText}>Followed through one topic, chess opening theory, so you can see the difference.</p>
      <ol style={styles.levels}>
        {LEVELS.map((level, i) => (
          <li key={level.name} style={{ ...styles.level, '--tilt': `${i % 2 ? 0.4 : -0.4}deg` } as CSSProperties} className="comic-panel comic-pop">
            <div style={styles.levelHead}>
              <span style={styles.number}>{i + 1}</span>
              <h3 style={styles.levelName}>{level.name}</h3>
              {/* how far up the ladder this level sits */}
              <span style={styles.ladder} aria-label={`Level ${i + 1} of ${LEVELS.length}`}>
                {LEVELS.map((_, rung) => (
                  <span
                    key={rung}
                    style={{ ...styles.rung, height: 8 + rung * 5, background: rung <= i ? cinnamon : ivory }}
                  />
                ))}
              </span>
            </div>
            <p style={styles.gist}>{level.gist}</p>
            <p style={styles.kitchen}>
              So for chess - {level.board}
            </p>
            <Disclosure label="What it takes">
              <p style={styles.text}>{level.detail}</p>
            </Disclosure>
          </li>
        ))}
      </ol>

      <h2 style={styles.sectionHeading}>Four kinds of Idea</h2>
      <p style={styles.sectionText}>A topic is made of Ideas, and each Idea is one of these. Each asks something different of you. Here is one of each from chess, the board game where two players take turns moving pieces, each trying to trap the other's king.</p>
      <ul style={styles.types}>
        {(Object.keys(IDEA_TYPES) as IdeaType[]).map((type, i) => (
          <li key={type} style={{ ...styles.type, '--tilt': `${i % 2 ? 0.3 : -0.3}deg` } as CSSProperties} className="comic-panel comic-pop">
            <span className="comic-chip" style={{ ...styles.typeChip, background: IDEA_TYPES[type].colour }}>
              {IDEA_TYPES[type].label}
            </span>
            <p style={styles.gist}>{IDEA_TYPES[type].tell}</p>
            <p style={styles.kitchen}>
              <strong>For example - </strong> {TYPE_EXAMPLES[type]}
            </p>
          </li>
        ))}
      </ul>

      <section style={{ ...styles.panel, ...styles.atlas }} className="comic-panel comic-pop">
        <h2 style={styles.heading}>How the Atlas uses it.</h2>
        <ul style={styles.atlasList}>
          {IN_THE_ATLAS.map((item) => (
            <li key={item.title}>
              <strong style={styles.atlasTitle}>{item.title}.</strong> {item.body}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  column: {
    maxWidth: 1100,
    margin: '0 auto 40px',
  },
  panel: {
    padding: '26px 30px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
  },
  //why it matters, over the map
  why: {
    marginBottom: 16,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 16px',
  },
  //what the model is on the left, what changes on the right; they stack on narrow screens
  intro: {
    marginBottom: 40,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '20px 40px',
    '--panel-fill': paleRed,
    '--tilt': '-0.3deg',
  } as CSSProperties,
  introColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  stamp: {
    alignSelf: 'flex-start',
    fontSize: 16,
  },
  heading: {
    margin: 0,
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
  number: {
    flex: 'none',
    display: 'grid',
    placeItems: 'center',
    width: 36,
    height: 36,
    background: blue,
    color: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 46% 52% 48%',
    fontFamily: comic,
    fontSize: 20,
  },
  shifts: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  shift: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  shiftFrom: {
    padding: '4px 10px',
    background: paleRed,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    fontFamily: comic,
    fontSize: 18,
  },
  shiftArrow: {
    fontSize: 22,
    color: brownRed,
  },
  shiftTo: {
    padding: '4px 10px',
    background: paleBlue,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    fontFamily: comic,
    fontSize: 18,
  },
  sectionHeading: {
    margin: '0 0 4px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 40,
    letterSpacing: 1,
    color: gunmetal,
  },
  sectionText: {
    margin: '0 0 20px',
    fontSize: 18,
  },
  levels: {
    margin: '0 0 40px',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: 30,
  },
  level: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '20px 22px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleCinnamon,
  } as CSSProperties,
  levelHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  levelName: {
    flex: 1,
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 26,
    letterSpacing: 1,
    lineHeight: 1.05,
    color: brownRed,
  },
  ladder: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 3,
  },
  rung: {
    width: 8,
    border: `2px solid ${gunmetal}`,
    borderRadius: 2,
  },
  gist: {
    margin: 0,
    fontSize: 19,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  relies: {
    margin: 0,
    fontSize: 16,
  },
  kitchen: {
    margin: 0,
    paddingTop: 10,
    borderTop: `3px dashed ${gunmetal}`,
    fontSize: 16,
    lineHeight: 1.45,
  },
  atlas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    '--panel-fill': paleBlue,
    '--tilt': '0.3deg',
  } as CSSProperties,
  atlasList: {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontSize: 17,
    lineHeight: 1.5,
  },
  atlasTitle: {
    color: gunmetal,
  },
  types: {
    margin: '0 0 40px',
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
    gap: 24,
  },
  type: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    padding: '18px 20px',
    boxSizing: 'border-box',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': paleBlue,
  } as CSSProperties,
  typeChip: {
    color: ivory,
    fontSize: 15,
  },
};

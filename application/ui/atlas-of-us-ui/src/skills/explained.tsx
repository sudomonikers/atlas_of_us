import { useState, type CSSProperties } from 'react';
import { getSkillMap, type SkillRef } from './api';
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

//what changes as someone gets better at anything, per the Dreyfus brothers
const SHIFTS = [
  { from: 'Following rules', to: 'Drawing on experience' },
  { from: 'Every detail matters equally', to: 'Seeing what matters' },
  { from: 'Standing outside it', to: 'Being inside it' },
];

//the five Dreyfus levels every skill is measured on, each followed through the same skill so they can be compared
const LEVELS = [
  {
    name: 'Novice',
    gist: 'Follows the rules, exactly as written.',
    relies: 'Rules',
    kitchen: 'Measures every teaspoon and sets a timer for the pasta. Out of an ingredient, the recipe is over.',
    detail:
      "A novice is given rules that work without any context: boil for ten minutes, add a pinch of salt. They don't yet know when a rule stops applying, so they follow it anyway. Progress is slow and deliberate, and when something goes wrong they tend to blame the rules.",
  },
  {
    name: 'Advanced Beginner',
    gist: 'Starts to recognize situations from experience.',
    relies: 'Rules and remembered examples',
    kitchen: "Knows what properly browned onions look like, and that a sauce looks too thin. Three pans at once still overwhelms.",
    detail:
      "Enough real experience has built up to notice things no rule describes, like what 'golden' looks like on this stove. But everything still seems equally important, so they can't yet tell which of the things they notice to act on first.",
  },
  {
    name: 'Competent',
    gist: 'Makes a plan, chooses what matters, and troubleshoots.',
    relies: 'A plan they chose',
    kitchen: 'Plans a dinner party menu, times the dishes to land together, and rescues a split sauce.',
    detail:
      'There is now too much going on to treat every detail equally, so a competent person picks a goal and decides which details serve it. Because the choice is theirs, so is the outcome: success feels earned and failure stings. This is where most people settle for most of their skills.',
  },
  {
    name: 'Proficient',
    gist: 'Sees the whole situation at once, then decides what to do.',
    relies: 'Intuition to see, thought to act',
    kitchen: 'Tastes a stew and knows straight away it needs acid. Still weighs up lemon against vinegar.',
    detail:
      "Experience lets a proficient person see what's going on without working it out: the situation just looks a certain way. Deciding what to do about it is still a conscious step, often guided by maxims, rules of thumb that only make sense to someone who already understands.",
  },
  {
    name: 'Expert',
    gist: 'Sees what needs doing and does it, fluidly and without deliberating.',
    relies: 'Deep tacit understanding',
    kitchen: 'Cooks without a recipe, adjusting by smell, sound and taste. Struggles to write down how.',
    detail:
      "An expert has seen so many situations that the right response comes with the seeing. The rules haven't disappeared, they've been absorbed so completely that the expert often can't say what they are. When something truly unusual happens, the expert slows down and thinks it through, like a competent person would.",
  },
];

//how the Atlas puts the model to work
const IN_THE_ATLAS = [
  {
    title: 'Every skill has its own five levels',
    body: 'You can be an expert cook and a novice driver. Levels belong to a skill, so there is no single score for how skilled you are.',
  },
  {
    title: 'Every level is written for its skill',
    body: "What Competent means for cooking isn't what it means for welding. Each level says what someone at it is like, the signs you can see them show, the evidence that would prove it, and what it takes to reach the next one.",
  },
  {
    title: 'Levels lead to other levels',
    body: 'Competent cooking needs knife skills at Advanced Beginner. Skills connect level to level, which is how the Atlas shows what you are close to and what to learn next.',
  },
  {
    title: 'The people who have a skill keep it honest',
    body: 'Levels start out written by AI and marked provisional. People who have the skill endorse them or propose changes, and the levels settle once enough of them agree.',
  },
];


//the Skills Explained view: why what you can do matters, over a map of every skill, what the Dreyfus model is, each of its levels, then how the Atlas uses it
//how the map draws a skill's link to the broader skill it's a kind of, as the explorer's board does
const KIND_OF: LinkKind[] = [{ id: 'kind_of', label: 'A kind of', line: 'solid', arrow: true, colour: gunmetal, length: 90 }];

interface ExplainedProps {
  onExplore: (skill: SkillRef) => void; //a skill or a field on the map was clicked, to explore from it
}

export default function Explained({ onExplore }: ExplainedProps) {
  const map = useMap(getSkillMap);
  const [layout] = useState(() => new BoardLayout());
  return (
    <div style={styles.column}>
      <header style={styles.why}>
        <span className="comic-stamp" style={{ ...styles.stamp, color: cinnamon }}>
          Why it matters
        </span>
        <h2 style={styles.heading}>What you can do is part of who you are.</h2>
      </header>
      {map.nodes ? (
        <GraphBoard
          preview
          label="Every skill in the Atlas"
          noun="skills"
          items={map.items}
          kinds={KIND_OF}
          hierarchy="kind_of"
          layout={layout}
          onSelect={(id) => {
            const skill = id ? map.byId.get(id) : undefined;
            if (skill) onExplore({ id: skill.id, name: skill.name, status: skill.status });
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
          <h2 style={styles.heading}>Nobody starts out an expert.</h2>
          <p style={styles.text}>
            A skill is something you are capable of doing. To say how well you can do it, the Atlas uses the Dreyfus
            model of skill acquisition. In 1980 the brothers Stuart and Hubert Dreyfus, a mathematician and a
            philosopher at Berkeley, studied how airline pilots, chess players, drivers and people learning a language
            got better. They found the same five stages every time.
          </p>
          <p style={styles.text}>
            The surprise was the direction of travel. People don't improve by learning more rules. They improve by
            needing them less.
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

      <h2 style={styles.sectionHeading}>The five levels</h2>
      <p style={styles.sectionText}>Followed through one skill, cooking, so you can see the difference.</p>
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
            <p style={styles.relies}>
              <span className="comic-chip">Relies on</span> {level.relies}
            </p>
            <p style={styles.kitchen}>
              <strong>In the kitchen.</strong> {level.kitchen}
            </p>
            <Disclosure label="How they think">
              <p style={styles.text}>{level.detail}</p>
            </Disclosure>
          </li>
        ))}
      </ol>

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
};

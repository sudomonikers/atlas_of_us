import { BLUE, circle, GRAY, GREEN, GROUND, INK, line, ORANGE, part, PURPLE, RED, rect, type Cue } from '../../shared_components/story/ink';
import { Bubble, Card, Ink, List, Person, Question, Say, Spark, Thought, Wash, Whiteboard as Marker, Window } from '../../shared_components/story/marker';

// Same Answer is drawn in marker on the whiteboard in the back of a bakery: Sam in orange, Priya in blue, Rosa in
// purple, and the bread in brown. The marker, the people and the board itself are shared with the other stories
// (shared_components/story/); the bakery and the cues are Same Answer's own.

const BROWN = '#a0632e';
const PAPER = '#fbfbf6';

// ---------------------------------------------------------------------------
// the bakery
// ---------------------------------------------------------------------------

const Loaf = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Wash d="M -46 0 Q -50 -40 0 -42 Q 50 -40 46 0 Z" c={BROWN} op={0.5} />
    <Ink d="M -46 0 Q -50 -40 0 -42 Q 50 -40 46 0 Z" c={BROWN} w={5} />
    <Ink d={`${line([-22, -34], [-12, -14])} ${line([0, -38], [10, -16])} ${line([22, -32], [30, -14])}`} c={BROWN} w={4} />
  </g>
);

//the counter, hiding whoever stands behind it from the waist down, with loaves on top
const Counter = ({ x, w = 520 }: { x: number; w?: number }) => (
  <g>
    <Wash d={rect(x - w / 2, GROUND - 150, w, 150)} c={PAPER} op={1} />
    <Ink d={rect(x - w / 2, GROUND - 150, w, 150)} />
    <Ink d={line([x - w / 2, GROUND - 120], [x + w / 2, GROUND - 120])} c={GRAY} w={4} />
    <Loaf x={x - w / 2 + 70} y={GROUND - 150} />
    <Loaf x={x + w / 2 - 70} y={GROUND - 150} s={0.8} />
    <Loaf x={x + w / 2 - 150} y={GROUND - 150} s={0.7} />
  </g>
);

//the bakery from the street, its name over the door, and open when it says so
const Storefront = ({ x, name = "Rosa's Bakery", open }: { x: number; name?: string; open?: boolean }) => (
  <g>
    <Ink d={rect(x - 300, 170, 600, GROUND - 170)} />
    <Wash d={rect(x - 300, 170, 600, 80)} c={ORANGE} op={0.3} />
    <Ink d={line([x - 300, 250], [x + 300, 250])} />
    <Say x={x} y={226} text={name} size={50} c={BROWN} />
    <Ink d={rect(x - 260, 290, 300, 200)} c={GRAY} w={5} />
    <Loaf x={x - 180} y={480} s={0.9} />
    <Loaf x={x - 70} y={480} s={0.8} />
    <Ink d={rect(x + 90, 290, 160, GROUND - 290)} />
    <Ink d={circle(x + 220, 470, 8)} w={5} />
    {open !== undefined && (
      <g>
        <Ink d={rect(x + 110, 320, 120, 50)} c={open ? GREEN : RED} w={4} />
        <Say x={x + 170} y={356} text={open ? 'OPEN' : 'SOLD?'} size={32} c={open ? GREEN : RED} />
      </g>
    )}
  </g>
);

const Oven = ({ x, hot }: { x: number; hot?: boolean }) => (
  <g>
    <Ink d={rect(x - 130, GROUND - 300, 260, 300)} c={GRAY} />
    <Ink d={rect(x - 100, GROUND - 230, 200, 130)} c={GRAY} w={5} />
    {hot && <Wash d={rect(x - 100, GROUND - 230, 200, 130)} c={ORANGE} op={0.45} />}
    <Ink d={`${circle(x - 70, GROUND - 265, 12)} ${circle(x - 30, GROUND - 265, 12)}`} c={GRAY} w={4} />
    {hot && (
      <g className="wb-steam">
        <Ink d={`M ${x - 40} ${GROUND - 320} q 16 -20 0 -40 q -16 -20 0 -40 M ${x + 30} ${GROUND - 320} q 16 -20 0 -40 q -16 -20 0 -40`} c={GRAY} w={4} />
      </g>
    )}
  </g>
);

const Fridge = ({ x, dead }: { x: number; dead?: boolean }) => (
  <g>
    <Ink d={rect(x - 110, GROUND - 400, 220, 400)} c={GRAY} />
    <Ink d={`${line([x - 110, GROUND - 260], [x + 110, GROUND - 260])} ${line([x + 80, GROUND - 360], [x + 80, GROUND - 300])} ${line([x + 80, GROUND - 220], [x + 80, GROUND - 140])}`} c={GRAY} w={5} />
    {dead && <Ink d={`${line([x - 60, GROUND - 380], [x + 50, GROUND - 290])} ${line([x + 50, GROUND - 380], [x - 60, GROUND - 290])}`} c={RED} w={8} />}
  </g>
);

//a box of butter, carried
const Butter = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Wash d={rect(x - 40, y - 30, 80, 30)} c={ORANGE} op={0.35} />
    <Ink d={rect(x - 40, y - 30, 80, 30)} c={ORANGE} w={4} />
  </g>
);

const Clock = ({ x, y, time }: { x: number; y: number; time: string }) => (
  <g>
    <Ink d={rect(x - 90, y - 50, 180, 90)} />
    <Say x={x} y={y + 18} text={time} size={60} c={RED} />
  </g>
);

const Moon = ({ x, y }: { x: number; y: number }) => <Ink d={`M ${x} ${y} a 50 50 0 1 0 40 90 a 40 40 0 1 1 -40 -90 Z`} c={GRAY} w={5} />;

//a quiz sheet: statements, each with five circles, and the one circle picked on each
const Quiz = ({ x, y, w = 520, rows, picked = [], c = INK }: { x: number; y: number; w?: number; rows: string[]; picked?: number[]; c?: string }) => (
  <g>
    <Wash d={rect(x, y, w, 60 + rows.length * 96)} c={PAPER} op={1} />
    <Ink d={rect(x, y, w, 60 + rows.length * 96)} c={c} w={5} />
    {rows.map((row, i) => (
      <g key={row}>
        <Say x={x + 30} y={y + 64 + i * 96} text={row} size={32} anchor="start" />
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <Ink d={circle(x + 50 + k * 70, y + 100 + i * 96, 16)} c={GRAY} w={4} />
            {picked[i] === k && <path d={circle(x + 50 + k * 70, y + 100 + i * 96, 11)} fill={c} className="wb-fade" />}
          </g>
        ))}
      </g>
    ))}
  </g>
);

//a phone held up, its screen lit, with what's on it written above whoever holds it
const Phone = ({ x, y, label }: { x: number; y: number; label?: string }) => (
  <g>
    <Wash d={rect(x - 16, y - 28, 32, 52)} c={BLUE} op={0.25} />
    <Ink d={rect(x - 16, y - 28, 32, 52)} w={4} />
    {label && <Say x={x} y={250} text={label} size={32} c={GRAY} />}
  </g>
);

//a ring of keys
const Keys = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Ink d={circle(x, y, 40)} c={ORANGE} w={6} />
    {[[-1, 1], [1, 1]].map(([dx], i) => (
      <Ink key={i} d={`${circle(x + dx * 40, y + 70, 20)} ${line([x + dx * 40, y + 90], [x + dx * 40, y + 170], [x + dx * 40 + 20, y + 170])} ${line([x + dx * 40, y + 140], [x + dx * 40 + 16, y + 140])}`} c={ORANGE} w={6} />
    ))}
  </g>
);

//a dog, for the regulars
const Dog = ({ x }: { x: number }) => (
  <g>
    <Ink d={`M ${x - 50} ${GROUND - 70} q 0 -26 30 -26 h 50 q 20 0 26 -30 q 10 -14 26 -2 q 6 18 -10 30 q -8 20 -16 28 v 70 M ${x - 40} ${GROUND - 60} v 60 M ${x + 30} ${GROUND - 62} v 62 M ${x - 50} ${GROUND - 70} q -30 -10 -30 -40`} c={BROWN} w={6} />
  </g>
);

//a bus window, someone seen through it
const BusWindow = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Ink d={rect(x, y, 700, 380)} c={GRAY} w={10} />
    <Ink d={line([x + 350, y], [x + 350, y + 380])} c={GRAY} w={6} />
    <Ink d={`${line([x + 380, y + 60], [x + 680, y + 120])} ${line([x + 400, y + 140], [x + 670, y + 200])}`} c={GRAY} w={3} dash />
  </g>
);

// ---------------------------------------------------------------------------
// cues: the board, and every part on it by key. Parts already up stay put; new ones draw on in order
// ---------------------------------------------------------------------------

const SAM = (pose = 'stand', x = 760, flip?: boolean) => part('sam', <Person x={x} c={ORANGE} pose={pose} s={1.15} wide={36} hair="#5a3a22" flip={flip} />);
const PRIYA = (pose = 'stand', x = 760, flip?: boolean) => part('priya', <Person x={x} c={BLUE} pose={pose} s={1.05} wide={30} flip={flip} />);
const ROSA = (pose = 'stand', x = 800) => part('rosa', <Person x={x} c={PURPLE} pose={pose} s={1} wide={34} hair={GRAY} />);
const NAME = (text: string, x: number, c: string) => part('name', <Say x={x} y={GROUND + 64} text={text} size={50} c={c} />);

//Sam behind the counter, hands up when he's talking
const atCounter = (pose: string) => [SAM(pose, 760), part('counter', <Counter x={760} />), NAME('Sam', 760, ORANGE)];

const CUES: Record<string, Cue> = {
  title_card: {
    board: 'title',
    parts: [
      part('title', <Say x={800} y={210} text="Same Answer" size={150} />),
      part('underline', <Ink d="M 430 242 Q 800 220 1170 242" c={ORANGE} w={9} />),
      SAM('hold', 420),
      PRIYA('hold', 1180),
      part('sheet1', <Quiz x={330} y={360} w={180} rows={['']} picked={[3]} c={ORANGE} />),
      part('sheet2', <Quiz x={1090} y={360} w={180} rows={['']} picked={[3]} c={BLUE} />),
      part('equals', <Say x={800} y={470} text="=" size={160} c={GRAY} />),
    ],
  },
  quiz_sheet: {
    board: 'quiz',
    parts: [
      part('sheet', <Quiz x={420} y={90} w={760} rows={['I am the life of the party.', 'I get chores done right away.', 'I worry about things.', 'I sympathize with others.']} picked={[3, 1, 2, 4]} />),
      part('label', <Say x={800} y={610} text="You are: a Commander!" size={60} c={RED} />),
      part('s1', <Spark x={1200} y={580} c={RED} />, true),
    ],
  },
  quiz_party: {
    board: 'party',
    parts: [
      part('sheet', <Quiz x={430} y={160} w={400} rows={['I love large parties.']} />),
      part('ends', <Say x={630} y={360} text="disagree . . . agree" size={34} c={GRAY} />),
      part('you', <Person x={1120} c={GREEN} pose="think" />),
    ],
  },
  quiz_parties: {
    board: 'party',
    parts: [
      part('you', <Person x={1120} c={GREEN} pose="think" />),
      part('t1', <Thought x={420} y={160} r={170} from={[1080, 300]}><Say x={420} y={150} text="a wedding" size={42} /><Say x={420} y={200} text="everyone you know" size={30} c={GRAY} /></Thought>),
      part('t2', <Thought x={500} y={430} r={170} from={[1080, 340]}><Say x={500} y={420} text="the office party" size={42} /><Say x={500} y={470} text="and your boss" size={30} c={GRAY} /></Thought>),
      part('t3', <Thought x={1300} y={150} r={170} from={[1150, 300]}><Say x={1300} y={140} text="a stranger's house" size={38} /><Say x={1300} y={190} text="at 1 a.m." size={30} c={GRAY} /></Thought>),
    ],
  },
  quiz_circle: {
    board: 'circle',
    parts: [
      part('sheet', <Quiz x={460} y={170} w={400} rows={['I love large parties.']} picked={[3]} />),
      part('q1', <Question x={1000} y={300} c={GRAY} size={90} />),
      part('which', <Say x={1180} y={240} text="which party?" size={44} c={RED} />),
      part('why', <Say x={1180} y={380} text="why?" size={60} c={RED} />),
    ],
  },
  two_silhouettes: {
    board: 'two',
    parts: [SAM('stand', 560), PRIYA('stand', 1040), part('q1', <Question x={560} y={200} c={ORANGE} />), part('q2', <Question x={1040} y={220} c={BLUE} />)],
  },

  sam_counter: {
    board: 'counter',
    parts: [...atCounter('stand'), part('sign', <Say x={760} y={150} text="Rosa's Bakery" size={60} c={BROWN} />), part('customer', <Person x={1240} c={GRAY} pose="wave" s={0.95} flip />), part('dog', <Dog x={1420} />)],
  },
  sam_ideas: {
    board: 'counter',
    parts: [
      ...atCounter('cheer'),
      part('sign', <Say x={760} y={150} text="Rosa's Bakery" size={60} c={BROWN} />),
      part('b1', <Bubble x={1000} y={170} w={460} text="Sourdough pizza Fridays!" tail={[860, 300]} c={ORANGE} />),
      part('b2', <Bubble x={1040} y={320} w={400} text="Bread subscription!" tail={[880, 420]} c={ORANGE} />),
      part('b3', <Bubble x={110} y={210} w={420} text="A night market stall!" tail={[640, 330]} c={ORANGE} />),
    ],
  },
  sam_quiz: {
    board: 'sam_quiz',
    parts: [SAM('cheer', 520), part('card', <Card x={820} y={180} w={560} title="You are:" lines={['a born leader!']} c={ORANGE} />), part('s1', <Spark x={1340} y={160} />, true), part('s2', <Spark x={790} y={420} s={0.7} />, true), NAME('Sam', 520, ORANGE)],
  },
  sam_thinking: {
    board: 'sam_quiz',
    parts: [SAM('think', 520), NAME('Sam', 520, ORANGE), part('thought', <Thought x={1080} y={280} r={300} from={[600, 260]}><Say x={1080} y={250} text="Sam's" size={70} c={BROWN} /><Say x={1080} y={320} text="my own place" size={40} c={GRAY} /></Thought>)],
  },

  priya_morning: {
    board: 'kitchen',
    parts: [PRIYA('stand', 560), NAME('Priya', 560, BLUE), part('oven', <Oven x={260} hot />), part('clock', <Clock x={1000} y={150} time="5:00" />), part('moon', <Moon x={1380} y={90} />), part('list', <List x={860} y={290} items={['Ovens hot', 'Orders checked', 'Till balanced']} done={3} />)],
  },
  priya_fridge: {
    board: 'fridge',
    parts: [
      part('fridge', <Fridge x={280} dead />),
      PRIYA('hold', 760),
      part('butter', <g><Butter x={760} y={GROUND - 170} /><Butter x={760} y={GROUND - 200} /></g>),
      part('arrow', <Ink d={`${line([900, 380], [1150, 380])} ${line([1120, 350], [1150, 380], [1120, 410])}`} c={BLUE} w={6} />),
      part('cafe', <Card x={1180} y={240} w={300} title="Café" lines={['next door']} />),
      part('label', <Say x={760} y={GROUND + 64} text="Saturday" size={46} c={BLUE} />),
    ],
  },
  priya_quiz: {
    board: 'priya_quiz',
    parts: [PRIYA('hold', 520), NAME('Priya', 520, BLUE), part('card', <Card x={820} y={180} w={560} title="You are:" lines={['a supporter.']} c={BLUE} />), part('small', <Say x={1100} y={420} text="(not a leader, then)" size={36} c={GRAY} />)],
  },
  priya_window: {
    board: 'priya_quiz',
    parts: [PRIYA('think', 520), NAME('Priya', 520, BLUE), part('window', <Window x={1060} y={150} />), part('q', <Question x={780} y={240} c={GRAY} size={80} />)],
  },

  rosa_news: {
    board: 'rosa',
    parts: [ROSA('wave', 800), part('name', <Say x={800} y={GROUND + 64} text="Rosa" size={50} c={PURPLE} />), part('bubble', <Bubble x={930} y={150} w={500} text="I'm retiring next year." tail={[860, 300]} c={PURPLE} />), SAM('shrug', 340), PRIYA('stand', 1260, true)],
  },
  both_bakery: {
    board: 'bakery',
    parts: [part('store', <Storefront x={800} open={false} />), SAM('stand', 300), PRIYA('stand', 1300, true), part('q1', <Question x={300} y={220} c={ORANGE} />), part('q2', <Question x={1300} y={230} c={BLUE} />)],
  },

  both_phones: {
    board: 'phones',
    parts: [SAM('hold', 480), PRIYA('hold', 1120), part('p1', <Phone x={480} y={GROUND - 196} label="The Shoplifter" />), part('p2', <Phone x={1120} y={GROUND - 180} label="The Shoplifter" />), part('break', <Say x={800} y={140} text="on their breaks" size={50} c={GRAY} />)],
  },
  both_same_choice: {
    board: 'phones',
    parts: [
      SAM('hold', 480),
      PRIYA('hold', 1120),
      part('p1', <Phone x={480} y={GROUND - 196} />),
      part('p2', <Phone x={1120} y={GROUND - 180} />),
      part('choice', <Card x={540} y={90} w={520} title="Keep the things," lines={['let him go with a warning.']} c={GREEN} />),
      part('ticks', <Ink d={`${line([560, 280], [580, 300], [612, 262])} ${line([1000, 280], [1020, 300], [1052, 262])}`} c={GREEN} w={8} />),
    ],
  },
  both_split: {
    board: 'split',
    parts: [
      part('divider', <Ink d={line([800, 90], [800, 720])} c={GRAY} w={5} dash />),
      SAM('shrug', 420),
      PRIYA('think', 1180, true),
      part('b1', <Bubble x={90} y={110} w={600} text="The rule's wrong." tail={[420, 290]} c={ORANGE} />),
      part('b2', <Bubble x={900} y={110} w={600} text="I felt for him." tail={[1180, 290]} c={BLUE} />),
      part('w1', <Say x={420} y={GROUND + 64} text="...and kept it quiet" size={40} c={ORANGE} />),
      part('w2', <Say x={1180} y={GROUND + 64} text="...and told Frank" size={40} c={BLUE} />),
    ],
  },

  sam_phone_protest: {
    board: 'sam_protest',
    parts: [SAM('shrug', 620), NAME('Sam', 620, ORANGE), part('bubble', <Bubble x={820} y={170} w={560} text="It's a fairy tale!" tail={[700, 320]} c={ORANGE} size={44} />), part('phone', <Phone x={1180} y={430} />)],
  },
  sam_phone_sheepish: {
    board: 'sam_protest',
    parts: [SAM('think', 620), NAME('Sam', 620, ORANGE), part('phone', <Phone x={1180} y={430} />), part('bubble', <Bubble x={820} y={170} w={300} text="...fair." tail={[700, 320]} c={ORANGE} />), part('sweat', <Ink d="M 700 300 q 8 16 0 22 q -8 -6 0 -22" c={BLUE} w={4} />)],
  },

  priya_reading: {
    board: 'reading',
    parts: [PRIYA('hold', 480), NAME('Priya', 480, BLUE), part('report', <Card x={720} y={140} w={680} title="Strengths" lines={['Calm when things go wrong', 'Trusted with what matters', 'Plans ahead']} c={BLUE} />), part('s1', <Spark x={1380} y={130} c={BLUE} />, true)],
  },
  priya_bus: {
    board: 'bus',
    parts: [part('window', <BusWindow x={450} y={130} />), PRIYA('cheer', 640), part('ha', <Say x={1000} y={280} text="ha!" size={90} c={BLUE} />), part('s1', <Spark x={1120} y={420} c={ORANGE} />, true), part('butter', <Butter x={1000} y={420} />)],
  },

  sam_counter_quiet: {
    board: 'counter',
    parts: [...atCounter('stand'), part('sign', <Say x={760} y={150} text="Rosa's Bakery" size={60} c={BROWN} />), part('cloud', <Ink d={`M 900 230 q -10 -50 40 -50 q 20 -40 70 -10 q 50 -10 50 40 q 30 30 -10 50 h -130 q -40 -10 -20 -30 Z`} c={GRAY} w={5} />), part('rain', <Ink d={`${line([930, 290], [920, 320])} ${line([970, 290], [960, 320])} ${line([1010, 290], [1000, 320])}`} c={BLUE} w={4} />)],
  },
  sam_plan: {
    board: 'plans',
    parts: [SAM('point', 330), part('title', <Say x={680} y={160} text="Sam's plan" size={56} c={ORANGE} anchor="start" />), part('list', <List x={680} y={210} items={['Checklists for the boring stuff', 'Alarms, and habits that stick', 'A partner who loves the books']} done={3} />)],
  },
  priya_plan: {
    board: 'plans',
    parts: [SAM('point', 330), part('title', <Say x={680} y={160} text="Sam's plan" size={56} c={ORANGE} anchor="start" />), part('list', <List x={680} y={210} items={['Checklists for the boring stuff', 'Alarms, and habits that stick', 'A partner who loves the books']} done={3} />), part('priya', <Person x={1440} c={BLUE} pose="hold" s={0.9} flip />), part('card', <Card x={700} y={460} w={600} title="Priya: practise the ask" lines={[]} c={BLUE} />)],
  },

  both_keys: {
    board: 'keys',
    parts: [SAM('cheer', 480), PRIYA('cheer', 1120), part('keys', <Keys x={800} y={200} />), part('s1', <Spark x={660} y={140} />, true), part('s2', <Spark x={950} y={140} c={BLUE} />, true)],
  },
  both_bakery_open: {
    board: 'open',
    parts: [part('store', <Storefront x={800} open />), PRIYA('stand', 260), SAM('wave', 1340, true), part('l1', <Say x={260} y={GROUND + 64} text="the books, the ovens" size={36} c={BLUE} />), part('l2', <Say x={1340} y={GROUND + 64} text="the front" size={36} c={ORANGE} />)],
  },
  priya_phone: {
    board: 'call',
    parts: [PRIYA('phone', 560), NAME('Priya', 560, BLUE), part('card', <Card x={860} y={170} w={560} title="Index card" lines={['Hi, it\'s Priya at Rosa\'s.', 'About the flour price...']} c={BLUE} />)],
  },
  rosa_visit: {
    board: 'visit',
    parts: [part('store', <Storefront x={760} name="Sam & Priya's" open />), SAM('cheer', 230), ROSA('wave', 1190), PRIYA('stand', 1400, true)],
  },
  two_lit: {
    board: 'two_lit',
    parts: [SAM('cheer', 520), PRIYA('cheer', 1080), part('s1', <Spark x={300} y={170} />, true), part('s2', <Spark x={800} y={240} c={GREEN} />, true), part('s3', <Spark x={1300} y={170} c={BLUE} />, true)],
  },
  your_turn: {
    board: 'yours',
    parts: [
      part('you', <Person x={800} c={GREEN} pose="cheer" />),
      part('sheet', <Quiz x={170} y={260} w={360} rows={['']} />),
      part('crossed', <Ink d={`${line([160, 250], [540, 420])} ${line([540, 250], [160, 420])}`} c={RED} w={8} />),
      part('story', <Card x={1040} y={240} w={420} title="Why?" lines={['Because...', '']} c={GREEN} />),
      part('title', <Say x={800} y={150} text="Your turn" size={90} c={GREEN} />),
    ],
  },
};
const FIRST_CUE = 'title_card';

//the whiteboard behind the story
function Whiteboard({ animation }: { animation?: string }) {
  return <Marker cues={CUES} first={FIRST_CUE} animation={animation} story="Same Answer" />;
}

export default Whiteboard;

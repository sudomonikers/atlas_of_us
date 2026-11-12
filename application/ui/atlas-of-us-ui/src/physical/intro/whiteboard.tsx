import { BLUE, circle, GRAY, GREEN, GROUND, INK, line, ORANGE, part, PURPLE, RED, rect, shape, type Cue, type Pt } from '../../shared_components/story/ink';
import { Bars, Bubble, Card, Ink, List, Person, Question, Say, Spark, Thought, Wash, Whiteboard as Marker, Window } from '../../shared_components/story/marker';

// Two Players is drawn in marker on a coach's whiteboard: Andrew in red, Daniel in blue, Marcus in purple, and the
// ball in orange. The marker, the people and the board itself are shared with the other stories
// (shared_components/story/); the things on the court and the cues are Two Players' own.

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

//Daniel's arms in his chair: elbow and hand, near then far
const SEATED: Record<string, [Pt, Pt][]> = {
  rest: [[[30, -176], [34, -128]], [[-24, -176], [-18, -128]]],
  cheer: [[[48, -268], [70, -322]], [[-44, -268], [-62, -322]]],
  catch: [[[52, -262], [70, -316]], [[-24, -176], [-18, -128]]],
  think: [[[38, -186], [10, -242]], [[-24, -176], [-18, -128]]],
  play: [[[56, -168], [100, -158]], [[44, -176], [88, -170]]],
  bow: [[[64, -228], [124, -232]], [[18, -214], [4, -246]]],
  wave: [[[54, -254], [62, -306]], [[-24, -176], [-18, -128]]],
};

//someone in a wheelchair, facing right
function Rider({ x, c, arms = 'rest', s = 1, flip }: { x: number; c: string; arms?: string; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(${flip ? -s : s} ${s})`}>
      <Ink d={circle(-4, -74, 72)} c={GRAY} w={8} />
      <Ink d={circle(-4, -74, 58)} c={GRAY} w={4} />
      <Ink d={line([-4, -74], [-4, -132]) + ' ' + line([-4, -74], [46, -50]) + ' ' + line([-4, -74], [-54, -50])} c={GRAY} w={3} />
      <Ink d={circle(84, -16, 15)} c={GRAY} w={6} />
      <Ink d={line([-74, -232], [-50, -226], [-38, -122], [60, -122], [74, -34], [100, -34])} c={GRAY} />
      <Ink d={line([60, -122], [84, -30])} c={GRAY} w={5} />
      <Wash d={shape([-28, -232], [28, -232], [22, -128], [-24, -128])} c={c} op={0.35} />
      <Ink d={shape([-28, -232], [28, -232], [22, -128], [-24, -128])} c={c} />
      <Ink d={line([-10, -130], [54, -132], [64, -44], [92, -44])} />
      <Ink d={line([6, -134], [62, -138], [74, -48], [100, -48])} />
      {SEATED[arms].map(([elbow, hand], i) => <Ink key={i} d={line([i ? -24 : 24, -226], elbow, hand)} />)}
      <Ink d={line([0, -250], [0, -232])} />
      <Ink d={circle(0, -276, 26)} />
      <path d="M -28 -280 Q -20 -310 6 -304 Q 30 -300 26 -278 Q 6 -296 -28 -280 Z" fill={INK} className="wb-fade" />
      <circle cx={-6} cy={-274} r={3.5} fill={INK} className="wb-fade" />
      <circle cx={12} cy={-274} r={3.5} fill={INK} className="wb-fade" />
      <Ink d="M -6 -262 Q 3 -255 12 -262" w={4} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// things
// ---------------------------------------------------------------------------

const Ball = ({ x, y, r = 30 }: { x: number; y: number; r?: number }) => (
  <g>
    <Wash d={circle(x, y, r)} c={ORANGE} op={0.55} />
    <Ink d={circle(x, y, r)} c={ORANGE} w={6} />
    <Ink d={`${line([x - r, y], [x + r, y])} M ${x} ${y - r} Q ${x - r * 0.6} ${y} ${x} ${y + r}`} c={ORANGE} w={4} />
  </g>
);

//a hoop on a pole; on a garage when the pole is short
const Hoop = ({ x, top = 220, pole = true }: { x: number; top?: number; pole?: boolean }) => (
  <g>
    {pole && <Ink d={line([x + 60, GROUND], [x + 60, top + 30], [x + 20, top + 30])} c={GRAY} w={10} />}
    <Ink d={rect(x - 70, top - 50, 120, 90)} />
    <Ink d={rect(x - 34, top - 6, 48, 34)} c={RED} w={5} />
    <Ink d={`M ${x - 46} ${top + 38} h 72`} c={ORANGE} w={8} />
    <Ink d={line([x - 44, top + 40], [x - 36, top + 92], [x - 24, top + 40], [x - 12, top + 92], [x, top + 40], [x + 12, top + 92], [x + 24, top + 40])} c={GRAY} w={3} />
  </g>
);

const Garage = ({ x }: { x: number }) => (
  <g>
    <Ink d={line([x - 260, GROUND], [x - 260, 330], [x, 190], [x + 260, 330], [x + 260, GROUND])} />
    <Ink d={rect(x - 170, 400, 340, GROUND - 400)} c={GRAY} />
    {[450, 500, 550].map((y) => <Ink key={y} d={line([x - 170, y], [x + 170, y])} c={GRAY} w={3} />)}
  </g>
);

const Sun = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Wash d={circle(x, y, 44)} c={ORANGE} op={0.4} />
    <Ink d={circle(x, y, 44)} c={ORANGE} w={5} />
    <Ink d={[0, 1, 2, 3, 4, 5, 6, 7].map((i) => line([x + Math.cos(i * 0.785) * 62, y + Math.sin(i * 0.785) * 62], [x + Math.cos(i * 0.785) * 86, y + Math.sin(i * 0.785) * 86])).join(' ')} c={ORANGE} w={5} />
  </g>
);

//a tape measure up beside someone, read off at the top
const Tape = ({ x, top, label }: { x: number; top: number; label: string }) => (
  <g>
    <Ink d={line([x, GROUND], [x, top])} c={ORANGE} w={8} />
    <Ink d={Array.from({ length: Math.floor((GROUND - top) / 30) }, (_, i) => line([x, GROUND - i * 30], [x + (i % 2 ? 14 : 24), GROUND - i * 30])).join(' ')} c={ORANGE} w={3} />
    <Ink d={line([x - 20, top], [x + 70, top])} c={ORANGE} w={5} />
    <Say x={x - 16} y={top - 16} text={label} size={46} c={ORANGE} anchor="end" />
  </g>
);

//a stair to step up and down, with the pulse it's taking
const Stair = ({ x }: { x: number }) => <Ink d={rect(x, GROUND - 60, 150, 60)} c={GRAY} />;
const Pulse = ({ x, y, c = RED }: { x: number; y: number; c?: string }) => (
  <g>
    <g className="wb-beat">
      <Wash d={`M ${x} ${y + 26} C ${x - 40} ${y} ${x - 34} ${y - 30} ${x} ${y - 10} C ${x + 34} ${y - 30} ${x + 40} ${y} ${x} ${y + 26} Z`} c={c} op={0.6} />
    </g>
    <Ink d={line([x + 50, y], [x + 90, y], [x + 106, y - 40], [x + 126, y + 36], [x + 142, y - 8], [x + 154, y], [x + 220, y])} c={c} w={5} />
  </g>
);

//a screen with the two-handed coordination game on it
const Screen = ({ x, y, good }: { x: number; y: number; good?: boolean }) => (
  <g>
    <Ink d={rect(x, y, 300, 190)} />
    <Ink d={line([x + 150, y + 190], [x + 150, y + 230]) + ' ' + line([x + 100, y + 230], [x + 200, y + 230])} />
    <Ink d={circle(x + 90, y + 95, 44) + ' ' + circle(x + 210, y + 95, 44)} c={GRAY} w={4} />
    <Ink d={good ? `${circle(x + 90, y + 51, 9)} ${circle(x + 210, y + 139, 9)}` : `${circle(x + 60, y + 30, 9)} ${circle(x + 262, y + 160, 9)}`} c={good ? GREEN : RED} w={6} />
    <Say x={x + 150} y={y - 18} text={good ? 'right on' : 'oops'} size={40} c={good ? GREEN : RED} />
  </g>
);

const Keys = ({ x, y }: { x: number; y: number }) => (
  <g>
    <Ink d={line([x - 10, y], [x + 330, y]) + ' ' + line([x + 20, y + 70], [x + 20, GROUND]) + ' ' + line([x + 300, y + 70], [x + 300, GROUND])} c={GRAY} />
    <Ink d={rect(x, y, 320, 70)} />
    <Ink d={Array.from({ length: 9 }, (_, i) => line([x + 32 + i * 32, y], [x + 32 + i * 32, y + 70])).join(' ')} w={3} />
    <path d={[0, 1, 3, 4, 5, 7, 8].map((i) => rect(x + 24 + i * 32, y, 16, 40)).join(' ')} fill={INK} className="wb-fade" />
  </g>
);

//music notes drifting up
const Notes = ({ x, y }: { x: number; y: number }) => (
  <g className="wb-drift">
    {[[0, 0], [70, -60], [140, -10]].map(([dx, dy]) => (
      <g key={dx}>
        <path d={circle(x + dx, y + dy, 13)} fill={BLUE} className="wb-fade" />
        <Ink d={line([x + dx + 12, y + dy], [x + dx + 12, y + dy - 60], [x + dx + 34, y + dy - 48])} c={BLUE} w={5} />
      </g>
    ))}
  </g>
);

const Target = ({ x, y, hit }: { x: number; y: number; hit?: boolean }) => (
  <g>
    <Ink d={line([x - 60, GROUND], [x, y + 120]) + ' ' + line([x + 60, GROUND], [x, y + 120])} c={GRAY} />
    {[120, 88, 56, 26].map((r, i) => (
      <g key={r}>
        <Wash d={circle(x, y, r)} c={[BLUE, RED, ORANGE, ORANGE][i]} op={0.25} />
        <Ink d={circle(x, y, r)} c={[BLUE, RED, ORANGE, ORANGE][i]} w={5} />
      </g>
    ))}
    {hit && <Ink d={line([x - 150, y - 30], [x - 4, y - 2]) + ' ' + line([x - 150, y - 30], [x - 170, y - 50]) + ' ' + line([x - 150, y - 30], [x - 176, y - 26])} w={5} />}
  </g>
);

//a bow in Daniel's hands, drawn when he's in the bow pose at x
const Bow = ({ x }: { x: number }) => <Ink d={`M ${x + 116} ${GROUND - 330} Q ${x + 170} ${GROUND - 232} ${x + 116} ${GROUND - 134} ${line([x + 116, GROUND - 330], [x + 6, GROUND - 246], [x + 116, GROUND - 134])}`} c={INK} w={4} />;

//a bouncing ball, for dribbling
const Bouncing = ({ x }: { x: number }) => (
  <g className="wb-bounce">
    <Ball x={x} y={GROUND - 30} r={26} />
  </g>
);

//the curve a shot takes, ending in the ball
const Shot = ({ from, to }: { from: Pt; to: Pt }) => (
  <g>
    <Ink d={`M ${from[0]} ${from[1]} Q ${(from[0] + to[0]) / 2} ${Math.min(from[1], to[1]) - 180} ${to[0]} ${to[1]}`} c={ORANGE} w={4} dash />
    <Ball x={to[0]} y={to[1]} r={26} />
  </g>
);

// ---------------------------------------------------------------------------
// cues: the board, and every part on it by key. Parts already up stay put; new ones draw on in order
// ---------------------------------------------------------------------------

const ANDREW = (pose = 'stand', x = 760) => part('andrew', <Person x={x} c={RED} pose={pose} s={1.22} wide={42} />);
const DANIEL = (arms = 'rest', x = 780) => part('daniel', <Rider x={x} c={BLUE} arms={arms} s={1.05} />);
const KID = (pose = 'stand', x = 760) => part('kid', <Person x={x} c={BLUE} pose={pose} s={0.68} wide={24} />);
const MARCUS = (pose = 'stand', x = 1060, s = 0.62) => part('marcus', <Person x={x} c={PURPLE} pose={pose} s={s} wide={24} hair="#5a3a22" flip />);
const NAME = (text: string, x: number, c: string) => part('name', <Say x={x} y={GROUND + 64} text={text} size={50} c={c} />);

const CUES: Record<string, Cue> = {
  title_card: {
    board: 'title',
    parts: [
      part('title', <Say x={800} y={230} text="Two Players" size={150} />),
      part('underline', <Ink d="M 470 262 Q 800 240 1130 262" c={ORANGE} w={9} />),
      part('andrew', <Person x={430} c={RED} pose="stand" s={1.1} wide={42} />),
      part('daniel', <Rider x={1110} c={BLUE} s={0.95} flip />),
      part('ball', <Ball x={800} y={460} r={40} />),
    ],
  },
  wondering: {
    board: 'wondering',
    parts: [
      part('you', <Person x={520} c={GRAY} pose="think" />),
      part('thought', <Thought x={980} y={270} r={250} from={[580, 300]}><Say x={980} y={260} text="Could I be good at that?" size={50} /><Say x={980} y={320} text="Really good?" size={40} c={GRAY} /></Thought>),
      part('q', <Question x={1300} y={560} c={GRAY} />),
    ],
  },
  two_silhouettes: {
    board: 'two',
    parts: [
      part('andrew', <Person x={560} c={RED} s={1.18} wide={42} />),
      part('daniel', <Rider x={1020} c={BLUE} flip />),
      part('q1', <Question x={560} y={200} c={RED} />),
      part('q2', <Question x={1030} y={200} c={BLUE} />),
    ],
  },
  andrew_intro: {
    board: 'andrew',
    parts: [ANDREW(), part('tape', <Tape x={600} top={GROUND - 366} label={'6\' 4"'} />), NAME('Andrew', 760, RED)],
  },
  andrew_asked: {
    board: 'andrew',
    parts: [
      ANDREW('shrug'),
      part('tape', <Tape x={600} top={GROUND - 366} label={'6\' 4"'} />),
      NAME('Andrew', 760, RED),
      part('b1', <Bubble x={940} y={140} w={430} text="What sport do you play?" tail={[880, 290]} c={GRAY} />),
      part('b2', <Bubble x={1000} y={300} w={360} text="Basketball, right?" tail={[880, 440]} c={GRAY} />),
      part('b3', <Bubble x={170} y={150} w={330} text="You play ball?" tail={[440, 280]} c={GRAY} />),
    ],
  },
  andrew_thinking: {
    board: 'andrew',
    parts: [
      ANDREW('think'),
      part('tape', <Tape x={600} top={GROUND - 366} label={'6\' 4"'} />),
      NAME('Andrew', 760, RED),
      part('thought', <Thought x={1140} y={250} r={200} from={[820, 250]}><Hoop x={1150} top={200} pole={false} /></Thought>),
    ],
  },
  daniel_catch: {
    board: 'young',
    parts: [
      KID('catch', 760),
      part('ball', <Ball x={812} y={380} r={24} />),
      part('lines', <Ink d="M 640 340 q 60 -20 120 20 M 620 390 q 70 -10 130 10" c={ORANGE} w={4} dash />),
      part('keys', <Ink d={`${circle(1040, 300, 18)} ${line([1056, 312], [1100, 344], [1092, 354]) + ' ' + line([1080, 334], [1072, 344])}`} c={GRAY} w={5} />),
      part('label', <Say x={760} y={GROUND + 64} text="Daniel, age 9" size={46} c={BLUE} />),
    ],
  },
  driveway: {
    board: 'driveway',
    parts: [
      part('garage', <Garage x={800} />),
      part('hoop', <Hoop x={800} top={270} pole={false} />),
      part('sun', <Sun x={1360} y={160} />),
      KID('shoot', 420),
      MARCUS('stand', 1180),
      part('shot', <Shot from={[420, GROUND - 236]} to={[770, 250]} />),
    ],
  },
  daniel_chair: { board: 'daniel', parts: [DANIEL(), NAME('Daniel', 780, BLUE)] },
  daniel_window: {
    board: 'daniel',
    parts: [DANIEL('think', 640), NAME('Daniel', 640, BLUE), part('window', <Window x={980} y={150} />), part('q', <Question x={800} y={240} c={GRAY} size={80} />)],
  },
  driveway_hoop: {
    board: 'driveway2',
    parts: [part('garage', <Garage x={900} />), part('hoop', <Hoop x={900} top={270} pole={false} />), DANIEL('wave', 560), MARCUS('stand', 1240, 1), part('ball', <Ball x={1196} y={GROUND - 120} r={28} />)],
  },
  both_hoop: {
    board: 'both',
    parts: [part('hoop', <Hoop x={790} top={200} />), part('andrew', <Person x={460} c={RED} s={1.18} wide={42} />), part('daniel', <Rider x={1140} c={BLUE} flip />), part('q1', <Question x={460} y={180} c={RED} />), part('q2', <Question x={1150} y={180} c={BLUE} />)],
  },
  andrew_measure: {
    board: 'andrew_tests',
    parts: [ANDREW('stand', 420), part('tape', <Tape x={260} top={GROUND - 366} label={'6\' 4"'} />), part('bars', <Bars x={700} y={200} rows={[['Strength', 0.86, 0.5], ['Power', 0.82, 0.5]]} />)],
  },
  andrew_step: {
    board: 'andrew_tests',
    parts: [ANDREW('step', 420), part('stair', <Stair x={430} />), part('pulse', <Pulse x={820} y={240} />, true), part('timer', <Say x={1180} y={420} text="3:00" size={90} c={RED} />), part('sweat', <Ink d="M 520 230 q 8 16 0 22 q -8 -6 0 -22 M 330 250 q 8 16 0 22 q -8 -6 0 -22" c={BLUE} w={4} />)],
  },
  andrew_games: {
    board: 'andrew_tests',
    parts: [ANDREW('fumble', 420), part('screen', <Screen x={820} y={180} />), part('label', <Say x={970} y={540} text="33 out of 100" size={44} c={RED} />)],
  },
  andrew_match: {
    board: 'andrew_match',
    parts: [ANDREW('shrug', 330), part('bars', <Bars x={620} y={170} rows={[['Strength', 0.86, 0.7], ['Stamina', 0.24, 0.7], ['Coordination', 0.36, 0.7]]} />), part('label', <Say x={1000} y={130} text="Andrew vs. Basketball" size={46} c={RED} />)],
  },
  andrew_plan: {
    board: 'andrew_plan',
    parts: [ANDREW('think', 330), part('list', <List x={660} y={190} items={['Run, 3 times a week', 'Footwork drills', 'Dribbling, 20 min a night']} />), part('label', <Say x={660} y={140} text="The plan" size={56} c={RED} anchor="start" />)],
  },
  andrew_training: {
    board: 'andrew_plan',
    parts: [ANDREW('dribble', 520), part('ball', <Bouncing x={610} />, true), part('list', <List x={900} y={190} items={['Run, 3 times a week', 'Footwork drills', 'Dribbling, 20 min a night']} done={3} />), part('moon', <Ink d="M 1400 120 a 50 50 0 1 0 40 90 a 40 40 0 1 1 -40 -90 Z" c={GRAY} w={5} />)],
  },
  andrew_retest: {
    board: 'andrew_retest',
    parts: [ANDREW('cheer', 300), part('stair', <Stair x={390} />), part('bars', <Bars x={620} y={170} rows={[['Strength', 0.86, 0.7], ['Stamina', 0.56, 0.7], ['Coordination', 0.48, 0.7]]} />), part('label', <Say x={1000} y={130} text="Three months later" size={46} c={RED} />)],
  },
  andrew_court: {
    board: 'andrew_court',
    parts: [part('hoop', <Hoop x={1150} top={200} />), ANDREW('shoot', 560), part('shot', <Shot from={[560, GROUND - 420]} to={[1100, 250]} />), part('label', <Say x={560} y={GROUND + 64} text="not there yet" size={46} c={RED} />)],
  },
  daniel_note: {
    board: 'daniel_tests',
    parts: [DANIEL('rest', 380), part('card', <Card x={720} y={170} w={560} title="What I live with" lines={['Paraplegia']} c={BLUE} />)],
  },
  daniel_basketball_reach: {
    board: 'daniel_tests',
    parts: [DANIEL('rest', 380), part('card', <Card x={720} y={150} w={560} title="Basketball" lines={['Running', 'Jumping', 'Legs']} />), part('flags', <Ink d="M 1010 260 h 220 M 1010 312 h 220 M 1010 364 h 220" c={RED} w={6} dash />)],
  },
  daniel_games: {
    board: 'daniel_games',
    parts: [DANIEL('play', 420), part('screen', <Screen x={760} y={180} good />), part('s1', <Spark x={1160} y={170} />, true), part('s2', <Spark x={720} y={140} s={0.7} />, true)],
  },
  daniel_results: {
    board: 'daniel_games',
    parts: [DANIEL('rest', 330), part('bars', <Bars x={620} y={170} rows={[['Fingers', 0.94, 0.5], ['Steady hands', 0.91, 0.5], ['Reactions', 0.86, 0.5]]} />), part('label', <Say x={1000} y={130} text="Scores out of 100" size={46} c={GREEN} />)],
  },
  daniel_lit: {
    board: 'daniel_lit',
    parts: [DANIEL('cheer', 780), part('s1', <Spark x={560} y={200} />, true), part('s2', <Spark x={1040} y={170} c={BLUE} />, true), part('s3', <Spark x={1120} y={420} s={0.7} />, true), part('bang', <Say x={790} y={200} text="!" size={140} c={BLUE} />)],
  },
  daniel_piano: {
    board: 'daniel_after',
    parts: [part('keys', <Keys x={720} y={GROUND - 210} />), DANIEL('play', 600), MARCUS('stand', 1240, 1), part('notes', <Notes x={900} y={260} />, true)],
  },
  daniel_range: {
    board: 'daniel_range',
    parts: [DANIEL('bow', 420), part('bow', <Bow x={420 + 0} />), part('target', <Target x={1200} y={330} hit />), part('label', <Say x={420} y={GROUND + 64} text="Saturdays" size={46} c={BLUE} />)],
  },
  two_lit: {
    board: 'two_lit',
    parts: [part('andrew', <Person x={480} c={RED} pose="cheer" s={1.18} wide={42} />), part('daniel', <Rider x={1100} c={BLUE} arms="cheer" flip />), part('s1', <Spark x={300} y={170} />, true), part('s2', <Spark x={800} y={240} c={GREEN} />, true), part('s3', <Spark x={1300} y={170} c={BLUE} />, true)],
  },
  your_turn: {
    board: 'yours',
    parts: [
      part('you', <Person x={800} c={GREEN} pose="cheer" />),
      part('tape', <Tape x={380} top={260} label="Size" />),
      part('screen', <Screen x={1040} y={170} good />),
      part('title', <Say x={800} y={150} text="Your turn" size={90} c={GREEN} />),
    ],
  },
};
const FIRST_CUE = 'title_card';

//the whiteboard behind the story
function Whiteboard({ animation }: { animation?: string }) {
  return <Marker cues={CUES} first={FIRST_CUE} animation={animation} story="Two Players" />;
}

export default Whiteboard;

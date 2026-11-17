import { type ReactNode } from 'react';
import { BLUE, circle, GRAY, GREEN, HAND, INK, line, ORANGE, type Pt, rect, RED, shape } from '../../shared_components/story/ink';
import { Fill, Ink, Say } from '../motion_marks';

// The pictures of Spot the Problem. Each is drawn in a box 400 wide and 260 tall, as it is or with one thing wrong
// with it, and knows where that thing is, as boxes a tap inside counts as finding it.

export const W = 400;
export const H = 260;

export type Box = [number, number, number, number]; //x, y, width, height

export interface Scene {
  name: string;
  draw: (wrong: boolean) => ReactNode;
  where: Box[]; //where the problem is, when there is one
  problem: string; //what it is, said after a practice one and in how it was scored
}

const PAPER = '#fff';
const WOOD = '#c98b5a';
const SKY = '#dbe9f4';

//a card of lines of writing, on the left
const card = (x: number, y: number, w: number, h: number, children: ReactNode) => (
  <g>
    <Fill d={rect(x, y, w, h)} c={PAPER} op={1} />
    <Ink d={rect(x, y, w, h)} w={3} />
    {children}
  </g>
);

//a gear: flat-topped teeth around a ring, one pointing at an angle. Gears mesh when their teeth are the same size, which
//is when their teeth are in proportion to their radii, they're their two radii apart, and a tooth of one faces a gap
//of the other
const TOOTH = 6; //how far a tooth stands out from the ring a gear turns on, and a gap goes in
function gear(cx: number, cy: number, r: number, teeth: number, toothAt: number) {
  const each = (Math.PI * 2) / teeth;
  const at = (a: number, rr: number): Pt => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  const pts = Array.from({ length: teeth }, (_, k) => toothAt + k * each).flatMap((c) => [
    at(c - 0.32 * each, r - TOOTH),
    at(c - 0.14 * each, r + TOOTH),
    at(c + 0.14 * each, r + TOOTH),
    at(c + 0.32 * each, r - TOOTH),
  ]);
  return shape(...pts);
}

const fence: Scene = {
  name: 'A fence',
  problem: 'A picket is missing',
  where: [[180, 104, 38, 122]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(0, 220, W, 40)} c={GREEN} op={0.25} />
      <Ink d={line([30, 150], [370, 150]) + line([30, 195], [370, 195])} c={WOOD} w={6} />
      {Array.from({ length: 11 }, (_, i) => 40 + i * 30)
        .filter((_, i) => !(wrong && i === 5))
        .map((x) => (
          <g key={x}>
            <Fill d={shape([x, 220], [x, 125], [x + 9, 112], [x + 18, 125], [x + 18, 220])} c={WOOD} op={0.8} />
            <Ink d={shape([x, 220], [x, 125], [x + 9, 112], [x + 18, 125], [x + 18, 220])} w={2.5} />
          </g>
        ))}
      <Ink d={line([0, 220], [W, 220])} w={3} />
    </g>
  ),
};

const door: Scene = {
  name: 'A door',
  problem: 'The handle is right at the top, out of reach',
  where: [[233, 26, 32, 32]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(0, 0, W, 232)} c={SKY} op={0.6} />
      <Fill d={rect(140, 30, 120, 202)} c={WOOD} op={0.85} />
      <Ink d={rect(140, 30, 120, 202)} w={3} />
      <Ink d={rect(162, 48, 76, 70) + rect(162, 136, 76, 80)} w={2} op={0.6} />
      <Fill d={rect(136, 58, 8, 24) + rect(136, 182, 8, 24)} c={GRAY} op={1} />
      <circle cx={249} cy={wrong ? 42 : 127} r={6} fill={ORANGE} stroke={INK} strokeWidth={2.5} />
      <Ink d={line([0, 232], [W, 232])} w={3} />
    </g>
  ),
};

const bike: Scene = {
  name: 'A bike',
  problem: 'There is no chain, so the pedals would turn nothing',
  where: [[110, 145, 100, 50]],
  draw: (wrong) => (
    <g>
      <Ink d={circle(120, 170, 50) + circle(290, 170, 50)} w={5} />
      <Ink d={circle(120, 170, 4) + circle(290, 170, 4)} w={3} />
      <Ink d={line([120, 170], [175, 95], [190, 170], [120, 170]) + line([175, 95], [270, 95], [190, 170]) + line([270, 95], [290, 170])} c={RED} w={5} />
      <Ink d={line([270, 95], [266, 76], [286, 72]) + line([175, 95], [171, 84]) + line([158, 84], [186, 84])} w={5} />
      <Ink d={circle(190, 170, 13) + circle(120, 170, 8)} w={3} />
      {!wrong && <Ink d={line([190, 157], [120, 162]) + line([190, 183], [120, 178])} c={GRAY} w={3} />}
      <Ink d={line([190, 170], [202, 192])} w={4} />
      <Ink d={line([194, 194], [212, 190])} w={5} />
      <Ink d={line([40, 222], [370, 222])} w={2} op={0.5} />
    </g>
  ),
};

const table: Scene = {
  name: 'A table',
  problem: 'One leg is too short to reach the floor, so the table would tip',
  where: [[270, 150, 50, 75]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(90, 106, 220, 14)} c={WOOD} op={0.9} />
      <Ink d={rect(90, 106, 220, 14)} w={3} />
      <Ink d={line([108, 120], [108, 220])} w={8} />
      <Ink d={line([292, 120], [292, wrong ? 192 : 220])} w={8} />
      <Fill d={shape([186, 106], [180, 70], [192, 52], [208, 52], [220, 70], [214, 106])} c={BLUE} op={0.5} />
      <Ink d={shape([186, 106], [180, 70], [192, 52], [208, 52], [220, 70], [214, 106])} w={3} />
      <Ink d={line([40, 222], [360, 222])} w={3} />
    </g>
  ),
};

//the numbers round a clock face, the 4 missing when it's wrong
export const clockAt = (n: number): Pt => [200 + 82 * Math.sin((n * Math.PI) / 6), 130 - 82 * Math.cos((n * Math.PI) / 6)];
//a hand from the middle toward a number, part of the way there
const hand = (n: number, share: number): Pt => {
  const [x, y] = clockAt(n);
  return [200 + (x - 200) * share, 130 + (y - 130) * share];
};
export const clock: Scene = {
  name: 'A clock',
  problem: 'The 4 is missing',
  where: [[clockAt(4)[0] - 22, clockAt(4)[1] - 22, 44, 44]],
  draw: (wrong) => (
    <g>
      <Fill d={circle(200, 130, 108)} c={PAPER} op={1} />
      <Ink d={circle(200, 130, 108)} w={5} />
      {Array.from({ length: 12 }, (_, i) => i + 1)
        .filter((n) => !(wrong && n === 4))
        .map((n) => {
          const [x, y] = clockAt(n);
          return <Say key={n} x={x} y={y + 8} text={`${n}`} size={24} />;
        })}
      <Ink d={line([200, 130], hand(10, 0.55))} w={6} />
      <Ink d={line([200, 130], hand(2, 0.85))} w={4} />
      <Fill d={circle(200, 130, 6)} c={INK} op={1} />
    </g>
  ),
};

//three gears in a row, the same size of tooth: 12 on the big ones and 9 on the small one in the middle
const BIG = { r: 50, teeth: 12 };
const SMALL = { r: 37.5, teeth: 9 };
const gears: Scene = {
  name: 'Three gears',
  problem: 'The last gear doesn\'t touch the middle one, so turning the others wouldn\'t turn it',
  where: [[234, 80, 40, 100]],
  draw: (wrong) => {
    const first = 110;
    const middle = first + BIG.r + SMALL.r + 1;
    const last = wrong ? middle + 122 : middle + SMALL.r + BIG.r + 1;
    //a tooth of the first points right, at the middle one, which has a gap there; the middle one's tooth on its other
    //side meets a gap in the last
    const shown: [number, typeof BIG, number, string][] = [
      [first, BIG, 0, ORANGE],
      [middle, SMALL, Math.PI + Math.PI / SMALL.teeth, BLUE],
      [last, BIG, Math.PI + Math.PI / BIG.teeth, GREEN],
    ];
    return (
      <g>
        {shown.map(([x, g, toothAt, c]) => (
          <g key={c}>
            <Fill d={gear(x, 130, g.r, g.teeth, toothAt)} c={c} op={0.5} />
            <Ink d={gear(x, 130, g.r, g.teeth, toothAt)} w={3} />
            <Fill d={circle(x, 130, 7)} c={INK} op={1} />
          </g>
        ))}
      </g>
    );
  },
};

const glass: Scene = {
  name: 'A glass on a table',
  problem: 'The glass is half over the edge and about to fall',
  where: [[256, 104, 88, 96]],
  draw: (wrong) => {
    const x = wrong ? 300 : 170;
    return (
      <g>
        <Fill d={rect(20, 180, 280, 12)} c={WOOD} op={0.9} />
        <Ink d={rect(20, 180, 280, 12)} w={3} />
        <Ink d={line([40, 192], [40, 250]) + line([280, 192], [280, 250])} w={7} />
        <Fill d={shape([x - 22, 118], [x - 16, 180], [x + 16, 180], [x + 22, 118])} c={SKY} op={0.6} />
        <Fill d={shape([x - 20, 135], [x - 16, 180], [x + 16, 180], [x + 20, 135])} c={BLUE} op={0.4} />
        <Ink d={line([x - 22, 118], [x - 16, 180], [x + 16, 180], [x + 22, 118])} w={3} />
      </g>
    );
  },
};

const day: Scene = {
  name: 'A day\'s plans',
  problem: 'The haircut ends before it starts',
  where: [[66, 182, 268, 28]],
  draw: (wrong) => (
    card(60, 14, 280, 226, <>
      <Say x={200} y={46} text="Tuesday" size={24} />
      {[
        ['9:00 - 10:00', 'Dentist'],
        ['10:30 - 11:00', 'Call with Sam'],
        ['12:00 - 13:00', 'Lunch with Ana'],
        [wrong ? '16:00 - 15:00' : '15:00 - 16:00', 'Haircut'],
      ].map(([when, what], i) => (
        <g key={what}>
          <Say x={76} y={92 + i * 36} text={when} size={18} anchor="start" c={BLUE} />
          <Say x={196} y={92 + i * 36} text={what} size={18} anchor="start" />
        </g>
      ))}
    </>)
  ),
};

const snowman: Scene = {
  name: 'A snowman',
  problem: 'The thermometer says 30 degrees, far too warm for snow',
  where: [[266, 30, 72, 205]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(0, 0, W, 232)} c={SKY} op={0.7} />
      {[
        [40, 30],
        [90, 60],
        [210, 40],
        [240, 120],
        [60, 140],
        [200, 190],
        [350, 30],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={3} fill="#fff" />
      ))}
      <Fill d={rect(0, 232, W, 28)} c="#fff" op={1} />
      <Ink d={line([0, 232], [W, 232])} w={2} op={0.4} />
      {(
        [
          [130, 196, 38],
          [130, 134, 28],
          [130, 88, 20],
        ] as const
      ).map(([x, y, r]) => (
        <g key={y}>
          <Fill d={circle(x, y, r)} c="#fff" op={1} />
          <Ink d={circle(x, y, r)} w={3} />
        </g>
      ))}
      <Fill d={shape([130, 90], [152, 94], [130, 96])} c={ORANGE} op={1} />
      <circle cx={123} cy={84} r={2.5} fill={INK} />
      <circle cx={137} cy={84} r={2.5} fill={INK} />
      <Fill d={rect(280, 40, 20, 170)} c="#fff" op={1} />
      <Ink d={rect(280, 40, 20, 170)} w={3} />
      <Fill d={rect(285, wrong ? 70 : 166, 10, wrong ? 148 : 52)} c={RED} op={0.9} />
      <Fill d={circle(290, 214, 16)} c={RED} op={1} />
      <Ink d={circle(290, 214, 16)} w={3} />
      {[30, 20, 10, 0].map((t, i) => (
        <Say key={t} x={306} y={76 + i * 30} text={`${t}`} size={16} anchor="start" />
      ))}
    </g>
  ),
};

const stairs: Scene = {
  name: 'Some stairs',
  problem: 'A step is missing',
  where: [[172, 100, 52, 132]],
  draw: (wrong) => (
    <g>
      {Array.from({ length: 6 }, (_, i) => i)
        .filter((i) => !(wrong && i === 3))
        .map((i) => {
          const x = 40 + i * 45;
          const y = 230 - (i + 1) * 30;
          return (
            <g key={i}>
              <Fill d={rect(x, y, 45, (i + 1) * 30)} c={GRAY} op={0.35} />
              <Ink d={rect(x, y, 45, (i + 1) * 30)} w={3} />
            </g>
          );
        })}
      <Ink d={line([20, 230], [380, 230])} w={3} />
    </g>
  ),
};

const car: Scene = {
  name: 'A car',
  problem: 'The back tire is flat',
  where: [[96, 150, 70, 60]],
  draw: (wrong) => (
    <g>
      <Fill d={shape([80, 170], [80, 125], [130, 120], [165, 84], [255, 84], [290, 120], [320, 128], [320, 170])} c={RED} op={0.7} />
      <Ink d={shape([80, 170], [80, 125], [130, 120], [165, 84], [255, 84], [290, 120], [320, 128], [320, 170])} w={3} />
      <Fill d={shape([142, 120], [170, 92], [205, 92], [205, 120]) + shape([215, 120], [215, 92], [250, 92], [276, 120])} c={SKY} op={1} />
      <Ink d={shape([142, 120], [170, 92], [205, 92], [205, 120]) + shape([215, 120], [215, 92], [250, 92], [276, 120])} w={2.5} />
      {wrong ? (
        <g>
          <ellipse cx={130} cy={186} rx={30} ry={14} fill={INK} />
          <circle cx={130} cy={182} r={6} fill={GRAY} />
        </g>
      ) : (
        <g>
          <circle cx={130} cy={175} r={25} fill={INK} />
          <circle cx={130} cy={175} r={9} fill={GRAY} />
        </g>
      )}
      <circle cx={270} cy={175} r={25} fill={INK} />
      <circle cx={270} cy={175} r={9} fill={GRAY} />
      <Ink d={line([30, 200], [370, 200])} w={3} />
    </g>
  ),
};

//books on a shelf, by their spines; the fifth is upside down when it's wrong
const BOOKS = [
  { title: 'Atlas', w: 34, h: 150, c: BLUE },
  { title: 'Birds', w: 30, h: 130, c: GREEN },
  { title: 'Maps', w: 38, h: 160, c: ORANGE },
  { title: 'Poems', w: 30, h: 120, c: RED },
  { title: 'Clocks', w: 36, h: 145, c: BLUE },
  { title: 'Ships', w: 32, h: 135, c: GREEN },
  { title: 'Trees', w: 34, h: 155, c: ORANGE },
  { title: 'Stars', w: 30, h: 125, c: RED },
];
const SHELF = 210;
const bookX = (i: number) => 66 + BOOKS.slice(0, i).reduce((s, b) => s + b.w + 4, 0);
const books: Scene = {
  name: 'A bookshelf',
  problem: 'One book is upside down',
  where: [[bookX(4) - 4, SHELF - 150, BOOKS[4].w + 8, 150]],
  draw: (wrong) => (
    <g>
      {BOOKS.map((b, i) => {
        const x = bookX(i);
        const flip = wrong && i === 4;
        return (
          <g key={b.title}>
            <Fill d={rect(x, SHELF - b.h, b.w, b.h)} c={b.c} op={0.55} />
            <Ink d={rect(x, SHELF - b.h, b.w, b.h)} w={2.5} />
            <text
              x={0}
              y={0}
              transform={`translate(${x + b.w / 2 + (flip ? -6 : 6)} ${SHELF - b.h / 2}) rotate(${flip ? 90 : -90})`}
              textAnchor="middle"
              fontSize={17}
              fill={INK}
              fontFamily={HAND}
            >
              {b.title}
            </text>
          </g>
        );
      })}
      <Fill d={rect(40, SHELF, 320, 12)} c={WOOD} op={0.9} />
      <Ink d={rect(40, SHELF, 320, 12)} w={3} />
    </g>
  ),
};

const lights: Scene = {
  name: 'Traffic lights',
  problem: 'The amber light is dead',
  where: [[174, 84, 52, 52]],
  draw: (wrong) => (
    <g>
      <Ink d={line([200, 200], [200, 250])} w={10} />
      <Fill d={rect(168, 20, 64, 180)} c={INK} op={1} />
      {[RED, wrong ? '#4a4f55' : ORANGE, GREEN].map((c, i) => (
        <circle key={i} cx={200} cy={52 + i * 58} r={21} fill={c} />
      ))}
    </g>
  ),
};


//an umbrella's canopy, scalloped along its edge
const CANOPY = 'M 100 130 Q 200 20 300 130 Q 275 114 250 130 Q 225 114 200 130 Q 175 114 150 130 Q 125 114 100 130 Z';
const umbrella: Scene = {
  name: 'An umbrella in the rain',
  problem: 'There is a hole in the umbrella, and the rain is coming through it',
  where: [[226, 76, 48, 136]],
  draw: (wrong) => (
    <g>
      {[60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 75, 135, 195, 255, 315].map((x, i) => {
        const y = i < 10 ? 20 + (i % 3) * 18 : 50;
        return <Ink key={i} d={line([x, y], [x - 4, y + 12])} c={BLUE} w={2.5} />;
      })}
      {[40, 70, 340, 365].map((x, i) => (
        <Ink key={`s${i}`} d={line([x, 140 + (i % 2) * 40], [x - 4, 152 + (i % 2) * 40])} c={BLUE} w={2.5} />
      ))}
      <Fill d={CANOPY} c={RED} op={0.75} />
      <Ink d={CANOPY} w={3} />
      {wrong && (
        <g>
          <ellipse cx={250} cy={94} rx={11} ry={7} fill="#fbfbf6" stroke={INK} strokeWidth={2.5} />
          {[150, 172, 194].map((y, i) => (
            <Ink key={y} d={line([248 + (i % 2) * 4, y - 12], [246 + (i % 2) * 4, y])} c={BLUE} w={2.5} />
          ))}
        </g>
      )}
      <Ink d={line([200, 56], [200, 212]) + ' M 200 212 q 0 14 -12 14 q -10 0 -10 -10'} w={5} />
      <Ink d={line([20, 240], [380, 240])} w={2} op={0.4} />
    </g>
  ),
};

//a fish, facing left, its middle at a point
const fish = (x: number, y: number, c: string, flat = false) => (
  <g transform={`translate(${x} ${y})${flat ? ' rotate(90)' : ''}`}>
    <Fill d={shape([12, 0], [24, -9], [24, 9])} c={c} op={0.9} />
    <ellipse cx={0} cy={0} rx={15} ry={9} fill={c} stroke={INK} strokeWidth={2.5} />
    <Ink d={shape([12, 0], [24, -9], [24, 9])} w={2.5} />
    <circle cx={-7} cy={-2} r={2} fill={INK} />
  </g>
);
//a round bowl sitting on the table, the water inside it up to below the rim, drawn from the bowl's own circle
const BOWL = { x: 170, y: 130, r: 70, rim: 81, water: 103 };
const across = (r: number, y: number) => Math.sqrt(r * r - (y - BOWL.y) ** 2); //half the bowl's width at a height
const fishbowl: Scene = {
  name: 'A fishbowl',
  problem: 'A fish is out of the bowl, lying on the table',
  where: [[272, 168, 56, 40]],
  draw: (wrong) => {
    const rim = across(BOWL.r, BOWL.rim);
    const inner = BOWL.r - 3;
    const surface = across(inner, BOWL.water);
    return (
      <g>
        <Fill d={rect(30, 200, 340, 12)} c={WOOD} op={0.9} />
        <Ink d={rect(30, 200, 340, 12)} w={3} />
        <Fill d={`M ${BOWL.x - surface} ${BOWL.water} A ${inner} ${inner} 0 1 0 ${BOWL.x + surface} ${BOWL.water} Z`} c={BLUE} op={0.3} />
        <Ink d={line([BOWL.x - surface, BOWL.water], [BOWL.x + surface, BOWL.water])} c={BLUE} w={2} />
        <Ink d={`M ${BOWL.x - rim} ${BOWL.rim} A ${BOWL.r} ${BOWL.r} 0 1 0 ${BOWL.x + rim} ${BOWL.rim}`} w={3} />
        {fish(150, 152, ORANGE)}
        {wrong ? <g transform="translate(300 190) scale(1 0.9)">{fish(0, 0, ORANGE)}</g> : fish(195, 128, ORANGE)}
      </g>
    );
  },
};

const lamp: Scene = {
  name: 'A lamp',
  problem: 'The cord is worn through, with bare wire showing',
  where: [[208, 200, 48, 44]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(0, 0, W, 230)} c={SKY} op={0.5} />
      <Ink d={line([0, 230], [W, 230])} w={3} />
      <Fill d={shape([70, 60], [130, 60], [145, 110], [55, 110])} c="#f2c84b" op={0.9} />
      <Ink d={shape([70, 60], [130, 60], [145, 110], [55, 110])} w={3} />
      <Ink d={line([100, 110], [100, 214])} w={5} />
      <Fill d={rect(76, 214, 48, 12)} c={GRAY} op={1} />
      <Ink d={rect(76, 214, 48, 12)} w={3} />
      <Fill d={rect(340, 176, 30, 40)} c="#fff" op={1} />
      <Ink d={rect(340, 176, 30, 40)} w={3} />
      <Fill d={rect(326, 188, 16, 16)} c={INK} op={1} />
      {wrong ? (
        <g>
          <Ink d={line([124, 222], [222, 222])} w={5} />
          <Ink d={line([242, 222], [300, 222], [318, 196], [326, 196])} w={5} />
          <Ink d={'M 222 222 q 5 -8 10 0 t 10 0'} c={ORANGE} w={2.5} />
          <Ink d={'M 222 222 q 5 8 10 0 t 10 0'} c={ORANGE} w={2.5} />
        </g>
      ) : (
        <Ink d={line([124, 222], [300, 222], [318, 196], [326, 196])} w={5} />
      )}
    </g>
  ),
};

//a pan on a hob, side on, the handle over the worktop or sticking out past its edge
const pan: Scene = {
  name: 'A pan on the stove',
  problem: 'The pan\'s handle sticks out past the edge, where it could be knocked',
  where: [[262, 112, 110, 34]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(20, 150, 300, 90)} c="#fff" op={1} />
      <Ink d={rect(20, 150, 300, 90)} w={3} />
      <Fill d={rect(14, 140, 312, 12)} c={GRAY} op={0.7} />
      <Ink d={rect(14, 140, 312, 12)} w={3} />
      {[180, 200, 220, 240].map((x) => (
        <Fill key={x} d={shape([x - 6, 140], [x, 128], [x + 6, 140])} c={ORANGE} op={0.9} />
      ))}
      <Fill d={rect(170, 92, 80, 34)} c={GRAY} op={0.9} />
      <Ink d={rect(170, 92, 80, 34)} w={3} />
      <Ink d={wrong ? line([250, 104], [360, 104]) : line([170, 104], [80, 104])} w={7} />
      {[195, 215, 235].map((x) => (
        <Ink key={x} d={`M ${x} 84 q -6 -10 0 -20 t 0 -20`} c={GRAY} w={2.5} />
      ))}
    </g>
  ),
};

const bridge: Scene = {
  name: 'A bridge',
  problem: 'There is a gap in the middle of the bridge',
  where: [[174, 128, 52, 46]],
  draw: (wrong) => (
    <g>
      <Fill d={rect(0, 190, W, 70)} c={BLUE} op={0.35} />
      <Ink d="M 0 210 q 25 -8 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0" c={BLUE} w={2} />
      <Fill d={shape([0, 150], [90, 150], [120, 260], [0, 260])} c={GREEN} op={0.45} />
      <Fill d={shape([310, 150], [400, 150], [400, 260], [280, 260])} c={GREEN} op={0.45} />
      <Ink d={line([150, 162], [150, 220]) + line([250, 162], [250, 220])} w={8} />
      {(wrong ? [[90, 185], [215, 310]] : [[90, 310]]).map(([a, b]) => (
        <g key={a}>
          <Fill d={rect(a, 150, b - a, 12)} c={WOOD} op={0.9} />
          <Ink d={rect(a, 150, b - a, 12)} w={3} />
          <Ink d={line([a, 132], [b, 132])} w={3} />
          {Array.from({ length: Math.floor((b - a) / 20) + 1 }, (_, k) => a + k * 20).map((x) => (
            <Ink key={x} d={line([x, 132], [x, 150])} w={2} />
          ))}
        </g>
      ))}
    </g>
  ),
};

const recipe: Scene = {
  name: 'A recipe',
  problem: 'Pancakes cook for a couple of minutes a side, not 2 hours',
  where: [[24, 186, 352, 28]],
  draw: (wrong) => (
    card(20, 14, 360, 226, <>
      <Say x={200} y={46} text="Pancakes, for 4" size={24} />
      <Say x={36} y={86} text="You need 2 eggs, a cup of flour" size={18} anchor="start" c={BLUE} />
      <Say x={36} y={108} text="and a cup of milk." size={18} anchor="start" c={BLUE} />
      <Say x={36} y={148} text="1. Beat the 2 eggs in a bowl." size={18} anchor="start" />
      <Say x={36} y={176} text="2. Whisk in the flour and milk." size={18} anchor="start" />
      <Say x={36} y={204} text={`3. Cook for 2 ${wrong ? 'hours' : 'minutes'} a side.`} size={18} anchor="start" />
    </>)
  ),
};

//the two to practice on, one wrong and one fine, then the ones that count, in order, and whether each is wrong. About
//a third are fine, so pointing at something every time doesn't pay
export const PRACTICE: [Scene, boolean][] = [
  [fence, true],
  [door, false],
];
export const ITEMS: [Scene, boolean][] = [
  [umbrella, true],
  [bike, false],
  [table, true],
  [clock, true],
  [gears, false],
  [glass, true],
  [day, true],
  [snowman, false],
  [stairs, true],
  [car, false],
  [books, true],
  [fishbowl, true],
  [lights, false],
  [lamp, true],
  [bridge, true],
  [pan, false],
  [recipe, true],
];

//whether a tap at a point is on the problem
export const onIt = (scene: Scene, [x, y]: Pt) => scene.where.some(([bx, by, bw, bh]) => x >= bx && x <= bx + bw && y >= by && y <= by + bh);

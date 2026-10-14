const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const paleBlue = 'var(--pale-blue)';
const skin = 'var(--pale-cinnamon)';

const Limb = ({ d }: { d: string }) => (
  <>
    <path d={d} fill="none" strokeWidth="15" />
    <path d={d} fill="none" style={{ stroke: skin }} strokeWidth="9.5" />
  </>
);

//Atlas as the interviewer: sat on the world, leaning in with rapt attention and holding a microphone out to whoever's
//on his right. Every so often he leans in further and nods along
export function Interviewer({ size = 150 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="-4 18 152 131" style={{ overflow: 'visible' }} aria-hidden>
      <g style={{ stroke: gunmetal }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-2 147 L146 147" fill="none" strokeWidth="2" opacity="0.4" />
        <circle cx="44" cy="124" r="22" style={{ fill: paleBlue }} />
        <path d="M30 114 C36 108 44 114 40 122 C36 128 28 122 30 114Z M44 130 C50 126 58 132 54 140 C50 144 42 138 44 130Z" style={{ fill: blue }} stroke="none" />
        <ellipse cx="44" cy="124" rx="22" ry="6.5" fill="none" strokeWidth="2" />

        <Limb d="M44 104 L62 107 L62 125 L69 127" />
        <Limb d="M56 104 L74 104 L77 122 L85 123" />
        <path d="M64 128 L71 130 M80 124 L89 125" fill="none" style={{ stroke: cinnamon }} strokeWidth="3.5" />
        {/* the skirt drapes over his lap, so it stays with his legs rather than leaning with him */}
        <path d="M33 88 L67 88 L67 94 C72 97 76 100 76 104 L74 112 Q52 117 30 112 L32 94Z" style={{ fill: ivory }} />
        <path d="M43 97 L40 113 M50 97 L50 114 M58 97 L62 113 M68 100 L70 110" fill="none" strokeWidth="2" />

        <g transform="translate(3 -3)">
          <g className="interview-lean">
            <g className="interview-mic">
              <Limb d="M72 68 C88 64 100 56 108 46" />
              <path d="M109 46 L119 34" fill="none" strokeWidth="7" />
              <path d="M109 46 L119 34" fill="none" style={{ stroke: brownRed }} strokeWidth="3" />
              <circle cx="122" cy="30" r="7.5" style={{ fill: '#c9ced1' }} />
              <path d="M116 28 L128 28 M117 32.5 L127 32.5 M122 23 V37" fill="none" strokeWidth="1.2" />
              <circle cx="108" cy="46" r="5.5" style={{ fill: skin }} />
            </g>
            <path d="M23 66 C23 80 33 90 37 94 L63 94 C67 90 77 80 77 66 C64 58 36 58 23 66 Z" style={{ fill: skin }} />
            <path d="M52 73 C58 77 66 76 72 71" fill="none" strokeWidth="2" />
            <path d="M24 66 L40 62 L66 92 L52 94 Z" style={{ fill: ivory }} />
            <path d="M36 92 L64 92" fill="none" style={{ stroke: brownRed }} strokeWidth="4" />
            <Limb d="M28 68 C14 80 18 96 32 100" />
            <circle cx="34" cy="100" r="5.5" style={{ fill: skin }} />

            <g className="interview-nod">
              <circle cx="50" cy="59" r="11" style={{ fill: skin }} />
              <path d="M39 56 C36 43 64 43 61 56 C56 51 44 51 39 56 Z" style={{ fill: cinnamon }} />
              <path d="M39 59 C39 77 61 77 61 59 C57 69 43 69 39 59 Z" style={{ fill: cinnamon }} />
              <path d="M40 51 C46 48 54 48 60 51" fill="none" style={{ stroke: brownRed }} strokeWidth="3" />
              <path d="M42 52 C44 50 47 50 48 51 M53 51 C54 50 57 50 59 52" fill="none" strokeWidth="2.2" />
              <g className="comic-blink" style={{ fill: gunmetal, stroke: 'none' }}>
                <ellipse cx="46" cy="57.5" rx="2.4" ry="3.6" />
                <ellipse cx="56" cy="57.5" rx="2.4" ry="3.6" />
              </g>
              <ellipse cx="51" cy="64.5" rx="2.6" ry="2.4" style={{ fill: brownRed }} strokeWidth="2" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

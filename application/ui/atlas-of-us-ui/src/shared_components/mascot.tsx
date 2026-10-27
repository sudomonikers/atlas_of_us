const blue = 'var(--air-force-blue)';
const cinnamon = 'var(--cinnamon-wood)';
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const paleBlue = 'var(--pale-blue)';
const skin = 'var(--pale-cinnamon)';
const ivory = 'var(--ivory-white)';

const LEGS = 'M40 100 L40 116 L20 116 M60 100 L82 96 L83 116';

//an ink stroke with a thinner skin stroke on top, so it reads as an outlined limb
const Limb = ({ d }: { d: string }) => (
  <>
    <path d={d} fill="none" strokeWidth="15" />
    <path d={d} fill="none" style={{ stroke: skin }} strokeWidth="9.5" />
  </>
);

//Atlas, the titan who holds up the world, and the guide who greets the user. Every so often he takes a hand off
//the globe to wipe the sweat from his brow
export function Mascot({ size = 96 }: { size?: number }) {
  //flex: none, so a speech bubble beside him in a flex row never squeezes him
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" style={{ flex: 'none' }} aria-hidden>
      {/* colours go through style rather than fill/stroke attributes so the css variables resolve */}
      <g style={{ stroke: gunmetal }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 18 L16 21 M6 30 L14 30 M92 18 L84 21 M94 30 L86 30" fill="none" strokeWidth="2.5" />
        {/* the world, with its colour bleeding past the outline */}
        <g className="atlas-globe">
          <circle cx="50" cy="24" r="20" style={{ fill: blue, stroke: 'none' }} transform="translate(3 3)" opacity="0.75" />
          <circle cx="50" cy="24" r="20" style={{ fill: paleBlue }} />
          <path d="M36 14 C42 10 48 16 44 22 C40 26 34 22 36 14 Z M54 26 C60 22 66 28 62 34 C58 38 52 32 54 26 Z" style={{ fill: blue, stroke: 'none' }} />
          <ellipse cx="50" cy="24" rx="20" ry="6" fill="none" strokeWidth="2" />
          <ellipse cx="50" cy="24" rx="8" ry="20" fill="none" strokeWidth="2" />
        </g>
        <Limb d="M28 68 C13 58 20 44 36 38" />
        <circle cx="36" cy="38" r="5.5" style={{ fill: skin }} />
        <g className="atlas-hold">
          <Limb d="M72 68 C87 58 80 44 64 38" />
          <circle cx="64" cy="38" r="5.5" style={{ fill: skin }} />
        </g>
        {/* kneeling on one knee, the other foot planted */}
        <path d="M10 119 L90 119" fill="none" strokeWidth="2" opacity="0.4" />
        <Limb d={LEGS} />
        <path d="M14 117 L21 117 M78 117 L89 117" fill="none" style={{ stroke: cinnamon }} strokeWidth="3.5" />
        {/* broad chest, a toga over one shoulder and a pleated skirt */}
        <path d="M23 66 C23 80 33 90 37 94 L63 94 C67 90 77 80 77 66 C64 58 36 58 23 66 Z" style={{ fill: skin }} />
        <path d="M52 73 C58 77 66 76 72 71" fill="none" strokeWidth="2" />
        <path d="M24 66 L40 62 L66 92 L52 94 Z" style={{ fill: ivory }} />
        <path d="M35 93 L65 93 L68 105 L32 105 Z" style={{ fill: ivory }} />
        <path d="M43 94 L41 104 M50 94 L50 104 M57 94 L59 104" fill="none" strokeWidth="2" />
        <path d="M36 92 L64 92" fill="none" style={{ stroke: brownRed }} strokeWidth="4" />
        {/* head, curly hair and beard */}
        <circle cx="50" cy="59" r="11" style={{ fill: skin }} />
        <path d="M39 56 C36 43 64 43 61 56 C56 51 44 51 39 56 Z" style={{ fill: cinnamon }} />
        <path d="M39 59 C39 77 61 77 61 59 C57 69 43 69 39 59 Z" style={{ fill: cinnamon }} />
        <path d="M40 51 C46 48 54 48 60 51" fill="none" style={{ stroke: brownRed }} strokeWidth="3" />
        {/* determined face */}
        <path d="M42 54 L47 55.5 M58 54 L53 55.5" fill="none" strokeWidth="2.5" />
        <g className="comic-blink" style={{ fill: gunmetal, stroke: 'none' }}>
          <ellipse cx="45" cy="59" rx="2" ry="3" />
          <ellipse cx="55" cy="59" rx="2" ry="3" />
        </g>
        <path d="M45 63.5 C48 65.5 52 65.5 55 63.5" fill="none" strokeWidth="2.5" />
        <path className="atlas-sweat" d="M64 47 C61.5 51 62 53 64 53 C66 53 66.5 51 64 47 Z" style={{ fill: paleBlue }} strokeWidth="1.5" />
        <g className="atlas-wipe">
          <Limb d="M76 68 C92 60 84 48 64 52" />
          <circle cx="64" cy="52" r="5.5" style={{ fill: skin }} />
        </g>
      </g>
    </svg>
  );
}

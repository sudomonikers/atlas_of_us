import type { CSSProperties } from 'react';
import { brownRed, gunmetal, ivory } from '../shared_components/palette';

//the sound waves either side of the speaker, as arcs around the woofer, nearest first
const WAVES = [66, 88, 110].map((r) => {
  const x = Math.round(r * Math.cos(Math.PI / 5));
  const y = Math.round(r * Math.sin(Math.PI / 5));
  return { r, x, y };
});

//a loudspeaker for the tests played through headphones, booming while the sound plays: the woofer pumps, the cabinet
//shakes and waves ripple out, from both sides or from one ear's side (1 for the right, -1 for the left)
export function Speaker({ booming, side = 0, style }: { booming: boolean; side?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 260 204" style={{ ...speakerStyle, ...style }} aria-hidden="true">
      {booming &&
        WAVES.map(({ r, x, y }, i) => (
          <g key={r} className="speaker-wave" style={{ animationDelay: `${i * 0.25}s` }}>
            {side >= 0 && <path d={`M${130 + x} ${126 - y} A${r} ${r} 0 0 1 ${130 + x} ${126 + y}`} />}
            {side <= 0 && <path d={`M${130 - x} ${126 - y} A${r} ${r} 0 0 0 ${130 - x} ${126 + y}`} />}
          </g>
        ))}
      <g className={booming ? 'speaker-shake' : undefined}>
        <rect x={86} y={18} width={100} height={176} rx={12} fill={gunmetal} />
        <rect x={80} y={12} width={100} height={176} rx={12} fill={ivory} stroke={gunmetal} strokeWidth={4} />
        <rect x={92} y={186} width={16} height={10} rx={2} fill={gunmetal} />
        <rect x={152} y={186} width={16} height={10} rx={2} fill={gunmetal} />
        <circle cx={130} cy={52} r={17} fill="#fff" stroke={gunmetal} strokeWidth={4} />
        <circle cx={130} cy={52} r={7} fill={gunmetal} />
        <circle cx={130} cy={126} r={42} fill="#fff" stroke={gunmetal} strokeWidth={4} />
        <g className={booming ? 'speaker-cone' : undefined}>
          <circle cx={130} cy={126} r={31} fill={brownRed} stroke={gunmetal} strokeWidth={4} />
          <circle cx={130} cy={126} r={12} fill={gunmetal} />
          <circle cx={126} cy={122} r={3.5} fill={ivory} />
        </g>
      </g>
    </svg>
  );
}

const speakerStyle: CSSProperties = {
  width: 'min(100%, 300px)',
  height: 'auto',
  overflow: 'visible',
};

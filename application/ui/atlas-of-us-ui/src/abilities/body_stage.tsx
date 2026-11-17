import { Suspense, lazy, useCallback, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { LAYERS, toggled, useShowing, type LayerId } from './anatomy_layers';
import { type Body, type Light } from './body_parts';
import { Thinking } from '../shared_components/thinking';
import { brownRed, gunmetal, ivory } from '../shared_components/palette';

//the 3D body, loaded with three.js only when it shows
const AnatomyViewer = lazy(() => import('./anatomy_viewer').then((m) => ({ default: m.AnatomyViewer })));

//the buttons along the bottom of the 3D body that turn its layers on and off
export function LayerButtons({ showing, loading, onToggle, style }: { showing: Set<LayerId>; loading: boolean; onToggle: (id: LayerId) => void; style?: CSSProperties }) {
  return (
    <div style={{ ...styles.layers, ...style }} role="group" aria-label="Layers">
      {LAYERS.map((l) => (
        <button key={l.id} className="comic-lift" style={showing.has(l.id) ? { ...styles.layer, ...styles.layerOn } : styles.layer} aria-pressed={showing.has(l.id)} onClick={() => onToggle(l.id)}>
          {l.label}
        </button>
      ))}
      {loading && <span style={styles.small}>Loading...</span>}
    </div>
  );
}

interface BodyStageProps {
  body: Body;
  layers: LayerId[]; //the layers showing to begin with
  noted?: Set<string>; //the meshes with something the user has noted, which blush
  onPick?: (element: string) => void; //a mesh clicked
  panel: (onLight: (light: Light) => void) => ReactNode; //what sits beside the body, lighting parts of it up
}

//the 3D body framed on the page, to turn around and click, with a panel beside it that lights parts of it up. The panel
//drops underneath on narrow screens
export default function BodyStage({ body, layers: initial, noted, onPick, panel }: BodyStageProps) {
  const [layers, setLayers] = useState<Set<LayerId>>(() => new Set(initial));
  const [light, setLight] = useState<Light>({});
  const [loading, setLoading] = useState(false);

  const lit = useMemo(() => light.lit ?? new Set<string>(), [light.lit]);
  const tints = useMemo(() => light.tints ?? new Map<string, number>(), [light.tints]);
  const none = useMemo(() => new Set<string>(), []);
  const showing = useShowing(layers, lit, body.meshes);
  const onLight = useCallback((l: Light) => setLight(l), []);

  return (
    <div style={styles.stage}>
      <div style={styles.viewer}>
        <Suspense fallback={<Thinking label="Building the body" />}>
          <AnatomyViewer layers={showing} lit={lit} noted={noted ?? none} tints={tints} focus={lit} spin={false} pulse={!!light.pulse} onPick={onPick} onLoading={setLoading} />
        </Suspense>
        <LayerButtons showing={showing} loading={loading} onToggle={(id) => setLayers((current) => toggled(current, id))} style={styles.inset} />
      </div>
      <aside style={styles.side}>
        <div style={styles.panel}>{panel(onLight)}</div>
      </aside>
    </div>
  );
}

//as tall as the screen allows, under the page's header
const HEIGHT = 'clamp(420px, calc(100vh - 160px), 900px)';

const styles: Record<string, CSSProperties> = {
  stage: {
    width: '100%',
    maxWidth: 1400,
    margin: '0 auto 36px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 22,
  },
  viewer: {
    flex: '1 1 480px',
    minWidth: 0,
    height: HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    background: `radial-gradient(rgba(106, 142, 174, 0.22) 1.6px, transparent 1.8px) 0 0 / 14px 14px, ${ivory}`,
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    boxShadow: `4px 5px 0 ${gunmetal}`,
  },
  side: {
    flex: '1 1 340px',
    maxWidth: '100%',
    maxHeight: HEIGHT,
    overflowY: 'auto',
    padding: '0 8px 8px 0', //room for the card's shadow inside the scrolling side
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: '20px 22px',
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    border: `3px solid ${gunmetal}`,
    boxShadow: `4px 5px 0 ${gunmetal}`,
  },
  layers: {
    position: 'absolute',
    left: 0,
    bottom: 10,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'none',
  },
  //the layer buttons inside the framed body, off its edge
  inset: {
    left: 12,
  },
  layer: {
    padding: '2px 10px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 13,
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  layerOn: {
    background: brownRed,
    color: ivory,
  },
  small: {
    margin: 0,
    fontSize: 13,
  },
};

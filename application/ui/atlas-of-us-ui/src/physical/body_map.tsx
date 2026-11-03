import { Suspense, lazy, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { getAnatomy, getConditions, getImpairments, getMeasurements, getPart, partName, type Conditions, type Impairment, type Impairments, type Measurement, type Part, type PartSummary } from './api';
import { LAYERS, getMeshIndex, type LayerId, type MeshIndex } from './anatomy_layers';
import { ImpairmentForm } from './impairment_form';
import { PartPanel } from './part_panel';
import { AtlasError } from '../shared_components/atlas-error';
import { SearchField } from '../shared_components/search_field';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the 3D body, loaded with three.js only when this view opens
const AnatomyViewer = lazy(() => import('./anatomy_viewer').then((m) => ({ default: m.AnatomyViewer })));

//the most search results shown at once
const MAX_RESULTS = 20;
//FMA's whole body, whose parts are the systems and regions
const HUMAN_BODY = 'FMA20394';

//every part above a part, through the wholes it belongs to
function above(id: string, byId: Map<string, PartSummary>): Set<string> {
  const found = new Set<string>();
  const todo = [...(byId.get(id)?.wholes ?? [])];
  while (todo.length) {
    const next = todo.pop()!;
    if (found.has(next)) continue;
    found.add(next);
    todo.push(...(byId.get(next)?.wholes ?? []));
  }
  return found;
}

//a 3D body to explore and learn from: turn it, pick any part to light it up and read all about it, switch layers, or
//pick a whole system
export default function BodyMap() {
  const [anatomy, setAnatomy] = useState<PartSummary[]>();
  const [meshes, setMeshes] = useState<MeshIndex>();
  const [impairments, setImpairments] = useState<Impairments>();
  const [conditions, setConditions] = useState<Conditions>();
  const [measurements, setMeasurements] = useState<Map<string, Measurement>>();
  const [version, setVersion] = useState(0); //goes up when the user notes something, so the open part reloads
  const [error, setError] = useState<string>();
  const [layers, setLayers] = useState<Set<LayerId>>(new Set(['skeleton', 'organs']));
  const [selected, setSelected] = useState<string>(); //the id of the part picked
  const [lit, setLit] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [noting, setNoting] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const failed = (e: unknown) => setError(e instanceof Error ? e.message : String(e));
    getAnatomy().then(setAnatomy, failed);
    getMeshIndex().then(setMeshes, failed);
    getImpairments().then(setImpairments, failed);
    getConditions().then(setConditions, failed);
    getMeasurements().then((m) => setMeasurements(new Map(m.measurements.map((x) => [x.id, x]))), failed);
  }, []);

  const byId = useMemo(() => new Map((anatomy ?? []).map((p) => [p.id, p])), [anatomy]);
  const byFma = useMemo(() => new Map((anatomy ?? []).map((p) => [p.fma_id, p])), [anatomy]);

  //the meshes of every part the user has noted something in, or of any part within one
  const noted = useMemo(() => {
    const ids = new Set<string>([
      ...(impairments?.impairments.map((i) => i.id) ?? []),
      ...(conditions?.mine.flatMap((m) => conditions.conditions.find((c) => c.id === m.id)?.parts.map((p) => p.id) ?? []) ?? []),
    ]);
    if (!ids.size || !meshes) return new Set<string>();
    return new Set(Object.entries(meshes).filter(([, [fma]]) => {
      const part = byFma.get(fma);
      return part && (ids.has(part.id) || [...above(part.id, byId)].some((a) => ids.has(a)));
    }).map(([element]) => element));
  }, [impairments, conditions, meshes, byId, byFma]);

  //lights up the meshes a part is drawn with, or those of the nearest drawn part it belongs to, and shows their layers
  const lightUp = useCallback((part: Part) => {
    const show = (elements: string[]) => {
      setLit(new Set(elements));
      if (!meshes) return;
      const needed = new Set(elements.map((e) => meshes[e]?.[1]).filter((l): l is LayerId => !!l));
      setLayers((current) => ([...needed].some((l) => current.has(l)) ? current : new Set([...current, ...needed])));
    };
    if (part.elements.length) return show(part.elements);
    const drawn = [...above(part.id, byId)].map((id) => byId.get(id)).find((p) => p?.drawn);
    if (drawn) getPart(drawn.id).then((whole) => show(whole.elements), () => setLit(new Set()));
    else setLit(new Set());
  }, [meshes, byId]);

  const pick = (id: string) => {
    setSelected(id);
    setNoting(false);
  };
  const pickMesh = (element: string) => {
    const fma = meshes?.[element]?.[0];
    const part = fma ? byFma.get(fma) : undefined;
    if (part) pick(part.id);
  };
  const toggleLayer = (id: LayerId) =>
    setLayers((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (error) return <AtlasError message={error} />;
  if (!anatomy || !meshes || !impairments || !conditions || !measurements) return <Thinking label="Building the body" />;

  const root = byFma.get(HUMAN_BODY);
  const systems = anatomy.filter((p) => root && p.wholes.includes(root.id));
  const picked = selected ? byId.get(selected) : undefined;
  const mine = new Map(impairments.impairments.map((i) => [i.id, i]));
  const myConditions = new Set(conditions.mine.map((m) => m.id));
  const saved = (impairment: Impairment) => {
    setImpairments({ ...impairments, impairments: [...impairments.impairments.filter((i) => i.id !== impairment.id), impairment] });
    setNoting(false);
    setVersion((v) => v + 1);
  };

  //every word of the search has to be in its name or another name for it
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = words.length
    ? anatomy.filter((p) => {
        const text = [p.name, ...p.synonyms].join(' ').toLowerCase();
        return words.every((w) => text.includes(w));
      })
    : [];

  return (
    <>
      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Explore the body</h2>
        <p style={styles.text}>
          Drag to turn the body, scroll or pinch to zoom, and click any part to light it up and learn about it. Show the
          layers you want, pick a whole system, or search for a part by name. Parts in pink have something you've noted.
        </p>
        <div style={styles.chips} role="group" aria-label="Layers">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              className="comic-lift"
              style={layers.has(l.id) ? { ...styles.chip, ...styles.chipOn } : styles.chip}
              aria-pressed={layers.has(l.id)}
              onClick={() => toggleLayer(l.id)}
            >
              {l.label}
            </button>
          ))}
          {loading && <span style={styles.small}>Loading...</span>}
        </div>

        <div style={styles.zone}>
          <div style={styles.viewer}>
            <Suspense fallback={<Thinking label="Building the body" />}>
              <AnatomyViewer layers={layers} lit={lit} noted={noted} onPick={pickMesh} onLoading={setLoading} />
            </Suspense>
          </div>
          <div style={styles.side}>
            {picked ? (
              noting ? (
                <ImpairmentForm part={{ id: picked.id, name: partName(picked.name) }} structure impairment={mine.get(picked.id) ?? null} onSaved={saved} onCancel={() => setNoting(false)} />
              ) : (
                <PartPanel key={`${picked.id}-${version}`} id={picked.id} myConditions={myConditions} measurements={measurements} onLoaded={lightUp} onPick={pick} onNote={() => setNoting(true)} />
              )
            ) : (
              <p style={styles.text}>Nothing picked yet. Try clicking the heart, or pick a system below.</p>
            )}
          </div>
        </div>
      </section>

      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Systems and regions</h2>
        <div style={styles.chips}>
          {systems.map((s) => (
            <button key={s.id} className="comic-lift" style={selected === s.id ? { ...styles.chip, ...styles.chipOn } : styles.chip} onClick={() => pick(s.id)}>
              {partName(s.name)}
            </button>
          ))}
        </div>
        <h2 style={styles.heading}>Find a part</h2>
        <SearchField id="anatomy-search" query={query} onQuery={setQuery} placeholder="Femur, retina, biceps, vagus nerve..." />
        {words.length > 0 && !results.length && <p style={styles.text}>Nothing by that name. Try another word.</p>}
        <div style={styles.chips}>
          {results.slice(0, MAX_RESULTS).map((p) => (
            <button key={p.id} className="comic-lift" style={styles.part} onClick={() => pick(p.id)}>
              {partName(p.name)}
            </button>
          ))}
        </div>
        {results.length > MAX_RESULTS && <p style={styles.small}>And {results.length - MAX_RESULTS} more. Add a word to narrow it down.</p>}
      </section>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    maxWidth: 1100,
    margin: '0 auto 36px',
    padding: '22px 26px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: '#fff',
    borderRadius: 'var(--wobbly)',
    '--panel-fill': 'var(--pale-cinnamon)',
    '--tilt': '0.3deg',
  } as CSSProperties,
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 28,
    letterSpacing: 1,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  small: {
    margin: 0,
    fontSize: 13,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    padding: '4px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  chipOn: {
    background: brownRed,
    color: ivory,
  },
  //the body beside what's picked; what's picked drops underneath on narrow screens
  zone: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 24,
  },
  viewer: {
    flex: '1 1 380px',
    minWidth: 0,
    border: `3px solid ${gunmetal}`,
    borderRadius: 16,
    background: 'radial-gradient(circle at 50% 40%, #fff, var(--pale-blue))',
    overflow: 'hidden',
  },
  side: {
    flex: '1 1 340px',
    minWidth: 0,
    maxHeight: 'min(70vh, 620px)',
    overflowY: 'auto',
  },
  part: {
    padding: '2px 10px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    font: 'inherit',
    fontSize: 14,
    textAlign: 'left',
    cursor: 'pointer',
  },
};

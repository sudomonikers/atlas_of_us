import { useEffect, useState, type CSSProperties } from 'react';
import {
  EXTENTS,
  SEVERITIES,
  conditionName,
  getConditions,
  getImpairments,
  type BodyPart,
  type Conditions,
  type Impairment,
  type Impairments,
} from './api';
import { BodyFigure } from './body_figure';
import { REGIONS, regionOf, type RegionId } from './body_regions';
import { ImpairmentForm } from './impairment_form';
import { AtlasError } from '../shared_components/atlas-error';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

const LABELS = Object.fromEntries(REGIONS.map((r) => [r.id, r.label])) as Record<RegionId, string>;

//the body, drawn: pick a region to see the impairments and conditions in it, and to note an impairment in one of its
//structures
export default function BodyMap() {
  const [impairments, setImpairments] = useState<Impairments>();
  const [conditions, setConditions] = useState<Conditions>();
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<RegionId | null>(null);
  const [editing, setEditing] = useState<string>(); //the id of the structure being noted

  useEffect(() => {
    const failed = (e: unknown) => setError(e instanceof Error ? e.message : String(e));
    getImpairments().then(setImpairments, failed);
    getConditions().then(setConditions, failed);
  }, []);

  if (error) return <AtlasError message={error} />;
  if (!impairments || !conditions) return <Thinking label="Drawing the body" />;

  const structures = new Map(impairments.structures.map((s) => [s.id, s]));
  const mine = new Map(impairments.impairments.map((i) => [i.id, i]));
  const conditionsById = new Map(conditions.conditions.map((c) => [c.id, c]));
  //what the user has noted in each region: impairments in its structures, and conditions affecting them
  const inRegion = (region: RegionId) => ({
    structures: impairments.structures.filter((s) => regionOf(s.code) === region),
    impairments: impairments.impairments.filter((i) => {
      const s = structures.get(i.id);
      return s && regionOf(s.code) === region;
    }),
    conditions: conditions.mine.filter((m) => conditionsById.get(m.id)?.structures.some((s) => regionOf(s.code) === region)),
  });
  const noted = new Set(REGIONS.map((r) => r.id).filter((id) => {
    const here = inRegion(id);
    return here.impairments.length > 0 || here.conditions.length > 0;
  }));
  const saved = (impairment: Impairment) => {
    setImpairments({ ...impairments, impairments: [...impairments.impairments.filter((i) => i.id !== impairment.id), impairment] });
    setEditing(undefined);
  };
  const select = (region: RegionId) => {
    setSelected(region);
    setEditing(undefined);
  };
  const here = selected ? inRegion(selected) : null;
  const editingPart = editing ? structures.get(editing) : undefined;

  return (
    <>
      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Your body</h2>
        <p style={styles.text}>
          Pick a part of the body to see what you've noted there, or to note something new. Parts in red have something
          noted. Functions like memory or balance aren't in one place, so they're under Impairments.
        </p>
        <BodyFigure labels={LABELS} noted={noted} selected={selected} onSelect={select} />
        <div style={styles.regions} role="group" aria-label="Parts of the body">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              className="comic-lift"
              style={{ ...styles.regionButton, ...(noted.has(r.id) ? styles.regionNoted : {}), ...(selected === r.id ? styles.regionPicked : {}) }}
              aria-pressed={selected === r.id}
              onClick={() => select(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      {selected && here && (
        <section style={styles.panel} className="comic-panel comic-pop" aria-live="polite">
          <h2 style={styles.heading}>{LABELS[selected]}</h2>
          {editingPart ? (
            <ImpairmentForm part={editingPart} structure impairment={mine.get(editingPart.id) ?? null} onSaved={saved} onCancel={() => setEditing(undefined)} />
          ) : (
            <>
              <h3 style={styles.subheading}>What you've noted</h3>
              {!here.impairments.length && !here.conditions.length && <p style={styles.text}>Nothing here.</p>}
              <ul style={styles.list}>
                {here.impairments.map((i) => (
                  <li key={i.id} style={styles.item}>
                    <span style={styles.itemName}>{structures.get(i.id)!.name}</span>
                    <span style={styles.itemNote}>{EXTENTS.find((e) => e.value === i.extent)?.label} impairment</span>
                    <button className="comic-lift" style={styles.small} onClick={() => setEditing(i.id)}>
                      Change
                    </button>
                  </li>
                ))}
                {here.conditions.map((m) => {
                  const c = conditionsById.get(m.id)!;
                  return (
                    <li key={m.id} style={styles.item}>
                      <span style={styles.itemName}>{conditionName(c.name)}</span>
                      <span style={styles.itemNote}>{SEVERITIES.find((s) => s.value === m.severity)?.label ?? 'Noted'} condition</span>
                    </li>
                  );
                })}
              </ul>
              <h3 style={styles.subheading}>Note an impairment</h3>
              <div style={styles.parts}>
                {here.structures.map((s: BodyPart) => (
                  <button key={s.id} className="comic-lift" style={styles.part} onClick={() => setEditing(s.id)}>
                    {s.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <p style={styles.how}>
        Body structures come from the WHO's International Classification of Functioning, Disability and Health (ICF),
        © World Health Organization, used under CC BY-ND 3.0 IGO.
      </p>
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
  subheading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 20,
    letterSpacing: 1,
    color: brownRed,
  },
  text: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.45,
  },
  regions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  regionButton: {
    padding: '4px 12px',
    background: ivory,
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  regionNoted: {
    background: 'var(--pale-red)',
  },
  regionPicked: {
    background: brownRed,
    color: ivory,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 12px',
  },
  itemName: {
    fontFamily: comic,
    fontSize: 19,
    letterSpacing: 1,
    color: brownRed,
  },
  itemNote: {
    fontSize: 15,
  },
  small: {
    padding: '2px 12px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 14,
    cursor: 'pointer',
  },
  parts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
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
  how: {
    maxWidth: 1100,
    margin: '0 auto 16px',
    fontSize: 15,
    lineHeight: 1.5,
  },
};

import { useEffect, useState, type CSSProperties } from 'react';
import { CHANGES, EXTENTS, clearImpairment, getImpairments, type BodyPart, type Impairment, type Impairments as ImpairmentList } from './api';
import { ImpairmentForm } from './impairment_form';
import { PartPicker } from './part_picker';
import { AtlasError } from '../shared_components/atlas-error';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the user's impairments in body functions and structures, and a way to add more
export default function Impairments() {
  const [data, setData] = useState<ImpairmentList>();
  const [error, setError] = useState<string>();
  const [removeError, setRemoveError] = useState<string>();
  const [editing, setEditing] = useState<string>(); //the id of the function or structure being changed or added
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getImpairments().then(setData, (e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <AtlasError message={error} />;
  if (!data) return <Thinking label="Looking over the body" />;

  const parts = new Map<string, { part: BodyPart; structure: boolean }>([
    ...data.functions.map((part) => [part.id, { part, structure: false }] as const),
    ...data.structures.map((part) => [part.id, { part, structure: true }] as const),
  ]);
  const saved = (impairment: Impairment) => {
    setData({ ...data, impairments: [...data.impairments.filter((i) => i.id !== impairment.id), impairment] });
    setEditing(undefined);
    setAdding(false);
  };
  const remove = (id: string) => {
    setRemoveError(undefined);
    clearImpairment(id).then(
      () => setData({ ...data, impairments: data.impairments.filter((i) => i.id !== id) }),
      (e) => setRemoveError(e instanceof Error ? e.message : String(e)),
    );
  };
  const picked = editing && !data.impairments.some((i) => i.id === editing) ? parts.get(editing) : undefined;

  return (
    <>
      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Your impairments</h2>
        <p style={styles.text}>
          If part of your body or mind doesn't work as well as it might, from needing glasses to a bad knee, you can note it
          here and how much it holds you back. Only you can see it.
        </p>
        {!data.impairments.length && <p style={styles.text}>Nothing noted. If that's you, wonderful.</p>}
        {removeError && <AtlasError message={removeError} />}
        <div style={styles.grid}>
          {data.impairments.map((i) => {
            const found = parts.get(i.id);
            if (!found) return null;
            return editing === i.id ? (
              <ImpairmentForm key={i.id} part={found.part} structure={found.structure} impairment={i} onSaved={saved} onCancel={() => setEditing(undefined)} />
            ) : (
              <ImpairmentCard key={i.id} part={found.part} impairment={i} onEdit={() => setEditing(i.id)} onRemove={() => remove(i.id)} />
            );
          })}
        </div>
      </section>

      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Add one</h2>
        {picked ? (
          <ImpairmentForm part={picked.part} structure={picked.structure} impairment={null} onSaved={saved} onCancel={() => setEditing(undefined)} />
        ) : adding ? (
          <PartPicker functions={data.functions} structures={data.structures} onPick={(p) => setEditing(p.id)} />
        ) : (
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding(true)}>
            Find a body function or structure
          </button>
        )}
      </section>

      <p style={styles.how}>
        Body functions and structures come from the WHO's International Classification of Functioning, Disability and
        Health (ICF), © World Health Organization, used under CC BY-ND 3.0 IGO.
      </p>
    </>
  );
}

interface ImpairmentCardProps {
  part: BodyPart;
  impairment: Impairment;
  onEdit: () => void;
  onRemove: () => void;
}

//one impairment: what it's in, how much, and the abilities it holds back
function ImpairmentCard({ part, impairment, onEdit, onRemove }: ImpairmentCardProps) {
  const extent = EXTENTS.find((e) => e.value === impairment.extent);
  const change = CHANGES.find((c) => c.value === impairment.change);
  return (
    <article style={styles.card}>
      <h3 style={styles.name}>{part.name}</h3>
      <p style={styles.small}>{part.group}</p>
      <p style={styles.extent}>
        {extent?.label}
        {change && <span style={styles.change}> · {change.label}</span>}
      </p>
      {!!part.abilities.length && (
        <div style={styles.chips}>
          Can affect {part.abilities.map((a) => <span key={a} className="comic-chip">{a}</span>)}
        </div>
      )}
      <div style={styles.buttons}>
        <button className="comic-lift" style={styles.secondary} onClick={onEdit}>
          Change
        </button>
        <button className="comic-lift" style={styles.secondary} onClick={onRemove}>
          Remove
        </button>
      </div>
    </article>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 16,
    alignItems: 'start',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 16px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
    boxShadow: `3px 4px 0 ${gunmetal}`,
    minWidth: 0,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 22,
    letterSpacing: 1,
    color: brownRed,
  },
  small: {
    margin: 0,
    fontSize: 13,
  },
  extent: {
    margin: 0,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    color: 'var(--air-force-blue)',
  },
  change: {
    fontFamily: 'inherit',
    fontSize: 14,
    color: gunmetal,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  primary: {
    alignSelf: 'flex-start',
    padding: '4px 14px',
    background: brownRed,
    color: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  secondary: {
    padding: '4px 14px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    cursor: 'pointer',
  },
  how: {
    maxWidth: 1100,
    margin: '0 auto 16px',
    fontSize: 15,
    lineHeight: 1.5,
  },
};

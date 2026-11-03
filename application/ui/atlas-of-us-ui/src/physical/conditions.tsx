import { useEffect, useState, type CSSProperties } from 'react';
import { SEVERITIES, clearMyCondition, conditionName, getConditions, type Condition, type Conditions as ConditionList, type MyCondition } from './api';
import { ConditionForm } from './condition_form';
import { ConditionPicker } from './condition_picker';
import { AtlasError } from '../shared_components/atlas-error';
import { Thinking } from '../shared_components/thinking';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the user's conditions, and a way to add more
export default function Conditions() {
  const [data, setData] = useState<ConditionList>();
  const [error, setError] = useState<string>();
  const [removeError, setRemoveError] = useState<string>();
  const [editing, setEditing] = useState<string>(); //the id of the condition being changed or added
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getConditions().then(setData, (e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <AtlasError message={error} />;
  if (!data) return <Thinking label="Looking up conditions" />;

  const byId = new Map(data.conditions.map((c) => [c.id, c]));
  const saved = (mine: MyCondition) => {
    setData({ ...data, mine: [...data.mine.filter((m) => m.id !== mine.id), mine] });
    setEditing(undefined);
    setAdding(false);
  };
  const added = (condition: Condition) => {
    setData({ ...data, conditions: [...data.conditions.filter((c) => c.id !== condition.id), condition] });
    setEditing(condition.id);
  };
  const remove = (id: string) => {
    setRemoveError(undefined);
    clearMyCondition(id).then(
      () => setData({ ...data, mine: data.mine.filter((m) => m.id !== id) }),
      (e) => setRemoveError(e instanceof Error ? e.message : String(e)),
    );
  };
  const picked = editing && !data.mine.some((m) => m.id === editing) ? byId.get(editing) : undefined;

  return (
    <>
      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Your conditions</h2>
        <p style={styles.text}>
          Anything you've been diagnosed with or know you have, from asthma to being double-jointed. Only you can see it,
          and you can say how much it affects you.
        </p>
        {!data.mine.length && <p style={styles.text}>Nothing noted.</p>}
        {removeError && <AtlasError message={removeError} />}
        <div style={styles.grid}>
          {data.mine.map((m) => {
            const condition = byId.get(m.id);
            if (!condition) return null;
            return editing === m.id ? (
              <ConditionForm key={m.id} condition={condition} mine={m} onSaved={saved} onCancel={() => setEditing(undefined)} />
            ) : (
              <ConditionCard key={m.id} condition={condition} mine={m} onEdit={() => setEditing(m.id)} onRemove={() => remove(m.id)} />
            );
          })}
        </div>
      </section>

      <section style={styles.panel} className="comic-panel comic-pop">
        <h2 style={styles.heading}>Add one</h2>
        {picked ? (
          <ConditionForm condition={picked} mine={null} onSaved={saved} onCancel={() => setEditing(undefined)} />
        ) : adding ? (
          <ConditionPicker conditions={data.conditions} onPick={(c) => setEditing(c.id)} onAdded={added} />
        ) : (
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding(true)}>
            Find a condition
          </button>
        )}
      </section>

      <p style={styles.how}>
        Conditions come from the Mondo Disease Ontology, used under CC BY 4.0, and the Human Phenotype Ontology
        (hpo.jax.org).
      </p>
    </>
  );
}

interface ConditionCardProps {
  condition: Condition;
  mine: MyCondition;
  onEdit: () => void;
  onRemove: () => void;
}

//one condition: what they've said about it, and the parts of the body it affects
function ConditionCard({ condition, mine, onEdit, onRemove }: ConditionCardProps) {
  const severity = SEVERITIES.find((s) => s.value === mine.severity);
  const notes = [mine.diagnosed ? 'Diagnosed' : 'Not diagnosed', ...(mine.managed ? ['Under control'] : [])];
  const affects = [...condition.functions, ...condition.structures];
  return (
    <article style={styles.card}>
      <h3 style={styles.name}>{conditionName(condition.name)}</h3>
      <p style={styles.extent}>
        {severity?.label ?? 'Noted'}
        <span style={styles.notes}> · {notes.join(' · ')}</span>
      </p>
      {!!affects.length && (
        <div style={styles.chips}>
          Affects {affects.map((a) => <span key={a} className="comic-chip">{a}</span>)}
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
  extent: {
    margin: 0,
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    color: 'var(--air-force-blue)',
  },
  notes: {
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

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  CHANGES,
  EXTENTS,
  SEVERITIES,
  clearImpairment,
  clearMyCondition,
  capitalised,
  type Ability,
  type AffectedBy,
  type Condition,
  type Conditions,
  type Impairment,
  type Impairments,
  type MyCondition,
  type PartSummary,
} from './api';
import { meshesOf, notedParts, type Body, type Light } from './body_parts';
import { ConditionForm } from './condition_form';
import { ConditionPicker } from './condition_picker';
import { ImpairmentForm, type Impairable } from './impairment_form';
import { PartPicker } from './part_picker';
import { AtlasError } from '../shared_components/atlas-error';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//the colour of the parts an impairment or condition can reach through the abilities it can affect, as hex
const REACH = 0xa77464;

//something an impairment can be in, as the cards show it
interface Found {
  part: Impairable;
  structure: boolean; //whether it's a body part rather than a function
  group: string;
  personality: string[]; //the Big Five domains and traits it corresponds to, as "Extraversion" or "Low Neuroticism"
}

interface NotingProps {
  show: 'impairments' | 'conditions'; //which of the two lists
  impairments: Impairments;
  conditions: Conditions;
  anatomy: PartSummary[];
  abilities: Ability[];
  affectedBy: AffectedBy[];
  body: Body;
  onImpaired: (saved: Impairment, abilities: Ability[]) => void; //with the user's abilities, which impairments hold back
  onUnimpaired: (id: string, abilities: Ability[]) => void;
  onConditions: (data: Conditions) => void;
  onLight: (light: Light) => void;
}

//the user's impairments or conditions, and a way to add more. Picking one, or adding one, lights up where it sits in the
//body and tints the parts of the abilities it can affect, to show how far it reaches
export default function Noting({ show, impairments, conditions, anatomy, abilities, affectedBy, body, onImpaired, onUnimpaired, onConditions, onLight }: NotingProps) {
  const [selected, setSelected] = useState<string>(); //the function, part or condition shown on the body
  const [editing, setEditing] = useState<string>(); //the function, part or condition being changed or added
  const [adding, setAdding] = useState<'impairment' | 'condition'>();
  const [error, setError] = useState<string>();

  //the abilities each impairment and condition can affect
  const affects = useMemo(() => {
    const by = new Map<string, Ability[]>();
    for (const a of affectedBy) {
      const ability = abilities.find((x) => x.id === a.id);
      if (!ability) continue;
      for (const id of [...a.impairments.map((i) => i.id), ...a.conditions.map((c) => c.id)]) by.set(id, [...(by.get(id) ?? []), ability]);
    }
    return by;
  }, [affectedBy, abilities]);

  useEffect(() => {
    const parts = selected && notedParts(impairments, conditions).get(selected);
    if (!parts) return onLight({});
    const lit = meshesOf(body, parts);
    const reach = meshesOf(body, (affects.get(selected) ?? []).flatMap((a) => a.parts));
    onLight({ lit, tints: new Map([...reach].filter((e) => !lit.has(e)).map((e) => [e, REACH])), pulse: true });
  }, [selected, impairments, conditions, affects, body, onLight]);

  const found = new Map<string, Found>([
    ...impairments.functions.map((f): [string, Found] => [f.id, { part: f, structure: false, group: f.group, personality: f.personality.map((t) => `${t.opposite ? 'Low ' : ''}${t.name}`) }]),
    ...anatomy.map((p): [string, Found] => [p.id, { part: { id: p.id, name: capitalised(p.name) }, structure: true, group: 'Body part', personality: [] }]),
  ]);
  const byId = new Map(conditions.conditions.map((c) => [c.id, c]));
  const failed = (e: unknown) => setError(failure(e));
  const cancel = () => {
    setEditing(undefined);
    setAdding(undefined);
  };
  const done = (id: string) => {
    cancel();
    setSelected(id);
  };
  const savedImpairment = (impairment: Impairment, abilities: Ability[]) => {
    onImpaired(impairment, abilities);
    done(impairment.id);
  };
  const savedCondition = (mine: MyCondition) => {
    onConditions({ ...conditions, mine: [...conditions.mine.filter((m) => m.id !== mine.id), mine] });
    done(mine.id);
  };
  const addedCondition = (condition: Condition) => {
    onConditions({ ...conditions, conditions: [...conditions.conditions.filter((c) => c.id !== condition.id), condition] });
    setEditing(condition.id);
  };
  const removeImpairment = (id: string) => {
    setError(undefined);
    clearImpairment(id).then((abilities) => onUnimpaired(id, abilities), failed);
  };
  const removeCondition = (id: string) => {
    setError(undefined);
    clearMyCondition(id).then(() => onConditions({ ...conditions, mine: conditions.mine.filter((m) => m.id !== id) }), failed);
  };
  const toggle = (id: string) => setSelected(selected === id ? undefined : id);
  const newImpairment = editing && adding === 'impairment' ? found.get(editing) : undefined;
  const newCondition = editing && adding === 'condition' ? byId.get(editing) : undefined;

  return (
    <>
      {error && <AtlasError message={error} />}

      {show === 'impairments' && (
      <section style={styles.section}>
        {impairments.impairments.map((i) => {
          const f = found.get(i.id);
          if (!f) return null;
          return editing === i.id ? (
            <ImpairmentForm key={i.id} part={f.part} structure={f.structure} impairment={i} onSaved={savedImpairment} onCancel={() => setEditing(undefined)} />
          ) : (
            <ImpairmentCard
              key={i.id}
              found={f}
              impairment={i}
              affects={affects.get(i.id) ?? []}
              showing={selected === i.id}
              onShow={() => toggle(i.id)}
              onEdit={() => setEditing(i.id)}
              onRemove={() => removeImpairment(i.id)}
            />
          );
        })}
        {newImpairment ? (
          <ImpairmentForm part={newImpairment.part} structure={newImpairment.structure} impairment={null} onSaved={savedImpairment} onCancel={cancel} />
        ) : adding === 'impairment' ? (
          <PartPicker functions={impairments.functions} parts={anatomy} onPick={(p) => setEditing(p.item.id)} />
        ) : (
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding('impairment')}>
            Add an impairment
          </button>
        )}
      </section>
      )}

      {show === 'conditions' && (
      <section style={styles.section}>
        {conditions.mine.map((m) => {
          const condition = byId.get(m.id);
          if (!condition) return null;
          return editing === m.id && adding !== 'condition' ? (
            <ConditionForm key={m.id} condition={condition} mine={m} onSaved={savedCondition} onCancel={() => setEditing(undefined)} />
          ) : (
            <ConditionCard
              key={m.id}
              condition={condition}
              mine={m}
              affects={affects.get(m.id) ?? []}
              showing={selected === m.id}
              onShow={() => toggle(m.id)}
              onEdit={() => setEditing(m.id)}
              onRemove={() => removeCondition(m.id)}
            />
          );
        })}
        {newCondition ? (
          <ConditionForm condition={newCondition} mine={conditions.mine.find((m) => m.id === newCondition.id) ?? null} onSaved={savedCondition} onCancel={cancel} />
        ) : adding === 'condition' ? (
          <ConditionPicker conditions={conditions.conditions} onPick={(c) => setEditing(c.id)} onAdded={addedCondition} />
        ) : (
          <button className="comic-lift" style={styles.primary} onClick={() => setAdding('condition')}>
            Add a condition
          </button>
        )}
      </section>
      )}

      <p style={styles.how}>
        {show === 'impairments'
          ? "Only you can see these. Body functions come from the WHO's International Classification of Functioning, Disability and Health (ICF), © World Health Organization, used under CC BY-ND 3.0 IGO. Body parts come from the Foundational Model of Anatomy, used under CC BY 3.0."
          : 'Only you can see these. Conditions come from the Mondo Disease Ontology, used under CC BY 4.0, and the Human Phenotype Ontology (hpo.jax.org).'}
      </p>
    </>
  );
}

//the abilities something can affect, as chips
function Reaches({ affects }: { affects: Ability[] }) {
  return (
    !!affects.length && (
      <div style={styles.chips}>
        Can affect {affects.map((a) => <span key={a.id} className="comic-chip">{a.name}</span>)}
      </div>
    )
  );
}

interface CardActions {
  affects: Ability[];
  showing: boolean;
  onShow: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

//the buttons along the bottom of a card
function Actions({ showing, onShow, onEdit, onRemove }: Omit<CardActions, 'affects'>) {
  return (
    <div style={styles.buttons}>
      <button className="comic-lift" style={showing ? { ...styles.secondary, ...styles.showing } : styles.secondary} aria-pressed={showing} onClick={onShow}>
        {showing ? 'Showing on the body' : 'Show on the body'}
      </button>
      <button className="comic-lift" style={styles.secondary} onClick={onEdit}>
        Change
      </button>
      <button className="comic-lift" style={styles.secondary} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

//one impairment: what it's in, how much, the abilities it can affect, and what it is in the Big Five
function ImpairmentCard({ found, impairment, affects, ...actions }: CardActions & { found: Found; impairment: Impairment }) {
  const { part, group, personality } = found;
  const extent = EXTENTS.find((e) => e.value === impairment.extent);
  const change = CHANGES.find((c) => c.value === impairment.change);
  return (
    <article style={actions.showing ? { ...styles.card, ...styles.cardShowing } : styles.card}>
      <h3 style={styles.name}>{part.name}</h3>
      <p style={styles.small}>{group}</p>
      <p style={styles.extent}>
        {extent?.label}
        {change && <span style={styles.notes}> · {change.label}</span>}
      </p>
      <Reaches affects={affects} />
      {!!personality.length && (
        <div style={styles.chips}>
          In the Big Five {personality.map((t) => <span key={t} className="comic-chip">{t}</span>)}
        </div>
      )}
      <Actions {...actions} />
    </article>
  );
}

//one condition: what they've said about it, the parts of the body it affects, and the abilities it can affect
function ConditionCard({ condition, mine, affects, ...actions }: CardActions & { condition: Condition; mine: MyCondition }) {
  const severity = SEVERITIES.find((s) => s.value === mine.severity);
  const notes = [mine.diagnosed ? 'Diagnosed' : 'Not diagnosed', ...(mine.managed ? ['Under control'] : [])];
  const parts = [...condition.functions.map((f) => ({ key: f.code, name: f.name })), ...condition.parts.map((p) => ({ key: p.id, name: capitalised(p.name) }))];
  return (
    <article style={actions.showing ? { ...styles.card, ...styles.cardShowing } : styles.card}>
      <h3 style={styles.name}>{capitalised(condition.name)}</h3>
      <p style={styles.extent}>
        {severity?.label ?? 'Noted'}
        <span style={styles.notes}> · {notes.join(' · ')}</span>
      </p>
      {!!parts.length && (
        <div style={styles.chips}>
          Affects {parts.map((p) => <span key={p.key} className="comic-chip">{p.name}</span>)}
        </div>
      )}
      <Reaches affects={affects} />
      <Actions {...actions} />
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
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
  cardShowing: {
    boxShadow: `3px 4px 0 ${brownRed}`,
    borderColor: brownRed,
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
  showing: {
    background: 'var(--pale-red)',
  },
  how: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
  },
};

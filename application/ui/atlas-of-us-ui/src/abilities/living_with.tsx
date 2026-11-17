import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  EXTENTS,
  SEVERITIES,
  addCondition,
  capitalized,
  clearImpairment,
  clearMyCondition,
  conditionName,
  getConditions,
  type Ability,
  type AffectedBy,
  type Candidate,
  type Condition,
  type Conditions,
  type Impairment,
  type Impairments,
  type MyCondition,
  type PartSummary,
} from './api';
import { ConditionForm } from './condition_form';
import { ImpairmentForm, type Impairable } from './impairment_form';
import { useFound } from './searching';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';
import { SearchField } from '../shared_components/search_field';
import { Thinking } from '../shared_components/thinking';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';
import { failure } from '../shared_components/use_save';

//while a condition someone added is being linked to the body, how often to check whether it's done, and for how long,
//in ms
const CHECK_EVERY = 4000;
const CHECK_FOR = 60_000;

//a body function or part an impairment can be in
interface Place {
  part: Impairable;
  structure: boolean; //whether it's a body part rather than a function
}

//what's open to fill in: a condition, or an impairment in a function or part
type Open = { kind: 'condition'; id: string } | { kind: 'impairment'; id: string };

interface LivingWithProps {
  impairments: Impairments;
  conditions: Conditions;
  anatomy: PartSummary[];
  affectedBy: AffectedBy[];
  onImpaired: (saved: Impairment, abilities: Ability[]) => void; //with the user's abilities, which note impairments
  onUnimpaired: (id: string, abilities: Ability[]) => void;
  onConditions: (data: Conditions) => void;
}

//the user's conditions and impairments, in one place: a checklist of common conditions in everyday names, a search for anything
//else, conditions from our list and from Mondo and HPO along with the body functions and parts an impairment can be in,
//and beside them what they've added and the abilities it can affect
export default function LivingWith({ impairments, conditions, anatomy, affectedBy, onImpaired, onUnimpaired, onConditions }: LivingWithProps) {
  const [open, setOpen] = useState<Open>();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string>();

  const byId = useMemo(() => new Map(conditions.conditions.map((c) => [c.id, c])), [conditions.conditions]);
  const mine = useMemo(() => new Map(conditions.mine.map((m) => [m.id, m])), [conditions.mine]);
  const impairable = useMemo(
    () =>
      new Map<string, Place>([
        ...impairments.functions.map((f): [string, Place] => [f.id, { part: f, structure: false }]),
        ...anatomy.map((p): [string, Place] => [p.id, { part: { id: p.id, name: capitalized(p.name) }, structure: true }]),
      ]),
    [impairments.functions, anatomy],
  );
  const checklist = useMemo(() => {
    const groups = new Map<string, Condition[]>();
    const listed = conditions.conditions.filter((c) => c.checklist).sort((a, b) => (a.checklist_order ?? 0) - (b.checklist_order ?? 0));
    for (const c of listed) groups.set(c.checklist!, [...(groups.get(c.checklist!) ?? []), c]);
    return [...groups];
  }, [conditions.conditions]);

  //a condition added from Mondo or HPO is linked to the body in the background, so while one of theirs is, it's checked
  //on until it's done, which shows what it can affect, or for a minute, after which it shows on their next visit
  const pending = conditions.mine.filter((m) => byId.get(m.id)?.pending).map((m) => m.id).sort().join(' ');
  const [gaveUpOn, setGaveUpOn] = useState<string>(); //the pending conditions it stopped checking on
  const gaveUp = !!pending && gaveUpOn === pending;
  const latest = useRef(onConditions);
  useEffect(() => {
    latest.current = onConditions;
  });
  useEffect(() => {
    if (!pending || gaveUp) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > CHECK_FOR) return setGaveUpOn(pending);
      getConditions().then((data) => latest.current(data), () => {});
    }, CHECK_EVERY);
    return () => clearInterval(timer);
  }, [pending, gaveUp]);

  const failed = (e: unknown) => setError(failure(e));
  const close = () => setOpen(undefined);
  const savedCondition = (m: MyCondition) => {
    onConditions({ ...conditions, mine: [...conditions.mine.filter((x) => x.id !== m.id), m] });
    close();
  };
  const addedCondition = (c: Condition) => {
    onConditions({ ...conditions, conditions: [...conditions.conditions.filter((x) => x.id !== c.id), c] });
    setOpen({ kind: 'condition', id: c.id });
  };
  const savedImpairment = (i: Impairment, abilities: Ability[]) => {
    onImpaired(i, abilities);
    close();
  };
  const removeCondition = (id: string) => {
    setError(undefined);
    clearMyCondition(id).then(() => onConditions({ ...conditions, mine: conditions.mine.filter((m) => m.id !== id) }), failed);
  };
  const removeImpairment = (id: string) => {
    setError(undefined);
    clearImpairment(id).then((abilities) => onUnimpaired(id, abilities), failed);
  };
  const search = (q: string) => {
    setQuery(q);
    setOpen(undefined);
  };

  //the form for what's open, where it was opened from, scrolled into view as it opens
  const form = (o: Open) => {
    if (o.kind === 'condition') {
      const c = byId.get(o.id);
      return c && <InView key={c.id}><ConditionForm condition={c} mine={mine.get(c.id) ?? null} onSaved={savedCondition} onCancel={close} /></InView>;
    }
    const f = impairable.get(o.id);
    const i = impairments.impairments.find((x) => x.id === o.id) ?? null;
    return f && <InView key={o.id}><ImpairmentForm part={f.part} structure={f.structure} impairment={i} onSaved={savedImpairment} onCancel={close} /></InView>;
  };

  return (
    <div style={styles.columns}>
      <section style={styles.pick} aria-label="Pick what applies">
        <SearchField id="living-search" query={query} onQuery={search} placeholder="Search anything: Parkinson's, shoulder, memory..." />
        {query.trim() ? (
          <Found
            query={query}
            byId={byId}
            mine={mine}
            impairments={impairments}
            anatomy={anatomy}
            open={open}
            form={form}
            onOpen={setOpen}
            onAdded={addedCondition}
          />
        ) : (
          checklist.map(([group, items]) => {
            const here = open?.kind === 'condition' && items.some((c) => c.id === open.id);
            return (
              <div key={group} style={styles.group}>
                <h3 style={styles.heading}>{group}</h3>
                <div style={styles.chips} role="group" aria-label={group}>
                  {items.map((c) => (
                    <button
                      key={c.id}
                      className="comic-lift"
                      style={mine.has(c.id) ? { ...styles.chip, ...styles.chipOn } : open?.id === c.id ? { ...styles.chip, ...styles.chipOpen } : styles.chip}
                      aria-pressed={mine.has(c.id)}
                      onClick={() => setOpen(open?.id === c.id ? undefined : { kind: 'condition', id: c.id })}
                    >
                      {conditionName(c)}
                    </button>
                  ))}
                </div>
                {here && form(open)}
              </div>
            );
          })
        )}
      </section>

      <section style={styles.yours} aria-label="Your conditions and impairments">
        <h3 style={styles.heading}>Your conditions and impairments</h3>
        {error && <AtlasError message={error} />}
        <Yours
          conditions={conditions}
          byId={byId}
          impairments={impairments.impairments}
          impairable={impairable}
          affectedBy={affectedBy}
          gaveUp={gaveUp}
          onChange={(o) => {
            setQuery('');
            setOpen(o);
          }}
          onRemoveCondition={removeCondition}
          onRemoveImpairment={removeImpairment}
        />
        {open && !query.trim() && !checklist.some(([, items]) => items.some((c) => c.id === open.id)) && form(open)}
        <p style={styles.credit}>
          Conditions come from the Mondo Disease Ontology, used under CC BY 4.0, and the Human Phenotype Ontology (hpo.jax.org).
          Body functions come from the WHO's International Classification of Functioning, Disability and Health (ICF), ©
          World Health Organization, used under CC BY-ND 3.0 IGO, and body parts from the Foundational Model of Anatomy, used
          under CC BY 3.0.
        </p>
      </section>
    </div>
  );
}

//what's inside, scrolled into view once it shows, as a form opened under a long list can be below the screen
function InView({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);
  return <div ref={ref} style={styles.inView}>{children}</div>;
}

interface FoundProps {
  query: string;
  byId: Map<string, Condition>;
  mine: Map<string, MyCondition>;
  impairments: Impairments;
  anatomy: PartSummary[];
  open: Open | undefined;
  form: (o: Open) => ReactNode;
  onOpen: (o: Open | undefined) => void;
  onAdded: (c: Condition) => void;
}

//what a search finds: conditions in the Atlas, then, behind a toggle unless there are none of those, ones in Mondo and
//HPO that picking adds to the Atlas, then body functions and parts an impairment can be in. Each opens its form in place
function Found({ query, byId, mine, impairments, anatomy, open, form, onOpen, onAdded }: FoundProps) {
  const { found, error } = useFound(query);
  const [adding, setAdding] = useState<string>();
  const [addError, setAddError] = useState<string>();
  if (error) return <AtlasError message={error} />;
  if (!found) return <Thinking label="Looking" />;

  const functions = new Map(impairments.functions.map((f) => [f.id, f]));
  const parts = new Map(anatomy.map((p) => [p.id, p]));
  const ours = found.conditions.flatMap((id) => byId.get(id) ?? []);
  const theirs = found.functions.flatMap((id) => functions.get(id) ?? []);
  const places = found.parts.flatMap((id) => parts.get(id) ?? []);
  const impaired = (id: string) => impairments.impairments.some((i) => i.id === id);

  const pickOutside = (c: Candidate) => {
    const known = c.id ? byId.get(c.id) : undefined;
    if (known) return onOpen({ kind: 'condition', id: known.id });
    setAdding(c.source_id);
    setAddError(undefined);
    addCondition(c.source_id).then(
      (condition) => {
        setAdding(undefined);
        onAdded(condition);
      },
      (e) => {
        setAdding(undefined);
        setAddError(failure(e));
      },
    );
  };

  const row = (o: Open, label: string, note: string | null, on: boolean) => (
    <li key={o.id} style={styles.result}>
      <button
        className="comic-lift"
        style={on ? { ...styles.chip, ...styles.chipOn } : open?.id === o.id ? { ...styles.chip, ...styles.chipOpen } : styles.chip}
        aria-pressed={on}
        onClick={() => onOpen(open?.id === o.id ? undefined : o)}
      >
        {label}
      </button>
      {note && <span style={styles.note}>{note}</span>}
      {open?.id === o.id && form(o)}
    </li>
  );
  const outside = (
    <>
      <p style={styles.text}>These aren't in the Atlas yet. Picking one adds it, and I'll work out which abilities it can affect.</p>
      <ul style={styles.results}>
        {found.outside.map((c) => (
          <li key={c.source_id} style={styles.result}>
            <button className="comic-lift" style={styles.chip} disabled={!!adding} onClick={() => pickOutside(c)}>
              {adding === c.source_id ? 'Adding it to the Atlas...' : capitalized(c.name)}
            </button>
            {c.description && <span style={{ ...styles.note, ...styles.clamped }}>{c.description}</span>}
          </li>
        ))}
      </ul>
      {addError && <AtlasError message={addError} />}
    </>
  );

  return (
    <>
      {(!!ours.length || !found.outside.length) && <h3 style={styles.heading}>Conditions</h3>}
      {!!ours.length && (
        <ul style={styles.results}>
          {ours.map((c) => row({ kind: 'condition', id: c.id }, conditionName(c), c.plain_name ? capitalized(c.name) : null, mine.has(c.id)))}
        </ul>
      )}
      {!!found.outside.length &&
        (ours.length ? (
          <Disclosure label={`More from medical lists (${found.outside.length})`}>{outside}</Disclosure>
        ) : (
          <>
            <h3 style={styles.heading}>From medical lists</h3>
            {outside}
          </>
        ))}
      {/* one just added from Mondo or HPO, which isn't among ours in this search */}
      {open?.kind === 'condition' && !ours.some((c) => c.id === open.id) && form(open)}
      {found.outside_failed && <p style={styles.text}>I couldn't search the medical lists just now. Try again in a bit.</p>}
      {!ours.length && !found.outside.length && !found.outside_failed && <p style={styles.text}>No condition goes by that name. Try another way of putting it.</p>}

      {!!(theirs.length || places.length) && (
        <>
          <h3 style={styles.heading}>Or something that doesn't work as well as it could</h3>
          <ul style={styles.results}>
            {theirs.map((f) => row({ kind: 'impairment', id: f.id }, f.name, f.group, impaired(f.id)))}
            {places.map((p) => row({ kind: 'impairment', id: p.id }, capitalized(p.name), 'Body part', impaired(p.id)))}
          </ul>
        </>
      )}
    </>
  );
}

interface YoursProps {
  conditions: Conditions;
  byId: Map<string, Condition>;
  impairments: Impairment[];
  impairable: Map<string, Place>;
  affectedBy: AffectedBy[];
  gaveUp: boolean; //whether checking on a condition being linked to the body has stopped for now
  onChange: (o: Open) => void;
  onRemoveCondition: (id: string) => void;
  onRemoveImpairment: (id: string) => void;
}

//what the user has added, to change or remove, and the abilities it can affect, each with what of theirs can affect it
function Yours({ conditions, byId, impairments, impairable, affectedBy, gaveUp, onChange, onRemoveCondition, onRemoveImpairment }: YoursProps) {
  const added = [
    ...conditions.mine.flatMap((m) => {
      const c = byId.get(m.id);
      if (!c) return [];
      const severity = SEVERITIES.find((s) => s.value === m.severity)?.label;
      const notes = [severity ?? 'Added', m.diagnosed ? 'diagnosed' : null, m.managed ? 'under control' : null].filter(Boolean);
      const working = c.pending ? (gaveUp ? "I'll show what this can affect once I've worked it out." : 'Working out what this can affect...') : null;
      return [{ open: { kind: 'condition', id: c.id } as Open, name: conditionName(c), notes: notes.join(', '), working, remove: () => onRemoveCondition(c.id) }];
    }),
    ...impairments.flatMap((i) => {
      const f = impairable.get(i.id);
      if (!f) return [];
      const extent = EXTENTS.find((e) => e.value === i.extent)?.label ?? '';
      return [{ open: { kind: 'impairment', id: i.id } as Open, name: f.part.name, notes: `${extent} impairment`, working: null, remove: () => onRemoveImpairment(i.id) }];
    }),
  ];
  const affected = affectedBy.filter((a) => a.conditions.length || a.impairments.length);
  const nameOf = (id: string, fallback: string) => {
    const c = byId.get(id);
    return c ? conditionName(c) : (impairable.get(id)?.part.name ?? capitalized(fallback));
  };

  if (!added.length)
    return <p style={styles.text}>Nothing yet. Pick anything that applies to you, or move on if nothing does.</p>;
  return (
    <>
      <ul style={styles.added}>
        {added.map((a) => (
          <li key={a.open.id} style={styles.card}>
            <span style={styles.name}>{a.name}</span>
            <span style={styles.note}>{a.notes}</span>
            {a.working && <span style={{ ...styles.note, ...styles.working }}>{a.working}</span>}
            <span style={styles.buttons}>
              <button className="comic-lift" style={styles.small} onClick={() => onChange(a.open)}>
                Change
              </button>
              <button className="comic-lift" style={styles.small} onClick={a.remove}>
                Remove
              </button>
            </span>
          </li>
        ))}
      </ul>
      {!!affected.length && (
        <>
          <h3 style={styles.heading}>What it means for your abilities</h3>
          <p style={styles.text}>These can affect the abilities below. When a skill needs one of them, I'll mention it so you can plan around it.</p>
          <dl style={styles.abilities}>
            {affected.map((a) => (
              <Fragment key={a.id}>
                <dt style={styles.ability}>{a.name}</dt>
                <dd style={styles.from}>from {[...a.conditions, ...a.impairments].map((x) => nameOf(x.id, x.name)).join(', ')}</dd>
              </Fragment>
            ))}
          </dl>
        </>
      )}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  inView: {
    alignSelf: 'stretch',
    scrollMarginBottom: 16,
  },
  columns: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: 28,
  },
  pick: {
    flex: '2 1 420px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  yours: {
    flex: '1 1 300px',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '14px 16px',
    background: ivory,
    border: `2px dashed ${gunmetal}`,
    borderRadius: 12,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  heading: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 21,
    letterSpacing: 1,
    color: brownRed,
  },
  working: {
    fontStyle: 'italic',
    color: 'var(--cinnamon-wood)',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    padding: '4px 14px',
    background: '#fff',
    color: gunmetal,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    font: 'inherit',
    fontSize: 15,
    textAlign: 'left',
    cursor: 'pointer',
  },
  chipOn: {
    background: brownRed,
    color: ivory,
  },
  chipOpen: {
    background: 'var(--pale-red)',
  },
  results: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  result: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  note: {
    fontSize: 13,
    lineHeight: 1.4,
    paddingLeft: 4,
  },
  //a definition from Mondo or HPO, cut to two lines
  clamped: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  text: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.5,
  },
  added: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '8px 12px',
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
  },
  name: {
    fontFamily: comic,
    fontSize: 19,
    letterSpacing: 1,
    color: brownRed,
  },
  buttons: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
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
  abilities: {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '4px 12px',
    fontSize: 14,
  },
  ability: {
    fontWeight: 600,
  },
  from: {
    margin: 0,
  },
  credit: {
    margin: '6px 0 0',
    fontSize: 12,
    lineHeight: 1.4,
  },
};

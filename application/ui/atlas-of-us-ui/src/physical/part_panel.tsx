import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { EXTENTS, comparedWith, conditionName, getPart, partName, standing, withUnit, type Measurement, type Part, type PartRef } from './api';
import { AtlasError } from '../shared_components/atlas-error';
import { Disclosure } from '../shared_components/disclosure';
import { Thinking } from '../shared_components/thinking';
import { navigate } from '../router';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//how many of a list show before the rest are behind a toggle
const SHOWN = 8;

interface PartPanelProps {
  id: string;
  myConditions: Set<string>; //the ids of the conditions the user has
  measurements: Map<string, Measurement>; //every measurement, with the user's readings, by id
  onLoaded: (part: Part) => void; //lights up the meshes it's drawn with
  onPick: (id: string) => void; //opens another part
  onNote: () => void; //notes or changes an impairment in it
}

//where a related thing comes from, when it isn't the part itself
function Through({ through }: { through: string | null }) {
  return through ? <span style={styles.through}>through {partName(through)}</span> : null;
}

//a list that shows the first few, with the rest behind a toggle
function Some<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  return (
    <>
      <ul style={styles.list}>{items.slice(0, SHOWN).map(render)}</ul>
      {items.length > SHOWN && (
        <Disclosure label={`${items.length - SHOWN} more`}>
          <ul style={styles.list}>{items.slice(SHOWN).map(render)}</ul>
        </Disclosure>
      )}
    </>
  );
}

//everything to learn about a part of the body, opened fresh for each one (give it a key of the id): what it is, the
//conditions that affect it, how it's measured and where the user stands, the user's impairments in it, what it lets
//them do and the skills that rely on it, the topics to learn more about it in, and how it fits in the body. What's linked to the parts it belongs to or is made of, or to what it does,
//counts for it too, and says where it comes from
export function PartPanel({ id, myConditions, measurements, onLoaded, onPick, onNote }: PartPanelProps) {
  const [part, setPart] = useState<Part>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    getPart(id).then(
      (loaded) => {
        if (!live) return;
        setPart(loaded);
        onLoaded(loaded);
      },
      (e) => live && setError(e instanceof Error ? e.message : String(e)),
    );
    return () => {
      live = false;
    };
  }, [id, onLoaded]);

  if (error) return <AtlasError message={error} />;
  if (!part) return <Thinking label="Opening it up" />;

  const links = (title: string, refs: PartRef[]) =>
    !!refs.length && (
      <>
        <h3 style={styles.heading}>{title}</h3>
        <div style={styles.links}>
          {refs.slice(0, 12).map((r) => (
            <button key={r.id} className="comic-lift" style={styles.part} onClick={() => onPick(r.id)}>
              {partName(r.name)}
            </button>
          ))}
          {refs.length > 12 && <span style={styles.small}>and {refs.length - 12} more</span>}
        </div>
      </>
    );
  return (
    <article style={styles.panel}>
      <h2 style={styles.name}>{partName(part.name)}</h2>
      {!part.elements.length && <p style={styles.small}>The 3D body has no model of this one, so it's lit up by what it belongs to.</p>}
      {part.definition && <p style={styles.definition}>{part.definition}</p>}
      {!!part.synonyms.length && (
        <Disclosure label="Other names">
          <p style={styles.small}>{part.synonyms.join('; ')}</p>
        </Disclosure>
      )}

      <h3 style={styles.heading}>Conditions</h3>
      {!part.conditions.length && <p style={styles.text}>No conditions are linked to it yet.</p>}
      <Some
        items={part.conditions}
        render={(c) => (
          <li key={c.id} style={styles.item}>
            <span style={styles.row}>
              {c.description ? (
                <Disclosure label={conditionName(c.name)}>
                  <p style={styles.small}>{c.description}</p>
                </Disclosure>
              ) : (
                <span>{conditionName(c.name)}</span>
              )}
              {myConditions.has(c.id) && <span className="comic-chip">You have this</span>}
            </span>
            <Through through={c.through} />
          </li>
        )}
      />

      <h3 style={styles.heading}>Measurements</h3>
      {!part.measurements.length && <p style={styles.text}>Nothing measures it yet.</p>}
      <Some
        items={part.measurements}
        render={(m) => {
          const full = measurements.get(m.id);
          const latest = full?.readings[0];
          return (
            <li key={m.id} style={styles.item}>
              <span style={styles.itemName}>{m.name}</span>
              <Through through={m.through} />
              {full && latest ? (
                <span style={styles.small}>
                  You: {withUnit(latest.value, full.unit)}
                  {latest.percentile !== null && latest.compared_with && full.better !== 'neither' && (
                    <>. {standing(latest.percentile, full.better)} {comparedWith(latest.compared_with)}</>
                  )}
                </span>
              ) : (
                <span style={styles.small}>You haven't measured this yet. Add a reading on the Measurements view.</span>
              )}
            </li>
          );
        }}
      />

      <h3 style={styles.heading}>Your impairments</h3>
      {!part.impairments.length && <p style={styles.text}>You haven't noted any here. Only you see what you note.</p>}
      <Some
        items={part.impairments}
        render={(i) => (
          <li key={i.id} style={styles.item}>
            <span>
              <span style={styles.itemName}>{partName(i.name)}</span>: {EXTENTS.find((e) => e.value === i.extent)?.label.toLowerCase()}
            </span>
            {!!i.through && <span style={styles.through}>in a related part or function</span>}
          </li>
        )}
      />
      <button className="comic-lift" style={styles.primary} onClick={onNote}>
        {part.impairments.some((i) => i.id === part.id) ? 'Change your impairment here' : 'Note an impairment here'}
      </button>

      {!!part.functions.length && (
        <>
          <h3 style={styles.heading}>What it lets you do</h3>
          <Some
            items={part.functions}
            render={(f) => (
              <li key={f.id} style={styles.item}>
                <span style={styles.itemName}>{f.name}</span>
                <Through through={f.through} />
                {!!f.abilities.length && (
                  <div style={styles.chips}>
                    {f.abilities.map((a) => <span key={a} className="comic-chip">{a}</span>)}
                  </div>
                )}
              </li>
            )}
          />
        </>
      )}

      {!!part.skills.length && (
        <>
          <h3 style={styles.heading}>Skills that rely on it</h3>
          <p style={styles.small}>Skills with a level that takes an ability it gives you. Yours come first.</p>
          <Some
            items={part.skills}
            render={(s) => (
              <li key={s.id} style={styles.item}>
                <span style={styles.row}>
                  <button className="comic-lift" style={styles.part} onClick={() => navigate(`/skills/${encodeURIComponent(s.id)}`)}>
                    {s.name}
                  </button>
                  {s.yours && <span className="comic-chip">Yours</span>}
                </span>
                <span style={styles.through}>takes {s.abilities.join(', ')}</span>
              </li>
            )}
          />
          {part.skills_total > part.skills.length && <p style={styles.small}>and {part.skills_total - part.skills.length} more</p>}
        </>
      )}

      {!!part.topics.length && (
        <>
          <h3 style={styles.heading}>Learn more</h3>
          <Some
            items={part.topics}
            render={(t) => (
              <li key={t.id} style={styles.item}>
                <span>
                  <button className="comic-lift" style={styles.part} onClick={() => navigate(`/topics/${encodeURIComponent(t.id)}`)}>
                    {t.name}
                  </button>
                </span>
                <Through through={t.through} />
              </li>
            )}
          />
        </>
      )}

      {links('Part of', part.wholes)}
      {links('Made up of', part.parts)}
      {links('A kind of', part.kinds)}
      {links('Kinds of it', part.subtypes)}

      <p style={styles.credit}>
        Names and definitions from the Foundational Model of Anatomy (CC BY 3.0). 3D models from BodyParts3D, © The
        Database Center for Life Science (CC BY 4.0).
      </p>
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 0,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 32,
    letterSpacing: 1,
    color: brownRed,
  },
  heading: {
    margin: '6px 0 0',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 21,
    letterSpacing: 1,
    color: brownRed,
  },
  definition: {
    margin: 0,
    padding: '8px 12px',
    background: ivory,
    border: `2px dashed ${gunmetal}`,
    borderRadius: 10,
    fontSize: 15,
    lineHeight: 1.45,
  },
  text: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.5,
  },
  small: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.4,
  },
  through: {
    fontSize: 12,
    color: 'var(--cinnamon-wood)',
  },
  links: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
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
    flexDirection: 'column',
    gap: 2,
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 600,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    fontSize: 13,
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
  credit: {
    margin: '6px 0 0',
    fontSize: 12,
    lineHeight: 1.4,
  },
};

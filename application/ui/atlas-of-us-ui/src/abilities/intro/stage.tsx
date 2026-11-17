import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { abilityLevel, LEVEL_NAMES } from '../../skills/api';
import { Ladder } from '../../skills/skill_page';
import { AtlasError } from '../../shared_components/atlas-error';
import { Thinking } from '../../shared_components/thinking';
import { blue, brownRed, gunmetal } from '../../shared_components/palette';
import { listed } from '../../shared_components/story/atlas';
import { StageGraph } from '../../shared_components/story/stage_graph';
import { stageStyles } from '../../shared_components/story/stage_styles';
import { useRank, useSkills } from '../../shared_components/story/use_skills';
import type { Person, Stage } from './script';
import { abilityFit, carriedUp } from '../../skills/ability_fit';
import { FitGraph } from '../../shared_components/fit_graph';

// The real Atlas, shown over the whiteboard during an interlude: skills on the skill graph, or a skill's levels with
// the abilities each takes, set against one of the story's people.

const green = '#2f9a5a';
const paleBlue = 'var(--pale-blue)';

export function StageView({ stage }: { stage: Stage }) {
  return (
    <>
      {stage.kind === 'graph' ? (
        <StageGraph key={stage.skills.join('|')} skills={stage.skills} expand={!!stage.expand} show={stage.show} />
      ) : stage.kind === 'fit' ? (
        <StageFit key={stage.skills.join('|')} person={stage.person} skills={stage.skills} rank={stage.rank} focus={stage.focus} />
      ) : (
        <StageSkill key={stage.skill} name={stage.skill} rank={stage.rank} person={stage.person} picked={stage.abilities} />
      )}
    </>
  );
}

//a skill's levels open at one, with each ability it takes beside where person stands on it, and the ones picked out
//brought to the front
function StageSkill({ name, rank: given, person, picked }: { name: string; rank: number; person?: Person; picked?: string[] }) {
  const [names] = useState(() => [name]);
  const { skills, waiting, error } = useSkills(names);
  const skill = skills?.[0];
  const [rank, setRank] = useRank(given);

  //the first ability picked out scrolls into view
  const list = useRef<HTMLUListElement>(null);
  const first = picked?.[0];
  useEffect(() => {
    list.current?.querySelector('[data-picked="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [first, rank, skill]);

  if (error) return <AtlasError message={error} />;
  if (!skill) return <Thinking label={waiting ?? `Opening ${name}`} />;

  const abilities = carriedUp(skill, rank);
  const level = skill.levels.find((l) => l.rank === rank);
  return (
    <section style={styles.panel} className="comic-panel">
      {/* the panel's border and fill are drawn behind it, so the scrolling happens on a layer inside */}
      <div style={styles.scroll}>
        <header style={styles.head}>
          <div>
            <h2 style={styles.name}>{skill.name}</h2>
            {person && <span style={styles.who}>as {person.name} sees it</span>}
          </div>
          <Ladder rank={rank} mine={null} onRank={setRank} compact />
        </header>
        {level?.description && <p style={styles.description}>{level.description}</p>}
        <h3 style={styles.subheading}>What {LEVEL_NAMES[rank - 1]} takes</h3>
        {!abilities.length && <p style={styles.description}>No abilities are written for this level yet.</p>}
        <ul ref={list} style={styles.abilities}>
          {abilities.map((a) => {
            const theirs = person?.abilities[a.name];
            const isPicked = !picked || picked.includes(a.name);
            const affects = person?.conditions?.filter((c) => c.affects.includes(a.name)) ?? [];
            return (
              <li key={a.name} data-picked={!!picked && isPicked} style={{ ...styles.ability, ...(isPicked ? {} : styles.faded), ...(picked && isPicked ? styles.picked : {}) }}>
                <div style={styles.abilityHead}>
                  <strong>{a.name}</strong>
                  <span style={styles.needs}>needs {abilityLevel(a.level)}</span>
                </div>
                <Meter need={a.level} theirs={theirs} />
                {person && theirs === undefined && picked && isPicked && <span style={styles.unknown}>{person.name} hasn't found this one out yet</span>}
                {affects.length > 0 && <span style={styles.note}>This can be affected by {person!.name}'s {affects.map((c) => c.name).join(' and ')}.</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

//a person's strengths and gaps against a few skills at once, at a level they can change on the ladder. Skills not in
//focus step back
function StageFit({ person, skills: names, rank: given, focus }: { person: Person; skills: string[]; rank: number; focus?: string[] }) {
  const { skills, waiting, error } = useSkills(names);
  const [rank, setRank] = useRank(given);
  if (error) return <AtlasError message={error} />;
  if (!skills) return <Thinking label={waiting ?? `Opening ${names.join(', ')}`} />;

  const affectedBy: Record<string, string[]> = {};
  for (const condition of person.conditions ?? []) for (const ability of condition.affects) (affectedBy[ability] ??= []).push(condition.name);
  const { items, targets, links } = abilityFit(skills, rank, person.abilities, affectedBy);
  return (
    <section style={{ ...styles.panel, height: '100%' }} className="comic-panel">
      {/* the drawing shrinks to fit, rather than scrolling */}
      <div style={styles.fitColumn}>
        <header style={styles.head}>
          <div>
            <h2 style={styles.name}>{person.name}'s strengths and gaps</h2>
            <span style={styles.who}>against what {LEVEL_NAMES[rank - 1]} takes</span>
          </div>
          <Ladder rank={rank} mine={null} onRank={setRank} compact />
        </header>
        <FitGraph
          who={person.name}
          items={items}
          targets={targets}
          links={links}
          focus={focus && skills.filter((s) => focus.includes(s.name)).map((s) => s.id)}
          labels={{ affected: `Can be affected by ${person.conditions?.map((c) => c.name).join(' and ')}` }}
          label={`${person.name}'s strengths and gaps against ${listed(names)}`}
        />
      </div>
    </section>
  );
}

//a bar from 0 to 1: where someone stands, filled in, and a tick for what the level takes, with any gap in red
function Meter({ need, theirs }: { need: number; theirs?: number }) {
  const short = theirs !== undefined && theirs < need;
  return (
    <div style={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={theirs ?? need}>
      {theirs !== undefined && <span style={{ ...styles.fill, width: `${theirs * 100}%`, background: short ? blue : green }} />}
      {short && <span style={{ ...styles.gap, left: `${theirs * 100}%`, width: `${(need - theirs) * 100}%` }} />}
      <span style={{ ...styles.tick, left: `${need * 100}%`, background: short ? brownRed : gunmetal }} />
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  ...stageStyles,
  abilities: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: 10,
  },
  ability: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '8px 12px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    transition: 'opacity 0.3s',
  },
  faded: {
    opacity: 0.35,
  },
  picked: {
    boxShadow: `4px 4px 0 ${brownRed}`,
    background: paleBlue,
  },
  abilityHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '0 8px',
    fontSize: 18,
  },
  needs: {
    fontSize: 15,
    opacity: 0.75,
  },
  meter: {
    position: 'relative',
    height: 16,
    background: '#eef0f2',
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    opacity: 0.8,
  },
  gap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    background: `repeating-linear-gradient(-45deg, ${brownRed} 0 4px, transparent 4px 8px)`,
    opacity: 0.6,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
  },
  unknown: {
    fontSize: 14,
    opacity: 0.7,
  },
  note: {
    alignSelf: 'flex-start',
    padding: '2px 10px',
    background: 'var(--pale-cinnamon)',
    border: `2px dashed ${gunmetal}`,
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 1.4,
  },
};

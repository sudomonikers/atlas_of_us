import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { LEVEL_NAMES, type Skill, type TraitRequirement } from '../../skills/api';
import { Ladder } from '../../skills/skill_page';
import { AtlasError } from '../../shared_components/atlas-error';
import { Thinking } from '../../shared_components/thinking';
import { FitGraph, type FitItem, type FitLink, type Standing } from '../../shared_components/fit_graph';
import { blue, brownRed, comic, gunmetal, ivory } from '../../shared_components/palette';
import { listed } from '../../shared_components/story/atlas';
import { StageGraph } from '../../shared_components/story/stage_graph';
import { stageStyles } from '../../shared_components/story/stage_styles';
import { useRank, useSkills } from '../../shared_components/story/use_skills';
import { DOMAINS, getTraits, type AffectedBy, type Contribution, type TraitInfo, type Trait } from '../api';
import { TraitRow } from '../my_personality';
import { PersonalityReport } from '../report';
import Explore from '../explore';
import { SCENARIOS, THUMBS } from '../scenarios';
import type { Evidence, Person, Stage } from './script';

// The real Atlas, shown over the whiteboard during an interlude: the scenes, a moment from one, a person's traits as My
// Personality shows them with the answers behind them, their report, Explore, and skills with the personality they
// take, set against one of the story's people.

const green = '#2f9a5a';
const paleBlue = 'var(--pale-blue)';

//the art of the scenes a stage can show a moment from, by scenario id, shown without its sound. Each is its own
//chunk, loaded when it's shown
const SCENE_ART: Record<string, React.LazyExoticComponent<(props: { animation: string; muted?: boolean }) => ReactNode>> = {
  the_shoplifter: lazy(() => import('../the_shoplifter/cctv')),
};

export function StageView({ stage }: { stage: Stage }) {
  switch (stage.kind) {
    case 'scenes':
      return <StageScenes picked={stage.picked} />;
    case 'scene':
      return <StageScene stage={stage} />;
    case 'traits':
      return <StageTraits person={stage.person} picked={stage.picked} compare={!!stage.compare} />;
    case 'why':
      return <StageWhy key={`${stage.person.name} ${stage.trait}`} person={stage.person} trait={stage.trait} />;
    case 'report':
      return <StageReport person={stage.person} part={stage.part} />;
    case 'explore':
      return (
        <Panel>
          <Explore />
        </Panel>
      );
    case 'graph':
      return <StageGraph key={stage.skills.join('|')} skills={stage.skills} expand={!!stage.expand} show={stage.show} />;
    case 'skill':
      return <StageSkill key={stage.skill} name={stage.skill} rank={stage.rank} person={stage.person} picked={stage.traits} />;
    case 'fit':
      return <StageFit key={stage.skills.join('|')} person={stage.person} skills={stage.skills} rank={stage.rank} focus={stage.focus} />;
  }
}

//a panel over the whiteboard that scrolls inside, keeping what's picked in view
function Panel({ children, scrollTo }: { children: ReactNode; scrollTo?: string }) {
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollTo) scroll.current?.querySelector(scrollTo)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  return (
    <section style={styles.panel} className="comic-panel">
      <div ref={scroll} style={styles.scroll}>
        {children}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// the scenes
// ---------------------------------------------------------------------------

//how many scenes are read together, as the dashboard plays them
const BATCH = 6;

//every scene as the dashboard lists them, in the batches they're read in, with the ones picked out brought forward
function StageScenes({ picked }: { picked?: string[] }) {
  const batches = Array.from({ length: Math.ceil(SCENARIOS.length / BATCH) }, (_, i) => SCENARIOS.slice(i * BATCH, (i + 1) * BATCH));
  return (
    <Panel scrollTo={picked ? '[data-picked="true"]' : undefined}>
      <h2 style={styles.name}>Eighteen scenes</h2>
      {batches.map((batch, i) => (
        <div key={i}>
          <h3 style={styles.subheading}>{i === 0 ? 'Your first look comes after these six' : i === batches.length - 1 ? 'And your report after these' : 'A sharper picture after these'}</h3>
          <ul style={styles.scenes}>
            {batch.map((scenario) => {
              const isPicked = !picked || picked.includes(scenario.id);
              return (
                <li key={scenario.id} data-picked={!!picked && isPicked} style={{ ...styles.sceneCard, ...(isPicked ? {} : styles.faded), ...(picked && isPicked ? styles.picked : {}) }}>
                  {THUMBS[scenario.id] && <img src={THUMBS[scenario.id]} alt="" style={styles.thumb} />}
                  <strong style={styles.sceneTitle}>{scenario.title}</strong>
                  <span style={styles.blurb}>{scenario.blurb}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </Panel>
  );
}

//a moment from a real scene, drawn as the scene draws it, with its prompt, the choice made and the why typed
function StageScene({ stage }: { stage: Extract<Stage, { kind: 'scene' }> }) {
  const Art = SCENE_ART[stage.scene];
  const title = SCENARIOS.find((s) => s.id === stage.scene)?.title;
  return (
    <section style={styles.sceneFrame} className="comic-panel" aria-label={title}>
      <div style={styles.art}>
        <Suspense fallback={null}>{Art && <Art animation={stage.animation} muted />}</Suspense>
      </div>
      <div style={styles.promptBox}>
        <p style={styles.prompt}>{stage.prompt}</p>
        <div style={styles.choices}>
          {stage.choices.map((choice, i) => (
            <span key={choice} style={{ ...styles.choice, ...(stage.choice === i ? styles.choiceOn : stage.choice !== undefined ? styles.faded : {}) }}>
              {stage.choice === i ? '▶ ' : ''}
              {choice}
            </span>
          ))}
        </div>
        {stage.choice !== undefined && <p style={{ ...styles.answer, ...(stage.answer ? {} : styles.placeholder) }}>{stage.answer ?? 'Why? Explain your thinking...'}</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// traits, as My Personality shows them
// ---------------------------------------------------------------------------

//every trait with its description and everyone's average, read once for as long as the page is open. A failed read
//is tried again next time
let traitsRead: Promise<TraitInfo[]> | undefined;
const readTraits = () => {
  traitsRead ??= getTraits();
  traitsRead.catch(() => (traitsRead = undefined));
  return traitsRead;
};

function useTraitInfo() {
  const [traits, setTraits] = useState<TraitInfo[]>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    readTraits().then((t) => live && setTraits(t), (e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, []);
  return { traits, error };
}

//an answer of the story's, as My Personality shows one
const contributionOf = (trait: string, e: Evidence, i: number): Contribution => ({
  answer_id: `${trait} ${i}`,
  trait,
  scenario: e.scene,
  question: e.question,
  answer: e.answer,
  reasoning: e.why,
  level: e.level,
  weight: e.weight,
  evidence: e.shows,
  contests: e.contest ? [{ trait, kind: e.contest.kind, message: e.contest.message, at: '', status: e.contest.accepted ? 'accepted' : 'rejected', reply: e.contest.reply }] : [],
});

//person's traits, as My Personality would have them
const traitsOf = (person: Person, info: TraitInfo[]): Trait[] =>
  info.map((t) => ({
    id: t.id,
    name: t.name,
    domain: t.domain,
    description: t.description ?? undefined,
    average: t.average ?? undefined,
    value: person.traits[t.name],
    contributions: (person.evidence?.[t.name] ?? []).map((e, i) => contributionOf(t.name, e, i)),
  }));

//what person has noted that can affect a trait, as My Personality would have it
const affecting = (person: Person, trait: string): AffectedBy | undefined => {
  const conditions = person.conditions?.filter((c) => c.affects.includes(trait)) ?? [];
  return conditions.length ? { name: trait, conditions: conditions.map((c) => ({ id: c.name, name: c.name, severity: null })), impairments: [] } : undefined;
};

//person's traits by domain, with the ones picked out brought forward and scrolled to
function StageTraits({ person, picked, compare }: { person: Person; picked?: string[]; compare: boolean }) {
  const { traits: info, error } = useTraitInfo();
  if (error) return <AtlasError message={error} />;
  if (!info) return <Thinking label={`Opening ${person.name}'s personality`} style={styles.waiting} />;
  const traits = traitsOf(person, info);
  return (
    <Panel scrollTo={picked ? '[data-picked="true"]' : undefined}>
      <h2 style={styles.name}>{person.name}'s personality</h2>
      {DOMAINS.map((domain) => (
        <div key={domain.key}>
          <h3 style={styles.subheading}>{domain.title}</h3>
          {traits
            .filter((t) => t.domain === domain.key)
            .map((t) => {
              const isPicked = !picked || picked.includes(t.name);
              return (
                <ul key={t.id} data-picked={!!picked && isPicked} style={{ ...styles.traitList, ...styles.trait, ...(isPicked ? {} : styles.faded), ...(picked && isPicked ? styles.pickedTrait : {}) }}>
                  <TraitRow trait={t} compare={compare} affectedBy={affecting(person, t.name)} early={person.early ? true : t.value === undefined ? undefined : false} />
                </ul>
              );
            })}
        </div>
      ))}
    </Panel>
  );
}

//one of person's traits with the answers behind it open
function StageWhy({ person, trait: name }: { person: Person; trait: string }) {
  const { traits: info, error } = useTraitInfo();
  if (error) return <AtlasError message={error} />;
  if (!info) return <Thinking label={`Opening ${person.name}'s ${name}`} style={styles.waiting} />;
  const trait = traitsOf(person, info).find((t) => t.name === name);
  if (!trait) return <AtlasError message={`${name} isn't one of the traits in the Atlas`} />;
  //a contest and its reply are what the step is about, when there is one
  const contested = trait.contributions.some((c) => c.contests.length);
  return (
    <Panel scrollTo={contested ? 'ol ol' : undefined}>
      <h2 style={styles.name}>Why?</h2>
      <span style={styles.who}>{person.name}'s {name}, and the answers behind it</span>
      <ul style={styles.traitList}>
        <TraitRow trait={trait} compare={false} affectedBy={affecting(person, name)} early={false} open />
      </ul>
    </Panel>
  );
}

//person's written report, scrolled to part
function StageReport({ person, part }: { person: Person; part?: 'headline' | 'domains' | 'lists' }) {
  if (!person.report) return null;
  return (
    <Panel scrollTo={part === 'domains' ? 'strong' : part === 'lists' ? 'h4' : 'h3'}>
      <h2 style={styles.name}>{person.name}'s report</h2>
      <PersonalityReport report={person.report} />
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// skills, with the personality they take
// ---------------------------------------------------------------------------

//the traits a level takes, its own and carried up from the levels below it, the most important first
function carriedUp(skill: Skill, rank: number) {
  const carried = new Map<string, TraitRequirement>();
  for (const level of [...skill.levels].sort((a, b) => a.rank - b.rank)) {
    if (level.rank > rank) break;
    for (const requirement of level.traits) carried.set(requirement.name, requirement);
  }
  return [...carried.values()].sort((a, b) => b.strength - a.strength);
}

//whether someone is on the side of a trait a level pulls toward: at or above it when it takes more of the trait, at or
//below it when it takes less
const clears = (requirement: TraitRequirement, theirs: number) => (requirement.level >= 0.5 ? theirs >= requirement.level : theirs <= requirement.level);

//how much of a trait a level takes, in words
const pull = (requirement: TraitRequirement) => `${requirement.level >= 0.5 ? 'high' : 'low'}, ${Math.round(requirement.level * 100)} or ${requirement.level >= 0.5 ? 'more' : 'less'}`;

//a skill's levels open at one, with each trait it takes beside where person stands on it, and the ones picked out
//brought to the front
function StageSkill({ name, rank: given, person, picked }: { name: string; rank: number; person?: Person; picked?: string[] }) {
  const [names] = useState(() => [name]);
  const { skills, waiting, error } = useSkills(names);
  const skill = skills?.[0];
  const [rank, setRank] = useRank(given);

  //the first trait picked out scrolls into view
  const list = useRef<HTMLUListElement>(null);
  const first = picked?.[0];
  useEffect(() => {
    list.current?.querySelector('[data-picked="true"]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [first, rank, skill]);

  if (error) return <AtlasError message={error} />;
  if (!skill) return <Thinking label={waiting ?? `Opening ${name}`} style={styles.waiting} />;

  const traits = carriedUp(skill, rank);
  const level = skill.levels.find((l) => l.rank === rank);
  return (
    <section style={styles.panel} className="comic-panel">
      <div style={styles.scroll}>
        <header style={styles.head}>
          <div>
            <h2 style={styles.name}>{skill.name}</h2>
            {person && <span style={styles.who}>as {person.name} sees it</span>}
          </div>
          <Ladder rank={rank} mine={null} onRank={setRank} compact />
        </header>
        {level?.description && <p style={styles.description}>{level.description}</p>}
        <h3 style={styles.subheading}>The personality {LEVEL_NAMES[rank - 1]} takes</h3>
        {!traits.length && <p style={styles.description}>No traits are written for this level yet.</p>}
        <ul ref={list} style={styles.requirements}>
          {traits.map((r) => {
            const theirs = person?.traits[r.name];
            const isPicked = !picked || picked.includes(r.name);
            const affects = person?.conditions?.filter((c) => c.affects.includes(r.name)) ?? [];
            return (
              <li key={r.name} data-picked={!!picked && isPicked} style={{ ...styles.requirement, ...(isPicked ? {} : styles.faded), ...(picked && isPicked ? styles.picked : {}) }}>
                <div style={styles.requirementHead}>
                  <strong>{r.name}</strong>
                  <span style={styles.needs}>takes {pull(r)}</span>
                </div>
                <Meter requirement={r} theirs={theirs} />
                {affects.length > 0 && <span style={styles.note}>This can be affected by {person!.name}'s {affects.map((c) => c.name).join(' and ')}.</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

//a bar from 0 to 1: where someone stands, filled in, and a tick for what the level takes, with any gap in red
function Meter({ requirement, theirs }: { requirement: TraitRequirement; theirs?: number }) {
  const need = requirement.level;
  const short = theirs !== undefined && !clears(requirement, theirs);
  return (
    <div style={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={theirs ?? need}>
      {theirs !== undefined && <span style={{ ...styles.fill, width: `${theirs * 100}%`, background: short ? blue : green }} />}
      {short && <span style={{ ...styles.gap, left: `${Math.min(theirs, need) * 100}%`, width: `${Math.abs(need - theirs) * 100}%` }} />}
      <span style={{ ...styles.tick, left: `${need * 100}%`, background: short ? brownRed : gunmetal }} />
    </div>
  );
}

//how someone fits a few skills at one level, by the traits they take. A trait shows when they have a score on it, or
//something they live with can affect it. Strengths come first, the strongest at the top, then the gaps
function traitFit(skills: Skill[], rank: number, person: Person) {
  const affectedBy: Record<string, string[]> = {};
  for (const condition of person.conditions ?? []) for (const trait of condition.affects) (affectedBy[trait] ??= []).push(condition.name);
  const links: FitLink[] = skills.flatMap((skill) =>
    carriedUp(skill, rank).flatMap((r): FitLink[] => {
      const theirs = person.traits[r.name];
      const standing: Standing | undefined = affectedBy[r.name]?.length ? 'affected' : theirs === undefined ? undefined : clears(r, theirs) ? 'ahead' : 'short';
      return standing ? [{ item: r.name, target: skill.id, standing, strength: r.strength }] : [];
    }),
  );
  const order: Standing[] = ['ahead', 'short', 'affected'];
  const worst = (name: string) => Math.max(...links.filter((l) => l.item === name).map((l) => order.indexOf(l.standing)));
  const items: FitItem[] = [...new Set(links.map((l) => l.item))]
    .sort((a, b) => worst(a) - worst(b) || (person.traits[b] ?? 0) - (person.traits[a] ?? 0))
    .map((name) => ({ name, value: person.traits[name], affectedBy: affectedBy[name]?.join(', ') }));
  return { items, targets: skills.map((s) => ({ id: s.id, name: s.name })), links };
}

//a person's strengths and gaps against a few skills at once, at a level they can change on the ladder. Skills not in
//focus step back
function StageFit({ person, skills: names, rank: given, focus }: { person: Person; skills: string[]; rank: number; focus?: string[] }) {
  const { skills, waiting, error } = useSkills(names);
  const [rank, setRank] = useRank(given);
  const fit = useMemo(() => skills && traitFit(skills, rank, person), [skills, rank, person]);
  if (error) return <AtlasError message={error} />;
  if (!skills || !fit) return <Thinking label={waiting ?? `Opening ${listed(names)}`} style={styles.waiting} />;
  return (
    <section style={{ ...styles.panel, height: '100%' }} className="comic-panel">
      <div style={styles.fitColumn}>
        <header style={styles.head}>
          <div>
            <h2 style={styles.name}>{person.name}'s strengths and gaps</h2>
            <span style={styles.who}>against the personality {LEVEL_NAMES[rank - 1]} takes</span>
          </div>
          <Ladder rank={rank} mine={null} onRank={setRank} compact />
        </header>
        <FitGraph
          who={person.name}
          items={fit.items}
          targets={fit.targets}
          links={fit.links}
          focus={focus && skills.filter((s) => focus.includes(s.name)).map((s) => s.id)}
          labels={{ affected: `Can be affected by ${person.conditions?.map((c) => c.name).join(' and ')}` }}
          label={`${person.name}'s strengths and gaps against ${listed(names)}`}
        />
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  ...stageStyles,
  faded: {
    opacity: 0.35,
  },
  picked: {
    boxShadow: `4px 4px 0 ${brownRed}`,
    background: paleBlue,
  },
  scenes: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
    gap: 10,
  },
  sceneCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 8,
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    transition: 'opacity 0.3s',
  },
  thumb: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    borderRadius: 6,
    border: `2px solid ${gunmetal}`,
  },
  sceneTitle: {
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 18,
    letterSpacing: 0.5,
    lineHeight: 1.1,
  },
  blurb: {
    fontSize: 13,
    lineHeight: 1.25,
  },
  //the scene's art, with its prompt laid over the bottom of it as the scene shows it
  sceneFrame: {
    position: 'relative',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    background: '#000',
    borderRadius: 'var(--wobbly)',
    overflow: 'hidden',
    '--panel-fill': paleBlue,
  } as CSSProperties,
  art: {
    position: 'absolute',
    inset: 0,
  },
  promptBox: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    maxHeight: 'calc(100% - 32px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '12px 18px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 'var(--wobbly)',
    fontFamily: 'var(--font-hand)',
    textAlign: 'left',
  },
  prompt: {
    margin: '0 0 8px',
    fontSize: 20,
    lineHeight: 1.3,
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  choice: {
    padding: '2px 10px',
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: '12px 8px 10px 6px / 8px 10px 6px 12px',
    fontSize: 16,
    transition: 'opacity 0.3s',
  },
  choiceOn: {
    background: paleBlue,
    boxShadow: `3px 3px 0 ${brownRed}`,
  },
  answer: {
    margin: '8px 0 0',
    padding: '6px 10px',
    background: '#fff',
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 1.3,
  },
  placeholder: {
    opacity: 0.55,
  },
  traitList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  trait: {
    transition: 'opacity 0.3s',
    borderRadius: 12,
  },
  pickedTrait: {
    background: paleBlue,
    boxShadow: `4px 4px 0 ${brownRed}`,
    padding: '0 8px',
  },
  requirements: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: 10,
  },
  requirement: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '8px 12px',
    background: '#fff',
    border: `3px solid ${gunmetal}`,
    borderRadius: '14px 8px 16px 10px / 8px 16px 10px 14px',
    transition: 'opacity 0.3s',
  },
  requirementHead: {
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

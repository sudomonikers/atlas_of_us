import { useEffect, useMemo, useRef, useState } from 'react';
import { getSkillMap, type SkillRef } from '../../skills/api';
import { emptyBoard, expandSkill, place, withNeighbors, type SkillBoard } from '../../skills/skill_board';
import { GraphBoard, MapWaiting, type LinkKind } from '../graph_board';
import type { BoardNode } from '../board_layout';
import { useMap } from '../use_map';
import { AtlasError } from '../atlas-error';
import { Thinking } from '../thinking';
import { blue, brownRed, gunmetal } from '../palette';
import { findSkill, listed, readNeighbors, type LinkType } from './atlas';
import { stageStyles } from './stage_styles';
import { useSkills } from './use_skills';

// Skills on the skill graph, as the stories that open a module show them during an interlude.

//how the board draws the ways skills link, as the Skills page does
const KINDS: LinkKind[] = [
  { id: 'kind_of', label: 'Kinds of skills', line: 'solid', arrow: true, colour: gunmetal, length: 90 },
  { id: 'needs', label: 'Skills needed', line: 'dashed', arrow: true, colour: 'var(--cinnamon-wood)', length: 130 },
  { id: 'similar', label: 'Similar skills', line: 'dotted', arrow: false, colour: blue, length: 150 },
  { id: 'takes', label: 'Traits needed', line: 'solid', arrow: true, colour: brownRed, length: 120 },
  { id: 'able', label: 'Abilities needed', line: 'solid', arrow: true, colour: 'var(--cinnamon-wood)', length: 120 },
  { id: 'knows', label: 'Knowledge needed', line: 'solid', arrow: true, colour: blue, length: 120 },
];

const NONE: string[] = [];

//skills on the skill graph, selected, with everything they link to brought on once expand is set, or with no skills,
//the whole map. Only the kinds of link in show are drawn, with what they reach, so a step can light up one kind at a time
export function StageGraph({ skills, expand, show }: { skills: string[]; expand: boolean; show?: LinkType[] }) {
  const map = useMap(getSkillMap);
  const [board, setBoard] = useState<SkillBoard>(emptyBoard);
  const [refs, setRefs] = useState<SkillRef[]>();
  const [error, setError] = useState<string>();
  const expanded = useRef(false);
  //a skill only brings on what it takes once its levels are written, so expanding waits for every one of them
  const written = useSkills(expand ? skills : NONE);

  useEffect(() => {
    let live = true;
    Promise.all(skills.map(findSkill)).then((list) => {
      if (!live) return;
      setRefs(list);
      if (list.length) setBoard((b) => ({ ...list.reduce(place, b), selected: list[0].id, focus: { id: list[0].id } }));
    }, (e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [skills]);

  useEffect(() => {
    if (!expand || !refs || !written.skills || expanded.current) return;
    expanded.current = true;
    //once what they link to is on, glide back to the first, which the close-up is laid out around
    Promise.all(
      refs.map(async (ref) => {
        const read = await readNeighbors(ref.id);
        setBoard((b) => withNeighbors(b, read));
        const on = withNeighbors({ ...emptyBoard(), skills: { [ref.id]: { skill: ref, expanded: false } } }, read);
        await expandSkill(on, ref.id, setBoard);
      }),
    )
      .then(() => setBoard((b) => ({ ...b, selected: refs[0].id, focus: { id: refs[0].id } })))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [expand, refs, written.skills]);

  const items = useMemo(() => map.items.map((item) => ({ ...item, filled: false })), [map.items]);
  const visitors = useMemo<BoardNode[]>(
    () => [
      ...Object.values(board.skills).filter(({ skill }) => !map.byId.has(skill.id)).map(({ skill, from }): BoardNode => ({ id: skill.id, label: skill.name, look: 'hollow', from })),
      ...Object.values(board.traits).map(({ trait, from }): BoardNode => ({ id: trait.id, label: trait.name, look: 'pale', shape: 'diamond', from })),
      ...Object.values(board.abilities).map(({ ability, from }): BoardNode => ({ id: ability.id, label: ability.name, look: 'warm', shape: 'hexagon', from })),
      ...Object.values(board.topics).map(({ topic, from }): BoardNode => ({ id: topic.id, label: topic.name, look: 'warm', from })),
    ],
    [board.skills, board.traits, board.abilities, board.topics, map.byId],
  );
  const opened = useMemo(() => new Set(Object.values(board.skills).filter((s) => s.expanded).map((s) => s.skill.id)), [board.skills]);
  const links = useMemo(() => (show ? board.links.filter((l) => show.includes(l.kind as LinkType)) : board.links), [board.links, show]);

  if (error || written.error) return <AtlasError message={(error ?? written.error)!} />;
  if (!map.nodes) return <MapWaiting error={map.error} />;
  //with no links yet the board would draw the whole map, so a step that expands waits for what it brings on
  if (expand && !links.length) return <Thinking label={written.waiting ?? 'Bringing them onto the board'} style={stageStyles.waiting} />;
  return (
    <GraphBoard
      label={`${listed(skills)} on the skill graph`}
      noun="skills"
      items={items}
      visitors={visitors}
      links={links}
      kinds={KINDS}
      hierarchy="kind_of"
      layout={board.layout}
      selected={board.selected}
      focus={board.focus}
      opened={opened}
      onSelect={(id) => setBoard((b) => ({ ...b, selected: id }))}
      height="100%"
      title={refs && <h2 style={stageStyles.graphTitle}>{refs.length ? listed(refs.map((r) => r.name)) : 'Every skill in the Atlas'}</h2>}
    />
  );
}

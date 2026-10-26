import type { Dispatch, SetStateAction } from 'react';
import { getNeighborPage, getNeighbors, getTraitSkills, type GroupName, type Neighbor, type Neighbors, type PagedGroup, type SkillRef, type TraitLink, type TraitSkills } from './api';
import { BoardLayout } from '../shared_components/board_layout';
import type { BoardLink } from '../shared_components/graph_board';

//a skill on the board, with what's been read about it
export interface BoardSkill {
  skill: SkillRef;
  from?: string; //the skill it was brought on from
  expanded: boolean; //whether the skills linked to it that have been read are on the board
  neighbors?: Neighbors;
}

//a personality trait on the board, brought on by a skill that takes it, with the skills that take it that have been read
export interface BoardTrait {
  trait: { id: string; name: string };
  from?: string; //the skill it was brought on from
  expanded: boolean; //whether the skills that take it that have been read are on the board
  read?: TraitSkills;
}

//everything on the board. The explorer keeps it, so the board is still there on the way back from a skill
export interface SkillBoard {
  skills: Record<string, BoardSkill>;
  traits: Record<string, BoardTrait>;
  links: BoardLink[];
  layout: BoardLayout;
  selected?: string;
  focus?: { id: string };
}

type Update = Dispatch<SetStateAction<SkillBoard>>;

const GROUPS: GroupName[] = ['broader', 'narrower', 'needs', 'leads_to', 'similar'];

export const emptyBoard = (): SkillBoard => ({ skills: {}, traits: {}, links: [], layout: new BoardLayout() });

//puts a skill on the board if it isn't already, and selects it and moves to it
export function place(board: SkillBoard, skill: SkillRef): SkillBoard {
  const skills = board.skills[skill.id] ? board.skills : { ...board.skills, [skill.id]: { skill, expanded: false } };
  return { ...board, skills, selected: skill.id, focus: { id: skill.id } };
}

//keeps what was read about a skill on the board
function read(board: SkillBoard, neighbors: Neighbors): SkillBoard {
  const { id, name, status } = neighbors.skill;
  const on = board.skills[id];
  if (!on) return board;
  return { ...board, skills: { ...board.skills, [id]: { ...on, skill: { id, name, status }, neighbors } } };
}

//the link between a skill and one linked to it in `group`. "A kind of" points to the broader skill, and "Needs" to the
//skill that's needed
function linkFor(id: string, group: GroupName, other: Neighbor): BoardLink {
  switch (group) {
    case 'broader':
      return { from: id, to: other.id, kind: 'kind_of' };
    case 'narrower':
      return { from: other.id, to: id, kind: 'kind_of' };
    case 'needs':
      return { from: id, to: other.id, kind: 'needs', weight: other.strength };
    case 'leads_to':
      return { from: other.id, to: id, kind: 'needs', weight: other.strength };
    case 'similar':
      return { from: id, to: other.id, kind: 'similar' };
  }
}

//similar runs both ways, so it's the same link whichever end it was found from
const linkKey = (l: BoardLink) => (l.kind === 'similar' ? `similar:${[l.from, l.to].sort().join(':')}` : `${l.kind}:${l.from}:${l.to}`);

//brings skills linked to `id` onto the board, next to it, with their links
function bring(board: SkillBoard, id: string, found: [GroupName, Neighbor[]][]): SkillBoard {
  const skills = { ...board.skills };
  const links = [...board.links];
  const has = new Set(links.map(linkKey));
  for (const [group, others] of found) {
    for (const other of others) {
      if (!skills[other.id]) skills[other.id] = { skill: { id: other.id, name: other.name, status: other.status }, from: id, expanded: false };
      const link = linkFor(id, group, other);
      if (has.has(linkKey(link))) continue;
      has.add(linkKey(link));
      links.push(link);
    }
  }
  return { ...board, skills, links };
}

//adds links the board doesn't have yet
function addLinks(links: BoardLink[], more: BoardLink[]): BoardLink[] {
  const has = new Set(links.map(linkKey));
  const added = [...links];
  for (const link of more) {
    if (has.has(linkKey(link))) continue;
    has.add(linkKey(link));
    added.push(link);
  }
  return added;
}

//brings the traits a skill takes onto the board, next to it. "Takes" points from the skill to the trait
function bringTraits(board: SkillBoard, id: string, found: TraitLink[]): SkillBoard {
  const traits = { ...board.traits };
  for (const t of found) if (!traits[t.id]) traits[t.id] = { trait: { id: t.id, name: t.name }, from: id, expanded: false };
  const links = addLinks(board.links, found.map((t) => ({ from: id, to: t.id, kind: 'takes', weight: t.strength })));
  return { ...board, traits, links };
}

//brings skills that take a trait onto the board, next to it
function bringTakers(board: SkillBoard, id: string, found: Neighbor[]): SkillBoard {
  const skills = { ...board.skills };
  for (const s of found) if (!skills[s.id]) skills[s.id] = { skill: { id: s.id, name: s.name, status: s.status }, from: id, expanded: false };
  const links = addLinks(board.links, found.map((s) => ({ from: s.id, to: id, kind: 'takes', weight: s.strength })));
  return { ...board, skills, links };
}

//brings the skills linked to a skill that have been read onto the board
function expand(board: SkillBoard, id: string): SkillBoard {
  const on = board.skills[id];
  if (!on?.neighbors || on.expanded) return board;
  const { neighbors } = on;
  const brought = bringTraits(bring(board, id, GROUPS.map((g) => [g, neighbors[g].skills])), id, neighbors.traits);
  return { ...brought, skills: { ...brought.skills, [id]: { ...on, expanded: true } } };
}

//reads a skill that hasn't been read yet, then keeps it on the board and passes `then` the board to change further
export function readThen(board: SkillBoard, id: string, setBoard: Update, then: (b: SkillBoard) => SkillBoard = (b) => b) {
  if (board.skills[id]?.neighbors) {
    setBoard((b) => then(b));
    return Promise.resolve();
  }
  return getNeighbors(id).then((neighbors) => setBoard((b) => then(read(b, neighbors))));
}

//brings the skills linked to a skill onto the board, reading it first if it hasn't been read
export const expandSkill = (board: SkillBoard, id: string, setBoard: Update) => readThen(board, id, setBoard, (b) => expand(b, id));

//reads the next page of one way an expanded skill links, and brings those skills onto the board
export function moreOf(board: SkillBoard, id: string, group: PagedGroup, setBoard: Update) {
  const shown = board.skills[id]?.neighbors?.[group].skills.length ?? 0;
  return getNeighborPage(id, group, shown).then((page) =>
    setBoard((b) => {
      const on = b.skills[id];
      if (!on?.neighbors) return b;
      const neighbors = { ...on.neighbors, [group]: { skills: [...on.neighbors[group].skills, ...page.skills], total: page.total } };
      const brought = bring(b, id, [[group, page.skills]]);
      return { ...brought, skills: { ...brought.skills, [id]: { ...on, neighbors } } };
    }),
  );
}

//keeps what was read about a trait on the board
function readTrait(board: SkillBoard, read: TraitSkills): SkillBoard {
  const on = board.traits[read.trait.id];
  if (!on) return board;
  return { ...board, traits: { ...board.traits, [read.trait.id]: { ...on, trait: { id: read.trait.id, name: read.trait.name }, read } } };
}

//reads a trait and the first page of the skills that take it, if it hasn't been read, then passes `then` the board
export function readTraitThen(board: SkillBoard, id: string, setBoard: Update, then: (b: SkillBoard) => SkillBoard = (b) => b) {
  if (board.traits[id]?.read) {
    setBoard((b) => then(b));
    return Promise.resolve();
  }
  return getTraitSkills(id).then((read) => setBoard((b) => then(readTrait(b, read))));
}

//brings the skills that take a trait onto the board, reading it first if it hasn't been read
export const expandTrait = (board: SkillBoard, id: string, setBoard: Update) =>
  readTraitThen(board, id, setBoard, (b) => {
    const on = b.traits[id];
    if (!on?.read || on.expanded) return b;
    const brought = bringTakers(b, id, on.read.skills);
    return { ...brought, traits: { ...brought.traits, [id]: { ...on, expanded: true } } };
  });

//reads the next page of the skills that take an expanded trait, and brings them onto the board
export function moreTakers(board: SkillBoard, id: string, setBoard: Update) {
  const shown = board.traits[id]?.read?.skills.length ?? 0;
  return getTraitSkills(id, shown).then((page) =>
    setBoard((b) => {
      const on = b.traits[id];
      if (!on?.read) return b;
      const read = { ...on.read, skills: [...on.read.skills, ...page.skills], total: page.total };
      const brought = bringTakers(b, id, page.skills);
      return { ...brought, traits: { ...brought.traits, [id]: { ...on, read } } };
    }),
  );
}

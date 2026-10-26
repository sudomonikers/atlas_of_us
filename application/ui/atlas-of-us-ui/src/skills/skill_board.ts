import type { Dispatch, SetStateAction } from 'react';
import { getNeighborPage, getNeighbors, type GroupName, type Neighbor, type Neighbors, type PagedGroup, type SkillRef } from './api';
import { BoardLayout } from '../shared_components/board_layout';
import type { BoardLink } from '../shared_components/graph_board';

//a skill on the board, with what's been read about it
export interface BoardSkill {
  skill: SkillRef;
  from?: string; //the skill it was brought on from
  expanded: boolean; //whether the skills linked to it that have been read are on the board
  neighbors?: Neighbors;
}

//everything on the board. The explorer keeps it, so the board is still there on the way back from a skill
export interface SkillBoard {
  skills: Record<string, BoardSkill>;
  links: BoardLink[];
  layout: BoardLayout;
  selected?: string;
  focus?: { id: string };
}

type Update = Dispatch<SetStateAction<SkillBoard>>;

const GROUPS: GroupName[] = ['broader', 'narrower', 'needs', 'leads_to', 'similar'];

export const emptyBoard = (): SkillBoard => ({ skills: {}, links: [], layout: new BoardLayout() });

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

//brings the skills linked to a skill that have been read onto the board
function expand(board: SkillBoard, id: string): SkillBoard {
  const on = board.skills[id];
  if (!on?.neighbors || on.expanded) return board;
  const { neighbors } = on;
  const brought = bring(board, id, GROUPS.map((g) => [g, neighbors[g].skills]));
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

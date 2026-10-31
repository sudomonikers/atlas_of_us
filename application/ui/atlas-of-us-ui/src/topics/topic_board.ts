import type { Dispatch, SetStateAction } from 'react';
import { getIdea, getIdeaPage, getNeighborPage, getNeighbors, type Group, type IdeaGroupName, type IdeaNeighbors, type IdeaRef, type Linked, type Neighbors, type PagedGroup, type TopicRef, type TopicStatus } from './api';
import { BoardLayout } from '../shared_components/board_layout';
import type { BoardLink } from '../shared_components/graph_board';

//a topic on the board, with what's been read about it
export interface BoardTopic {
  topic: TopicRef;
  from?: string; //the node it was brought on from
  expanded: boolean; //whether what's linked to it that has been read is on the board
  neighbors?: Neighbors;
}

//an Idea on the board, with what's been read about it
export interface BoardIdea {
  idea: IdeaRef;
  from?: string;
  expanded: boolean;
  read?: IdeaNeighbors;
}

//a skill that needs a topic, brought on by that topic. It opens in Skills, and isn't expanded here
export interface BoardSkill {
  skill: { id: string; name: string; status: TopicStatus };
  from?: string;
}

//everything on the board. The Topics page keeps it, so the board is still there on the way back from a page
export interface TopicBoard {
  topics: Record<string, BoardTopic>;
  ideas: Record<string, BoardIdea>;
  skills: Record<string, BoardSkill>;
  links: BoardLink[];
  layout: BoardLayout;
  selected?: string;
  focus?: { id: string };
}

//something to put on the board, a topic or an Idea
export type Placed = { kind: 'topic'; topic: TopicRef } | { kind: 'idea'; idea: IdeaRef };

type Update = Dispatch<SetStateAction<TopicBoard>>;
type AnyGroup = Exclude<keyof Neighbors, 'topic'> | IdeaGroupName;

const TOPIC_GROUPS: Exclude<keyof Neighbors, 'topic'>[] = ['broader', 'narrower', 'ideas', 'needed_by', 'similar'];
const IDEA_GROUPS: IdeaGroupName[] = ['topics', 'requires', 'required_by', 'analogous'];

export const emptyBoard = (): TopicBoard => ({ topics: {}, ideas: {}, skills: {}, links: [], layout: new BoardLayout() });

//puts a topic or an Idea on the board if it isn't already, and selects it and moves to it. A new Idea floats beside `from`
export function place(board: TopicBoard, placed: Placed, from?: string): TopicBoard {
  if (placed.kind === 'topic') {
    const { topic } = placed;
    const topics = board.topics[topic.id] ? board.topics : { ...board.topics, [topic.id]: { topic, expanded: false } };
    return { ...board, topics, selected: topic.id, focus: { id: topic.id } };
  }
  const { idea } = placed;
  const ideas = board.ideas[idea.id] ? board.ideas : { ...board.ideas, [idea.id]: { idea, from, expanded: false } };
  return { ...board, ideas, selected: idea.id, focus: { id: idea.id } };
}

//the link between `id` and something linked to it in `group`. "Part of" points to the broader topic, "Includes" from a
//topic to its Idea, "Needs first" to the Idea needed, and "Needs knowledge" from a skill to the topic it needs
function linkFor(id: string, group: AnyGroup, other: Linked): BoardLink {
  switch (group) {
    case 'broader':
      return { from: id, to: other.id, kind: 'part_of' };
    case 'narrower':
      return { from: other.id, to: id, kind: 'part_of' };
    case 'ideas':
      return { from: id, to: other.id, kind: 'includes' };
    case 'topics':
      return { from: other.id, to: id, kind: 'includes' };
    case 'needed_by':
      return { from: other.id, to: id, kind: 'needs_knowledge', weight: other.strength };
    case 'similar':
      return { from: id, to: other.id, kind: 'similar' };
    case 'requires':
      return { from: id, to: other.id, kind: 'needs_first' };
    case 'required_by':
      return { from: other.id, to: id, kind: 'needs_first' };
    case 'analogous':
      return { from: id, to: other.id, kind: 'analogous' };
  }
}

//similar and analogous run both ways, so each is the same link whichever end it was found from
const linkKey = (l: BoardLink) =>
  l.kind === 'similar' || l.kind === 'analogous' ? `${l.kind}:${[l.from, l.to].sort().join(':')}` : `${l.kind}:${l.from}:${l.to}`;

//brings what's linked to `id` onto the board, next to it, with the links. Each group brings topics, Ideas or skills
function bring(board: TopicBoard, id: string, found: [AnyGroup, Linked[]][]): TopicBoard {
  const topics = { ...board.topics };
  const ideas = { ...board.ideas };
  const skills = { ...board.skills };
  const links = [...board.links];
  const has = new Set(links.map(linkKey));
  for (const [group, others] of found) {
    for (const other of others) {
      if (group === 'needed_by') {
        if (!skills[other.id]) skills[other.id] = { skill: { id: other.id, name: other.name, status: other.status ?? 'stub' }, from: id };
      } else if (group === 'ideas' || group === 'requires' || group === 'required_by' || group === 'analogous') {
        if (!ideas[other.id]) ideas[other.id] = { idea: { id: other.id, name: other.name, type: other.type ?? 'concept' }, from: id, expanded: false };
      } else if (!topics[other.id]) {
        topics[other.id] = { topic: { id: other.id, name: other.name, status: other.status ?? 'stub' }, from: id, expanded: false };
      }
      const link = linkFor(id, group, other);
      if (has.has(linkKey(link))) continue;
      has.add(linkKey(link));
      links.push(link);
    }
  }
  return { ...board, topics, ideas, skills, links };
}

//keeps what was read about a topic or an Idea on the board
function readTopic(board: TopicBoard, neighbors: Neighbors): TopicBoard {
  const { id, name, status } = neighbors.topic;
  const on = board.topics[id];
  if (!on) return board;
  return { ...board, topics: { ...board.topics, [id]: { ...on, topic: { id, name, status }, neighbors } } };
}

function readIdea(board: TopicBoard, read: IdeaNeighbors): TopicBoard {
  const { id, name, type } = read.idea;
  const on = board.ideas[id];
  if (!on) return board;
  return { ...board, ideas: { ...board.ideas, [id]: { ...on, idea: { id, name, type }, read } } };
}

//reads a topic or an Idea that hasn't been read yet, then keeps it on the board and passes `then` the board to change
//further. A skill has nothing to read
export function readThen(board: TopicBoard, id: string, setBoard: Update, then: (b: TopicBoard) => TopicBoard = (b) => b) {
  if (board.topics[id] && !board.topics[id].neighbors) return getNeighbors(id).then((n) => setBoard((b) => then(readTopic(b, n))));
  if (board.ideas[id] && !board.ideas[id].read) return getIdea(id).then((read) => setBoard((b) => then(readIdea(b, read))));
  setBoard((b) => then(b));
  return Promise.resolve();
}

//brings what's linked to a topic or an Idea that has been read onto the board
function expand(board: TopicBoard, id: string): TopicBoard {
  const topic = board.topics[id];
  if (topic?.neighbors && !topic.expanded) {
    const { neighbors } = topic;
    const brought = bring(board, id, TOPIC_GROUPS.map((g) => [g, neighbors[g].items]));
    return { ...brought, topics: { ...brought.topics, [id]: { ...topic, expanded: true } } };
  }
  const idea = board.ideas[id];
  if (idea?.read && !idea.expanded) {
    const { read } = idea;
    const brought = bring(board, id, IDEA_GROUPS.map((g) => [g, read[g].items]));
    return { ...brought, ideas: { ...brought.ideas, [id]: { ...idea, expanded: true } } };
  }
  return board;
}

//brings what's linked to a topic or an Idea onto the board, reading it first if it hasn't been read
export const expandNode = (board: TopicBoard, id: string, setBoard: Update) => readThen(board, id, setBoard, (b) => expand(b, id));

//the page of `group` read so far, for an expanded topic or Idea
export function shownOf(board: TopicBoard, id: string, group: PagedGroup | IdeaGroupName): Group | undefined {
  const topic = board.topics[id]?.neighbors;
  if (topic && group in topic) return topic[group as PagedGroup];
  const idea = board.ideas[id]?.read;
  if (idea && group in idea) return idea[group as IdeaGroupName];
  return undefined;
}

//reads the next page of one way an expanded topic or Idea links, and brings what's in it onto the board
export function moreOf(board: TopicBoard, id: string, group: PagedGroup | IdeaGroupName, setBoard: Update) {
  const shown = shownOf(board, id, group)?.items.length ?? 0;
  const isTopic = !!board.topics[id];
  const reading = isTopic ? getNeighborPage(id, group as PagedGroup, shown) : getIdeaPage(id, group as IdeaGroupName, shown);
  return reading.then((page) =>
    setBoard((b) => {
      const brought = bring(b, id, [[group, page.items]]);
      const merge = (g: Group): Group => ({ items: [...g.items, ...page.items], total: page.total });
      if (isTopic) {
        const on = brought.topics[id];
        if (!on?.neighbors) return b;
        const neighbors = { ...on.neighbors, [group]: merge(on.neighbors[group as PagedGroup]) };
        return { ...brought, topics: { ...brought.topics, [id]: { ...on, neighbors } } };
      }
      const on = brought.ideas[id];
      if (!on?.read) return b;
      const read = { ...on.read, [group]: merge(on.read[group as IdeaGroupName]) };
      return { ...brought, ideas: { ...brought.ideas, [id]: { ...on, read } } };
    }),
  );
}

//takes a node off the board: the links it brought on, and the node itself unless it's on the map, where it just stops
//being expanded. Then anything floating that nothing links to any more, other than the selected node, goes too
export function hide(board: TopicBoard, id: string, onMap: (id: string) => boolean): TopicBoard {
  const links = board.links.filter((l) => l.from !== id && l.to !== id);
  const linked = new Set(links.flatMap((l) => [l.from, l.to]));
  const selected = board.selected === id && !onMap(id) ? undefined : board.selected;
  const stays = (other: string) => other === selected || linked.has(other);
  const topics: TopicBoard['topics'] = {};
  for (const [key, on] of Object.entries(board.topics)) {
    if (key === id && onMap(id)) topics[key] = { ...on, expanded: false };
    else if (key !== id && (onMap(key) || stays(key))) topics[key] = on;
  }
  const ideas = Object.fromEntries(Object.entries(board.ideas).filter(([key]) => key !== id && stays(key)));
  const skills = Object.fromEntries(Object.entries(board.skills).filter(([key]) => key !== id && stays(key)));
  return { ...board, topics, ideas, skills, links, selected };
}

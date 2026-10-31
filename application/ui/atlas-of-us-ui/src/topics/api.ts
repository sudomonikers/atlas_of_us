import { request } from '../auth/api';
import { evidenceApi, type Evidence } from '../shared_components/evidence_api';

export type TopicStatus = 'stub' | 'filling' | 'ready' | 'failed';
export type IdeaType = 'concept' | 'claim' | 'norm' | 'value';

//a topic's six levels, Bloom's taxonomy, by rank
export const BLOOM_NAMES = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

//the four kinds of Idea, how to tell each one, and the colour its chip is drawn in
export const IDEA_TYPES: Record<IdeaType, { label: string; tell: string; colour: string }> = {
  concept: { label: 'Concept', tell: 'Something you grasp. It is not true or false.', colour: 'var(--air-force-blue)' },
  claim: { label: 'Claim', tell: 'Something that is either true or false, whether or not it can be proved.', colour: 'var(--cinnamon-wood)' },
  norm: { label: 'Norm', tell: 'Something that tells you what to do.', colour: 'var(--brown-red)' },
  value: { label: 'Value', tell: 'A good someone holds dear, more or less strongly.', colour: 'var(--gunmetal-black)' },
};

export interface TopicRef {
  id: string;
  name: string;
  status: TopicStatus;
}

export interface IdeaRef {
  id: string;
  name: string;
  type: IdeaType;
}

//a topic as search and the gates show it, with the broader topics it's a subtopic of
export interface TopicSummary extends TopicRef {
  description: string | null;
  broader: TopicRef[];
}

//one of a topic's six Bloom levels. A stub's levels only have a rank and a name
export interface Level {
  rank: number; //1 (Remember) to 6 (Create)
  name: string;
  description: string | null;
  observable_signs: string[] | null;
  example_evidence: string[] | null;
  version: number | null;
  trust: 'provisional' | 'established' | null;
}

//an Idea a topic includes, with the Ideas to understand before it
export interface Idea extends IdeaRef {
  description: string | null;
  requires: { id: string; name: string }[];
}

export interface Topic extends TopicRef {
  description: string | null;
  aliases: string[];
  levels: Level[]; //Remember to Create
  ideas: Idea[]; //empty until it's filled
  broader: TopicRef[]; //the topics it's a subtopic of
  narrower: TopicRef[]; //its subtopics
}

//what came of asking for a topic we don't have
export type AskOutcome =
  | { outcome: 'not_a_topic'; kind: 'skill' | 'personality' | 'physical_attribute' | 'other'; name: string } //it belongs to another module
  | { outcome: 'rejected'; reason: string } //nonsense, or a slur
  | { outcome: 'existing'; topic: TopicSummary } //a topic we already have
  | { outcome: 'created'; topic: TopicSummary }; //a new stub, ready to be opened

//a topic on the map of every topic, with the ids of the broader topics it's a subtopic of
export interface MapTopic extends TopicRef {
  broader: string[];
}

//every topic, for the map in Topics Explained
export const getTopicMap = () => request<MapTopic[]>('GET', '/topics/map');

//the closest topics to what was typed, each with its broader topics
export const searchTopics = (q: string) => request<TopicSummary[]>('GET', `/topics/search?q=${encodeURIComponent(q)}`);

//runs the gates and the resolver on what the user typed
export const askForTopic = (query: string) => request<AskOutcome>('POST', '/topics', { query });

export const getTopic = (id: string) => request<Topic>('GET', `/topics/${encodeURIComponent(id)}`);

//asks for a stub or failed topic to be filled. Anything else is left as it is, so it's safe to call on every open, then
//poll getTopic until it's ready
export const requestFill = (id: string) => request<{ status: TopicStatus }>('POST', `/topics/${encodeURIComponent(id)}/fill`);

//something linked to a topic or an Idea. A topic or a skill has a status and an Idea a type. A skill that needs a
//topic has the strength of its strongest link and the rank of the deepest Bloom level it needs
export interface Linked {
  id: string;
  name: string;
  status?: TopicStatus;
  type?: IdeaType;
  strength?: number;
  rank?: number;
}

//a page of what's linked one way, and how many are linked that way in all
export interface Group {
  items: Linked[];
  total: number;
}

//the ways a topic links, and the ones that come a page at a time
export type GroupName = 'broader' | 'narrower' | 'ideas' | 'needed_by' | 'similar';
export type PagedGroup = Exclude<GroupName, 'similar'>;

export interface Neighbors {
  topic: TopicRef & { description: string | null };
  broader: Group; //the topics it's a subtopic of
  narrower: Group; //its subtopics
  ideas: Group; //the Ideas it includes
  needed_by: Group; //skills whose levels need knowledge of it
  similar: Group; //the closest topics by meaning, other than its broader and narrower ones
}

//what's around a topic: the first page of each way it links, and the topic itself without its levels
export const getNeighbors = (id: string) => request<Neighbors>('GET', `/topics/${encodeURIComponent(id)}/neighbors`);

//the next page of one way a topic links, from `skip`
export const getNeighborPage = (id: string, group: PagedGroup, skip: number) =>
  request<Group>('GET', `/topics/${encodeURIComponent(id)}/neighbors/${group}?skip=${skip}`);

//the ways an Idea links, all of them a page at a time
export type IdeaGroupName = 'topics' | 'requires' | 'required_by' | 'analogous';

export interface IdeaNeighbors {
  idea: IdeaRef & { description: string | null };
  topics: Group; //the topics that include it
  requires: Group; //the Ideas to understand first
  required_by: Group; //the Ideas that build on it
  analogous: Group; //Ideas with the same structure in another field
}

//an Idea and the first page of each way it links
export const getIdea = (id: string) => request<IdeaNeighbors>('GET', `/topics/ideas/${encodeURIComponent(id)}`);

//the next page of one way an Idea links, from `skip`
export const getIdeaPage = (id: string, group: IdeaGroupName, skip: number) =>
  request<Group>('GET', `/topics/ideas/${encodeURIComponent(id)}/neighbors/${group}?skip=${skip}`);


//where the logged in user is with a topic: the Bloom level they've reached (ENGAGES_TOPIC), if they've placed
//themselves on it, and their evidence for it
export interface Engagement {
  rank: number | null; //1 (Remember) to 6 (Create)
  evidence: Evidence[]; //oldest first
}

//a topic someone has placed themselves on, with the level they've reached and their evidence
export interface EngagedTopic {
  topic: TopicRef;
  rank: number;
  updated_at: string;
  evidence: Evidence[];
}

const engagementPath = (id: string) => `/topics/${encodeURIComponent(id)}/engagement`;

export const getEngagement = (id: string) => request<Engagement>('GET', engagementPath(id));

//places the logged in user at one of a ready topic's levels, in place of any they were at before
export const setEngagement = (id: string, rank: number) => request<void>('PUT', engagementPath(id), { rank });

//takes the logged in user off a topic, with all their evidence for it
export const removeEngagement = (id: string) => request<void>('DELETE', engagementPath(id));

//adding the logged in user's evidence about a topic, once they've placed themselves on it
export const topicEvidence = (id: string) => evidenceApi(`/topics/${encodeURIComponent(id)}`);

//every topic the logged in user has placed themselves on, deepest first
export const getEngagements = () => request<EngagedTopic[]>('GET', '/topics/engagements');

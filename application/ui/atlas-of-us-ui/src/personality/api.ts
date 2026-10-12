import { request } from '../auth/api';

export interface ScenarioQuestion {
  id: string;
  key: string; //the prompt id in the scenario's script
  prompt: string;
}

export interface SavedAnswer {
  scenario: string; //scenario name, e.g. 'landfall'
  question_id: string;
  question_key: string;
  answer: string;
  reasoning?: string;
  answered_date: string;
}

export const getQuestions = (scenario: string) =>
  request<ScenarioQuestion[]>('GET', `/personality/scenarios/${encodeURIComponent(scenario)}/questions`);

//replaces any earlier answer to the same question. Refused while a scoring job is running
export const saveAnswer = (question_id: string, answer: string, reasoning?: string) =>
  request<SavedAnswer & { job_started: boolean }>('PUT', '/personality/answers', { question_id, answer, reasoning });

//every question the logged in user has answered
export const getProgress = () => request<SavedAnswer[]>('GET', '/personality/progress');

export interface TraitInfo {
  id: string;
  name: string;
  description: string | null;
}

export interface TraitScore extends TraitInfo {
  value: number; //how strongly the person has the trait, 0 to 1
  confidence: number; //how much evidence the value is based on, 0 to 1
}

//every trait we measure
export const getTraits = () => request<TraitInfo[]>('GET', '/personality/traits');

//the person's measured traits. Only the logged in user's own are allowed
export const getPersonTraits = (personId: string) =>
  request<TraitScore[]>('GET', `/personality/people/${encodeURIComponent(personId)}/traits`);

//whether the logged in user's traits are being rescored, which happens after each finished scenario
export const getJob = () => request<{ running: boolean }>('GET', '/personality/job');

export interface Shift {
  trait: string; //the trait's name
  delta: number; //-1 (towards low) to 1 (towards high)
  evidence?: string; //the llm's reason. Missing when the shift is the picked choice's base score
}

export interface AnswerEvidence {
  scenario: string; //the scenario's title
  question: string;
  answer: string;
  reasoning: string | null;
  shifts: Shift[];
}

//every scored answer and how it moved the person's traits. Only the logged in user's own are allowed
export const getPersonEvidence = (personId: string) =>
  request<AnswerEvidence[]>('GET', `/personality/people/${encodeURIComponent(personId)}/evidence`);

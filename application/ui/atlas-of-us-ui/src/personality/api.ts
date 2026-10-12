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

//replaces any earlier answer to the same question
export const saveAnswer = (question_id: string, answer: string, reasoning?: string) =>
  request<SavedAnswer>('PUT', '/personality/answers', { question_id, answer, reasoning });

//every question the logged in user has answered
export const getProgress = () => request<SavedAnswer[]>('GET', '/personality/progress');

export interface TraitInfo {
  id: string;
  name: string;
  description: string | null;
}

export interface TraitScore extends TraitInfo {
  value: number; //how strongly the person has the trait, 0 to 1
}

//every trait we measure
export const getTraits = () => request<TraitInfo[]>('GET', '/personality/traits');

//the person's measured traits. Only the logged in user's own are allowed
export const getPersonTraits = (personId: string) =>
  request<TraitScore[]>('GET', `/personality/people/${encodeURIComponent(personId)}/traits`);

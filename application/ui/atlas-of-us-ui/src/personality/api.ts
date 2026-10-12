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

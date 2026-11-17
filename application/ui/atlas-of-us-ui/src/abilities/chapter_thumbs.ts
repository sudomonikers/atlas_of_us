import type { Area } from './api';

//each chapter's picture, a still of its opening scene, by its id
export const THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob<string>('./chapters/*.jpg', { eager: true, import: 'default' })).map(([path, url]) => [path.split('/')[2].replace('.jpg', ''), url]),
);

//the chapter on each area of abilities, by the abilities' category
export const AREA_CHAPTER: Record<Area, string> = { Physical: 'body', Psychomotor: 'coordination', Sensory: 'senses', Cognitive: 'mind' };

import type { ComponentType } from 'react';
import { Classroom } from './classroom';
import { Kitchen } from './kitchen';

//where a collection's board hangs: the scene drawn behind it, the wall's color while it draws, and how far down the
//board starts, clear of what runs along the top of the scene
export interface Scene {
  Backdrop: ComponentType;
  wall: string;
  top: number;
}

const CLASSROOM: Scene = { Backdrop: Classroom, wall: '#efe6cf', top: 76 };

//each collection's scene, by its id. A collection without one hangs its board in the classroom
const SCENES: Record<string, Scene> = {
  'common-knowledge': CLASSROOM,
  'life-knowledge': { Backdrop: Kitchen, wall: '#e4ead6', top: 104 },
};

export const sceneFor = (collectionId: string): Scene => SCENES[collectionId] ?? CLASSROOM;

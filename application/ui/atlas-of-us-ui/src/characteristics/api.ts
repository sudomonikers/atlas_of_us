import { request } from '../auth/api';

//a fact about the user's body that's one of a few choices, such as which hand they use, with their answer
export interface Characteristic {
  key: string; //what it's sent by
  name: string;
  question: string; //what Atlas asks
  choices: string[];
  value: string | null; //one of the choices, or null when they haven't said
}

//every characteristic, in the order they're asked
export const getCharacteristics = () => request<Characteristic[]>('GET', '/characteristics');

//changes the characteristics sent, by key, each to one of its choices or to null to take the answer back, and returns
//them all. A change of sex works out the user's abilities again, since who they're compared with moves every percentile
export const setCharacteristics = (change: Record<string, string | null>) => request<Characteristic[]>('PUT', '/characteristics', change);

//the hand the user uses most, left or right, when they've said it's one of them
export const handOf = (characteristics: Characteristic[]) => {
  const said = characteristics.find((c) => c.key === 'handedness')?.value;
  return said === 'Left' || said === 'Right' ? said.toLowerCase() : null;
};

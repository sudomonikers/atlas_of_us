// The shape of a test persona. Personas are shared by every module, and a persona takes part in a module when it has
// that module's key, e.g. `personality: { targets, answers }`.

export interface Account {
  phone: string; //E.164, e.g. +15555550101
  password: string;
  first_name: string;
  last_name: string;
  birthday: string; //YYYY-MM-DD
  email: string;
  username: string;
}

//a scripted answer to one prompt. A string answers a free-text prompt. { choice, text } picks a choice with text as the
//reasoning, left is the clock's seconds remaining when it's given, and ran_out: true runs the clock out straight after it
export type Answer = string | { choice: number; text: string; left?: number; ran_out?: boolean };

//an impairment the persona notes, in a body function or a body part, by its name as the ui shows it
export interface Impairment {
  in: string;
  part?: boolean; //a body part rather than a body function
  extent: 'mild' | 'moderate' | 'severe' | 'complete';
  change?: string; //for a part, how it has changed, as the ui labels it, such as "Partial absence"
}

//a condition the persona notes, by its name as the ui shows it
export interface Condition {
  name: string;
  severity?: 'mild' | 'moderate' | 'severe';
  diagnosed: boolean;
  managed: boolean;
}

//the persona's body and what it can do, as it enters them in the Abilities chapters. Anything left out is skipped
export interface Abilities {
  targets: Record<string, number>; //ability name to where what the persona enters places it, 0 to 1
  characteristics: Record<string, string>; //characteristic name to its choice, such as Sex: 'Female'
  //measurement name to its reading in the measurement's unit. A measurement typed in takes it as it is, and a test the
  //app runs is played to score it. Sit and Reach is cm past the toes, and negative for short of them
  readings: Record<string, number>;
  brick_uses?: string[]; //the uses typed in Brick Uses, which the api scores
  impairments: Impairment[];
  conditions: Condition[];
}

export interface Persona {
  name: string;
  account: Account;
  personality?: {
    targets: Record<string, number>; //trait name to the score its answers show, 0 to 1
    answers: Record<string, Record<string, Answer>>; //scene id to prompt id to answer
  };
  abilities?: Abilities;
}

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

export interface Persona {
  name: string;
  account: Account;
  personality?: {
    targets: Record<string, number>; //trait name to the score its answers show, 0 to 1
    answers: Record<string, Record<string, Answer>>; //scene id to prompt id to answer
  };
}

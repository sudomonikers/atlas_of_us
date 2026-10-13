import { useSyncExternalStore } from 'react';

export interface Person {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  email: string;
  birthday: string; //YYYY-MM-DD
  username: string;
  public: boolean; //whether anyone can see their profile at /u/{username}
  admin: boolean; //set by hand in the graph, unlocks /admin
}

export interface NewPerson extends Omit<Person, 'id' | 'public' | 'admin'> {
  password: string;
}

interface AuthResponse {
  token: string;
  expires_at: string;
  person: Person;
}

const TOKEN_KEY = 'atlas.token';

//calls the api with the stored token, if any. Failures throw with the api's message
export async function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new Error("Couldn't reach the server. Try again in a moment.");
  });
  //the api's 4xx messages are written for users. Anything else could be a raw error, so it's never shown
  if (res.status >= 500) throw new Error('Something went wrong on our end. Please try again.');
  if (!res.ok) throw new Error((await res.text()) || 'Something went wrong. Please try again.');
  return res.status === 204 ? (undefined as T) : res.json();
}

const authenticate = async (path: string, body: unknown) => {
  const { token, person } = await request<AuthResponse>('POST', path, body);
  localStorage.setItem(TOKEN_KEY, token);
  setSession({ status: 'authenticated', person });
  return person;
};

export const login = (phone: string, password: string) => authenticate('/auth/login', { phone, password });

export const createUser = (person: NewPerson) => authenticate('/auth/create-user', person);

//opts the profile in or out of being seen by anyone. Private by default
export const setPublic = async (on: boolean) => {
  const person = await request<Person>('PUT', '/auth/public', { public: on });
  setSession({ status: 'authenticated', person });
  return person;
};

export const logout = async () => {
  await request('POST', '/auth/logout').catch(() => {}); //stateless on the api, so dropping the token is what matters
  localStorage.removeItem(TOKEN_KEY);
  setSession({ status: 'anonymous' });
};

/* ---------------------------------------------------------------------------------------------
 * session: who is logged in, shared by every component through useSession
 * ------------------------------------------------------------------------------------------- */

export type Session = { status: 'checking' } | { status: 'anonymous' } | { status: 'authenticated'; person: Person };

let session: Session = localStorage.getItem(TOKEN_KEY) ? { status: 'checking' } : { status: 'anonymous' };
const listeners = new Set<() => void>();

function setSession(next: Session) {
  session = next;
  listeners.forEach((listener) => listener());
}

//a stored token is checked once when the app loads; an expired or invalid one is thrown away
if (session.status === 'checking') {
  request<Person>('GET', '/auth/me')
    .then((person) => setSession({ status: 'authenticated', person }))
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setSession({ status: 'anonymous' });
    });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSession = () => useSyncExternalStore(subscribe, () => session);

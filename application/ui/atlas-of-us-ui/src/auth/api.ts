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
const TOKEN_HEADER = 'X-Atlas-Token';

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const RETRY_MS = 500;
//how long a GET or PUT waits for a response before it's sent again. The api answers in well under a second, and a
//request sent down a dead connection otherwise hangs until the OS gives up on it, which takes minutes
const TIMEOUT_MS = 15_000;

//calls the api with the stored token, if any. Failures throw with the api's message.
//A GET, PUT or DELETE that gets no response at all, or none within TIMEOUT_MS, is sent once more: a browser waking from
//sleep, back from another app, or idle for a while can send the first request down a connection that died while it was
//away. They're safe to repeat, and POSTs never are
export async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const payload = body === undefined ? '' : JSON.stringify(body);
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(crypto.subtle && { 'x-amz-content-sha256': await sha256(payload) }),
      ...(token && { [TOKEN_HEADER]: token }),
    },
    body: body === undefined ? undefined : payload,
  };
  const send = () => fetch(`/api${path}`, method === 'POST' ? init : { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const res = await send()
    .catch((e) => {
      if (method === 'POST') throw e;
      return new Promise((resolve) => setTimeout(resolve, RETRY_MS)).then(send);
    })
    .catch(() => {
      throw new Error("I can't reach my server. Give it a moment and try again.");
    });
  //the api's 4xx messages are written for users. Anything else could be a raw error, so it's never shown
  if (res.status >= 500) throw new Error("Something broke on my end, not yours. Try again?");
  if (!res.ok) throw new Error((await res.text()) || 'Something went sideways. Try again?');
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

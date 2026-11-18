import { useSyncExternalStore } from 'react';

//the atlas-api, served at /api on this site as on atlas-of-us.com, with the same accounts. A login token is kept for
//this site alone, so people log in here with the same phone and password

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface SignedIn {
  person: Person;
}

interface AuthResponse extends SignedIn {
  token: string;
}

const TOKEN_KEY = 'atlas.business.token';
const TOKEN_HEADER = 'X-Atlas-Token';
//the main site, where people make an account and add what they know and can do
export const ATLAS = 'https://atlas-of-us.com';

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const RETRY_MS = 500;
//how long a GET waits for a response before it's sent again
const TIMEOUT_MS = 15_000;

//calls the api with the stored token, if any. Failures throw with a message to show. A GET that gets no response, or
//none in time, is sent once more, since a connection can die while a tab is in the background. POSTs never are.
//CloudFront signs requests to the api, and a signed request needs the hash of its body
export async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const token = readToken();
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
      throw new Error("We can't reach the server. Check your connection and try again.");
    });
  //the api's 4xx messages are written for people. Anything else could be a raw error, so it's never shown
  if (res.status >= 500) throw new Error('Something went wrong on our end. Please try again.');
  if (!res.ok) throw new Error((await res.text()) || 'Something went wrong. Please try again.');
  return res.status === 204 ? (undefined as T) : res.json();
}

//storage can be unavailable, in a private window or with site data blocked, and the app still works without it
function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    //kept for this page only
  }
}

export const login = async (phone: string, password: string) => {
  const { token, person } = await request<AuthResponse>('POST', '/auth/login', { phone, password });
  writeToken(token);
  setSession({ status: 'authenticated', person });
};

//the api is stateless, so dropping the token is logging out, straight away, before anything else can be sent with it
export const logout = () => {
  writeToken(null);
  setSession({ status: 'anonymous' });
};

/* ---------------------------------------------------------------------------------------------
 * session: who is logged in, shared by every component through useSession
 * ------------------------------------------------------------------------------------------- */

export type Session = { status: 'checking' } | { status: 'anonymous' } | ({ status: 'authenticated' } & SignedIn);

let session: Session = readToken() ? { status: 'checking' } : { status: 'anonymous' };
const listeners = new Set<() => void>();

function setSession(next: Session) {
  session = next;
  listeners.forEach((listener) => listener());
}

//a stored token is checked once when the app loads; an expired or invalid one is thrown away
if (session.status === 'checking') {
  request<SignedIn>('GET', '/auth/me')
    .then((me) => setSession({ status: 'authenticated', person: me.person }))
    .catch(() => {
      writeToken(null);
      setSession({ status: 'anonymous' });
    });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSession = () => useSyncExternalStore(subscribe, () => session);

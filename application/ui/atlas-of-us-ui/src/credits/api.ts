import { useEffect, useSyncExternalStore } from 'react';
import { request, useSession } from '../auth/api';

//a price as Stripe has it, in the currency's smallest unit
export interface Price {
  amount: number;
  currency: string;
}

//the logged in person's credits, which pay for Atlas's written summaries, and what they can buy
export interface Balance {
  credits: number;
  subscribed_until: string | null; //when their subscription's paid period ends, while it hasn't. Unlimited until then
  has_customer: boolean; //whether they've bought anything, so they can manage it
  for_sale: { pack_credits: number; pack: Price; subscription: Price } | null; //null when buying isn't set up
}

export type Kind = 'pack' | 'subscription';

export const getCredits = () => request<Balance>('GET', '/credits');

//sends them to Stripe to pay for a pack or the subscription
export const checkout = async (kind: Kind) => {
  const { url } = await request<{ url: string }>('POST', '/credits/checkout', { kind });
  window.location.href = url;
};

//settles the checkout they've come back from
export const confirm = async (checkout: string) => setBalance(await request<Balance>('POST', '/credits/confirm', { checkout }));

//sends them to Stripe to manage or cancel their subscription
export const manage = async () => {
  const { url } = await request<{ url: string }>('POST', '/credits/portal');
  window.location.href = url;
};

export const price = ({ amount, currency }: Price) =>
  (amount / 100).toLocaleString('en-US', { style: 'currency', currency: currency.toUpperCase() });

/* ---------------------------------------------------------------------------------------------
 * the balance, shared by the nav, the credits page and every premium feature through useCredits
 * ------------------------------------------------------------------------------------------- */

let balance: Balance | undefined;
const listeners = new Set<() => void>();

function setBalance(next: Balance | undefined) {
  balance = next;
  listeners.forEach((listener) => listener());
}

//reads the balance again, after something may have spent or given back a credit
export const refreshCredits = () => getCredits().then(setBalance, () => {});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

//the logged in person's balance, read once they're logged in and dropped when they log out. undefined until it's read
export const useCredits = () => {
  const session = useSession();
  const signedIn = session.status === 'authenticated' ? session.person.id : undefined;
  useEffect(() => {
    if (!signedIn) setBalance(undefined);
    else if (!balance) refreshCredits();
  }, [signedIn]);
  return useSyncExternalStore(subscribe, () => balance);
};

//whether they can have a premium feature written now: subscribed, or with a credit to spend. True until the balance is read
export const canSpend = (b: Balance | undefined) => !b || !!b.subscribed_until || b.credits > 0;

//what a premium feature's button says it costs
export const cost = (b: Balance | undefined) => (b?.subscribed_until ? '' : ' · 1 credit');

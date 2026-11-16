# How Credits Work

Credits pay for the premium features: Atlas's written summaries, which each take a call to Sonnet. Today those are the
**physical summary** on Your results and the **personality report** on My Personality.

## The pieces

| Piece | Where | What it does |
|---|---|---|
| UI | `application/ui/atlas-of-us-ui/src/credits/` | The Credits page, the balance in the nav, and the button a premium feature shows when they're out |
| API | `application/apis/atlas-api/src/credits/` | The balance, buying through Stripe, and spending and giving back credits for every premium feature |
| Jobs | `application/apis/atlas-jobs/src/jobs/` | Each premium feature's job gives the credit back when it can't write |
| Stripe | Stripe's dashboard | What's for sale and at what price, Checkout and the customer portal |

## Getting credits
- **Every account starts with 3.**
- **A pack** adds a set number of credits, which never run out.
- **A subscription** is unlimited use for as long as it's paid. While it's paid, premium features spend nothing.
- **What's for sale is set up in Stripe.** The pack and the subscription are the active prices with the lookup keys
  `credits_pack` and `unlimited_monthly`, and the pack's price has how many credits it is in its `credits` metadata.
  A price is changed by making a new one in Stripe and moving the lookup key to it, with nothing to deploy. A pack
  bought adds the credits its price had when it was bought.
- **Buying goes through Stripe Checkout,** Stripe's own page, so card details never reach the Atlas. The subscription
  is managed and canceled on Stripe's customer portal.

## Settling a purchase
The api asks Stripe what happened to a checkout, rather than waiting for Stripe to tell it.

1. Each checkout a person starts is kept on them.
2. When Stripe sends them back to the Credits page, the api reads that checkout from Stripe and adds what it bought.
   Each checkout is added once, however often it's read.
3. A checkout they never came back from is settled the next time their credits are read, or they spend one. One that
   expired unpaid is dropped.
4. A subscription past the end of its paid period is read again from Stripe at the same moments: renewed, it's
   extended; canceled, it ends.

## Spending
- **Each write of a premium feature costs a credit,** including writing a stale one again. Asking for one that's
  already being written or is up to date costs nothing.
- **Out of credits,** the feature offers to get more instead.
- **A write that fails gives the credit back,** once: when it can't be queued, when its job fails, or when it hasn't
  arrived in the time it's given.
- **Adding a premium feature** means spending a credit where it's asked for and giving it back wherever it fails, with
  the helpers in the api's credits module.

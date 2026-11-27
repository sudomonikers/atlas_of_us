# Soulmates by Atlas Of Us

The soulmates site, soulmates.atlas-of-us.com. People don't browse or swipe: they log in with their Atlas account, fill
out whatever's missing on atlas-of-us.com, and are matched with one person from everything the Atlas knows about them.
It's a React and Vite app like atlas-business-ui, and it calls the same atlas-api at `/api`.

## Running it

```sh
npm install
npm run dev
```

It serves on port 5176 and sends `/api` to the atlas-api on port 3000, or to `ATLAS_API` when it's set.

## Deploying it
The bucket and CloudFront are in `application/infrastructure/soulmates_hosting.tf`. Once they're applied:

```sh
npm run deploy
```

## What's in it

| Where | What |
|---|---|
| `src/welcome.tsx` | What this is, and logging in |
| `src/ready.tsx` | How much of their Atlas is filled out, with links to finish it |
| `src/match.tsx` | Unboxing their match: a gift to open, then who they are and why they fit. Mocked until matching is built |

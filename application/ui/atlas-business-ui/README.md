# Atlas Of Us for Business

The business site, business.atlas-of-us.com: the occupations a person is closest to, and how far they are from any of
them (`documentation/architecture/occupations.md`). It's a React and Vite app, like atlas-of-us-ui, with its own
professional look in the Atlas palette. It calls the same atlas-api at `/api`, with the same accounts.

## Running it

```sh
npm install
npm run dev
```

It serves on port 5175 and sends `/api` to the atlas-api on port 3000. `ATLAS_API` sends it to another, such as a
second copy on 3001:

```sh
ATLAS_API=http://localhost:3001 npm run dev
```

## Deploying it
The bucket and CloudFront are in `application/infrastructure/business_hosting.tf`. Once they're applied:

```sh
npm run deploy
```

It builds the app and syncs it to the `atlas-of-us-business-site` bucket, with the hashed assets cached for good and
everything else checked on every load.

## What's in it

| Where | What |
|---|---|
| `src/api.ts` | Calls to the api, and who's logged in. The login is kept for this site |
| `src/login.tsx` | Logging in with an Atlas account |
| `src/occupations/home.tsx` | Search, and the occupations closest to you |
| `src/occupations/occupation_page.tsx` | One occupation, with where you are on everything it takes |

Occupation data is O\*NET's, under CC BY 4.0, and the footer credits it on every page.

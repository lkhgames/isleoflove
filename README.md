# Isle of Love

A narrative, choice-driven dating-sim game loosely inspired by Fusebox's *Love Island: The Game* — players make dialogue choices that shift compatibility with islanders, and can couple up once compatibility is high enough.

Monorepo with a Node.js/TypeScript API and a React web client.

## Tech stack

Everything below is open source.

| Layer | Choice | Why |
| --- | --- | --- |
| Backend language | Node.js + TypeScript | Shared types/tooling with the frontend |
| Backend framework | [Express](https://expressjs.com/) | Minimal, well-understood HTTP layer |
| ORM / DB | [Prisma](https://www.prisma.io/) + SQLite (dev), Postgres (prod-ready via `docker-compose.yml`) | Typed schema/queries, zero-setup local dev |
| Backend BDD testing | [cucumber-js](https://github.com/cucumber/cucumber-js) | Gherkin scenario tests exercise real game rules (e.g. "compatibility can't exceed the max", "coupling fails below the threshold") against the domain logic and a real (SQLite) database |
| Frontend framework | [React](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript | Fast dev loop, huge ecosystem |
| Distribution | [PWA](https://web.dev/explore/progressive-web-apps) via [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Installable on desktop/mobile, offline-capable, free to ship (static hosting, no app store fees) |
| Frontend e2e testing | [Playwright](https://playwright.dev/) | Browser-driven tests against the real rendered UI |

## Repo layout

```
backend/    Express API, Prisma schema, domain logic, cucumber-js features
frontend/   React + Vite client, Playwright e2e tests
docker-compose.yml   optional Postgres for production-like local runs
```

## Getting started

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev   # creates the local SQLite db
npm run dev              # http://localhost:3001
```

Run the BDD scenario suite:

```bash
npm run test:bdd
```

Feature files live in `backend/features/*.feature`; step definitions in `backend/features/step_definitions/`. Each scenario resets the database in a `Before` hook (see `backend/features/support/hooks.ts`) so scenarios stay independent.

To use Postgres instead of SQLite: run `docker compose up -d` from the repo root, set `DATABASE_URL` in `backend/.env` to the Postgres connection string (commented example in `.env.example`), and change `provider` in `backend/prisma/schema.prisma` to `"postgresql"`.

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, expects the backend on :3001
```

Run the Playwright e2e suite (spins up the dev server automatically):

```bash
npm run test:e2e
```

Tests live in `frontend/tests/e2e/`.

### PWA

The frontend is a Progressive Web App (config in `frontend/vite.config.ts`, icons in `frontend/public/`). The service worker only activates in a production build, not `npm run dev`, so to test installability locally:

```bash
npm run build
npm run preview   # http://localhost:4173
```

Open that URL in Chrome/Edge and look for the install icon in the address bar. Source icons are `frontend/public/icon.svg` and `frontend/public/maskable-icon.svg` — regenerate the PNGs if you change them (resize to 192×192, 512×512, and a 180×180 apple-touch-icon; the maskable one needs its artwork kept inside the center ~80% safe zone since OSes crop it into shapes).

## Game domain (current scaffold)

- **Islander** — an NPC contestant with a name and bio.
- **Player** — the user playing through the story.
- **Episode** / **Choice** — story beats; each choice can carry a `compatibilityDelta` for a specific islander.
- **Relationship** — tracks compatibility (0–100) between a player and an islander, and whether they're coupled up (requires compatibility ≥ 50).

This is intentionally a thin vertical slice — enough domain, API, and tests to build on, not a finished game.

## Deployment (free hosting)

Backend on [Fly.io](https://fly.io) (free allowance includes a persistent volume, so the existing SQLite setup works as-is), frontend on [Cloudflare Pages](https://pages.cloudflare.com/) (unlimited free bandwidth). Both CLIs are already installed by this scaffold; you just need to log in once with your own account — nobody else can do that step for you.

### One-time setup

```bash
# Backend — log in, then create the app and its persistent volume
"$USERPROFILE/.fly/bin/flyctl" auth login
cd backend
flyctl apps create isle-of-love-api
flyctl volumes create isle_of_love_data --region lhr --size 1 -a isle-of-love-api

# Frontend — log in
cd ../frontend
npx wrangler login
```

(`flyctl` installs to `%USERPROFILE%\.fly\bin`; add it to your PATH, or keep calling it by full path / restart your shell so the installer's PATH update takes effect.)

If you're not near London, change `primary_region` in `backend/fly.toml` and the `--region` flag above to whichever [Fly.io region](https://fly.io/docs/reference/regions/) is closest to your players.

### Deploying

```bash
cd backend && npm run deploy    # fly deploy — builds remotely, no local Docker needed
cd frontend && npm run deploy   # builds the PWA and pushes to Cloudflare Pages
```

The frontend build is pinned to `https://isle-of-love-api.fly.dev` via `frontend/.env.production` (`VITE_API_BASE_URL`) — update that if you pick a different Fly app name.

Re-run `npm run deploy` in either folder any time you want to ship changes; there's no CI/CD wiring yet, so deploys are manual until you want to add that.

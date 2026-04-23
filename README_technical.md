# UW Social Technical README

This document describes how UW Social is structured, how to develop and validate changes locally, and how deployment works.

## 1. Architecture Overview

UW Social is a Vue 3 + TypeScript single-page application (SPA) deployed as static assets on GitHub Pages.

Primary architecture characteristics:

- Frontend-first app in `Frontend/`.
- Uses Firebase services directly from the client:
	- Firebase Authentication for sign-in/session.
	- Cloud Firestore for events, users, forums, and post data.
	- Firebase Storage for media assets (for example profile/event images).
- Uses Pinia for client-side state management.
- Uses Vue Router with hash history for route compatibility in static hosting.
- Uses Vite for local development and production builds.
- Includes optional API integration via Axios (`/api` proxy in dev, production base URL configured in code).

## 2. Runtime Flow

### App bootstrap

At startup (`Frontend/src/main.ts`):

1. Vue app is created.
2. Pinia, router, and Element Plus are registered.
3. User auth state is restored via `userStore.loadUser()`.
4. Page-view analytics hook is attached in router navigation.
5. Google Maps script is loaded dynamically if `VITE_GOOGLE_MAPS_API_KEY` is available.
6. App mounts to `#app`.

### Routing and auth gating

- Router is defined in `Frontend/src/router/index.ts`.
- History mode: `createWebHashHistory(import.meta.env.BASE_URL)`.
- Auth-protected routes use `meta.requiresAuth`.
- Global guard redirects unauthenticated users to `/login` and preserves redirect target in query params.

### Data access patterns

- Firestore access is centralized through Firebase instances in `Frontend/src/firebase/config.ts`.
- Domain-specific API helpers are under `Frontend/src/api/`.
- State is coordinated through Pinia stores in `Frontend/src/stores/`.

Examples:

- `Frontend/src/stores/event.ts` fetches and sorts events from Firestore.
- `Frontend/src/stores/user.ts` handles Google sign-in, auth persistence, and user document initialization.
- `Frontend/src/api/forums.ts` handles forum listing, forum creation per event, and realtime post subscription.

## 3. Repository and Directory Structure

Root wrapper workspace:

- `package.json`: convenience scripts forwarding to `Frontend/`.
- `AGENTS.md`: internal agent workflow constraints and expected validation steps.
- `README.md`: high-level product overview.
- `README_technical.md`: this document.
- `.github/workflows/deploy.yml`: build/deploy pipeline to GitHub Pages.

Main application (`Frontend/`):

- `src/main.ts`: app bootstrap.
- `src/App.vue`: app shell and global layout.
- `src/router/`: route definitions and auth guards.
- `src/views/`: page-level views (Events, Clubs, Forums, Profile, Publish, etc.).
- `src/components/`: reusable UI components and mobile-specific components.
- `src/stores/`: Pinia stores for users/events/clubs/tags.
- `src/api/`: API abstraction modules (forums, optional backend API wrapper).
- `src/firebase/`: Firebase initialization and exported service handles.
- `src/types/`: shared TypeScript interfaces and model helpers.
- `src/assets/`: CSS files and design system styles.
- `src/utils/`: utility modules (event helpers, Google Maps helper).
- `scripts/migrate-forums.mjs`: Firestore migration utility for old event-post data to forums.
- `firestore.rules`: Firestore security rules.
- `firestore.indexes.json`: Firestore indexes config.
- `vite.config.ts`: Vite config, aliases, proxy, base path, ONNX/WASM MIME support.

Public assets and models:

- `public/models/` and `src/components/models/` include ONNX model assets.
- `public/tokenizer/` contains tokenizer data used by transformer-related dependencies.

## 4. Technology Stack

Core:

- Vue 3
- TypeScript (strict mode)
- Vue Router 4
- Pinia
- Vite
- Element Plus

Data and cloud:

- Firebase Auth
- Cloud Firestore
- Firebase Storage

Auxiliary packages present in codebase:

- Axios (API wrapper)
- Google Maps JavaScript API loader/types
- Fuse.js
- Transformer/ONNX-related libraries (`@huggingface/transformers`, `@xenova/transformers`, `onnxruntime-web`, `tokenizers`)

## 5. Environment Configuration

Environment variables are used for Firebase, Google Maps, and deployment base path.

Common variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_BASE_PATH`
- `VITE_API_BASE_URL` (used in some deployment variants)

Notes:

- Frontend runtime env is read with `import.meta.env`.
- `scripts/migrate-forums.mjs` expects env vars via Node process environment and is designed to run with `.env.local`.

## 6. Local Development Workflow

### Prerequisites

- Node.js 18+ recommended.
- npm.

### Install dependencies

From repository root:

```bash
npm run install-frontend
```

Equivalent direct command:

```bash
cd Frontend
npm install
```

### Start development server

From root:

```bash
npm run dev
```

From `Frontend/`:

```bash
npm run dev
```

Implementation details:

- Vite serves with `--host 0.0.0.0`.
- Vite proxy forwards `/api` to `http://localhost:5000` in development.
- Aliases:
	- `@` -> `Frontend/src`
	- `@svg` -> `Frontend/public/svg`

### Build and preview

Build:

```bash
npm run build
```

Preview built output:

```bash
npm run preview
```

## 7. Testing and Validation Workflow

Current state:

- There is no dedicated automated test runner configured (no Vitest/Jest/Cypress scripts).
- Validation currently relies on TypeScript/compiler constraints and manual smoke testing.

Recommended validation before merge:

1. Run production build:

```bash
npm run build
```

2. Run manual smoke checks on affected areas:
	 - Auth flow: login, redirect after login, logout.
	 - Events flow: list, detail, create/edit/delete where applicable.
	 - Clubs flow: list/detail/interactions.
	 - Forums flow: forum list, detail, posting, realtime update.
	 - Profile flow: profile load/edit updates.

3. If deployment-related changes were made:
	 - Verify base path behavior locally with matching env.
	 - Validate route refresh and deep-link behavior with hash routing.

## 8. Data Model and Firestore Notes

Core collections used by app code:

- `users`
- `events`
- `forums`
- `forums/{forumId}/posts` subcollections

Legacy/migration context:

- Older event post paths under `events/{eventId}/posts` can be migrated to forum documents/posts with `npm run migrate:forums` inside `Frontend/`.

Security rules:

- Defined in `Frontend/firestore.rules`.
- Enforces authenticated writes for protected documents.
- Restricts updates/deletes to owner IDs where specified.

## 9. Deployment Workflow

Deployment is managed by GitHub Actions in `.github/workflows/deploy.yml`.

### Trigger conditions

- Push to `main` or `alpha`.
- Manual trigger via `workflow_dispatch`.

### Build job

1. Checkout repository.
2. Generate `Frontend/.env` from GitHub Secrets.
3. Set repo-specific `VITE_BASE_PATH` and related values.
4. Setup Node.js 18.
5. Install dependencies in `Frontend/`.
6. Build with `npm run build`.
7. Upload `Frontend/dist` as Pages artifact.

### Deploy job

- Uses `actions/deploy-pages@v4`.
- Environment name is chosen by branch:
	- `main` -> `github-pages`
	- `alpha` -> `alpha`

## 10. Operational Guidelines for Contributors

- Keep changes targeted; avoid unrelated refactors.
- Preserve strict TypeScript compatibility.
- When adding/changing fields in Firestore documents:
	- Update shared types in `Frontend/src/types/`.
	- Update all stores/forms/views depending on those fields.
- Keep auth routing behavior intact (`meta.requiresAuth`, redirect query handling).
- Do not commit secrets or private keys.

## 11. Known Gaps and Suggested Next Improvements

- Add automated tests (unit + component + optional e2e).
- Add linting/formatting scripts and CI checks for consistency.
- Consolidate Firebase initialization modules (`src/firebase/config.ts` and `src/firebase/index.ts`) to one source of truth.
- Clarify and standardize API strategy (direct Firestore-first vs optional `/api` backend paths).


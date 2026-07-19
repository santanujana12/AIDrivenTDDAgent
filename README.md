# ticket-tdd

`ticket-tdd` is an Nx integrated monorepo for a React frontend, an Express backend, and shared TypeScript API types.

## Install

Install all workspace dependencies from the repository root:

```bash
npm install
```

## Run the apps

Run both applications together:

```bash
npx nx run-many -t serve -p backend,frontend
```

Or use two terminals:

```bash
npx nx serve backend
npx nx serve frontend
```

The Express backend listens on port `4000` by default. The Vite frontend listens on port `5173` by default.

## Shared types

All API request and response shapes live in `libs/shared-types`. Import them as `@ticket-tdd/shared-types`; do not duplicate those types in either application.

## Environment files

Copy the documented values from the root `.env.example` into the application-specific environment files. Never commit real credentials.

- `apps/backend/.env` needs `PORT`, `OPENAI_API_KEY`, `OPENAI_MODEL`, and `FRONTEND_ORIGIN`.
- `apps/frontend/.env` needs `VITE_API_BASE_URL`.

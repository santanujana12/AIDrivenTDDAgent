# TicketTDD — Frontend

React 19 + Vite frontend for the TicketTDD hackathon app. Lets developers view their assigned Jira tickets, move them through workflow transitions, connect a local codebase folder, and generate AI-written tests and implementations.

## Setup

Create `apps/frontend/.env` in this directory:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Run

From the **repository root**:

```bash
npm install
npx nx serve frontend
```

The app runs on `http://localhost:5173` by default. The backend must also be running on port 4000 (`npx nx serve backend` in a second terminal).

To run both at once:

```bash
npx nx run-many -t serve -p backend,frontend
```

## shadcn/ui components used

`button`, `card`, `badge`, `input`, `label`, `select`, `dialog`, `skeleton`, `collapsible`, `checkbox`, `sonner`

All components are in `src/components/ui/`.

## Browser requirement

The **"Connect Codebase"** feature uses the [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access), which requires **Chrome or Edge** (Chromium-based). The rest of the app works in any modern browser.

## Architecture notes

- **Redux slices**: `jiraAuthSlice` (credentials — in-memory only), `repoSlice` (file tree metadata), `ticketWorkflowSlice` (generation results, ticket version counter)
- **`FileSystemFileHandle` objects** are kept in a module-level `Map` (`api/fileHandleStore.ts`) outside Redux so Redux state stays serializable
- **React 19 primitives**: `useActionState` for the Jira connect form, `useOptimistic` + `useTransition` for ticket transitions, `useEffect` + `AbortController` for data fetching
- **No data-fetching library** — hooks are deliberately simple GET wrappers that refetch on the `ticketsVersion` counter in Redux

## Shared types

All API shapes are imported from `@ticket-tdd/shared-types`. Never duplicate them locally.

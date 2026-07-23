# SpecPilot 🚀

> **AI-powered TDD agent for Jira** — Connect your Jira board, pick a ticket, point at your codebase, and let SpecPilot generate test files and implementation code for you.

---

## What Does It Do?

SpecPilot is a developer tool that bridges your Jira tickets and your codebase using OpenAI:

1. **Connect to Jira** — Authenticate with your Atlassian API token
2. **Browse your tickets** — See all tickets currently assigned to you
3. **Connect your codebase** — Point SpecPilot at your local project folder (files never leave your machine)
4. **Generate Tests** — AI writes test cases that match the ticket's acceptance criteria and your project's testing conventions
5. **Generate Implementation** — AI writes the production code that makes those tests pass

---

## Prerequisites

- **Node.js** v20 or later
- **npm** v10 or later
- A **Jira Cloud** account with an API token ([generate one here](https://id.atlassian.com/manage-profile/security/api-tokens))
- An **OpenAI API key** ([get one here](https://platform.openai.com/api-keys))
- A **Chromium-based browser** (Chrome or Edge) — required for the local file picker

---

## Installation

Clone the repo and install all dependencies from the workspace root:

```bash
git clone https://github.com/santanujana12/AIDrivenTDDAgent.git
cd AIDrivenTDDAgent
npm install
```

---

## Environment Setup

### Backend (`apps/backend/.env`)

Create the file and add:

```env
PORT=4000
OPENAI_API_KEY=sk-...          # Your OpenAI secret key
OPENAI_MODEL=gpt-4.1           # Or gpt-4o, gpt-3.5-turbo, etc.
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend (`apps/frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

> ⚠️ Never commit `.env` files with real credentials to version control.

---

## Running the App Locally

### Option A — Both apps together (recommended)

```bash
npx nx run-many -t serve -p backend,frontend
```

### Option B — Two separate terminals

```bash
# Terminal 1 — backend
npx nx serve backend

# Terminal 2 — frontend
npx nx serve frontend
```

| App | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000/api |

---

## How to Use SpecPilot

### Step 1 — Connect to Jira

When the app opens, you will see the **Connect to Jira** screen.

Fill in:
- **Jira Domain** — your Atlassian domain, e.g. `yourcompany.atlassian.net` *(without https://)*
- **Email** — the email address on your Jira account
- **API Token** — generated from [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens)

Click **Connect**. SpecPilot verifies your credentials live — if they are wrong you will see an error immediately.

> 🔒 Credentials are held in browser memory only. They are never stored in localStorage, cookies, or a database.

---

### Step 2 — Browse Your Tickets

After connecting, your **Dashboard** loads all tickets currently assigned to your account, sorted by last-updated.

Each ticket card shows:
- Ticket key (e.g. `PROJ-42`)
- Summary and description preview
- Status, issue type, and priority badges
- A **Move to** dropdown to transition the ticket workflow status without leaving the app

Use the **Refresh** button in the header to reload tickets at any time.

---

### Step 3 — Connect Your Codebase

Click **Connect Codebase** in the top-right header.

Your browser opens a native folder picker. Select the root of your project repository.

SpecPilot will:
- Walk the directory tree recursively
- Skip `node_modules`, `.git`, `dist`, and binary files automatically
- Index all text files and display their metadata

> ✅ Files are read **locally in the browser**. Nothing is uploaded to the server at this step.

---

### Step 4 — Generate Tests

On any ticket card, click **Generate Tests**.

A dialog opens showing your indexed files. SpecPilot will automatically pre-select files whose paths match keywords from the ticket text.

You can:
- Check or uncheck individual files
- Filter files by name using the search box
- Use Select All / Clear All

**Character budget**: Combined content of selected files must stay under 100,000 characters (shown in the dialog). Deselect large files if you go over.

Click **Generate**. SpecPilot reads the selected files and sends them — along with the ticket summary and description — to OpenAI. The AI infers your test framework (Jest, Vitest, Mocha, etc.) from your existing test files.

The result is a complete test file in a syntax-highlighted viewer. Copy it or click **Regenerate** to try with different files.

---

### Step 5 — Generate Implementation

After generating tests, the **Generate Impl** button on the ticket card becomes active.

Click it. The file picker opens. Select the files relevant to the implementation.

Click **Generate**. SpecPilot sends the generated test file plus your selected source files to OpenAI: *"Write the smallest implementation that makes these tests pass."*

Copy the resulting file into your codebase and run your tests.

---

### Step 6 — Move the Ticket

Use the **Move to** dropdown on the ticket card to transition its Jira status (e.g. `In Progress` → `In Review`) without opening Jira. The status updates optimistically in the UI and syncs with Jira in the background.

---

## Project Structure

```
AIDrivenTDDAgent/
├── apps/
│   ├── backend/          # Express API (Node.js)
│   │   └── src/
│   │       ├── middleware/   # Auth, error handling, async wrapper
│   │       ├── routes/       # /api/jira, /api/codex, /api/health
│   │       └── services/     # Jira API calls, OpenAI prompt builders
│   └── frontend/         # React SPA (Vite + Tailwind CSS)
│       └── src/
│           ├── api/          # HTTP client + local file handle store
│           ├── components/   # UI components
│           ├── hooks/        # useMyTickets, useTransitions, useTheme
│           └── store/        # Redux slices
└── libs/
    └── shared-types/     # TypeScript interfaces shared by both apps
```

---

## Deployment

### Backend → Railway.app

1. Create a new project on [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Set build command: `npm install && npx nx build backend`
4. Set start command: `node dist/apps/backend/main.js`
5. Add environment variables (same as `apps/backend/.env` with production values)
6. Set `FRONTEND_ORIGIN` to your deployed frontend URL

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set build command: `npx nx build frontend`
3. Set output directory: `dist/apps/frontend`
4. Add env var: `VITE_API_BASE_URL` = your Railway backend URL

---

## Shared Types

All API request/response shapes live in `libs/shared-types`. Import from `@ticket-tdd/shared-types` in either app. Do not duplicate type definitions in individual apps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| State | Redux Toolkit |
| Backend | Express 5, Node.js, TypeScript |
| AI | OpenAI Chat Completions API |
| Jira | Jira REST API v3 |
| Monorepo | NX 23 |
| UI Components | Radix UI, shadcn/ui |

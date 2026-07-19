# TicketTDD backend

The Express backend is a stateless proxy for Jira Cloud and OpenAI. It never stores Jira credentials: the frontend supplies them as request headers only for `/api/jira/*` calls.

## Setup and run

Create `apps/backend/.env` using the root `.env.example` as a guide:

```env
PORT=4000
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4.1
FRONTEND_ORIGIN=http://localhost:5173
```

From the repository root, install dependencies and run the backend:

```bash
npm install
npx nx serve backend
```

## Route examples

```bash
curl http://localhost:4000/api/health

curl -H "X-Jira-Domain: yourcompany.atlassian.net" -H "X-Jira-Email: user@example.com" -H "X-Jira-Token: jira-api-token" http://localhost:4000/api/jira/my-tickets

curl -H "X-Jira-Domain: yourcompany.atlassian.net" -H "X-Jira-Email: user@example.com" -H "X-Jira-Token: jira-api-token" http://localhost:4000/api/jira/tickets/PROJ-123/transitions

curl -X POST -H "Content-Type: application/json" -H "X-Jira-Domain: yourcompany.atlassian.net" -H "X-Jira-Email: user@example.com" -H "X-Jira-Token: jira-api-token" -d '{"transitionId":"31"}' http://localhost:4000/api/jira/tickets/PROJ-123/transition

curl -X POST -H "Content-Type: application/json" -d '{"ticketSummary":"Add validation","ticketDescription":"Reject empty input","files":[{"path":"src/example.ts","content":"export const value = 1;"}]}' http://localhost:4000/api/codex/generate-tests

curl -X POST -H "Content-Type: application/json" -d '{"testFileName":"example.spec.ts","testFileContent":"it(\"works\", () => {})","files":[{"path":"src/example.ts","content":"export const value = 1;"}]}' http://localhost:4000/api/codex/generate-implementation
```

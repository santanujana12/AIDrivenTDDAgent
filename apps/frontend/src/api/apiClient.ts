import type {
  MyTicketsResponse,
  TransitionsResponse,
  TransitionRequestBody,
  TransitionResponse,
  GenerateTestsRequestBody,
  GenerateTestsResponse,
  GenerateImplementationRequestBody,
  GenerateImplementationResponse,
  HealthResponse,
  ApiErrorResponse,
} from '@ticket-tdd/shared-types';
import { JIRA_HEADER_DOMAIN, JIRA_HEADER_EMAIL, JIRA_HEADER_TOKEN } from '@ticket-tdd/shared-types';
import type { JiraAuthState } from '../store/jiraAuthSlice';

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as ApiErrorResponse;
      if (body.error) errorMessage = body.error;
    } catch {
      // Use the default message if the body cannot be parsed as JSON
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

function buildJiraHeaders(credentials: JiraAuthState): HeadersInit {
  return {
    [JIRA_HEADER_DOMAIN]: credentials.domain,
    [JIRA_HEADER_EMAIL]: credentials.email,
    [JIRA_HEADER_TOKEN]: credentials.token,
    'Content-Type': 'application/json',
  };
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBase}/health`, { signal });
  return handleResponse<HealthResponse>(response);
}

export async function fetchMyTickets(
  credentials: JiraAuthState,
  signal?: AbortSignal
): Promise<MyTicketsResponse> {
  const response = await fetch(`${apiBase}/jira/my-tickets`, {
    headers: buildJiraHeaders(credentials),
    signal,
  });
  return handleResponse<MyTicketsResponse>(response);
}

export async function fetchTransitions(
  credentials: JiraAuthState,
  issueId: string,
  signal?: AbortSignal
): Promise<TransitionsResponse> {
  const response = await fetch(
    `${apiBase}/jira/tickets/${encodeURIComponent(issueId)}/transitions`,
    { headers: buildJiraHeaders(credentials), signal }
  );
  return handleResponse<TransitionsResponse>(response);
}

export async function postTransition(
  credentials: JiraAuthState,
  issueId: string,
  body: TransitionRequestBody
): Promise<TransitionResponse> {
  const response = await fetch(
    `${apiBase}/jira/tickets/${encodeURIComponent(issueId)}/transition`,
    {
      method: 'POST',
      headers: buildJiraHeaders(credentials),
      body: JSON.stringify(body),
    }
  );
  return handleResponse<TransitionResponse>(response);
}

export async function postGenerateTests(
  body: GenerateTestsRequestBody
): Promise<GenerateTestsResponse> {
  const response = await fetch(`${apiBase}/codex/generate-tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<GenerateTestsResponse>(response);
}

export async function postGenerateImplementation(
  body: GenerateImplementationRequestBody
): Promise<GenerateImplementationResponse> {
  const response = await fetch(`${apiBase}/codex/generate-implementation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<GenerateImplementationResponse>(response);
}

import type {
  JiraTicket,
  JiraTransition,
  MyTicketsResponse,
  TransitionsResponse,
} from '@ticket-tdd/shared-types';
import { ApiError } from '../middleware/errorHandler';
import type { JiraCredentials } from '../types';

interface AdfNode {
  type?: string;
  text?: string;
  content?: AdfNode[];
}

interface JiraIssue {
  id?: string;
  key?: string;
  fields?: {
    summary?: string;
    description?: AdfNode | null;
    status?: { name?: string };
    issuetype?: { name?: string };
    priority?: { name?: string } | null;
  };
}

const jiraHeaders = (credentials: JiraCredentials) => ({
  Accept: 'application/json',
  Authorization: credentials.authorizationHeader,
});

const extractErrorMessage = (body: unknown, fallback: string) => {
  if (typeof body === 'object' && body !== null) {
    const candidate = body as { errorMessages?: unknown; errors?: Record<string, unknown> };
    if (Array.isArray(candidate.errorMessages) && typeof candidate.errorMessages[0] === 'string') {
      return candidate.errorMessages[0];
    }
    if (candidate.errors) {
      const firstError = Object.values(candidate.errors).find((value) => typeof value === 'string');
      if (typeof firstError === 'string') return firstError;
    }
  }
  return fallback;
};

const jiraRequest = async <T>(credentials: JiraCredentials, path: string, init?: RequestInit): Promise<T> => {
  let response: globalThis.Response;
  try {
    response = await fetch(`https://${credentials.domain}/rest/api/3/${path}`, {
      ...init,
      headers: { ...jiraHeaders(credentials), ...init?.headers },
    });
  } catch (networkError) {
    console.error('Jira network error:', networkError);
    throw new ApiError('Unable to reach Jira. Check the Jira domain and try again.', 502);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new ApiError(extractErrorMessage(body, `Jira request failed (${response.status}).`), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const adfToPlainText = (node: AdfNode | null | undefined): string => {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';

  const content = (node.content ?? []).map(adfToPlainText).join('');
  return node.type === 'paragraph' ? `${content}\n` : content;
};

export const getMyTickets = async (credentials: JiraCredentials): Promise<MyTicketsResponse> => {
  const raw = await jiraRequest<{ issues?: JiraIssue[] }>(credentials, 'search/jql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jql: 'assignee = currentUser() ORDER BY updated DESC',
      fields: ['summary', 'description', 'status', 'issuetype', 'priority'],
      maxResults: 50,
    }),
  });
  const tickets: JiraTicket[] = (raw.issues ?? []).map((issue) => ({
    id: issue.id ?? '',
    key: issue.key ?? '',
    summary: issue.fields?.summary ?? '',
    description: adfToPlainText(issue.fields?.description).trim(),
    status: issue.fields?.status?.name ?? '',
    issueType: issue.fields?.issuetype?.name ?? '',
    priority: issue.fields?.priority?.name ?? '',
  }));
  return { tickets };
};

export const getTransitions = async (credentials: JiraCredentials, issueId: string): Promise<TransitionsResponse> => {
  const raw = await jiraRequest<{ transitions?: Array<{ id?: string; name?: string }> }>(
    credentials,
    `issue/${encodeURIComponent(issueId)}/transitions`
  );
  const transitions: JiraTransition[] = (raw.transitions ?? []).map((transition) => ({
    id: transition.id ?? '',
    name: transition.name ?? '',
  }));
  return { transitions };
};

export const transitionTicket = async (credentials: JiraCredentials, issueId: string, transitionId: string) => {
  await jiraRequest<void>(credentials, `issue/${encodeURIComponent(issueId)}/transitions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
};

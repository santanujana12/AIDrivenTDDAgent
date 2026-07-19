import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorResponse } from '@ticket-tdd/shared-types';
import { JIRA_HEADER_DOMAIN, JIRA_HEADER_EMAIL, JIRA_HEADER_TOKEN } from '@ticket-tdd/shared-types';
import type { JiraRequest } from '../types';

const headerValue = (request: Request, name: string) => {
  const value = request.header(name);
  return value?.trim();
};

export const jiraAuth = (request: Request, response: Response, next: NextFunction) => {
  const domain = headerValue(request, JIRA_HEADER_DOMAIN);
  const email = headerValue(request, JIRA_HEADER_EMAIL);
  const token = headerValue(request, JIRA_HEADER_TOKEN);

  if (!domain || !email || !token) {
    const body: ApiErrorResponse = {
      error: `${JIRA_HEADER_DOMAIN}, ${JIRA_HEADER_EMAIL}, and ${JIRA_HEADER_TOKEN} headers are required.`,
    };
    response.status(400).json(body);
    return;
  }

  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
    const body: ApiErrorResponse = { error: 'X-Jira-Domain must be a domain without a protocol or path.' };
    response.status(400).json(body);
    return;
  }

  (request as JiraRequest).jiraCredentials = {
    domain,
    authorizationHeader: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
  };
  next();
};

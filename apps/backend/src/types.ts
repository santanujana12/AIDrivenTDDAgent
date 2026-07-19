import type { Request } from 'express';

export interface JiraCredentials {
  domain: string;
  authorizationHeader: string;
}

export interface JiraRequest extends Request {
  jiraCredentials: JiraCredentials;
}

export interface OpenAiChatCompletion {
  choices?: Array<{ message?: { content?: string | null } }>;
}

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  issueType: string;
  priority: string;
}

export interface JiraTransition {
  id: string;
  name: string;
}

export interface MyTicketsResponse {
  tickets: JiraTicket[];
}

export interface TransitionsResponse {
  transitions: JiraTransition[];
}

export interface TransitionRequestBody {
  transitionId: string;
}

export interface TransitionResponse {
  success: boolean;
  error?: string;
}

export interface RepoFile {
  path: string;
  content: string;
}

export interface GenerateTestsRequestBody {
  ticketSummary: string;
  ticketDescription: string;
  files: RepoFile[];
}

export interface GenerateTestsResponse {
  testFileName: string;
  testFileContent: string;
  assumptions: string[];
}

export interface GenerateImplementationRequestBody {
  testFileName: string;
  testFileContent: string;
  files: RepoFile[];
}

export interface GenerateImplementationResponse {
  implementationFileName: string;
  implementationFileContent: string;
  assumptions: string[];
}

export interface HealthResponse {
  status: 'ok';
}

export interface ApiErrorResponse {
  error: string;
}

export const JIRA_HEADER_DOMAIN = 'X-Jira-Domain';
export const JIRA_HEADER_EMAIL = 'X-Jira-Email';
export const JIRA_HEADER_TOKEN = 'X-Jira-Token';

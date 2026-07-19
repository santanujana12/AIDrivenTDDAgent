import { Router } from 'express';
import type { TransitionRequestBody, TransitionResponse } from '@ticket-tdd/shared-types';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { jiraAuth } from '../middleware/jiraAuth';
import { getMyTickets, getTransitions, transitionTicket } from '../services/jiraService';
import type { JiraRequest } from '../types';

export const jiraRouter = Router();
jiraRouter.use(jiraAuth);

const issueIdFrom = (value: string | string[]) => {
  const issueId = Array.isArray(value) ? value[0] : value;
  if (!issueId?.trim()) throw new ApiError('issueId is required.', 400);
  return issueId;
};

jiraRouter.get('/my-tickets', asyncHandler(async (request, response) => {
  const body = await getMyTickets((request as JiraRequest).jiraCredentials);
  response.json(body);
}));

jiraRouter.get('/tickets/:issueId/transitions', asyncHandler(async (request, response) => {
  const body = await getTransitions((request as JiraRequest).jiraCredentials, issueIdFrom(request.params.issueId));
  response.json(body);
}));

jiraRouter.post('/tickets/:issueId/transition', asyncHandler(async (request, response) => {
  const { transitionId } = request.body as TransitionRequestBody;
  if (!transitionId?.trim()) throw new ApiError('transitionId is required.', 400);

  try {
    await transitionTicket((request as JiraRequest).jiraCredentials, issueIdFrom(request.params.issueId), transitionId);
    const body: TransitionResponse = { success: true };
    response.json(body);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to transition the Jira ticket.';
    const body: TransitionResponse = { success: false, error: message };
    response.status(error instanceof ApiError ? error.statusCode : 502).json(body);
  }
}));

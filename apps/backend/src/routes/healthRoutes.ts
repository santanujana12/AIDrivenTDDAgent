import { Router } from 'express';
import type { HealthResponse } from '@ticket-tdd/shared-types';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  const body: HealthResponse = { status: 'ok' };
  response.json(body);
});

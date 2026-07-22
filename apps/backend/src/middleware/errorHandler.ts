import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorResponse } from '@ticket-tdd/shared-types';

export class ApiError extends Error {
  constructor(message: string,public readonly statusCode = 500) {
    super(message);
  }
}

export const notFoundHandler = (_request: Request, response: Response) => {
  const body: ApiErrorResponse = { error: 'Route not found.' };
  response.status(404).json(body);
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'An unexpected server error occurred.';

  if (!(error instanceof ApiError)) {
    console.error('Unhandled backend error:', error);
  }

  const body: ApiErrorResponse = { error: message };
  response.status(statusCode).json(body);
};

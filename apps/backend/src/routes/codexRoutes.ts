import { Router } from 'express';
import type {
  GenerateImplementationRequestBody,
  GenerateImplementationResponse,
  GenerateTestsRequestBody,
  GenerateTestsResponse,
  RepoFile,
} from '@ticket-tdd/shared-types';
import { asyncHandler } from '../middleware/asyncHandler';
import { ApiError } from '../middleware/errorHandler';
import { generateImplementation, generateTests } from '../services/codexService';

const maximumFileContentLength = 100_000;
const validFiles = (files: unknown): files is RepoFile[] =>
  Array.isArray(files) && files.every((file) =>
    typeof file === 'object' && file !== null && typeof file.path === 'string' && typeof file.content === 'string'
  );

const validateFiles = (files: unknown): RepoFile[] => {
  if (!validFiles(files) || files.length === 0) {
    throw new ApiError('At least one repo file is required.', 400);
  }
  const totalLength = files.reduce((sum, file) => sum + file.content.length, 0);
  if (totalLength > maximumFileContentLength) {
    throw new ApiError('Selected files exceed 100,000 characters. Send fewer or smaller files.', 400);
  }
  return files;
};

export const codexRouter = Router();

codexRouter.post('/generate-tests', asyncHandler(async (request, response) => {
  const body = request.body as Partial<GenerateTestsRequestBody>;

  if (typeof body.ticketSummary !== 'string' || !body.ticketSummary.trim()) {
    throw new ApiError('ticketSummary must be a non-empty string.', 400);
  }
  const ticketDescription = typeof body.ticketDescription === 'string' ? body.ticketDescription : '';
  const files = validateFiles(body.files);

  const result = await generateTests(body.ticketSummary, ticketDescription, files);
  response.json(result as GenerateTestsResponse);
}));

codexRouter.post('/generate-implementation', asyncHandler(async (request, response) => {
  const body = request.body as Partial<GenerateImplementationRequestBody>;

  if (typeof body.testFileName !== 'string' || !body.testFileName.trim()) {
    throw new ApiError('testFileName must be a non-empty string.', 400);
  }
  if (typeof body.testFileContent !== 'string' || !body.testFileContent.trim()) {
    throw new ApiError('testFileContent must be a non-empty string.', 400);
  }
  const files = validateFiles(body.files);

  const result = await generateImplementation(body.testFileName, body.testFileContent, files);
  response.json(result as GenerateImplementationResponse);
}));

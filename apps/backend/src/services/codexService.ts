import { ApiError } from '../middleware/errorHandler';
import type { OpenAiChatCompletion } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stripJsonFence = (content: string) =>
  content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

const formatFilesAsContext = (files: Array<{ path: string; content: string }>) =>
  files.map((file) => `FILE: ${file.path}\n${file.content}`).join('\n\n');

// ---------------------------------------------------------------------------
// OpenAI chat completion (shared by both codex routes)
// ---------------------------------------------------------------------------

const callOpenAI = async (systemPrompt: string, userPrompt: string): Promise<unknown> => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    throw new ApiError('OPENAI_API_KEY and OPENAI_MODEL must be configured on the server.', 500);
  }

  let response: globalThis.Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
  } catch (networkError) {
    console.error('OpenAI network error:', networkError);
    throw new ApiError('Unable to reach OpenAI. Please try again.', 502);
  }

  if (!response.ok) {
    throw new ApiError(`OpenAI request failed (${response.status}).`, response.status >= 500 ? 502 : response.status);
  }

  const completion = (await response.json()) as OpenAiChatCompletion;
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new ApiError('OpenAI returned an empty response.', 502);

  try {
    return JSON.parse(stripJsonFence(content));
  } catch {
    throw new ApiError('OpenAI returned invalid JSON. Please try again.', 502);
  }
};

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const buildGenerateTestsPrompt = (
  ticketSummary: string,
  ticketDescription: string,
  files: Array<{ path: string; content: string }>
) => ({
  system: [
    'You write precise, minimal tests.',
    'Return strict JSON only — no markdown fences, no prose outside the JSON object.',
  ].join(' '),

  user: [
    'Infer the test framework and conventions from the supplied files.',
    'Look for Jest, Vitest, Mocha, and Testing Library imports to determine the style.',
    'Write test cases for the behaviour described in the ticket below.',
    'Do not invent functions or APIs that are absent from the supplied files.',
    'If you must assume an interface that is not evidenced in the files, state it explicitly in assumptions.',
    '',
    `Ticket summary: ${ticketSummary}`,
    `Ticket description: ${ticketDescription}`,
    '',
    'Return exactly this JSON shape (no other keys):',
    '{ "testFileName": "string", "testFileContent": "string", "assumptions": ["string"] }',
    '',
    formatFilesAsContext(files),
  ].join('\n'),
});

const buildGenerateImplementationPrompt = (
  testFileName: string,
  testFileContent: string,
  files: Array<{ path: string; content: string }>
) => ({
  system: [
    'You write minimal, clear production implementations.',
    'Return strict JSON only — no markdown fences, no prose outside the JSON object.',
  ].join(' '),

  user: [
    'Write the smallest, clearest implementation that makes the supplied test file pass.',
    'Use self-explanatory names; do not add speculative or out-of-scope features.',
    'State every interface or contract you had to infer — that is not evidenced in the supplied files — in assumptions.',
    '',
    `Test file: ${testFileName}`,
    testFileContent,
    '',
    'Return exactly this JSON shape (no other keys):',
    '{ "implementationFileName": "string", "implementationFileContent": "string", "assumptions": ["string"] }',
    '',
    formatFilesAsContext(files),
  ].join('\n'),
});

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

export const generateTests = (
  ticketSummary: string,
  ticketDescription: string,
  files: Array<{ path: string; content: string }>
) => {
  const { system, user } = buildGenerateTestsPrompt(ticketSummary, ticketDescription, files);
  return callOpenAI(system, user);
};

export const generateImplementation = (
  testFileName: string,
  testFileContent: string,
  files: Array<{ path: string; content: string }>
) => {
  const { system, user } = buildGenerateImplementationPrompt(testFileName, testFileContent, files);
  return callOpenAI(system, user);
};

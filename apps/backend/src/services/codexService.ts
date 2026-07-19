import { ApiError } from '../middleware/errorHandler';
import type { OpenAiChatCompletion } from '../types';

const stripJsonFence = (content: string) =>
  content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

const readCompletion = async (systemPrompt: string, userPrompt: string) => {
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
  } catch {
    throw new ApiError('Unable to reach OpenAI. Please try again.', 502);
  }

  if (!response.ok) {
    throw new ApiError(`OpenAI request failed (${response.status}).`, response.status >= 500 ? 502 : response.status);
  }

  const completion = (await response.json()) as OpenAiChatCompletion;
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new ApiError('OpenAI returned an empty response.', 502);

  try {
    return JSON.parse(stripJsonFence(content)) as unknown;
  } catch {
    throw new ApiError('OpenAI returned invalid JSON. Please try again.', 502);
  }
};

const filesContext = (files: Array<{ path: string; content: string }>) =>
  files.map((file) => `FILE: ${file.path}\n${file.content}`).join('\n\n');

export const generateTests = (ticketSummary: string, ticketDescription: string, files: Array<{ path: string; content: string }>) =>
  readCompletion(
    'You write precise tests. Return strict JSON only, with no markdown or prose outside JSON.',
    `Infer the test framework and conventions from the supplied files (including Jest, Vitest, Mocha, and Testing Library imports). Write tests for this ticket without inventing APIs or functions absent from the files. State any necessary interface assumptions explicitly.\n\nTicket summary: ${ticketSummary}\nTicket description: ${ticketDescription}\n\nReturn exactly: {"testFileName":"string","testFileContent":"string","assumptions":["string"]}.\n\n${filesContext(files)}`
  );

export const generateImplementation = (testFileName: string, testFileContent: string, files: Array<{ path: string; content: string }>) =>
  readCompletion(
    'You write minimal, clear production implementations. Return strict JSON only, with no markdown or prose outside JSON.',
    `Write the smallest, clearest implementation that makes the supplied test pass. Use self-explanatory names; do not add speculative features. State every interface or contract inferred beyond the supplied files in assumptions.\n\nTest file: ${testFileName}\n${testFileContent}\n\nReturn exactly: {"implementationFileName":"string","implementationFileContent":"string","assumptions":["string"]}.\n\n${filesContext(files)}`
  );

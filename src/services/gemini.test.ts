/**
 * Glide — Gemini Service Unit Tests
 *
 * Tests the Gemini client service with mocked Google AI SDK responses
 * to verify error handling, retry logic, and generation behavior.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import {
  initGeminiClient,
  generateText,
  GeminiError,
  GeminiErrorCode,
} from './gemini';

// ---------------------------------------------------------------------------
// Mock the @google/generative-ai module
// ---------------------------------------------------------------------------

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockGenerateContent.mockReset();
  // Re-init client before each test
  initGeminiClient('test-api-key-123');
});

// ---------------------------------------------------------------------------
// initGeminiClient
// ---------------------------------------------------------------------------

describe('initGeminiClient', () => {
  it('should throw GeminiError for empty API key', () => {
    expect(() => initGeminiClient('')).toThrow(GeminiError);
    expect(() => initGeminiClient('')).toThrow(/API key is required/);
  });

  it('should throw GeminiError for whitespace-only API key', () => {
    expect(() => initGeminiClient('   ')).toThrow(GeminiError);
  });

  it('should return a client instance for a valid key', () => {
    const client = initGeminiClient('valid-key');
    expect(client).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// generateText — successful responses
// ---------------------------------------------------------------------------

describe('generateText — success', () => {
  it('should return generated text from a successful response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Hello, this is a summary of your email.',
      },
    });

    const result = await generateText('Summarize this email');
    expect(result).toBe('Hello, this is a summary of your email.');
    expect(mockGenerateContent).toHaveBeenCalledWith('Summarize this email');
  });

  it('should pass custom generation options', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Generated response with custom params.',
      },
    });

    const result = await generateText('Test prompt', {
      temperature: 0.5,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 20,
    });

    expect(result).toBe('Generated response with custom params.');
  });
});

// ---------------------------------------------------------------------------
// generateText — error handling
// ---------------------------------------------------------------------------

describe('generateText — error handling', () => {
  it('should throw INVALID_API_KEY for 401 errors', async () => {
    const error = new Error('API key not valid');
    (error as any).status = 401;
    mockGenerateContent.mockRejectedValue(error);

    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.INVALID_API_KEY,
      retryable: false,
    });
  });

  it('should throw INVALID_API_KEY for 403 errors', async () => {
    const error = new Error('Permission denied');
    (error as any).status = 403;
    mockGenerateContent.mockRejectedValue(error);

    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.INVALID_API_KEY,
      retryable: false,
    });
  });

  it('should throw CONTENT_FILTERED for empty responses', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '',
      },
    });

    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.CONTENT_FILTERED,
    });
  });

  it('should throw NETWORK_ERROR for fetch failures', async () => {
    mockGenerateContent.mockRejectedValue(new Error('fetch failed'));

    // Use a longer timeout since retry backoff adds real delays
    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.NETWORK_ERROR,
      retryable: true,
    });
  }, 30_000);

  it('should throw CONTENT_FILTERED for safety filter blocks', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Response blocked by safety filter'));

    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.CONTENT_FILTERED,
      retryable: false,
    });
  });
});

// ---------------------------------------------------------------------------
// generateText — retry behavior
// ---------------------------------------------------------------------------

describe('generateText — retry with backoff', () => {
  it('should retry rate-limited requests and succeed', async () => {
    const rateLimitError = new Error('Too many requests');
    (rateLimitError as any).status = 429;

    // First two calls reject, third succeeds
    mockGenerateContent
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({
        response: {
          text: () => 'Success after retries!',
        },
      });

    const result = await generateText('test');
    expect(result).toBe('Success after retries!');
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  }, 30_000);

  it('should retry server errors (5xx) and succeed', async () => {
    const serverError = new Error('Internal server error');
    (serverError as any).status = 500;

    mockGenerateContent
      .mockRejectedValueOnce(serverError)
      .mockResolvedValueOnce({
        response: {
          text: () => 'Recovered from server error.',
        },
      });

    const result = await generateText('test');
    expect(result).toBe('Recovered from server error.');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  }, 15_000);

  it('should not retry non-retryable errors', async () => {
    const authError = new Error('Invalid API key');
    (authError as any).status = 401;

    mockGenerateContent.mockRejectedValue(authError);

    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.INVALID_API_KEY,
    });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should throw after exhausting all retries', async () => {
    const rateLimitError = new Error('Too many requests');
    (rateLimitError as any).status = 429;

    mockGenerateContent.mockRejectedValue(rateLimitError);

    await expect(generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.RATE_LIMITED,
    });
    // 1 initial + 3 retries = 4 total
    expect(mockGenerateContent).toHaveBeenCalledTimes(4);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// generateText — uninitialised client
// ---------------------------------------------------------------------------

describe('generateText — uninitialised client', () => {
  it('should throw if client was never initialised', async () => {
    // Reset the module to clear the singleton
    jest.resetModules();
    const freshModule = await import('./gemini');

    await expect(freshModule.generateText('test')).rejects.toMatchObject({
      code: GeminiErrorCode.INVALID_API_KEY,
    });
  });
});

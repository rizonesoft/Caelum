/**
 * Glide — Gemini Client Service
 *
 * Provides a typed interface to the Google Generative AI (Gemini) API
 * with configurable parameters, rate-limiting with exponential backoff,
 * and granular error handling.
 *
 * © Rizonetech (Pty) Ltd. — https://rizonesoft.com
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configurable generation options passed to `generateText`. */
export interface GenerateOptions {
  /** Controls randomness. Lower = more deterministic. Range: 0.0–2.0. Default: 1.0 */
  temperature?: number;
  /** Maximum number of tokens in the response. Default: 2048 */
  maxOutputTokens?: number;
  /** Nucleus sampling. Range: 0.0–1.0. Default: 0.95 */
  topP?: number;
  /** Top-K sampling. Default: 40 */
  topK?: number;
  /** Which Gemini model to use. Default: 'gemini-3-pro-preview' */
  model?: string;
}

/** Error codes surfaced by the Gemini service. */
export enum GeminiErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  UNKNOWN = 'UNKNOWN',
}

/** Typed error thrown by the Gemini service. */
export class GeminiError extends Error {
  code: GeminiErrorCode;
  retryable: boolean;
  statusCode?: number;

  constructor(message: string, code: GeminiErrorCode, retryable = false, statusCode?: number) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.retryable = retryable;
    this.statusCode = statusCode;
    // Fix prototype chain for ES5 targets (TypeScript class extending Error)
    Object.setPrototypeOf(this, GeminiError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-3-pro-preview';
const DEFAULT_TEMPERATURE = 1.0;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;
const DEFAULT_TOP_P = 0.95;
const DEFAULT_TOP_K = 40;

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RETRY_BACKOFF_FACTOR = 2;
const REQUEST_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let clientInstance: GoogleGenerativeAI | null = null;

/**
 * Initialise (or reinitialise) the Gemini client with the given API key.
 * Returns the `GoogleGenerativeAI` instance for direct access if needed.
 */
export function initGeminiClient(apiKey: string): GoogleGenerativeAI {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new GeminiError(
      'API key is required. Please set GEMINI_API_KEY in your .env file.',
      GeminiErrorCode.INVALID_API_KEY,
    );
  }
  clientInstance = new GoogleGenerativeAI(apiKey);
  return clientInstance;
}

/**
 * Returns the current client instance, or throws if `initGeminiClient`
 * has not been called yet.
 */
function getClient(): GoogleGenerativeAI {
  if (!clientInstance) {
    throw new GeminiError(
      'Gemini client not initialised. Call initGeminiClient(apiKey) first.',
      GeminiErrorCode.INVALID_API_KEY,
    );
  }
  return clientInstance;
}

// ---------------------------------------------------------------------------
// Core generation function
// ---------------------------------------------------------------------------

/**
 * Send a prompt to Gemini and return the generated text.
 *
 * @param prompt  - The user prompt string.
 * @param options - Optional generation parameters.
 * @returns The model's text response.
 *
 * @throws {GeminiError} with a typed `code` for every failure scenario.
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const client = getClient();
  const modelName = options.model ?? DEFAULT_MODEL;

  const generationConfig: GenerationConfig = {
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    maxOutputTokens: options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    topP: options.topP ?? DEFAULT_TOP_P,
    topK: options.topK ?? DEFAULT_TOP_K,
  };

  const model: GenerativeModel = client.getGenerativeModel({
    model: modelName,
    generationConfig,
  });

  return retryWithBackoff(() => callModel(model, prompt));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Make a single API call with a timeout wrapper. */
async function callModel(model: GenerativeModel, prompt: string): Promise<string> {
  try {
    const result = await withTimeout(model.generateContent(prompt), REQUEST_TIMEOUT_MS);

    const response = result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new GeminiError(
        'The model returned an empty response. The content may have been filtered.',
        GeminiErrorCode.CONTENT_FILTERED,
      );
    }

    return text;
  } catch (error) {
    throw classifyError(error);
  }
}

/** Wrap a promise with a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new GeminiError(
          `Request timed out after ${ms / 1000}s. Check your network connection.`,
          GeminiErrorCode.TIMEOUT,
          true,
        ),
      );
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Retry a function with exponential backoff.
 * Only retries errors marked as `retryable`.
 */
async function retryWithBackoff(fn: () => Promise<string>): Promise<string> {
  let lastError: GeminiError | undefined;
  let delay = INITIAL_RETRY_DELAY_MS;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof GeminiError ? error : classifyError(error);

      if (!lastError.retryable || attempt === MAX_RETRIES) {
        throw lastError;
      }

      // Wait with jitter before retrying
      const jitter = Math.random() * 0.3 * delay;
      await sleep(delay + jitter);
      delay *= RETRY_BACKOFF_FACTOR;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError!;
}

/** Classify raw errors into typed GeminiError instances. */
function classifyError(error: unknown): GeminiError {
  // Already classified
  if (error instanceof GeminiError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const statusCode = extractStatusCode(error);

  // Invalid / expired API key
  if (statusCode === 401 || statusCode === 403 || /api.?key/i.test(message)) {
    return new GeminiError(
      'Invalid or expired API key. Please check your GEMINI_API_KEY.',
      GeminiErrorCode.INVALID_API_KEY,
      false,
      statusCode,
    );
  }

  // Rate limited
  if (statusCode === 429 || /rate.?limit/i.test(message) || /too many requests/i.test(message)) {
    return new GeminiError(
      'Rate limited by the Gemini API. Retrying with backoff…',
      GeminiErrorCode.RATE_LIMITED,
      true,
      429,
    );
  }

  // Quota exceeded
  if (statusCode === 429 && /quota/i.test(message)) {
    return new GeminiError(
      'API quota exceeded. Check your billing and quota settings in the Google Cloud Console.',
      GeminiErrorCode.QUOTA_EXCEEDED,
      false,
      429,
    );
  }

  // Network errors
  if (
    /network/i.test(message) ||
    /fetch failed/i.test(message) ||
    /ECONNREFUSED/i.test(message) ||
    /ENOTFOUND/i.test(message) ||
    /offline/i.test(message)
  ) {
    return new GeminiError(
      'Network error — please check your internet connection.',
      GeminiErrorCode.NETWORK_ERROR,
      true,
    );
  }

  // Content safety filter
  if (/safety/i.test(message) || /blocked/i.test(message) || /filter/i.test(message)) {
    return new GeminiError(
      'The response was blocked by content safety filters.',
      GeminiErrorCode.CONTENT_FILTERED,
      false,
    );
  }

  // Server errors (5xx) are retryable
  if (statusCode && statusCode >= 500) {
    return new GeminiError(
      `Server error (${statusCode}). Retrying…`,
      GeminiErrorCode.UNKNOWN,
      true,
      statusCode,
    );
  }

  // Unknown
  return new GeminiError(
    `Unexpected error: ${message}`,
    GeminiErrorCode.UNKNOWN,
    false,
    statusCode,
  );
}

/** Try to extract an HTTP status code from an error object. */
function extractStatusCode(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.status === 'number') return obj.status;
    if (typeof obj.statusCode === 'number') return obj.statusCode;
    if (typeof obj.code === 'number') return obj.code;
    // Google AI SDK sometimes nests it
    if (obj.response && typeof obj.response === 'object') {
      const resp = obj.response as Record<string, unknown>;
      if (typeof resp.status === 'number') return resp.status;
    }
  }
  return undefined;
}

/** Promise-based sleep. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

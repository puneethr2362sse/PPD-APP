import 'dotenv/config';
import crypto from 'crypto';

export type GeminiFailureReason =
  | 'QUOTA_EXHAUSTED'
  | 'RATE_LIMIT_TRANSIENT'
  | 'INVALID_API_KEY'
  | 'MODELS_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'NO_API_KEY';

export interface GeminiCallOptions {
  temperature?: number;
  responseMimeType?: string;
  inlineData?: { mimeType: string; data: string };
  cacheKey?: string;
  isVision?: boolean;
}

export interface GeminiCallResult<T = any> {
  success: boolean;
  data?: T;
  rawText?: string;
  modelUsed?: string;
  cached?: boolean;
  failureReason?: GeminiFailureReason;
  errorMessage?: string;
  retryDelaySeconds?: number;
}

export interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Model fallback lists configured for high availability with currently active models
export const GEMINI_TEXT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3-flash-preview',
];

export const GEMINI_VISION_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3-flash-preview',
];

// In-memory cache for recent responses (15-minute TTL)
interface CacheEntry {
  timestamp: number;
  result: GeminiCallResult;
}
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<GeminiCallResult>>();

// Circuit breaker state per model and globally for project-level quota
interface ModelCircuitState {
  exhaustedUntil: number;
  failureCount: number;
  isDailyQuotaExhausted: boolean;
  reason?: string;
}
const modelCircuitStates = new Map<string, ModelCircuitState>();
let globalQuotaExhaustedUntil = 0;
let globalQuotaReason = '';

// Global concurrency limiter
let activeCalls = 0;
const MAX_CONCURRENT_CALLS = 2;
const callQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeCalls < MAX_CONCURRENT_CALLS) {
    activeCalls++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    callQueue.push(() => {
      activeCalls++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeCalls = Math.max(0, activeCalls - 1);
  if (callQueue.length > 0) {
    const next = callQueue.shift();
    if (next) next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeHash(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 24);
}

export const geminiClient = {
  /**
   * Resets internal circuit breaker and caches (useful for testing).
   */
  resetState(): void {
    responseCache.clear();
    inFlightRequests.clear();
    modelCircuitStates.clear();
    globalQuotaExhaustedUntil = 0;
    globalQuotaReason = '';
    activeCalls = 0;
    callQueue.length = 0;
  },

  /**
   * Checks if Gemini models or project-level quota are currently in daily quota exhaustion.
   */
  isQuotaExhausted(isVision: boolean = false): boolean {
    const now = Date.now();
    if (globalQuotaExhaustedUntil > now) {
      return true;
    }
    const models = isVision ? GEMINI_VISION_MODELS : GEMINI_TEXT_MODELS;
    return models.every((m) => {
      const state = modelCircuitStates.get(m);
      return state && state.isDailyQuotaExhausted && state.exhaustedUntil > now;
    });
  },

  /**
   * Executes a resilient Gemini API call with:
   * - Request deduplication
   * - Bounded retries with exponential backoff & jitter for transient 429s
   * - Immediate circuit breaking for exhausted daily quotas (RESOURCE_EXHAUSTED)
   * - Model fallback rotation
   * - Result caching
   */
  async generateContent<T = any>(
    prompt: string,
    options: GeminiCallOptions = {}
  ): Promise<GeminiCallResult<T>> {
    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    if (!apiKey) {
      console.warn('[GeminiClient] No GEMINI_API_KEY or GOOGLE_API_KEY configured in server environment.');
      return {
        success: false,
        failureReason: 'NO_API_KEY',
        errorMessage: 'GEMINI_API_KEY is not configured on the server.',
      };
    }

    // 0. Fast circuit breaker check: do NOT make repeated doomed calls if quota is known exhausted
    if (this.isQuotaExhausted(options.isVision)) {
      const remainingSec = Math.max(1, Math.ceil((globalQuotaExhaustedUntil - Date.now()) / 1000));
      return {
        success: false,
        failureReason: 'QUOTA_EXHAUSTED',
        errorMessage: 'Gemini API free-tier quota is currently exhausted. Please try again later.',
        retryDelaySeconds: remainingSec,
      };
    }

    // 1. Generate cache key
    const inlinePart = options.inlineData
      ? `${options.inlineData.mimeType}_${options.inlineData.data.length}_${computeHash(options.inlineData.data)}`
      : '';
    const rawKey = options.cacheKey || `${options.isVision ? 'vision_' : 'text_'}${computeHash(prompt)}_${inlinePart}`;
    const cacheKey = computeHash(rawKey);

    // 2. Check response cache
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.result,
        cached: true,
      };
    }

    // 3. Request deduplication: reuse in-flight call if identical query is already running
    const existing = inFlightRequests.get(cacheKey);
    if (existing) {
      return existing;
    }

    const taskPromise = this._executeWithConcurrencyLimit(prompt, options, apiKey, cacheKey);
    inFlightRequests.set(cacheKey, taskPromise);

    try {
      const result = await taskPromise;
      if (result.success) {
        responseCache.set(cacheKey, { timestamp: Date.now(), result });
      }
      return result as GeminiCallResult<T>;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  },

  async _executeWithConcurrencyLimit<T = any>(
    prompt: string,
    options: GeminiCallOptions,
    apiKey: string,
    cacheKey: string
  ): Promise<GeminiCallResult<T>> {
    await acquireSlot();
    try {
      return (await this._callWithFallbacksAndRetries(prompt, options, apiKey)) as GeminiCallResult<T>;
    } finally {
      releaseSlot();
    }
  },

  async _callWithFallbacksAndRetries<T = any>(
    prompt: string,
    options: GeminiCallOptions,
    apiKey: string
  ): Promise<GeminiCallResult<T>> {
    const isVision = Boolean(options.isVision || options.inlineData);
    const candidateModels = isVision ? GEMINI_VISION_MODELS : GEMINI_TEXT_MODELS;

    let lastFailureReason: GeminiFailureReason = 'MODELS_UNAVAILABLE';
    let lastErrorMessage = 'All candidate Gemini models failed or are currently unavailable.';
    let maxRetryDelay = 0;

    for (const model of candidateModels) {
      const circuit = modelCircuitStates.get(model);
      const now = Date.now();

      // Check circuit breaker cooldown
      if (circuit && circuit.exhaustedUntil > now) {
        continue;
      }

      // Model call with bounded retries for transient errors
      const modelResult = (await this._callSingleModelWithRetries(model, prompt, options, apiKey)) as GeminiCallResult<T>;

      if (modelResult.success) {
        // Reset failure count on success
        modelCircuitStates.delete(model);
        return modelResult;
      }

      // Record failure state
      lastFailureReason = modelResult.failureReason || lastFailureReason;
      lastErrorMessage = modelResult.errorMessage || lastErrorMessage;
      if (modelResult.retryDelaySeconds && modelResult.retryDelaySeconds > maxRetryDelay) {
        maxRetryDelay = modelResult.retryDelaySeconds;
      }

      // If invalid API key or network failure, do not waste calls trying other models
      if (
        modelResult.failureReason === 'INVALID_API_KEY' ||
        modelResult.failureReason === 'NETWORK_ERROR'
      ) {
        break;
      }
    }

    // If all candidate models suffered quota exhaustion, engage global circuit breaker
    if (
      candidateModels.length > 0 &&
      candidateModels.every(
        (m) => modelCircuitStates.get(m)?.isDailyQuotaExhausted && (modelCircuitStates.get(m)?.exhaustedUntil || 0) > Date.now()
      )
    ) {
      const minCooldown = Math.min(...candidateModels.map((m) => modelCircuitStates.get(m)?.exhaustedUntil || Date.now() + 15 * 60 * 1000));
      globalQuotaExhaustedUntil = minCooldown;
      globalQuotaReason = 'All configured Gemini models have exhausted their daily free-tier quotas.';
    }

    return {
      success: false,
      failureReason: lastFailureReason,
      errorMessage: lastErrorMessage,
      retryDelaySeconds: maxRetryDelay > 0 ? maxRetryDelay : undefined,
    };
  },

  async _callSingleModelWithRetries<T>(
    model: string,
    prompt: string,
    options: GeminiCallOptions,
    apiKey: string
  ): Promise<GeminiCallResult<T>> {
    const maxRetries = 1; // Maximum 1 transient retry per model

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const parts: any[] = [{ text: prompt }];

        if (options.inlineData) {
          parts.push({
            inlineData: {
              mimeType: options.inlineData.mimeType,
              data: options.inlineData.data,
            },
          });
        }

        const bodyPayload: any = {
          contents: [{ parts }],
          generationConfig: {
            temperature: typeof options.temperature === 'number' ? options.temperature : 0.0,
          },
        };

        if (options.responseMimeType) {
          bodyPayload.generationConfig.responseMimeType = options.responseMimeType;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // Safe diagnostic logging: model name and HTTP status only (no keys, payloads, or secrets)
        console.log(`[GeminiClient] Model: ${model} | HTTP Status: ${res.status} | OK: ${res.ok}`);

        // ─── HTTP 200 SUCCESS ──────────────────────────────────────────────
        if (res.ok) {
          const data = (await res.json()) as GeminiApiResponse;
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) {
            return {
              success: false,
              failureReason: 'SERVER_ERROR',
              errorMessage: `Model "${model}" returned an empty response.`,
            };
          }

          let parsed: any = undefined;
          const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          try {
            parsed = JSON.parse(cleanedText);
          } catch {
            const m = cleanedText.match(/\{[\s\S]*\}/);
            if (m) {
              try {
                parsed = JSON.parse(m[0]);
              } catch {
                parsed = undefined;
              }
            }
          }

          return {
            success: true,
            data: parsed as T,
            rawText,
            modelUsed: model,
          };
        }

        // ─── ERROR HANDLING ────────────────────────────────────────────────
        const status = res.status;
        let errorBody: any = null;
        let rawErrorText = '';
        try {
          rawErrorText = await res.text();
          errorBody = JSON.parse(rawErrorText);
        } catch {
          // non-JSON error
        }

        console.warn(`[GeminiClient] Model: ${model} | HTTP Status: ${status} | Status: ${errorBody?.error?.status || 'UNKNOWN'} | Code: ${errorBody?.error?.code || status}`);

        // 1. HTTP 404 (Model Not Found / Deprecated)
        if (status === 404) {
          // Disable this model for 1 hour so we never call it again
          modelCircuitStates.set(model, {
            exhaustedUntil: Date.now() + 60 * 60 * 1000,
            failureCount: 1,
            isDailyQuotaExhausted: false,
            reason: 'Model not found (404)',
          });
          return {
            success: false,
            failureReason: 'MODELS_UNAVAILABLE',
            errorMessage: `Model "${model}" is not available (404).`,
          };
        }

        // 2. HTTP 400 / 403 (Invalid API Key or Permission)
        if (status === 400 || status === 403) {
          const errMsg = errorBody?.error?.message || rawErrorText;
          if (/API_KEY_INVALID|INVALID_ARGUMENT|PERMISSION_DENIED|key/i.test(errMsg)) {
            return {
              success: false,
              failureReason: 'INVALID_API_KEY',
              errorMessage: 'Configured Gemini API key is invalid or lacks necessary permissions.',
            };
          }
        }

        // 3. HTTP 429 (Rate Limit vs. Quota Exhaustion)
        if (status === 429) {
          const errorMsg = errorBody?.error?.message || '';
          const statusText = errorBody?.error?.status || '';

          // Check if Google provided a retryDelay or Retry-After header
          let retryDelaySeconds = 0;
          const retryHeader = res.headers?.get ? res.headers.get('retry-after') : null;
          if (retryHeader) {
            const parsedHeader = parseInt(retryHeader, 10);
            if (!isNaN(parsedHeader)) retryDelaySeconds = parsedHeader;
          }

          const retryInfo = errorBody?.error?.details?.find((d: any) => d['@type']?.includes('RetryInfo'));
          if (retryInfo?.retryDelay) {
            const parsedSeconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
            if (!isNaN(parsedSeconds)) retryDelaySeconds = parsedSeconds;
          }

          const isResourceExhausted =
            statusText === 'RESOURCE_EXHAUSTED' ||
            errorMsg.includes('RESOURCE_EXHAUSTED') ||
            rawErrorText.includes('RESOURCE_EXHAUSTED') ||
            errorMsg.includes('FreeTier') ||
            rawErrorText.includes('FreeTier') ||
            errorMsg.includes('free_tier_requests') ||
            rawErrorText.includes('free_tier_requests') ||
            errorMsg.includes('GenerateRequestsPerDay') ||
            rawErrorText.includes('GenerateRequestsPerDay') ||
            rawErrorText.toLowerCase().includes('quota exceeded') ||
            retryDelaySeconds > 60;

          if (isResourceExhausted) {
            // Daily / Monthly quota exhausted for this model: Engage per-model circuit breaker cooldown
            const cooldownMs = retryDelaySeconds > 0 ? Math.min(retryDelaySeconds * 1000, 12 * 60 * 60 * 1000) : 30 * 60 * 1000;

            modelCircuitStates.set(model, {
              exhaustedUntil: Date.now() + cooldownMs,
              failureCount: 5,
              isDailyQuotaExhausted: true,
              reason: errorMsg || rawErrorText || 'Daily quota exhausted',
            });

            return {
              success: false,
              failureReason: 'QUOTA_EXHAUSTED',
              errorMessage: 'Gemini API free-tier quota is currently exhausted.',
              retryDelaySeconds: retryDelaySeconds > 0 ? retryDelaySeconds : undefined,
            };
          }

          // Transient RPM (Requests Per Minute) rate limit: Bounded retry with exponential backoff & jitter
          if (attempt < maxRetries) {
            const baseBackoffMs = retryDelaySeconds > 0 && retryDelaySeconds <= 3
              ? retryDelaySeconds * 1000
              : 250 * Math.pow(2, attempt);
            const jitterMs = Math.floor(Math.random() * 80);
            const waitMs = Math.min(1500, baseBackoffMs + jitterMs);

            await sleep(waitMs);
            continue; // Retry single model
          }

          return {
            success: false,
            failureReason: 'RATE_LIMIT_TRANSIENT',
            errorMessage: 'Gemini API request rate limit reached. Please try again shortly.',
          };
        }

        // 4. Server error (500, 503)
        if (status >= 500 && attempt < maxRetries) {
          await sleep(250);
          continue;
        }

        return {
          success: false,
          failureReason: 'SERVER_ERROR',
          errorMessage: `Gemini service returned HTTP ${status}: ${errorBody?.error?.message || rawErrorText.slice(0, 120)}`,
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            failureReason: 'NETWORK_ERROR',
            errorMessage: 'Gemini request timed out after 18 seconds.',
          };
        }
        if (attempt >= maxRetries) {
          return {
            success: false,
            failureReason: 'NETWORK_ERROR',
            errorMessage: err.message || 'Network error connecting to Gemini API.',
          };
        }
        await sleep(150);
      }
    }

    return {
      success: false,
      failureReason: 'SERVER_ERROR',
      errorMessage: `Model "${model}" failed after ${maxRetries + 1} attempts.`,
    };
  },
};

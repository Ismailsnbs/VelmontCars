import type { AuthLevel, HttpMethod } from './types.js';
import { BASE_URL, REQUEST_TIMEOUT_MS } from './config.js';
import { getToken } from './auth.js';

export interface RequestOptions {
  auth?: AuthLevel;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
}

export interface RequestResult {
  status: number;
  body: unknown;
  responseTime: number;
  error?: string;
}

export async function makeRequest(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<RequestResult> {
  const { auth = 'none', body, query } = options;
  const start = performance.now();

  try {
    const token = await getToken(auth);

    let url = `${BASE_URL}${path}`;
    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams(query);
      url += `?${params.toString()}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let responseBody: unknown;
    try {
      responseBody = await res.json();
    } catch {
      responseBody = null;
    }

    return {
      status: res.status,
      body: responseBody,
      responseTime: Math.round(performance.now() - start),
    };
  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('abort')) {
      return { status: 0, body: null, responseTime: elapsed, error: `Timeout after ${REQUEST_TIMEOUT_MS}ms` };
    }

    return { status: 0, body: null, responseTime: elapsed, error: message };
  }
}

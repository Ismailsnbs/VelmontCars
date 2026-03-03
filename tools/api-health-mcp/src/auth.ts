import type { AuthLevel } from './types.js';
import { BASE_URL, TEST_USERS } from './config.js';

const tokenCache = new Map<AuthLevel, string>();

export async function getToken(level: AuthLevel): Promise<string | null> {
  if (level === 'none') return null;

  const cached = tokenCache.get(level);
  if (cached) return cached;

  const user = TEST_USERS[level];
  if (!user) return null;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${level} (${user.email}): ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { success: boolean; data: { accessToken: string } };
  const token = json.data.accessToken;
  tokenCache.set(level, token);
  return token;
}

export function clearTokens(): void {
  tokenCache.clear();
}

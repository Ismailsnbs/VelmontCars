import type { EndpointDef, EndpointGroup, TestReport, TestResult } from './types.js';
import { endpoints } from './endpoints.js';
import { makeRequest } from './http-client.js';
import { clearTokens } from './auth.js';

const idCache = new Map<string, string>();

async function resolveId(lookupGroup: string): Promise<string | null> {
  const cached = idCache.get(lookupGroup);
  if (cached) return cached;

  // Map lookup group to API path and auth level
  const lookupMap: Record<string, { path: string; auth: 'master' | 'gallery_owner' }> = {
    countries: { path: '/countries', auth: 'master' },
    'tax-rates': { path: '/tax-rates', auth: 'master' },
    'exchange-rates': { path: '/exchange-rates', auth: 'master' },
    galleries: { path: '/galleries', auth: 'master' },
    'audit-logs': { path: '/audit-logs', auth: 'master' },
    notifications: { path: '/notifications', auth: 'master' },
    vehicles: { path: '/vehicles', auth: 'gallery_owner' },
    products: { path: '/products', auth: 'gallery_owner' },
    customers: { path: '/customers', auth: 'gallery_owner' },
    sales: { path: '/sales', auth: 'gallery_owner' },
  };

  const config = lookupMap[lookupGroup];
  if (!config) return null;

  const result = await makeRequest('GET', config.path, { auth: config.auth, query: { limit: '1' } });

  if (result.status !== 200 || !result.body) return null;

  const body = result.body as { success: boolean; data: Array<{ id: string }> | { id: string } };
  if (!body.success) return null;

  let id: string | undefined;
  if (Array.isArray(body.data) && body.data.length > 0) {
    id = body.data[0].id;
  } else if (!Array.isArray(body.data) && body.data?.id) {
    id = body.data.id;
  }

  if (id) {
    idCache.set(lookupGroup, id);
    return id;
  }

  return null;
}

async function resolvePath(endpoint: EndpointDef): Promise<string | null> {
  let path = endpoint.path;

  if (!endpoint.pathParams) return path;

  for (const [param, lookupGroup] of Object.entries(endpoint.pathParams)) {
    const id = await resolveId(lookupGroup);
    if (!id) return null; // cannot resolve → skip test
    path = path.replace(param, id);
  }

  return path;
}

async function testEndpoint(endpoint: EndpointDef, skipMutating: boolean): Promise<TestResult> {
  const base: Omit<TestResult, 'resolvedPath' | 'actualStatus' | 'passed' | 'responseTime' | 'skipped'> = {
    name: endpoint.name,
    group: endpoint.group,
    method: endpoint.method,
    path: endpoint.path,
    expectedStatus: endpoint.expectedStatus ?? 200,
  };

  // Skip mutating endpoints if flag set
  if (skipMutating && endpoint.mutating) {
    return { ...base, resolvedPath: endpoint.path, actualStatus: 0, passed: true, skipped: true, responseTime: 0 };
  }

  // Resolve dynamic path params
  const resolvedPath = await resolvePath(endpoint);
  if (resolvedPath === null) {
    return {
      ...base,
      resolvedPath: endpoint.path,
      actualStatus: 0,
      passed: false,
      skipped: true,
      responseTime: 0,
      error: `Could not resolve path params (no data in ${JSON.stringify(endpoint.pathParams)})`,
    };
  }

  // Resolve dynamic body params (e.g. originCountryId → countries lookup)
  let body = endpoint.body;
  if (endpoint.bodyParams && body) {
    body = { ...body };
    for (const [field, lookupGroup] of Object.entries(endpoint.bodyParams)) {
      const id = await resolveId(lookupGroup);
      if (!id) {
        return {
          ...base,
          resolvedPath,
          actualStatus: 0,
          passed: false,
          skipped: true,
          responseTime: 0,
          error: `Could not resolve body param "${field}" (no data in "${lookupGroup}")`,
        };
      }
      (body as Record<string, unknown>)[field] = id;
    }
  }

  const result = await makeRequest(endpoint.method, resolvedPath, {
    auth: endpoint.auth,
    body,
    query: endpoint.query,
  });

  const expected = endpoint.expectedStatus ?? 200;
  const passed = result.error ? false : result.status === expected;

  return {
    ...base,
    resolvedPath,
    actualStatus: result.status,
    passed,
    skipped: false,
    responseTime: result.responseTime,
    error: result.error || (!passed ? `Expected ${expected}, got ${result.status}` : undefined),
    responseBody: passed ? undefined : result.body,
  };
}

export async function runTests(options: {
  group?: EndpointGroup;
  skipMutating?: boolean;
}): Promise<TestReport> {
  const { group, skipMutating = false } = options;

  // Clear caches for fresh run
  clearTokens();
  idCache.clear();

  const filtered = group ? endpoints.filter((e) => e.group === group) : endpoints;

  const start = performance.now();
  const results: TestResult[] = [];

  // Sequential execution to respect rate limits
  for (const endpoint of filtered) {
    const result = await testEndpoint(endpoint, skipMutating);
    results.push(result);
  }

  const durationMs = Math.round(performance.now() - start);
  const passed = results.filter((r) => r.passed && !r.skipped).length;
  const failed = results.filter((r) => !r.passed && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const errors = results.filter((r) => r.error && !r.skipped).length;

  return {
    timestamp: new Date().toISOString(),
    baseUrl: (await import('./config.js')).BASE_URL,
    totalEndpoints: filtered.length,
    passed,
    failed,
    skipped,
    errors,
    durationMs,
    results,
    failedDetails: results.filter((r) => !r.passed && !r.skipped),
  };
}

export function listEndpoints(group?: EndpointGroup) {
  const filtered = group ? endpoints.filter((e) => e.group === group) : endpoints;
  return filtered.map((e) => ({
    name: e.name,
    group: e.group,
    method: e.method,
    path: e.path,
    auth: e.auth,
    mutating: e.mutating ?? false,
    expectedStatus: e.expectedStatus ?? 200,
  }));
}

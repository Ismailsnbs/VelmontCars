export type AuthLevel =
  | 'none'
  | 'master'
  | 'gallery_owner'
  | 'gallery_manager'
  | 'gallery_sales'
  | 'gallery_accountant'
  | 'gallery_staff';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface EndpointDef {
  name: string;
  group: string;
  method: HttpMethod;
  path: string;
  auth: AuthLevel;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  expectedStatus?: number;
  mutating?: boolean;
  pathParams?: Record<string, string>; // e.g. { ':id': 'vehicles' } → lookup first record
  bodyParams?: Record<string, string>; // e.g. { 'originCountryId': 'countries' } → inject resolved ID into body
}

export interface TestResult {
  name: string;
  group: string;
  method: HttpMethod;
  path: string;
  resolvedPath: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  skipped: boolean;
  responseTime: number;
  error?: string;
  responseBody?: unknown;
}

export interface TestReport {
  timestamp: string;
  baseUrl: string;
  totalEndpoints: number;
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  durationMs: number;
  results: TestResult[];
  failedDetails: TestResult[];
}

export type EndpointGroup =
  | 'auth'
  | 'countries'
  | 'tax-rates'
  | 'exchange-rates'
  | 'galleries'
  | 'audit-logs'
  | 'notifications'
  | 'vehicles'
  | 'calculator'
  | 'products'
  | 'customers'
  | 'sales'
  | 'stock-movements'
  | 'stock-alerts'
  | 'stock-count'
  | 'dashboard'
  | 'reports';

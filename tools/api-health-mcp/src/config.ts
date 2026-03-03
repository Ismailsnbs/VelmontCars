import type { AuthLevel, EndpointGroup } from './types.js';

export const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
export const REQUEST_TIMEOUT_MS = 10_000;

export const TEST_USERS: Record<AuthLevel, { email: string; password: string } | null> = {
  none: null,
  master: { email: 'admin@kktcgaleri.com', password: '123456' },
  gallery_owner: { email: 'owner@demogaleri.com', password: '123456' },
  gallery_manager: { email: 'manager@demogaleri.com', password: '123456' },
  gallery_sales: { email: 'sales@demogaleri.com', password: '123456' },
  gallery_accountant: { email: 'accountant@demogaleri.com', password: '123456' },
  gallery_staff: { email: 'staff@demogaleri.com', password: '123456' },
};

export const ENDPOINT_GROUPS: EndpointGroup[] = [
  'auth',
  'countries',
  'tax-rates',
  'exchange-rates',
  'galleries',
  'audit-logs',
  'notifications',
  'vehicles',
  'calculator',
  'products',
  'customers',
  'sales',
  'stock-movements',
  'stock-alerts',
  'stock-count',
  'dashboard',
  'reports',
];

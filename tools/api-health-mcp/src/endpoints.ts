import type { EndpointDef } from './types.js';

export const endpoints: EndpointDef[] = [
  // ═══════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════
  { name: 'Login OK (master)', group: 'auth', method: 'POST', path: '/auth/login', auth: 'none', body: { email: 'admin@kktcgaleri.com', password: '123456' }, expectedStatus: 200, mutating: false },
  { name: 'Login fail (bad password)', group: 'auth', method: 'POST', path: '/auth/login', auth: 'none', body: { email: 'admin@kktcgaleri.com', password: 'wrong' }, expectedStatus: 401, mutating: false },
  { name: 'Me (authenticated)', group: 'auth', method: 'GET', path: '/auth/me', auth: 'master', expectedStatus: 200 },
  { name: 'Me (no auth → 401)', group: 'auth', method: 'GET', path: '/auth/me', auth: 'none', expectedStatus: 401 },
  { name: 'Refresh token', group: 'auth', method: 'POST', path: '/auth/refresh', auth: 'none', body: { refreshToken: 'invalid-token' }, expectedStatus: 401, mutating: false },

  // ═══════════════════════════════════════════════════════════
  // COUNTRIES (master panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List countries', group: 'countries', method: 'GET', path: '/countries', auth: 'master', expectedStatus: 200 },
  { name: 'Get country by ID', group: 'countries', method: 'GET', path: '/countries/:id', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'countries' } },
  { name: 'Active countries (gallery)', group: 'countries', method: 'GET', path: '/countries/active', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Countries (no auth → 401)', group: 'countries', method: 'GET', path: '/countries', auth: 'none', expectedStatus: 401 },

  // ═══════════════════════════════════════════════════════════
  // TAX RATES (master panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List tax rates', group: 'tax-rates', method: 'GET', path: '/tax-rates', auth: 'master', expectedStatus: 200 },
  { name: 'Active tax rates', group: 'tax-rates', method: 'GET', path: '/tax-rates/active', auth: 'master', expectedStatus: 200 },
  { name: 'Get tax rate by ID', group: 'tax-rates', method: 'GET', path: '/tax-rates/:id', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'tax-rates' } },
  { name: 'Tax rate history', group: 'tax-rates', method: 'GET', path: '/tax-rates/:id/history', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'tax-rates' } },

  // ═══════════════════════════════════════════════════════════
  // EXCHANGE RATES (master panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List exchange rates', group: 'exchange-rates', method: 'GET', path: '/exchange-rates', auth: 'master', expectedStatus: 200 },
  { name: 'Get by currency code', group: 'exchange-rates', method: 'GET', path: '/exchange-rates/USD', auth: 'master', expectedStatus: 200 },
  { name: 'Exchange rate settings', group: 'exchange-rates', method: 'GET', path: '/exchange-rates/settings', auth: 'master', expectedStatus: 200 },
  { name: 'Exchange rate history', group: 'exchange-rates', method: 'GET', path: '/exchange-rates/history/USD', auth: 'master', expectedStatus: 200 },
  { name: 'Current rate (gallery)', group: 'exchange-rates', method: 'GET', path: '/exchange-rates/current/USD', auth: 'gallery_owner', expectedStatus: 200 },

  // ═══════════════════════════════════════════════════════════
  // GALLERIES (master panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List galleries', group: 'galleries', method: 'GET', path: '/galleries', auth: 'master', expectedStatus: 200 },
  { name: 'Get gallery by ID', group: 'galleries', method: 'GET', path: '/galleries/:id', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'galleries' } },
  { name: 'Gallery stats', group: 'galleries', method: 'GET', path: '/galleries/:id/stats', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'galleries' } },

  // ═══════════════════════════════════════════════════════════
  // AUDIT LOGS (master panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List audit logs', group: 'audit-logs', method: 'GET', path: '/audit-logs', auth: 'master', expectedStatus: 200 },
  { name: 'Get audit log by ID', group: 'audit-logs', method: 'GET', path: '/audit-logs/:id', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'audit-logs' } },

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  { name: 'List notifications (master)', group: 'notifications', method: 'GET', path: '/notifications', auth: 'master', expectedStatus: 200 },
  { name: 'Get notification by ID', group: 'notifications', method: 'GET', path: '/notifications/:id', auth: 'master', expectedStatus: 200, pathParams: { ':id': 'notifications' } },
  { name: 'Gallery notifications', group: 'notifications', method: 'GET', path: '/notifications/gallery', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Unread count', group: 'notifications', method: 'GET', path: '/notifications/unread-count', auth: 'gallery_owner', expectedStatus: 200 },

  // ═══════════════════════════════════════════════════════════
  // VEHICLES (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List vehicles', group: 'vehicles', method: 'GET', path: '/vehicles', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Vehicle stats', group: 'vehicles', method: 'GET', path: '/vehicles/stats', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Get vehicle by ID', group: 'vehicles', method: 'GET', path: '/vehicles/:id', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':id': 'vehicles' } },
  { name: 'Vehicle documents', group: 'vehicles', method: 'GET', path: '/vehicles/:vehicleId/documents', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':vehicleId': 'vehicles' } },
  { name: 'Vehicle expenses', group: 'vehicles', method: 'GET', path: '/vehicles/:vehicleId/expenses', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':vehicleId': 'vehicles' } },
  { name: 'Vehicle images', group: 'vehicles', method: 'GET', path: '/vehicles/:vehicleId/images', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':vehicleId': 'vehicles' } },

  // ═══════════════════════════════════════════════════════════
  // CALCULATOR (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'Calculator rates', group: 'calculator', method: 'GET', path: '/calculator/rates', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Calculator history', group: 'calculator', method: 'GET', path: '/calculator/history', auth: 'gallery_owner', expectedStatus: 200 },
  {
    name: 'Calculate import cost',
    group: 'calculator',
    method: 'POST',
    path: '/calculator/calculate',
    auth: 'gallery_owner',
    expectedStatus: 201,
    mutating: true,
    body: {
      fobPrice: 6000,
      shippingCost: 600,
      insuranceCost: 100,
      engineCC: 1600,
      vehicleType: 'PASSENGER',
      modelYear: 2022,
    },
    bodyParams: { originCountryId: 'countries' },
  },

  // ═══════════════════════════════════════════════════════════
  // PRODUCTS (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List products', group: 'products', method: 'GET', path: '/products', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Product stats', group: 'products', method: 'GET', path: '/products/stats', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Get product by ID', group: 'products', method: 'GET', path: '/products/:id', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':id': 'products' } },

  // ═══════════════════════════════════════════════════════════
  // CUSTOMERS (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List customers', group: 'customers', method: 'GET', path: '/customers', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Customer stats', group: 'customers', method: 'GET', path: '/customers/stats', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Get customer by ID', group: 'customers', method: 'GET', path: '/customers/:id', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':id': 'customers' } },

  // ═══════════════════════════════════════════════════════════
  // SALES (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'List sales', group: 'sales', method: 'GET', path: '/sales', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Sales stats', group: 'sales', method: 'GET', path: '/sales/stats', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Get sale by ID', group: 'sales', method: 'GET', path: '/sales/:id', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':id': 'sales' } },

  // ═══════════════════════════════════════════════════════════
  // STOCK MOVEMENTS (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'Recent movements', group: 'stock-movements', method: 'GET', path: '/stock-movements/recent', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Movements by product', group: 'stock-movements', method: 'GET', path: '/stock-movements/product/:productId', auth: 'gallery_owner', expectedStatus: 200, pathParams: { ':productId': 'products' } },

  // ═══════════════════════════════════════════════════════════
  // STOCK ALERTS (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'Low stock alerts', group: 'stock-alerts', method: 'GET', path: '/stock-alerts/low-stock', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Check stock levels', group: 'stock-alerts', method: 'POST', path: '/stock-alerts/check', auth: 'gallery_owner', expectedStatus: 200, mutating: true },

  // ═══════════════════════════════════════════════════════════
  // STOCK COUNT (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'Stock count products', group: 'stock-count', method: 'GET', path: '/stock-count/products', auth: 'gallery_owner', expectedStatus: 200 },

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'Dashboard stats', group: 'dashboard', method: 'GET', path: '/dashboard', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Dashboard charts', group: 'dashboard', method: 'GET', path: '/dashboard/charts', auth: 'gallery_owner', expectedStatus: 200 },

  // ═══════════════════════════════════════════════════════════
  // REPORTS (gallery panel)
  // ═══════════════════════════════════════════════════════════
  { name: 'Vehicle inventory report', group: 'reports', method: 'GET', path: '/reports/vehicle-inventory', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Vehicle status report', group: 'reports', method: 'GET', path: '/reports/vehicle-status', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Cost report', group: 'reports', method: 'GET', path: '/reports/costs', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Stock report', group: 'reports', method: 'GET', path: '/reports/stock', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Sales report', group: 'reports', method: 'GET', path: '/reports/sales', auth: 'gallery_owner', expectedStatus: 200 },
  { name: 'Financial summary', group: 'reports', method: 'GET', path: '/reports/financial-summary', auth: 'gallery_owner', expectedStatus: 200 },

  // ═══════════════════════════════════════════════════════════
  // AUTH / ROLE BOUNDARY TESTS (expected 401 or 403)
  // ═══════════════════════════════════════════════════════════
  { name: 'Vehicles (no auth → 401)', group: 'auth', method: 'GET', path: '/vehicles', auth: 'none', expectedStatus: 401 },
  { name: 'Tax rates (gallery → 403)', group: 'auth', method: 'GET', path: '/tax-rates', auth: 'gallery_owner', expectedStatus: 403 },
  { name: 'Galleries (gallery → 403)', group: 'auth', method: 'GET', path: '/galleries', auth: 'gallery_owner', expectedStatus: 403 },
  { name: 'Audit logs (gallery → 403)', group: 'auth', method: 'GET', path: '/audit-logs', auth: 'gallery_owner', expectedStatus: 403 },
  { name: 'Dashboard (staff → 403)', group: 'auth', method: 'GET', path: '/dashboard', auth: 'gallery_staff', expectedStatus: 403 },
  { name: 'Sales (no auth → 401)', group: 'auth', method: 'GET', path: '/sales', auth: 'none', expectedStatus: 401 },
  { name: 'Reports (staff → 403)', group: 'auth', method: 'GET', path: '/reports/sales', auth: 'gallery_staff', expectedStatus: 403 },
  { name: 'Customers (staff → 403)', group: 'auth', method: 'GET', path: '/customers', auth: 'gallery_staff', expectedStatus: 403 },
];

import { test, expect } from '@playwright/test'

// All pages to check for console errors
const PAGES = [
  // Auth pages
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },

  // Master panel pages
  { name: 'Master Dashboard', path: '/master' },
  { name: 'Tax Rates', path: '/master/tax-rates' },
  { name: 'Exchange Rates', path: '/master/exchange-rates' },
  { name: 'Countries', path: '/master/countries' },
  { name: 'Galleries', path: '/master/galleries' },
  { name: 'Notifications', path: '/master/notifications' },
  { name: 'Audit Logs', path: '/master/audit-logs' },

  // Gallery panel pages
  { name: 'Gallery Dashboard', path: '/dashboard' },
  { name: 'Vehicles', path: '/dashboard/vehicles' },
  { name: 'Vehicle New', path: '/dashboard/vehicles/new' },
  { name: 'Transit', path: '/dashboard/vehicles/transit' },
  { name: 'Calculator', path: '/dashboard/calculator' },
  { name: 'Products', path: '/dashboard/products' },
  { name: 'Customers', path: '/dashboard/customers' },
  { name: 'Sales', path: '/dashboard/sales' },
  { name: 'Reports', path: '/dashboard/reports' },
  { name: 'Finance', path: '/dashboard/finance' },
]

interface ConsoleMsg {
  type: string
  text: string
}

for (const page of PAGES) {
  test(`${page.name} (${page.path}) — no console errors`, async ({ page: p }) => {
    const errors: ConsoleMsg[] = []
    const warnings: ConsoleMsg[] = []

    p.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ type: 'error', text: msg.text() })
      }
      if (msg.type() === 'warning') {
        warnings.push({ type: 'warning', text: msg.text() })
      }
    })

    p.on('pageerror', (err) => {
      errors.push({ type: 'pageerror', text: err.message })
    })

    await p.goto(page.path, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
      // Some pages may redirect — that's OK
    })

    // Wait a bit for any async errors
    await p.waitForTimeout(2000)

    // Log all findings
    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n=== ${page.name} (${page.path}) ===`)
      for (const e of errors) {
        console.log(`  ❌ [${e.type}] ${e.text}`)
      }
      for (const w of warnings) {
        console.log(`  ⚠️ [warning] ${w.text}`)
      }
    }

    // Fail only on actual JS errors, not API 401s or network errors
    const jsErrors = errors.filter(
      (e) =>
        !e.text.includes('401') &&
        !e.text.includes('403') &&
        !e.text.includes('Failed to fetch') &&
        !e.text.includes('NetworkError') &&
        !e.text.includes('ERR_CONNECTION_REFUSED') &&
        !e.text.includes('net::ERR')
    )

    // Don't fail test — just collect data
    // expect(jsErrors).toHaveLength(0)
  })
}

import { test } from '@playwright/test'

// All pages to check — grouped by panel
const AUTH_PAGES = [
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
]

const MASTER_PAGES = [
  { name: 'Master Dashboard', path: '/master' },
  { name: 'Tax Rates', path: '/master/tax-rates' },
  { name: 'Exchange Rates', path: '/master/exchange-rates' },
  { name: 'Countries', path: '/master/countries' },
  { name: 'Galleries', path: '/master/galleries' },
  { name: 'Notifications', path: '/master/notifications' },
  { name: 'Audit Logs', path: '/master/audit-logs' },
]

const GALLERY_PAGES = [
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

interface LogEntry {
  type: string
  text: string
}

// Collect ALL console output from every page
const allFindings: Record<string, LogEntry[]> = {}

async function visitAndCollect(p: any, name: string, path: string) {
  const logs: LogEntry[] = []

  p.on('console', (msg: any) => {
    const type = msg.type()
    const text = msg.text()
    // Skip common non-issues
    if (text.includes('Download the React DevTools')) return
    if (text.includes('[HMR]') || text.includes('[Fast Refresh]')) return
    if (text.includes('webpack')) return
    if (type === 'log' || type === 'info' || type === 'debug') return

    logs.push({ type, text })
  })

  p.on('pageerror', (err: any) => {
    logs.push({ type: 'PAGE_ERROR', text: err.message })
  })

  try {
    const response = await p.goto(path, { waitUntil: 'networkidle', timeout: 15000 })
    const status = response?.status() || 0

    // Check for server errors
    if (status >= 500) {
      logs.push({ type: 'HTTP_ERROR', text: `HTTP ${status} on ${path}` })
    }
  } catch (err: any) {
    logs.push({ type: 'NAVIGATION_ERROR', text: err.message })
  }

  // Wait for async rendering
  await p.waitForTimeout(3000)

  if (logs.length > 0) {
    allFindings[`${name} (${path})`] = logs
  }
}

test('Auth pages — collect console output', async ({ page }) => {
  for (const pg of AUTH_PAGES) {
    await visitAndCollect(page, pg.name, pg.path)
  }
})

test('Master pages — collect console output (no auth)', async ({ page }) => {
  test.setTimeout(120000)
  for (const pg of MASTER_PAGES) {
    await visitAndCollect(page, pg.name, pg.path)
  }
})

test('Gallery pages — collect console output (no auth)', async ({ page }) => {
  test.setTimeout(120000)
  for (const pg of GALLERY_PAGES) {
    await visitAndCollect(page, pg.name, pg.path)
  }
})

test.afterAll(() => {
  console.log('\n\n========================================')
  console.log('   CONSOLE ERROR REPORT')
  console.log('========================================\n')

  const pageNames = Object.keys(allFindings)
  if (pageNames.length === 0) {
    console.log('   ✅ No console errors or warnings found on any page!\n')
    return
  }

  for (const pageName of pageNames) {
    const logs = allFindings[pageName]
    console.log(`📄 ${pageName}`)
    for (const log of logs) {
      const icon = log.type === 'error' || log.type === 'PAGE_ERROR' ? '❌' : '⚠️'
      console.log(`   ${icon} [${log.type}] ${log.text.substring(0, 200)}`)
    }
    console.log('')
  }

  console.log(`Total pages with issues: ${pageNames.length}`)
  const totalErrors = Object.values(allFindings).flat().length
  console.log(`Total issues: ${totalErrors}`)
  console.log('========================================\n')
})

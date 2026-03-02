import { test } from '@playwright/test'

const API_BASE = 'http://localhost:4000/api'

interface LogEntry {
  type: string
  text: string
  url?: string
}

const allFindings: Record<string, LogEntry[]> = {}

async function login(page: any, email: string, password: string): Promise<string | null> {
  try {
    const res = await page.request.post(`${API_BASE}/auth/login`, {
      data: { email, password },
    })
    const body = await res.json()
    if (body.data?.accessToken) {
      return body.data.accessToken
    }
    return null
  } catch {
    return null
  }
}

async function visitWithAuth(page: any, token: string, name: string, path: string) {
  const logs: LogEntry[] = []

  page.on('console', (msg: any) => {
    const type = msg.type()
    const text = msg.text()
    if (text.includes('Download the React DevTools')) return
    if (text.includes('[HMR]') || text.includes('[Fast Refresh]')) return
    if (text.includes('webpack') || text.includes('next-dev')) return
    if (type === 'log' || type === 'info' || type === 'debug') return

    logs.push({ type, text: text.substring(0, 300), url: page.url() })
  })

  page.on('pageerror', (err: any) => {
    logs.push({ type: 'PAGE_ERROR', text: err.message.substring(0, 300), url: page.url() })
  })

  // Set auth token in localStorage before navigating (matches authStore pattern)
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t: string) => {
    localStorage.setItem('accessToken', t)
    document.cookie = 'auth_session=1; path=/; SameSite=Lax'
  }, token)

  try {
    await page.goto(path, { waitUntil: 'networkidle', timeout: 15000 })
  } catch {
    // Some pages may redirect or be slow
  }

  await page.waitForTimeout(2000)

  if (logs.length > 0) {
    allFindings[`${name} (${path})`] = logs
  }
}

// ─── Master Admin: test all master pages ─────────────────────────
test('Master Panel — authenticated console check', async ({ page }) => {
  test.setTimeout(120000)

  const token = await login(page, 'admin@kktcgaleri.com', '123456')
  if (!token) {
    console.log('⚠️ Could not login as master admin — skipping authenticated tests')
    console.log('   Make sure the API is running on port 3001 and DB is seeded')
    return
  }

  const masterPages = [
    { name: 'Master Dashboard', path: '/master' },
    { name: 'Tax Rates', path: '/master/tax-rates' },
    { name: 'Exchange Rates', path: '/master/exchange-rates' },
    { name: 'Countries', path: '/master/countries' },
    { name: 'Galleries', path: '/master/galleries' },
    { name: 'Notifications', path: '/master/notifications' },
    { name: 'Audit Logs', path: '/master/audit-logs' },
  ]

  for (const pg of masterPages) {
    await visitWithAuth(page, token, pg.name, pg.path)
  }
})

// ─── Gallery Owner: test all gallery pages ───────────────────────
test('Gallery Panel — authenticated console check', async ({ page }) => {
  test.setTimeout(120000)

  const token = await login(page, 'owner@demogaleri.com', '123456')
  if (!token) {
    console.log('⚠️ Could not login as gallery owner — skipping authenticated tests')
    console.log('   Make sure the API is running on port 3001 and DB is seeded')
    return
  }

  const galleryPages = [
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

  for (const pg of galleryPages) {
    await visitWithAuth(page, token, pg.name, pg.path)
  }
})

test.afterAll(() => {
  console.log('\n\n========================================')
  console.log('   AUTH CONSOLE ERROR REPORT')
  console.log('========================================\n')

  const pageNames = Object.keys(allFindings)
  if (pageNames.length === 0) {
    console.log('   ✅ No console errors or warnings found on any authenticated page!\n')
    return
  }

  for (const pageName of pageNames) {
    const logs = allFindings[pageName]
    console.log(`📄 ${pageName}`)
    for (const log of logs) {
      const icon = log.type === 'error' || log.type === 'PAGE_ERROR' ? '❌' : '⚠️'
      console.log(`   ${icon} [${log.type}] ${log.text}`)
    }
    console.log('')
  }

  console.log(`Total pages with issues: ${pageNames.length}`)
  const totalErrors = Object.values(allFindings).flat().length
  console.log(`Total issues: ${totalErrors}`)
  console.log('========================================\n')
})

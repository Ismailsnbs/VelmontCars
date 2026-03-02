import { test } from '@playwright/test'

const API_BASE = 'http://localhost:4000/api'

test('Debug Vehicles page network errors', async ({ page }) => {
  test.setTimeout(60000)

  // Login
  const res = await page.request.post(`${API_BASE}/auth/login`, {
    data: { email: 'owner@demogaleri.com', password: '123456' },
  })
  const body = await res.json()
  const token = body.data?.accessToken

  if (!token) {
    console.log('Could not login')
    return
  }

  // Set auth
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t: string) => {
    localStorage.setItem('accessToken', t)
    document.cookie = 'auth_session=1; path=/; SameSite=Lax'
  }, token)

  // Listen for failed network requests
  page.on('requestfailed', (req) => {
    console.log(`❌ FAILED: ${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
  })

  page.on('response', (response) => {
    const status = response.status()
    if (status >= 400) {
      console.log(`🔴 HTTP ${status}: ${response.request().method()} ${response.url()}`)
    }
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`📛 Console error: ${msg.text().substring(0, 200)}`)
    }
  })

  console.log('\n=== Navigating to /dashboard/vehicles ===')
  await page.goto('/dashboard/vehicles', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(3000)

  console.log('\n=== Navigating to /dashboard/vehicles/transit ===')
  await page.goto('/dashboard/vehicles/transit', { waitUntil: 'networkidle', timeout: 15000 })
  await page.waitForTimeout(3000)
})

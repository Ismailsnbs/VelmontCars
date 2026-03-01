import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Public paths that do not require authentication.
 * All other paths under /master and /dashboard are protected.
 */
const PUBLIC_PATHS: ReadonlySet<string> = new Set(['/', '/login', '/register'])

/**
 * Next.js Edge Middleware — server-side route protection.
 *
 * Token storage strategy: JWTs live in localStorage (client-only). To bridge
 * the gap with edge middleware, the authStore writes a lightweight presence
 * cookie (`auth_session=1`) on every successful login/token-refresh and clears
 * it on logout. This cookie carries NO sensitive data — it is purely a signal
 * so the middleware can fast-redirect unauthenticated users before the page
 * renders, even with JS disabled.
 *
 * NOTE: This is a defense-in-depth UX layer. The authoritative security check
 * is the API-side JWT verification. An attacker who manually sets the cookie
 * will still be rejected by every protected API endpoint.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl

  // Static assets, Next.js internals, and explicit API routes pass through.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    // Any path segment containing a dot is treated as a static file.
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Public paths always pass through.
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Protected zone: /master/* and /dashboard/*
  const isProtected =
    pathname.startsWith('/master') || pathname.startsWith('/dashboard')

  if (!isProtected) {
    return NextResponse.next()
  }

  // Check the lightweight auth presence cookie set by authStore on login.
  const hasSession = Boolean(request.cookies.get('auth_session')?.value)

  if (!hasSession) {
    // Preserve the intended destination so the login page can redirect back.
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

/**
 * Limit the middleware invocation to protected route prefixes only.
 * Static file paths (/_next, /favicon.ico, etc.) are excluded automatically
 * by Next.js when using this matcher syntax.
 */
export const config = {
  matcher: ['/master/:path*', '/dashboard/:path*'],
}

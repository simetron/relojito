import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase auth session on every request and redirects
 * unauthenticated users away from protected `/(app)/*` routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request (for downstream middleware) and
          // the response (so the browser receives the refreshed session).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — do NOT remove this call.
  // It keeps the user's session alive and writes updated cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes under /(app)/* — redirect unauthenticated users to /login
  const { pathname } = request.nextUrl
  const isAppRoute = pathname.startsWith('/dashboard') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/stats') ||
    pathname.startsWith('/settings')

  if (isAppRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages and landing page
  const isAuthRoute = pathname === '/login' || pathname === '/register'
  const isLandingPage = pathname === '/'
  if ((isAuthRoute || isLandingPage) && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

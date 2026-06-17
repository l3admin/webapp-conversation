import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'
  const requestedTargetUrl = new URL(redirectTo, requestUrl.origin)
  const targetUrl = requestedTargetUrl.origin === requestUrl.origin
    ? requestedTargetUrl
    : new URL('/', requestUrl.origin)

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const signInUrl = new URL('/sign-in', requestUrl.origin)
    signInUrl.searchParams.set('authError', 'missing_supabase_env')
    return NextResponse.redirect(signInUrl)
  }

  if (!code) {
    const signInUrl = new URL('/sign-in', requestUrl.origin)
    signInUrl.searchParams.set('authError', 'missing_code')
    return NextResponse.redirect(signInUrl)
  }

  const response = NextResponse.redirect(targetUrl)
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const signInUrl = new URL('/sign-in', requestUrl.origin)
    signInUrl.searchParams.set('authError', 'exchange_failed')
    return NextResponse.redirect(signInUrl)
  }

  return response
}

import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { createServerClient } from '@supabase/ssr'
import { API_KEY, API_URL, APP_ID, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config'

const userPrefix = `user_${APP_ID}:`

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const createSupabaseRouteClient = (request: NextRequest) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.')
  }

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {},
    },
  })
}

export const getInfo = async (request: NextRequest) => {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user: authUser }, error } = await supabase.auth.getUser()
  if (error || !authUser) {
    throw new AuthError(`Unauthorized Supabase session. reason=${error?.message || 'missing_user'}`)
  }

  const user = userPrefix + authUser.id
  return {
    user,
    authUserId: authUser.id,
  }
}

export const client = new ChatClient(API_KEY, API_URL || undefined)

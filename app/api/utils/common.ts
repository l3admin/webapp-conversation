import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { createServerClient } from '@supabase/ssr'
import { DIFY_API_BASE_URL, DIFY_APP_API_KEY_KN_COLD } from '@/config/server'
import { SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY } from '@/config'

const userPrefix = 'user:'
let cachedClient: ChatClient | null = null

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const createSupabaseRouteClient = (request: NextRequest) => {
  if (!SUPABASE_PROJECT_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_PROJECT_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required.')
  }

  return createServerClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY, {
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

export const getClient = () => {
  if (!DIFY_APP_API_KEY_KN_COLD || !DIFY_API_BASE_URL) {
    throw new Error('Missing Dify configuration: DIFY_APP_API_KEY_KN_COLD and DIFY_API_BASE_URL are required on the server.')
  }
  if (!cachedClient) {
    cachedClient = new ChatClient(DIFY_APP_API_KEY_KN_COLD, DIFY_API_BASE_URL)
  }
  return cachedClient
}

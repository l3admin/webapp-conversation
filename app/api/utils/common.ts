import type { NextRequest } from 'next/server'
import { ChatClient } from 'dify-client'
import { createServerClient } from '@supabase/ssr'
import { DIFY_API_BASE_URL, DIFY_APP_API_KEY_KN_COLD, getSupabaseServerConfig } from '@/config/server'

const userPrefix = 'user:'
let cachedClient: ChatClient | null = null

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const createSupabaseRouteClient = (request: NextRequest) => {
  const { url, publishableKey } = getSupabaseServerConfig()

  return createServerClient(url, publishableKey, {
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

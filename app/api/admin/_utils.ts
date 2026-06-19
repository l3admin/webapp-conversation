import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { getSupabaseSecretKeyConfig, getSupabaseServerConfig } from '@/config/server'

export const createSupabaseRouteClient = (request: NextRequest) => {
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

export const createSupabaseAdminClient = () => {
  const { url, secretKey } = getSupabaseSecretKeyConfig()
  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const requireMasterAdmin = async (request: NextRequest) => {
  const routeClient = createSupabaseRouteClient(request)
  const {
    data: { user },
    error: authError,
  } = await routeClient.auth.getUser()
  if (authError || !user) {
    throw new AuthError(`Unauthorized Supabase session. reason=${authError?.message || 'missing_user'}`)
  }

  const { data: profile, error: profileError } = await routeClient
    .from('user_profiles')
    .select('is_master_admin,is_disabled,must_change_password')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error(`Failed to resolve admin role. user_id=${user.id} reason=${profileError?.message || 'missing_profile'}`)
  }
  if (profile.is_disabled) {
    throw new AuthError(`Admin access denied for disabled user. user_id=${user.id}`)
  }
  if (profile.must_change_password) {
    throw new AuthError(`Admin access denied until password is changed. user_id=${user.id}`)
  }
  if (!profile.is_master_admin) {
    throw new AuthError(`Admin access denied. user_id=${user.id}`)
  }

  return {
    authUserId: user.id,
  }
}

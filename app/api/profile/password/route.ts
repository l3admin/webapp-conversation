import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient } from '@/app/api/admin/_utils'
import { getSupabaseServerConfig } from '@/config/server'

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

const normalizePassword = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: password must be a string.')
  }
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Invalid payload: password is required.')
  }
  if (normalized.length < 6) {
    throw new Error('Invalid payload: password must be at least 6 characters.')
  }
  const hasLetter = /[a-zA-Z]/.test(normalized)
  const hasNumber = /\d/.test(normalized)
  if (!hasLetter || !hasNumber) {
    throw new Error('Invalid payload: password must contain at least one letter and one number.')
  }
  if (normalized.length > 128) {
    throw new Error('Invalid payload: password exceeds max length 128.')
  }
  return normalized
}

const normalizeCurrentPassword = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: current_password must be a string.')
  }
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Invalid payload: current_password is required.')
  }
  return normalized
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseRouteClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new AuthError(`Unauthorized Supabase session. reason=${authError?.message || 'missing_user'}`)
    }

    const body = await request.json()
    const password = normalizePassword(body?.password)
    const { data: passwordStateProfile, error: passwordStateError } = await supabase
      .from('user_profiles')
      .select('must_change_password')
      .eq('user_id', user.id)
      .single()
    if (passwordStateError || !passwordStateProfile) {
      throw new Error(`Failed to load password state profile. user_id=${user.id} reason=${passwordStateError?.message || 'empty_result'}`)
    }

    if (!passwordStateProfile.must_change_password) {
      const currentPassword = normalizeCurrentPassword(body?.current_password)
      if (!user.email) {
        throw new Error(`Cannot verify current password: missing email on auth user. user_id=${user.id}`)
      }
      const { error: verifyPasswordError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyPasswordError) {
        throw new Error(`Current password verification failed. user_id=${user.id} reason=${verifyPasswordError.message}`)
      }
    }

    const serviceClient = createSupabaseAdminClient()
    const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(user.id, { password })
    if (updateAuthError) {
      throw new Error(`Failed to update password in auth user record. user_id=${user.id} reason=${updateAuthError.message}`)
    }

    const { data: updatedProfile, error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('user_id,must_change_password,password_changed_at')
      .single()

    if (profileUpdateError || !updatedProfile) {
      throw new Error(`Failed to update password state in user profile. user_id=${user.id} reason=${profileUpdateError?.message || 'empty_result'}`)
    }

    return NextResponse.json({
      data: {
        user_id: updatedProfile.user_id,
        must_change_password: Boolean(updatedProfile.must_change_password),
        password_changed_at: updatedProfile.password_changed_at,
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Password update failed',
      context: 'profile-password',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Payload { password: string, current_password?: string }',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

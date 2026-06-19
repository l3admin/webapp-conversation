import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { AuthError, getInfo } from '@/app/api/utils/common'
import { getSupabaseServerConfig } from '@/config/server'

type UserProfileRow = {
  user_id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  initials_override: string | null
  avatar_url: string | null
  is_master_admin: boolean
  is_disabled: boolean
  must_change_password: boolean
  password_changed_at: string | null
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

const normalizeNullableString = (value: unknown, field: string, maxLength = 200) => {
  if (value === null || typeof value === 'undefined')
    return null
  if (typeof value !== 'string')
    throw new Error(`Invalid profile payload: '${field}' must be string or null.`)
  const trimmed = value.trim()
  if (!trimmed)
    return null
  if (trimmed.length > maxLength)
    throw new Error(`Invalid profile payload: '${field}' exceeds max length ${maxLength}.`)
  return trimmed
}

const normalizeInitials = (value: unknown) => {
  const normalized = normalizeNullableString(value, 'initials_override', 4)
  if (!normalized)
    return null
  const filtered = normalized.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (!filtered)
    throw new Error('Invalid profile payload: initials_override must include letters.')
  if (filtered.length > 4)
    throw new Error('Invalid profile payload: initials_override max length is 4 letters.')
  return filtered
}

export async function GET(request: NextRequest) {
  try {
    const info = await getInfo(request)
    const supabase = createSupabaseRouteClient(request)
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_id,display_name,first_name,last_name,initials_override,avatar_url,is_master_admin,is_disabled,must_change_password,password_changed_at')
      .eq('user_id', info.authUserId)
      .single()

    if (error || !profile) {
      throw new Error(`Failed to load profile. user_id=${info.authUserId} reason=${error?.message || 'missing_profile_row'}`)
    }

    return NextResponse.json({
      profile: profile as UserProfileRow,
      viewer: info.viewer,
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Profile request failed',
      context: 'profile',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Existing user profile row with valid contract',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const info = await getInfo(request)
    const body = await request.json()
    const payload = {
      first_name: normalizeNullableString(body?.first_name, 'first_name', 80),
      last_name: normalizeNullableString(body?.last_name, 'last_name', 80),
      display_name: normalizeNullableString(body?.display_name, 'display_name', 100),
      initials_override: normalizeInitials(body?.initials_override),
      avatar_url: normalizeNullableString(body?.avatar_url, 'avatar_url', 500),
    }

    const supabase = createSupabaseRouteClient(request)
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(payload)
      .eq('user_id', info.authUserId)
      .select('user_id,display_name,first_name,last_name,initials_override,avatar_url,is_master_admin,is_disabled,must_change_password,password_changed_at')
      .single()

    if (error || !updatedProfile) {
      throw new Error(`Failed to update profile. user_id=${info.authUserId} reason=${error?.message || 'empty_update_result'}`)
    }

    const refreshedInfo = await getInfo(request)
    return NextResponse.json({
      profile: updatedProfile as UserProfileRow,
      viewer: refreshedInfo.viewer,
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Profile update failed',
      context: 'profile',
      expected: error instanceof AuthError ? 'Authenticated Supabase session cookie' : 'Valid profile payload fields',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

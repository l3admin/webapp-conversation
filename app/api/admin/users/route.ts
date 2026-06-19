import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const normalizeNullableString = (value: unknown, field: string, maxLength: number) => {
  if (typeof value === 'undefined' || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid payload: '${field}' must be a string or null.`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > maxLength) {
    throw new Error(`Invalid payload: '${field}' exceeds max length ${maxLength}.`)
  }
  return trimmed
}

const normalizeEmail = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: email must be a string.')
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    throw new Error('Invalid payload: email is required.')
  }
  if (!normalized.includes('@')) {
    throw new Error(`Invalid payload: email must contain '@'. received=${normalized}`)
  }
  return normalized
}

const normalizeSendInviteEmail = (value: unknown) => {
  if (typeof value === 'undefined') {
    return false
  }
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid payload: send_invite_email must be boolean. received=${String(value)}`)
  }
  return value
}

const normalizePassword = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: password must be a string.')
  }
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Invalid payload: password is required.')
  }
  if (normalized.length < 8) {
    throw new Error('Invalid payload: password must be at least 8 characters.')
  }
  if (normalized.length > 128) {
    throw new Error('Invalid payload: password exceeds max length 128.')
  }
  return normalized
}

export async function GET(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const serviceClient = createSupabaseAdminClient()

    const { data: profileRows, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('user_id,display_name,first_name,last_name,is_master_admin,is_disabled,must_change_password')
      .order('created_at', { ascending: false })

    if (profileError || !profileRows) {
      throw new Error(`Failed to load user_profiles for admin users list. reason=${profileError?.message || 'empty_result'}`)
    }

    const { data: accessRows, error: accessError } = await serviceClient
      .from('user_customer_access')
      .select('user_id,customer_id')

    if (accessError) {
      throw new Error(`Failed to load user_customer_access for admin users list. reason=${accessError.message}`)
    }

    const {
      data: { users },
      error: authUsersError,
    } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (authUsersError || !users) {
      throw new Error(`Failed to load auth users for admin users list. reason=${authUsersError?.message || 'empty_result'}`)
    }

    const customerIdsByUserId = new Map<string, string[]>()
    ;(accessRows || []).forEach((row) => {
      const existing = customerIdsByUserId.get(row.user_id) || []
      customerIdsByUserId.set(row.user_id, [...existing, row.customer_id])
    })

    const profileByUserId = new Map(profileRows.map(row => [row.user_id, row]))
    const data = users.map((user) => {
      const profile = profileByUserId.get(user.id)
      return {
        user_id: user.id,
        email: user.email || '',
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        display_name: profile?.display_name || null,
        is_master_admin: Boolean(profile?.is_master_admin),
        is_disabled: Boolean(profile?.is_disabled),
        must_change_password: Boolean(profile?.must_change_password),
        customer_ids: customerIdsByUserId.get(user.id) || [],
      }
    }).filter(user => !user.is_master_admin)

    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin users request failed',
      context: 'admin-users',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Existing auth users and profile linkage',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const body = await request.json()
    const email = normalizeEmail(body?.email)
    const firstName = normalizeNullableString(body?.first_name, 'first_name', 80)
    if (!firstName) {
      throw new Error("Invalid payload: 'first_name' is required.")
    }
    const lastName = normalizeNullableString(body?.last_name, 'last_name', 80)
    if (!lastName) {
      throw new Error("Invalid payload: 'last_name' is required.")
    }
    const displayName = normalizeNullableString(body?.display_name, 'display_name', 100)
    const sendInviteEmail = normalizeSendInviteEmail(body?.send_invite_email)
    const password = normalizePassword(body?.password)

    const serviceClient = createSupabaseAdminClient()
    const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })
    if (createUserError || !createdUser?.user?.id) {
      throw new Error(`Failed to create user. email=${email} reason=${createUserError?.message || 'missing_user_id'}`)
    }
    const userId = createdUser.user.id

    if (sendInviteEmail) {
      const redirectTo = new URL('/auth/callback', new URL(request.url).origin).toString()
      const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, { redirectTo })
      if (inviteError) {
        throw new Error(`User created but invite email failed. user_id=${userId} email=${email} reason=${inviteError.message}`)
      }
    }

    const { data: upsertedProfile, error: upsertError } = await serviceClient
      .from('user_profiles')
      .upsert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        initials_override: null,
        avatar_url: null,
        is_master_admin: false,
        is_disabled: false,
        must_change_password: true,
        password_changed_at: null,
      })
      .select('user_id,display_name,first_name,last_name,is_master_admin,is_disabled,must_change_password')
      .single()

    if (upsertError || !upsertedProfile) {
      throw new Error(`Failed to upsert invited user profile. user_id=${userId} reason=${upsertError?.message || 'empty_upsert_result'}`)
    }

    return NextResponse.json({
      data: {
        user_id: userId,
        email,
        first_name: upsertedProfile.first_name,
        last_name: upsertedProfile.last_name,
        display_name: upsertedProfile.display_name,
        is_master_admin: Boolean(upsertedProfile.is_master_admin),
        is_disabled: Boolean(upsertedProfile.is_disabled),
        must_change_password: Boolean(upsertedProfile.must_change_password),
        customer_ids: [],
        invite_email_sent: sendInviteEmail,
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin user create failed',
      context: 'admin-users-create',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { email: string, password: string, first_name: string, last_name: string, display_name?: string|null, send_invite_email?: boolean }',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

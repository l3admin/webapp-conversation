import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const normalizeRequiredName = (value: unknown, field: string, maxLength = 80) => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid payload: '${field}' must be a string.`)
  }
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`Invalid payload: '${field}' is required.`)
  }
  if (trimmed.length > maxLength) {
    throw new Error(`Invalid payload: '${field}' exceeds max length ${maxLength}.`)
  }
  return trimmed
}

const normalizeNullableDisplayName = (value: unknown) => {
  if (typeof value === 'undefined' || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw new Error("Invalid payload: 'display_name' must be a string or null.")
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.length > 100) {
    throw new Error("Invalid payload: 'display_name' exceeds max length 100.")
  }
  return trimmed
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireMasterAdmin(request)
    const { userId } = await params
    if (!userId) {
      throw new Error('Invalid path: userId is required.')
    }

    const body = await request.json()
    const firstName = normalizeRequiredName(body?.first_name, 'first_name')
    const lastName = normalizeRequiredName(body?.last_name, 'last_name')
    const displayName = normalizeNullableDisplayName(body?.display_name)

    const serviceClient = createSupabaseAdminClient()
    const { data: updatedProfile, error: updateError } = await serviceClient
      .from('user_profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      })
      .eq('user_id', userId)
      .select('user_id,display_name,first_name,last_name,is_master_admin,is_disabled,must_change_password')
      .single()

    if (updateError || !updatedProfile) {
      throw new Error(`Failed to update user profile. user_id=${userId} reason=${updateError?.message || 'empty_result'}`)
    }

    const {
      data: { users },
      error: authUsersError,
    } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (authUsersError || !users) {
      throw new Error(`Failed to load auth user after profile update. user_id=${userId} reason=${authUsersError?.message || 'empty_result'}`)
    }
    const authUser = users.find(user => user.id === userId)
    if (!authUser) {
      throw new Error(`Failed to resolve auth user after profile update. user_id=${userId}`)
    }

    return NextResponse.json({
      data: {
        user_id: updatedProfile.user_id,
        email: authUser.email || '',
        first_name: updatedProfile.first_name,
        last_name: updatedProfile.last_name,
        display_name: updatedProfile.display_name,
        is_master_admin: Boolean(updatedProfile.is_master_admin),
        is_disabled: Boolean(updatedProfile.is_disabled),
        must_change_password: Boolean(updatedProfile.must_change_password),
        customer_ids: [],
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin user profile update failed',
      context: 'admin-users-update',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { first_name: string, last_name: string, display_name?: string|null } and valid userId path parameter',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

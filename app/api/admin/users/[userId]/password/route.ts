import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const normalizePassword = (value: unknown) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid payload: password must be a string.')
  }
  const normalized = value.trim()
  if (!normalized) {
    throw new Error('Invalid payload: password is required.')
  }
  if (normalized.length > 128) {
    throw new Error('Invalid payload: password exceeds max length 128.')
  }
  return normalized
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireMasterAdmin(request)
    const { userId } = await params
    if (!userId) {
      throw new Error('Invalid path: userId is required.')
    }
    if (userId === admin.authUserId) {
      throw new Error('Cannot reset password for the currently logged in admin user.')
    }

    const body = await request.json()
    const password = normalizePassword(body?.password)

    const serviceClient = createSupabaseAdminClient()
    const { error: updateAuthError } = await serviceClient.auth.admin.updateUserById(userId, { password })
    if (updateAuthError) {
      throw new Error(`Failed to reset user password. user_id=${userId} reason=${updateAuthError.message}`)
    }

    const { data: updatedProfile, error: profileError } = await serviceClient
      .from('user_profiles')
      .update({
        must_change_password: true,
        password_changed_at: null,
      })
      .eq('user_id', userId)
      .select('user_id,must_change_password')
      .single()

    if (profileError || !updatedProfile) {
      throw new Error(`Failed to update password reset state on profile. user_id=${userId} reason=${profileError?.message || 'empty_result'}`)
    }

    return NextResponse.json({
      data: {
        user_id: updatedProfile.user_id,
        must_change_password: Boolean(updatedProfile.must_change_password),
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin password reset request failed',
      context: 'admin-users-password-reset',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { password: string } and valid userId path parameter',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

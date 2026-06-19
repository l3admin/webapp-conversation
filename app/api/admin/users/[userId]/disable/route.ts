import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const normalizeDisabled = (value: unknown) => {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid payload: is_disabled must be boolean. received=${String(value)}`)
  }
  return value
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireMasterAdmin(request)
    const { userId } = await params
    if (!userId) {
      throw new Error('Invalid path: userId is required.')
    }
    if (userId === admin.authUserId) {
      throw new Error('Cannot disable the currently logged in admin user.')
    }

    const body = await request.json()
    const isDisabled = normalizeDisabled(body?.is_disabled)

    const serviceClient = createSupabaseAdminClient()

    const { data: updatedProfile, error: profileError } = await serviceClient
      .from('user_profiles')
      .update({
        is_disabled: isDisabled,
      })
      .eq('user_id', userId)
      .select('user_id,is_disabled')
      .single()

    if (profileError || !updatedProfile) {
      throw new Error(`Failed to update user disable state. user_id=${userId} reason=${profileError?.message || 'empty_result'}`)
    }

    if (isDisabled) {
      const { error: accessDeleteError } = await serviceClient
        .from('user_customer_access')
        .delete()
        .eq('user_id', userId)
      if (accessDeleteError) {
        throw new Error(`Failed to clear user customer access while disabling user. user_id=${userId} reason=${accessDeleteError.message}`)
      }
    }

    return NextResponse.json({
      data: {
        user_id: updatedProfile.user_id,
        is_disabled: updatedProfile.is_disabled,
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin disable user request failed',
      context: 'admin-users-disable',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { is_disabled: boolean } and valid userId path parameter',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

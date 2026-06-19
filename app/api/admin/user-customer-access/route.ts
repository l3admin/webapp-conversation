import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

const requireUuid = (value: unknown, field: string) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid payload: '${field}' is required.`)
  }
  return value.trim()
}

const requireRole = (value: unknown) => {
  if (value !== 'admin' && value !== 'member') {
    throw new Error(`Invalid payload: role must be 'admin' or 'member'. received=${String(value)}`)
  }
  return value
}

export async function POST(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const body = await request.json()
    const userId = requireUuid(body?.user_id, 'user_id')
    const customerId = requireUuid(body?.customer_id, 'customer_id')
    const role = requireRole(body?.role)

    const serviceClient = createSupabaseAdminClient()
    const { data, error } = await serviceClient
      .from('user_customer_access')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        role,
      }, { onConflict: 'user_id,customer_id' })
      .select('user_id,customer_id,role')
      .single()

    if (error || !data) {
      throw new Error(`Failed to save user_customer_access. user_id=${userId} customer_id=${customerId} reason=${error?.message || 'empty_result'}`)
    }

    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 400
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin user-customer assignment failed',
      context: 'admin-user-customer-access',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Payload { user_id: string, customer_id: string, role: admin|member }',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

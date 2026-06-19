import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

export async function GET(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const serviceClient = createSupabaseAdminClient()

    const [{ count: totalUsers, error: usersError }, { count: totalCustomers, error: customersError }, { count: totalAgentCatalog, error: agentCatalogError }, { count: totalCustomerAgentAssignments, error: customerAgentError }, { count: totalUserCustomerAssignments, error: userCustomerError }] = await Promise.all([
      serviceClient.from('user_profiles').select('*', { count: 'exact', head: true }),
      serviceClient.from('customers').select('*', { count: 'exact', head: true }),
      serviceClient.from('agent_catalog').select('*', { count: 'exact', head: true }),
      serviceClient.from('customer_agent_access').select('*', { count: 'exact', head: true }),
      serviceClient.from('user_customer_access').select('*', { count: 'exact', head: true }),
    ])

    const failingError = usersError || customersError || agentCatalogError || customerAgentError || userCustomerError
    if (failingError) {
      throw new Error(`Failed to load overview counts. reason=${failingError.message}`)
    }

    return NextResponse.json({
      data: {
        total_users: totalUsers || 0,
        total_customers: totalCustomers || 0,
        total_agent_catalog: totalAgentCatalog || 0,
        total_customer_agent_assignments: totalCustomerAgentAssignments || 0,
        total_user_customer_assignments: totalUserCustomerAssignments || 0,
      },
    })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin overview request failed',
      context: 'admin-overview',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Existing admin tables and readable count queries',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}

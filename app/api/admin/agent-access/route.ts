import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthError } from '@/app/api/utils/common'
import { createSupabaseAdminClient, requireMasterAdmin } from '@/app/api/admin/_utils'

type CustomerSummary = {
  id: string
  slug: string
  display_name: string
}

type UserProfileSummary = {
  user_id: string
  is_disabled: boolean
}

export async function GET(request: NextRequest) {
  try {
    await requireMasterAdmin(request)
    const serviceClient = createSupabaseAdminClient()

    const {
      data: { users: authUsers },
      error: authUsersError,
    } = await serviceClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (authUsersError || !authUsers) {
      throw new Error(`Failed to load auth users for access matrix. reason=${authUsersError?.message || 'empty_result'}`)
    }

    const { data: profiles, error: profilesError } = await serviceClient
      .from('user_profiles')
      .select('user_id,is_disabled')
    if (profilesError || !profiles) {
      throw new Error(`Failed to load user_profiles for access matrix. reason=${profilesError?.message || 'empty_result'}`)
    }

    const { data: userCustomerRows, error: userCustomerError } = await serviceClient
      .from('user_customer_access')
      .select('user_id,customer_id')
    if (userCustomerError) {
      throw new Error(`Failed to load user_customer_access for access matrix. reason=${userCustomerError.message}`)
    }

    const { data: customers, error: customersError } = await serviceClient
      .from('customers')
      .select('id,slug,display_name')
    if (customersError || !customers) {
      throw new Error(`Failed to load customers for access matrix. reason=${customersError?.message || 'empty_result'}`)
    }

    const { data: customerAgentRows, error: customerAgentError } = await serviceClient
      .from('customer_agent_access')
      .select('customer_id,agent_id,is_default')
    if (customerAgentError) {
      throw new Error(`Failed to load customer_agent_access for access matrix. reason=${customerAgentError.message}`)
    }

    const profileByUserId = new Map((profiles as UserProfileSummary[]).map(profile => [profile.user_id, profile]))
    const customerById = new Map((customers as CustomerSummary[]).map(customer => [customer.id, customer]))
    const userAccessByUserId = new Map<string, string[]>()
    ;(userCustomerRows || []).forEach((row) => {
      const current = userAccessByUserId.get(row.user_id) || []
      userAccessByUserId.set(row.user_id, [...current, row.customer_id])
    })

    const customerAgentsByCustomerId = new Map<string, string[]>()
    const customerDefaultAgentByCustomerId = new Map<string, string | null>()
    ;(customerAgentRows || []).forEach((row) => {
      const current = customerAgentsByCustomerId.get(row.customer_id) || []
      customerAgentsByCustomerId.set(row.customer_id, [...current, row.agent_id])
      if (row.is_default) {
        customerDefaultAgentByCustomerId.set(row.customer_id, row.agent_id)
      }
    })

    const data = authUsers.flatMap((authUser) => {
      const linkedCustomers = userAccessByUserId.get(authUser.id) || []
      const isDisabled = Boolean(profileByUserId.get(authUser.id)?.is_disabled)
      if (!linkedCustomers.length) {
        return [{
          user_id: authUser.id,
          email: authUser.email || '',
          customer_id: null,
          customer_slug: null,
          customer_display_name: null,
          user_disabled: isDisabled,
          assigned_agents: [],
          default_agent_id: null,
        }]
      }

      return linkedCustomers.map((customerId) => {
        const customer = customerById.get(customerId)
        return {
          user_id: authUser.id,
          email: authUser.email || '',
          customer_id: customerId,
          customer_slug: customer?.slug || null,
          customer_display_name: customer?.display_name || null,
          user_disabled: isDisabled,
          assigned_agents: customerAgentsByCustomerId.get(customerId) || [],
          default_agent_id: customerDefaultAgentByCustomerId.get(customerId) || null,
        }
      })
    })

    return NextResponse.json({ data })
  }
  catch (error: any) {
    const status = error instanceof AuthError ? 401 : 500
    return NextResponse.json({
      error: error instanceof AuthError ? 'Unauthorized' : 'Admin agent access request failed',
      context: 'admin-agent-access',
      expected: error instanceof AuthError ? 'Authenticated master admin session' : 'Readable user/customer/agent assignment datasets',
      received: error?.message || 'Unknown error',
    }, { status })
  }
}
